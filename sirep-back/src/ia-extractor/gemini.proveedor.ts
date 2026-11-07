import {
  CajaCampo,
  CampoEsperado,
  CampoLeido,
  Confianza,
  LectorDeReportes,
  ProveedorIaError,
  ResultadoLectura,
} from './types';
import { OBSERVACION_EN_BLANCO, casillaMarcada, esCampoEnBlanco } from './normalizacion';

export interface GeminiConfig {
  apiKey: string;
  modelo?: string;
  fetchFn?: typeof fetch;
  /** Intentos totales ante fallos transitorios del proveedor (por defecto 3). */
  intentosMaximos?: number;
  /** Espera antes del 2.º intento; se duplica en cada reintento (por defecto 2000 ms). */
  esperaBaseMs?: number;
}

// Sobrecarga o límite de tasa del lado de Google: suelen resolverse en segundos.
// Un 400/401/403/404 (clave o modelo mal puestos) NO se reintenta porque fallaría igual.
const ESTADOS_REINTENTABLES = new Set([429, 500, 502, 503, 504]);

export class GeminiLector implements LectorDeReportes {
  readonly nombre = 'gemini';
  readonly modelo: string;
  private readonly apiKey: string;
  private readonly fetchFn: typeof fetch;
  private readonly intentosMaximos: number;
  private readonly esperaBaseMs: number;

  constructor(config: GeminiConfig) {
    if (!config.apiKey) {
      throw new ProveedorIaError('gemini', 'GEMINI_API_KEY no configurada');
    }
    this.apiKey = config.apiKey;
    this.modelo = config.modelo || 'gemini-3.8-flash';
    this.fetchFn = config.fetchFn || globalThis.fetch.bind(globalThis);
    this.intentosMaximos = Math.max(1, config.intentosMaximos ?? 3);
    this.esperaBaseMs = config.esperaBaseMs ?? 2000;
  }

