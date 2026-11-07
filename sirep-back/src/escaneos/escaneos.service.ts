import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  Optional,
} from '@nestjs/common';
import { SupabaseService } from '../common/supabase.service';
import { EventosGateway } from '../realtime/eventos.gateway';
import { crearLectorDeReportes } from '../ia-extractor/ia-extractor.factory';
import { CampoEsperado, LectorDeReportes, ResultadoLectura } from '../ia-extractor/types';
import { aTexto, columnasDesdeValores } from '../reportes/reportes.columnas';
import { CAMPOS_FORMULARIO } from './campos-formulario';
import {
  calcularHuellaSHA256,
  esPDF,
  extraerNumeroReporte,
  fusionarLecturas,
  normalizarFecha,
  optimizarParaIA,
  renderizarPaginasPDF,
  validarImagen,
} from './escaneos.util';

const BUCKET = 'escaneos-originales';
export const EMPRESA_POR_DEFECTO = '00000000-0000-0000-0000-000000000000';

export class EscaneoDuplicadoError extends ConflictException {
  constructor(
    public readonly tipoDuplicado: 'archivo_duplicado' | 'reporte_duplicado',
    mensaje: string,
    public readonly datosExtra?: Record<string, any>,
  ) {
    super(mensaje);
  }
}

/**
 * Falla del proveedor de IA (sin clave, sin respuesta, error HTTP, JSON inválido).
 * El detalle técnico va al log; el mensaje que ve la secretaria en Telegram es genérico
 * porque los errores de los proveedores son largos y no le sirven.
 */
export class LecturaIAError extends BadGatewayException {
  constructor(public readonly detalle: string) {
    super('No se pudo leer el reporte con la IA.');
  }
}

export interface ProcesarEscaneoInput {
  buffer: Buffer;
  filename?: string;
  caption?: string;
  mimetype?: string;
  enviadoPor?: string;
  telegramChatId?: number;
  empresaId?: string;
}

export interface ResultadoProcesamientoEscaneo {
  escaneoId: string;
  numeroReporte: string;
  estado: 'recibido' | 'procesado' | 'en_revision' | 'completo';
  campos: Record<string, any>;
  camposDudosos: string[];
  totalPaginas: number;
  huella: string;
  rutasPaginas: string[];
  metricasIA: {
    tokensEntrada: number;
    tokensSalida: number;
    costoUsd: number;
    latenciaMs: number;
    proveedor: string;
    modelo: string;
  };
}

@Injectable()
export class EscaneosService {
  private readonly logger = new Logger(EscaneosService.name);
  private lectorIA: LectorDeReportes | null = null;

  // Campos del formulario físico de GO Service Latam: ver campos-formulario.ts
  readonly camposFormulario: CampoEsperado[] = [...CAMPOS_FORMULARIO];

  constructor(
    private readonly supabase: SupabaseService,
    // Opcional para que las pruebas unitarias no necesiten el canal en vivo
    @Optional() private readonly eventos?: EventosGateway,
  ) {
    try {
      this.lectorIA = crearLectorDeReportes();
      this.logger.log(`Lector de IA inicializado: ${this.lectorIA.nombre} (${this.lectorIA.modelo})`);
    } catch (err: any) {
      this.logger.warn(`No se pudo inicializar LectorDeReportes al inicio: ${err?.message}`);
    }
  }

  private get client() {
    return this.supabase.getClient();
  }

  setLectorIA(lector: LectorDeReportes) {
    this.lectorIA = lector;
  }

  /** Borra de Storage lo ya subido cuando el procesamiento falla, para no dejar archivos huérfanos. */
  private async limpiarStorage(rutas: string[]) {
    if (rutas.length === 0) return;
    try {
      const { error } = await this.client.storage.from(BUCKET).remove(rutas);
      if (error) this.logger.warn(`No se pudo limpiar Storage tras un fallo: ${error.message}`);
    } catch (err: any) {
      this.logger.warn(`No se pudo limpiar Storage tras un fallo: ${err?.message}`);
    }
  }

  async procesarEscaneo(input: ProcesarEscaneoInput): Promise<ResultadoProcesamientoEscaneo> {
    const { buffer, filename, caption, enviadoPor, telegramChatId } = input;
    const empresaId = input.empresaId || EMPRESA_POR_DEFECTO;

    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('El archivo enviado está vacío.');
    }

    // 1. Huella SHA-256 y duplicado nivel 1 (mismo archivo reenviado)
    const huella = calcularHuellaSHA256(buffer);
    const { data: escaneoPorHuella } = await this.client
      .from('escaneos')
      .select('id, numero_reporte')
      .eq('empresa_id', empresaId)
      .eq('huella', huella)
      .maybeSingle();

