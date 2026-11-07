import * as crypto from 'crypto';
import { pathToFileURL } from 'url';
import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import { CampoLeido, Confianza, ResultadoLectura } from '../ia-extractor/types';

/** Lee un entero de una variable de entorno; si no existe o es inválido usa el valor por defecto. */
function enteroDeEnv(nombre: string, defecto: number): number {
  const n = Number(process.env[nombre]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : defecto;
}

/**
 * Huella SHA-256 del archivo tal como llegó. Solo detecta el reenvío del MISMO
 * archivo: si la misma hoja se escanea dos veces la impresora genera dos archivos
 * distintos, por eso el duplicado real se controla con el N° del talonario.
 */
export function calcularHuellaSHA256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Extrae el N° impreso del talonario desde el texto del mensaje o el nombre del archivo.
 * Se exige que el texto sea el número, que empiece por él o que lo anteceda una palabra
 * clave (reporte, N°...). Antes cualquier racha de 4-7 dígitos o cualquier nombre de
 * 4-10 caracteres ("scan.pdf", "IMG_20261102.jpg") se tomaba como N° y bloqueaba
 * reportes legítimos como "duplicados". Se conservan ceros a la izquierda y sufijo
 * de letra (0005-A) porque el N° es texto, no un entero.
 */
export function extraerNumeroReporte(texto?: string | null): string | null {
  if (!texto) return null;
  const t = texto.trim();
  if (!t) return null;

  // Sin extensión de archivo: "000845.pdf" -> "000845"
  const sinExtension = t.replace(/\.[A-Za-z0-9]{2,5}$/, '');

  const conPalabraClave = sinExtension.match(
    /(?:reporte|informe|talonario|nro\.?|n[úu]mero|n\s*[°º])\s*[:#.\-]?\s*(\d{4,7}(?:-[A-Za-z])?)(?![0-9A-Za-z])/i,
  );
  if (conPalabraClave?.[1]) return conPalabraClave[1];

  // El texto o el nombre del archivo empieza por el número: "000845", "000845_escaneo", "0005-A"
  const alInicio = sinExtension.match(/^(\d{4,7}(?:-[A-Za-z])?)(?![0-9A-Za-z])/);
  if (alInicio?.[1]) return alInicio[1];

  return null;
}

/**
 * Convierte una fecha manuscrita a ISO (YYYY-MM-DD) para la columna `date` de Postgres.
 * Los reportes traen día/mes/año con año de 2 dígitos ("03/02/26"); Postgres rechaza
 * ese formato y hacía fallar el guardado completo. Si no se puede interpretar se
 * devuelve null: el valor original sigue guardado en campos_extraidos para la revisión.
 */
export function normalizarFecha(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const t = valor.trim();

  let dia: number, mes: number, anio: number;
  const iso = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
  const latino = t.match(/^(\d{1,2})[\/\-.\s](\d{1,2})[\/\-.\s](\d{2}|\d{4})$/);

  if (iso) {
    anio = Number(iso[1]);
    mes = Number(iso[2]);
    dia = Number(iso[3]);
  } else if (latino) {
    dia = Number(latino[1]);
    mes = Number(latino[2]);
    anio = Number(latino[3]);
    if (latino[3].length === 2) anio += 2000;
  } else {
    return null;
  }

  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  const valida =
    fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
  if (!valida) return null;

  return `${String(anio).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/** Telegram a veces declara mal el mimetype; la firma %PDF- es la fuente confiable. */
export function esPDF(buffer: Buffer): boolean {
  return buffer.length >= 5 && buffer.subarray(0, 5).toString('latin1') === '%PDF-';
}

/**
 * Convierte cada página de un PDF a una imagen PNG (el documento pide una imagen por
 * página: OpenAI no acepta PDF y los recortes de la bandeja de revisión salen de la imagen).
 *
 * pdfjs-dist 4.x es solo ESM y este proyecto compila a CommonJS, por eso se carga con
 * import() dinámico. TypeScript convertiría un import() normal en require() y fallaría,
 * así que se usa new Function. Se resuelve la ruta absoluta para no depender del cwd.
 * Se renderiza con el canvasFactory del propio pdfjs: usar un canvas externo
 * provocaba un cierre abrupto del proceso ("double free or corruption").
 */
export async function renderizarPaginasPDF(
  buffer: Buffer,
  opciones: { dpi?: number; maxPaginas?: number } = {},
): Promise<Buffer[]> {
  const dpi = opciones.dpi ?? enteroDeEnv('PDF_DPI', 200);
  const maxPaginas = opciones.maxPaginas ?? enteroDeEnv('MAX_PAGINAS_REPORTE', 4);

  const importarEsm = new Function('ruta', 'return import(ruta)') as (ruta: string) => Promise<any>;
  const pdfjs = await importarEsm(
    pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.mjs')).href,
  );

  let doc: any;
  try {
    doc = await pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      isEvalSupported: false,
      verbosity: 0,
    }).promise;
  } catch {
    throw new BadRequestException('No se pudo abrir el PDF. Verifica que no esté dañado ni protegido con contraseña.');
  }

  try {
    if (doc.numPages > maxPaginas) {
      throw new BadRequestException(
        `El PDF tiene ${doc.numPages} páginas y el máximo por reporte es ${maxPaginas} (anverso y reverso). ` +
        `Envía un archivo por reporte.`,
      );
    }

    const imagenes: Buffer[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const pagina = await doc.getPage(n);
      const viewport = pagina.getViewport({ scale: dpi / 72 });
      const fabrica = doc.canvasFactory;
      const lienzo = fabrica.create(Math.ceil(viewport.width), Math.ceil(viewport.height));
      try {
        await pagina.render({ canvasContext: lienzo.context, viewport }).promise;
        imagenes.push(Buffer.from(lienzo.canvas.toBuffer('image/png')));
      } finally {
        fabrica.destroy(lienzo);
        pagina.cleanup();
      }
    }
    return imagenes;
  } finally {
    await doc.destroy();
  }
}

/** Valida que el archivo sea una imagen legible y devuelve su formato (jpg, png, webp...). */
export async function validarImagen(buffer: Buffer): Promise<{ extension: string; mimetype: string }> {
  try {
    const meta = await sharp(buffer).metadata();
    if (!meta.format || !meta.width || !meta.height) throw new Error('sin dimensiones');
    const extension = meta.format === 'jpeg' ? 'jpg' : meta.format;
    return { extension, mimetype: `image/${meta.format}` };
  } catch {
    throw new BadRequestException('El archivo no es un PDF ni una imagen válida (JPG, PNG o WebP).');
  }
}

/**
 * Copia comprimida para el modelo. El original queda intacto en Storage porque es el
 * archivo del reporte. 1600 px de lado largo es el valor de SIREGG (comprobantes
 * impresos); para manuscrito se ajusta con la prueba de viabilidad vía IA_LADO_LARGO_PX.
 */
export async function optimizarParaIA(imagen: Buffer): Promise<{ buffer: Buffer; mimetype: string }> {
  const ladoLargo = enteroDeEnv('IA_LADO_LARGO_PX', 1600);
  const optimizado = await sharp(imagen)
    .rotate()
    .resize(ladoLargo, ladoLargo, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  return { buffer: optimizado, mimetype: 'image/jpeg' };
}

const PESO_CONFIANZA: Record<Confianza, number> = { alta: 3, media: 2, baja: 1 };

/**
 * Une las lecturas de cada página (anverso/reverso) en una sola. Por campo gana la
 * lectura que SÍ pudo leer el valor y, entre varias, la de mayor confianza; en empate
 * se queda la primera página. Así un campo vacío en el anverso no tapa el valor del reverso.
 * Costo y tokens se suman porque la prueba de viabilidad presupuesta por reporte.
 */
export function fusionarLecturas(lecturas: ResultadoLectura[]): ResultadoLectura {
  if (lecturas.length === 0) {
    throw new Error('No hay lecturas para fusionar');
  }
  if (lecturas.length === 1) return lecturas[0];

  const mejorPorClave = new Map<string, CampoLeido>();
  for (const lectura of lecturas) {
    for (const campo of lectura.campos) {
      const actual = mejorPorClave.get(campo.clave);
      if (!actual) {
        mejorPorClave.set(campo.clave, campo);
        continue;
      }
      const mejora =
        (actual.noLeido && !campo.noLeido) ||
        (actual.noLeido === campo.noLeido &&
          !campo.noLeido &&
          PESO_CONFIANZA[campo.confianza] > PESO_CONFIANZA[actual.confianza]);
      if (mejora) mejorPorClave.set(campo.clave, campo);
    }
  }

  const uso = lecturas.reduce(
    (acc, l) => ({
      ...acc,
      tokensEntrada: acc.tokensEntrada + l.uso.tokensEntrada,
      tokensSalida: acc.tokensSalida + l.uso.tokensSalida,
      costoUsd: Number((acc.costoUsd + l.uso.costoUsd).toFixed(6)),
      latenciaMs: acc.latenciaMs + l.uso.latenciaMs,
    }),
    { ...lecturas[0].uso, tokensEntrada: 0, tokensSalida: 0, costoUsd: 0, latenciaMs: 0 },
  );

  return {
    numeroReporte: lecturas.map((l) => l.numeroReporte).find((n) => !!n) ?? null,
    campos: Array.from(mejorPorClave.values()),
    uso,
    salidaCruda: JSON.stringify(lecturas.map((l) => l.salidaCruda ?? null)),
  };
}