  async leer(
    imagen: Buffer,
    mimeType: string,
    campos: CampoEsperado[],
    temperatura = 0.1,
  ): Promise<ResultadoLectura> {
    if (!imagen || imagen.length === 0) {
      throw new ProveedorIaError('gemini', 'El buffer de la imagen está vacío');
    }
    if (!campos || campos.length === 0) {
      throw new ProveedorIaError('gemini', 'Se requiere al menos un campo esperado');
    }

    const inicio = Date.now();
    const promptSistema = this.construirPrompt(campos);
    const base64Imagen = imagen.toString('base64');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelo}:generateContent?key=${this.apiKey}`;

    const payload = {
      contents: [
        {
          parts: [
            { text: promptSistema },
            {
              inline_data: {
                mime_type: mimeType || 'image/jpeg',
                data: base64Imagen,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: temperatura,
        response_mime_type: 'application/json',
      },
    };

    const res = await this.enviarConReintentos(url, payload);

    const json = await res.json();
    const latenciaMs = Date.now() - inicio;

    const tokensEntrada = json.usageMetadata?.promptTokenCount ?? 0;
    const tokensSalida = json.usageMetadata?.candidatesTokenCount ?? 0;
    const costoUsd = this.calcularCosto(tokensEntrada, tokensSalida);

    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new ProveedorIaError('gemini', 'Respuesta del modelo sin texto');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch (err: any) {
      throw new ProveedorIaError('gemini', `JSON inválido retornado por Gemini: ${rawText}`);
    }

    const camposLeidos = this.normalizarCampos(parsed.campos || {}, campos);

    return {
      numeroReporte: parsed.numero_reporte ? String(parsed.numero_reporte).trim() : null,
      campos: camposLeidos,
      uso: {
        proveedor: this.nombre,
        modelo: this.modelo,
        tokensEntrada,
        tokensSalida,
        costoUsd,
        latenciaMs,
      },
      salidaCruda: rawText,
    };
  }

  /**
   * Envía la petición y reintenta con espera creciente ante errores transitorios
   * (503 "high demand", 429, 5xx o caída de red). Al agotar los intentos lanza el último error.
   */
  private async enviarConReintentos(url: string, payload: unknown): Promise<Response> {
    let ultimoError: ProveedorIaError | null = null;

    for (let intento = 1; intento <= this.intentosMaximos; intento++) {
      let res: Response | undefined;
      try {
        res = await this.fetchFn(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (err: any) {
        ultimoError = new ProveedorIaError('gemini', `Error de conexión: ${err?.message ?? err}`);
      }

      if (res) {
        if (res.ok) return res;
        const errorBody = await res.text().catch(() => '');
        ultimoError = new ProveedorIaError('gemini', `HTTP ${res.status}: ${errorBody}`, res.status);
        if (!ESTADOS_REINTENTABLES.has(res.status)) throw ultimoError;
      }

      if (intento < this.intentosMaximos && this.esperaBaseMs > 0) {
        const espera = this.esperaBaseMs * 2 ** (intento - 1);
        // Sin esto un 503 se ve igual con o sin reintentos y no hay forma de saber si están funcionando
        console.warn(
          `[gemini] intento ${intento}/${this.intentosMaximos} falló (${ultimoError?.codigoHttp ?? 'sin respuesta'}); reintentando en ${espera} ms`,
        );
        await new Promise((r) => setTimeout(r, espera));
      }
    }

    throw ultimoError as ProveedorIaError;
  }

  private normalizarCampos(
    camposRespuesta: Record<string, any>,
    camposEsperados: CampoEsperado[],
  ): CampoLeido[] {
    return camposEsperados.map((esperado) => {
      const extraido = camposRespuesta[esperado.clave];

      if (esCampoEnBlanco(esperado, extraido)) {
        return {
          clave: esperado.clave,
          valor: null,
          confianza: 'alta' as Confianza,
          noLeido: false,
          dudoso: false,
          observacion: OBSERVACION_EN_BLANCO,
          caja: this.normalizarCaja(extraido?.caja_2d),
        };
      }

      if (
        !extraido ||
        extraido.valor === undefined ||
        extraido.valor === null ||
        extraido.valor === ''
      ) {
        return {
          clave: esperado.clave,
          valor: null,
          confianza: 'baja' as Confianza,
          noLeido: true,
          dudoso: false,
          observacion: extraido?.observacion || 'No detectado en el documento',
          caja: this.normalizarCaja(extraido?.caja_2d),
        };
      }

      const conf: string = String(extraido.confianza || 'media').toLowerCase();
      const confianza: Confianza =
        conf === 'alta' ? 'alta' : conf === 'baja' ? 'baja' : 'media';
      const dudoso = Boolean(extraido.dudoso ?? (confianza === 'baja'));

      let valor = extraido.valor;
      if (esperado.tipo === 'casilla') {
        valor = casillaMarcada(valor);
      } else {
        valor = String(valor).trim();
      }

      return {
        clave: esperado.clave,
        valor,
        confianza,
        noLeido: false,
        dudoso,
        observacion: extraido.observacion,
        caja: this.normalizarCaja(extraido.caja_2d),
      };
    });
  }

  /**
   * Convierte la caja del modelo [ymin, xmin, ymax, xmax] (escala 0–1000) a coordenadas 0–1.
   * Se ensancha un poco porque el modelo suele ajustar la caja a la tinta y la letra manuscrita
   * se sale de la línea. Una caja inválida se descarga (null): el frontend usa entonces el mapa fijo.
   */
  private normalizarCaja(bruta: unknown): CajaCampo | null {
    if (!Array.isArray(bruta) || bruta.length !== 4) return null;
    const n = bruta.map(Number);
    if (n.some((v) => !Number.isFinite(v))) return null;
    const [ymin, xmin, ymax, xmax] = n.map((v) => Math.min(1000, Math.max(0, v)));
    if (ymax <= ymin || xmax <= xmin) return null;
    // Una caja que cubre casi toda la hoja es una respuesta vacía del modelo, no un campo
    if ((ymax - ymin) * (xmax - xmin) > 600_000) return null;

    const margenX = 6;
    const margenY = 5;
    const r = (v: number) => Number((v / 1000).toFixed(4));
    const x0 = Math.max(0, xmin - margenX);
    const y0 = Math.max(0, ymin - margenY);
    const x1 = Math.min(1000, xmax + margenX);
    const y1 = Math.min(1000, ymax + margenY);
    return { x: r(x0), y: r(y0), ancho: r(x1 - x0), alto: r(y1 - y0) };
  }

  private calcularCosto(tokensIn: number, tokensOut: number): number {
    const costoIn = (tokensIn / 1_000_000) * 0.075;
    const costoOut = (tokensOut / 1_000_000) * 0.30;
    return Number((costoIn + costoOut).toFixed(6));
  }

  private construirPrompt(campos: CampoEsperado[]): string {
    return `Eres un sistema especializado en extracción y lectura de reportes técnicos de servicio industrial manuscritos (escritos a mano).

Tu única tarea es transcribir fielmente los campos visibles en el reporte físico escaneado.

REGLAS OBLIGATORIAS (Guía SIREP):
1. NUNCA inventes, completes ni supongas datos que no estén escritos.
2. Si un campo no se lee claramente o está vacío, devuelve valor: null y noLeido: true.
3. Evalúa tu confianza rigurosamente por campo:
   - "alta": La letra es legible sin ninguna ambigüedad.
   - "media": Se entiende por contexto pero algún carácter o número es dudoso.
   - "baja": Muy difícil de descifrar o incompleto. Marca dudoso: true.
4. Para casillas de verificación (tipo "casilla"): si está marcada devuelve true; una casilla sin marca es valor: null, no false. Si hay marca ambigua, confianza "baja".
   Para campos tipo "opcion" devuelve el TEXTO exacto de la casilla marcada entre "opciones" (ej. "Limpio"); si no hay ninguna marcada, valor: null; si hay dos marcadas, ambas separadas por " / " y confianza "media".
   Para firmas devuelve true si hay una firma manuscrita sobre la línea y valor: null si la línea está vacía.
5. Los textos largos (procedimiento, conclusión, recomendaciones) se transcriben fielmente sin corregir ortografía ni vocabulario técnico.
6. El número de reporte impreso (sello rojo en la cabecera) debe leerse en "numero_reporte".
7. Para CADA campo devuelve "caja_2d": [ymin, xmin, ymax, xmax] con enteros de 0 a 1000, medidos sobre la IMAGEN COMPLETA que recibes (0,0 = esquina superior izquierda de la imagen, no de la hoja; la hoja puede estar desplazada, recortada o inclinada).
   - Encierra únicamente el espacio donde se escribe el valor (la línea o recuadro con la letra manuscrita), NO la etiqueta impresa como "EMPRESA:" o "FECHA:".
   - Si el campo está vacío, encierra su recuadro o línea vacía.
   - En textos largos (procedimiento, conclusión, recomendaciones) encierra todo el recuadro de escritura.
   - Si no logras ubicar el campo, usa null.
   - Localiza cada campo por la etiqueta impresa que lo acompaña en ESTA imagen; no asumas posiciones de otros reportes.
8. En "observacion" escribe, en español y en una frase corta, QUÉ te hizo dudar (ej. "la segunda letra parece una o o una a", "el último dígito se confunde entre 3 y 8", "casilla sin marca clara"). Si la confianza es "alta", déjala vacía.
9. Cada campo trae "opcional": true o false. Si es opcional y el espacio está completamente en blanco en el papel (nadie escribió ni marcó nada), devuelve valor: null y "vacio": true. Si hay algo escrito o marcado pero no logras leerlo, devuelve "vacio": false y noLeido: true. Nunca pongas "vacio": true en un campo donde veas tinta.

CAMPOS SOLICITADOS:
${JSON.stringify(campos)}

Responde ESTRICTAMENTE con un objeto JSON:
{
  "numero_reporte": "000845" o null,
  "campos": {
    "nombre_clave": {
      "valor": string | boolean | null,
      "confianza": "alta" | "media" | "baja",
      "noLeido": boolean,
      "dudoso": boolean,
      "observacion": string,
      "vacio": boolean,
      "caja_2d": [ymin, xmin, ymax, xmax] | null
    }
  }
}`;
  }
}