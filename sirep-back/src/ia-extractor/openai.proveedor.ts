import {
  CampoEsperado,
  CampoLeido,
  Confianza,
  LectorDeReportes,
  ProveedorIaError,
  ResultadoLectura,
} from './types';
import { OBSERVACION_EN_BLANCO, casillaMarcada, esCampoEnBlanco } from './normalizacion';

export interface OpenAIConfig {
  apiKey: string;
  modelo?: string;
  fetchFn?: typeof fetch;
}

export class OpenAILector implements LectorDeReportes {
  readonly nombre = 'openai';
  readonly modelo: string;
  private readonly apiKey: string;
  private readonly fetchFn: typeof fetch;

  constructor(config: OpenAIConfig) {
    if (!config.apiKey) {
      throw new ProveedorIaError('openai', 'OPENAI_API_KEY no configurada');
    }
    this.apiKey = config.apiKey;
    this.modelo = config.modelo || 'gpt-4o-mini';
    this.fetchFn = config.fetchFn || globalThis.fetch.bind(globalThis);
  }

  async leer(
    imagen: Buffer,
    mimeType: string,
    campos: CampoEsperado[],
    temperatura = 0.1,
  ): Promise<ResultadoLectura> {
    if (!imagen || imagen.length === 0) {
      throw new ProveedorIaError('openai', 'El buffer de la imagen está vacío');
    }
    if (!campos || campos.length === 0) {
      throw new ProveedorIaError('openai', 'Se requiere al menos un campo esperado');
    }

    if (mimeType === 'application/pdf') {
      throw new ProveedorIaError(
        'openai',
        'El endpoint multimodal de OpenAI solo admite imágenes (JPEG, PNG, WebP) y no soporta application/pdf directo. Convierta la página del PDF a imagen o envíe el reporte en formato imagen para usar este proveedor.',
        400,
      );
    }

    const inicio = Date.now();
    const promptSistema = this.construirPrompt(campos);
    const base64 = imagen.toString('base64');
    const dataUrl = `data:${mimeType || 'image/jpeg'};base64,${base64}`;

    const payload = {
      model: this.modelo,
      response_format: { type: 'json_object' },
      temperature: temperatura,
      messages: [
        { role: 'system', content: promptSistema },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extrae los campos del reporte técnico manuscrito adjunto siguiendo estrictamente las reglas.',
            },
            {
              type: 'image_url',
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
    };

    let res: Response;
    try {
      res = await this.fetchFn('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (err: any) {
      throw new ProveedorIaError('openai', `Error de conexión: ${err?.message ?? err}`);
    }

    if (!res.ok) {
      const errorBody = await res.text().catch(() => '');
      throw new ProveedorIaError('openai', `HTTP ${res.status}: ${errorBody}`, res.status);
    }

    const json = await res.json();
    const latenciaMs = Date.now() - inicio;

    const tokensEntrada = json.usage?.prompt_tokens ?? 0;
    const tokensSalida = json.usage?.completion_tokens ?? 0;
    const costoUsd = Number(
      ((tokensEntrada / 1_000_000) * 0.15 + (tokensSalida / 1_000_000) * 0.6).toFixed(6),
    );

    const rawContent = json.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new ProveedorIaError('openai', 'OpenAI devolvió una respuesta vacía');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawContent);
    } catch (err: any) {
      throw new ProveedorIaError('openai', `JSON inválido retornado por OpenAI: ${rawContent}`);
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
      salidaCruda: rawContent,
    };
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
      };
    });
  }

  private construirPrompt(campos: CampoEsperado[]): string {
    return `Eres un transcriptor de reportes técnicos industriales manuscritos.
No inventes datos. Si un campo no se lee, valor: null y noLeido: true.
Casillas (tipo casilla): true si está marcada, null si no. Tipo opcion: devuelve el texto de la casilla marcada entre "opciones" o null.
Si un campo opcional está completamente en blanco en el papel, devuelve valor: null y vacio: true (no noLeido). Si hay algo escrito que no logras leer, vacio: false y noLeido: true.
Campos esperados: ${JSON.stringify(campos)}.
Devuelve JSON: { "numero_reporte": string|null, "campos": { [clave]: { valor, confianza, noLeido, dudoso, observacion, vacio } } }`;
  }
}