    if (escaneoPorHuella) {
      throw new EscaneoDuplicadoError('archivo_duplicado', 'Este archivo ya fue enviado anteriormente.', {
        escaneoId: escaneoPorHuella.id,
        numeroReporte: escaneoPorHuella.numero_reporte,
      });
    }

    // 2. N° preliminar (texto del envío o nombre del archivo) y duplicado nivel 2 (mismo papel escaneado dos veces)
    let numeroReporte = extraerNumeroReporte(caption) || extraerNumeroReporte(filename);
    if (numeroReporte) {
      await this.verificarNumeroNoRegistrado(empresaId, numeroReporte);
    }

    // 3. Lector de IA listo antes de guardar nada: si falta la clave no se sube basura a Storage
    const lector = this.obtenerLector();

    // 4. Una imagen por página. Se hace antes de subir para rechazar PDF dañados o demasiado largos sin dejar rastro.
    const esPdf = esPDF(buffer);
    let imagenesPaginas: Buffer[];
    let extensionOriginal = 'pdf';
    let mimetypeOriginal = 'application/pdf';

    if (esPdf) {
      imagenesPaginas = await renderizarPaginasPDF(buffer);
    } else {
      const formato = await validarImagen(buffer);
      extensionOriginal = formato.extension;
      mimetypeOriginal = formato.mimetype;
      imagenesPaginas = [buffer];
    }
    const totalPaginas = imagenesPaginas.length;

    // 5. Guardar el original sin comprimir y las imágenes de cada página
    const base = `${empresaId}/${Date.now()}_${numeroReporte || 'sin_num'}`;
    const rutaOriginal = `${base}_orig.${extensionOriginal}`;
    const subidos: string[] = [];

    await this.subirArchivo(rutaOriginal, buffer, mimetypeOriginal);
    subidos.push(rutaOriginal);

    // Una foto ya ES su única página: no se duplica en Storage
    const rutasPaginas: string[] = [];
    try {
      for (let i = 0; i < imagenesPaginas.length; i++) {
        if (!esPdf) {
          rutasPaginas.push(rutaOriginal);
          continue;
        }
        const ruta = `${base}_pag_${i + 1}.png`;
        await this.subirArchivo(ruta, imagenesPaginas[i], 'image/png');
        subidos.push(ruta);
        rutasPaginas.push(ruta);
      }
    } catch (err) {
      await this.limpiarStorage(subidos);
      throw err;
    }

    try {
      // 6. Lectura con el modelo, página por página, y fusión de resultados
      const lecturas: ResultadoLectura[] = [];
      for (const [indice, pagina] of imagenesPaginas.entries()) {
        const copiaIA = await optimizarParaIA(pagina);
        try {
          const lecturaPagina = await lector.leer(copiaIA.buffer, copiaIA.mimetype, this.camposFormulario);
          // La caja del modelo es relativa a la imagen de ESTA página: se anota cuál es
          for (const campo of lecturaPagina.campos) {
            if (campo.caja) campo.caja.pagina = indice + 1;
          }
          lecturas.push(lecturaPagina);
        } catch (err: any) {
          this.logger.error(`Error en la extracción con IA: ${err?.message}`);
          throw new LecturaIAError(err?.message ?? 'error desconocido');
        }
      }
      const lectura = fusionarLecturas(lecturas);

      // 7. Si el N° no vino en el envío, se usa el que leyó el modelo y se revisa duplicado de nuevo
      if (!numeroReporte && lectura.numeroReporte) {
        numeroReporte = extraerNumeroReporte(lectura.numeroReporte);
        if (numeroReporte) {
          await this.verificarNumeroNoRegistrado(empresaId, numeroReporte);
        }
      }

      // 8. Campos dudosos o no leídos = lo que irá a la bandeja de revisión
      const camposDudosos: string[] = [];
      const camposMapa: Record<string, any> = {};
      for (const campo of lectura.campos) {
        camposMapa[campo.clave] = campo;
        if (campo.dudoso || campo.confianza === 'baja' || campo.noLeido) {
          camposDudosos.push(campo.clave);
        }
      }
      // "procesado" = el modelo leyó y hay campos esperando a una persona; "en_revision" lo asigna la bandeja
      // cuando alguien ya intervino; sin dudosos el reporte queda "completo". Es la misma regla de la bandeja.
      const estado: 'procesado' | 'completo' = camposDudosos.length > 0 ? 'procesado' : 'completo';

      // 9. Persistir escaneo
      const { data: escaneoInsertado, error: errorEscaneo } = await this.client
        .from('escaneos')
        .insert({
          empresa_id: empresaId,
          numero_reporte: numeroReporte || null,
          ruta_original: rutaOriginal,
          huella,
          paginas: totalPaginas,
          enviado_por: enviadoPor || 'telegram',
          telegram_chat_id: telegramChatId || null,
          estado,
          metadatos: {
            rutas_paginas: rutasPaginas,
            uso: lectura.uso,
            salida_cruda: lectura.salidaCruda,
            filename,
          },
        })
        .select('id')
        .single();

      if (errorEscaneo || !escaneoInsertado) {
        // 23505 = índice único: otro envío igual terminó justo antes (carrera entre dos mensajes)
        if ((errorEscaneo as any)?.code === '23505') {
          const porHuella = String(errorEscaneo?.message).includes('huella');
          throw porHuella
            ? new EscaneoDuplicadoError('archivo_duplicado', 'Este archivo ya fue enviado anteriormente.')
            : new EscaneoDuplicadoError(
              'reporte_duplicado',
              `El reporte N° ${numeroReporte} ya se encuentra registrado.`,
              { numeroReporte },
            );
        }
        const msg = errorEscaneo?.message || 'No se obtuvo el ID del registro creado';
        this.logger.error(`Error persistiendo escaneo en base de datos: ${msg}`);
        throw new InternalServerErrorException(`Error al registrar el escaneo: ${msg}`);
      }

      const escaneoId = escaneoInsertado.id;

      // 10. Persistir reporte (origen histórico, vinculado a su escaneo). Todo campo del formulario
      // tiene su columna: antes solo 6 se guardaban y el resto vivía únicamente en el JSON.
      const valores = Object.fromEntries(lectura.campos.map((c) => [c.clave, aTexto(c.valor)]));
      const { error: errorReporte } = await this.client.from('reportes').insert({
        empresa_id: empresaId,
        escaneo_id: escaneoId,
        numero_talonario: numeroReporte || null,
        origen: 'historico',
        ...columnasDesdeValores(valores),
        estado_reporte: estado === 'procesado' ? 'pendiente_revision' : 'aprobado',
        campos_extraidos: camposMapa,
        campos_dudosos: camposDudosos,
      });

      if (errorReporte) {
        // Sin esto el escaneo quedaba guardado sin reporte y reenviarlo se rechazaba como "duplicado"
        await this.client.from('escaneos').delete().eq('id', escaneoId);
        this.logger.error(`Error persistiendo reporte técnico: ${errorReporte.message}`);
        throw new InternalServerErrorException(`Error al registrar reporte técnico: ${errorReporte.message}`);
      }

      this.eventos?.emitirCambio('creado', numeroReporte);

      return {
        escaneoId,
        numeroReporte: numeroReporte || 'Sin N° detectado',
        estado,
        campos: camposMapa,
        camposDudosos,
        totalPaginas,
        huella,
        rutasPaginas,
        metricasIA: lectura.uso,
      };
    } catch (err) {
      await this.limpiarStorage(subidos);
      throw err;
    }
  }

  private obtenerLector(): LectorDeReportes {
    if (this.lectorIA) return this.lectorIA;
    try {
      this.lectorIA = crearLectorDeReportes();
      return this.lectorIA;
    } catch (err: any) {
      this.logger.error(`Proveedor de IA no disponible: ${err?.message}`);
      throw new LecturaIAError(err?.message ?? 'proveedor no configurado');
    }
  }

  private async verificarNumeroNoRegistrado(empresaId: string, numeroReporte: string) {
    const { data } = await this.client
      .from('escaneos')
      .select('id, numero_reporte')
      .eq('empresa_id', empresaId)
      .eq('numero_reporte', numeroReporte)
      .maybeSingle();

    if (data) {
      throw new EscaneoDuplicadoError(
        'reporte_duplicado',
        `El reporte N° ${numeroReporte} ya se encuentra registrado.`,
        { numeroReporte },
      );
    }
  }

  private async subirArchivo(ruta: string, contenido: Buffer, contentType: string) {
    const { error } = await this.client.storage.from(BUCKET).upload(ruta, contenido, { contentType, upsert: false });
    if (error) {
      this.logger.error(`Error guardando ${ruta} en Storage: ${error.message}`);
      throw new InternalServerErrorException(`No se pudo almacenar el archivo en Storage: ${error.message}`);
    }
  }

  async listarEscaneos(limite = 50) {
    const { data, error } = await this.client
      .from('escaneos')
      .select('*')
      .order('creado_en', { ascending: false })
      .limit(limite);

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async obtenerEscaneoPorId(id: string) {
    const { data, error } = await this.client
      .from('escaneos')
      .select('*, reportes(*)')
      .eq('id', id)
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }
}