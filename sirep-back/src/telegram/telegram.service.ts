import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EscaneosService,
  EscaneoDuplicadoError,
  LecturaIAError,
  ResultadoProcesamientoEscaneo,
} from '../escaneos/escaneos.service';

export interface TelegramUpdate {
  message?: {
    chat: { id: number | string };
    message_id: number;
    from?: { first_name?: string; username?: string };
    document?: { file_id: string; file_name?: string; mime_type?: string; file_size?: number };
    photo?: Array<{ file_id: string }>;
    caption?: string;
    text?: string;
  };
}

/** Los valores vienen de letra manuscrita leída por IA: un "<" suelto rompe el parse_mode HTML y Telegram descarta el mensaje. */
export function escaparHtml(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// getFile de la Bot API solo entrega archivos de hasta 20 MB
const LIMITE_DESCARGA_BYTES = 20 * 1024 * 1024;
const LIMITE_MENSAJE = 4000;

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly token: string | undefined;

  constructor(
    private readonly config: ConfigService,
    private readonly escaneosService: EscaneosService,
  ) {
    this.token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
  }

  private get apiBase() {
    return `https://api.telegram.org/bot${this.token}`;
  }

  private get fileBase() {
    return `https://api.telegram.org/file/bot${this.token}`;
  }

  async handleUpdate(update: TelegramUpdate) {
    const message = update.message;
    if (!message) return;

    const chatId = message.chat.id;
    const remitente = message.from?.username || message.from?.first_name || 'telegram_user';

    // 1. Verificar si viene un archivo o foto
    const fileId =
      message.document?.file_id ||
      (message.photo && message.photo.length > 0 ? message.photo[message.photo.length - 1].file_id : null);

    if (!fileId) {
      if (message.text?.startsWith('/start') || message.text?.startsWith('/help')) {
        await this.enviarMensaje(
          chatId,
          `👋 <b>Bienvenido al Bot de SIREP</b>\n\n` +
          `Envía el reporte técnico escaneado en <b>PDF</b> (anverso y reverso en un solo archivo) o en <b>foto</b>, a 300 dpi.\n` +
          `Puedes poner el N° de reporte en el mensaje o en el nombre del archivo (ej: <code>000845.pdf</code>).`,
        );
        return;
      }

      await this.enviarMensaje(chatId, `📄 Por favor envía el escaneo del reporte técnico (PDF o foto) para procesarlo.`);
      return;
    }

    const filename = message.document?.file_name || `escaneo_${Date.now()}.jpg`;
    const mimetype = message.document?.mime_type || (filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
    const caption = message.caption || message.text;

    // Se rechaza antes de descargar: Word, Excel, etc. no son reportes escaneados
    if (message.document && mimetype !== 'application/pdf' && !mimetype.startsWith('image/')) {
      await this.enviarMensaje(chatId, `⚠️ Solo puedo procesar <b>PDF</b> o <b>imágenes</b> (JPG, PNG). Recibí un archivo de tipo <code>${escaparHtml(mimetype)}</code>.`);
      return;
    }

    if ((message.document?.file_size ?? 0) > LIMITE_DESCARGA_BYTES) {
      await this.enviarMensaje(
        chatId,
        `⚠️ El archivo pesa más de 20 MB y Telegram no me permite descargarlo. Vuelve a escanear a menor tamaño (por ejemplo 200 dpi) o envía solo el reporte sin otras hojas.`,
      );
      return;
    }

    await this.enviarMensaje(chatId, `⏳ <i>Procesando reporte con IA, por favor espera un momento...</i>`);

    try {
      // 2. Descargar el archivo de Telegram
      const buffer = await this.descargarArchivo(fileId);

      // 3. Huella + N° + guardado + IA (ver EscaneosService)
      const resultado = await this.escaneosService.procesarEscaneo({
        buffer,
        filename,
        caption,
        mimetype,
        enviadoPor: remitente,
        telegramChatId: Number(chatId),
      });

      // 4. Responder al chat
      await this.enviarMensaje(chatId, this.formatearResultado(resultado));
    } catch (err: any) {
      await this.responderError(chatId, err);
    }
  }

  private formatearResultado(resultado: ResultadoProcesamientoEscaneo): string {
    // Las claves son las de EscaneosService.camposFormulario ('empresa' y 'equipo'; antes se
    // buscaban 'cliente' y 'serie_equipo', que el modelo nunca devuelve, y siempre salía "No detectado").
    const dato = (clave: string, maxLargo = 200): string => {
      const valor = resultado.campos[clave]?.valor;
      if (valor === null || valor === undefined || valor === '') return '<i>[No detectado]</i>';
      const texto = typeof valor === 'boolean' ? (valor ? 'Sí' : 'No') : String(valor);
      const recortado = texto.length > maxLargo ? `${texto.slice(0, maxLargo)}…` : texto;
      return escaparHtml(recortado);
    };

    let mensaje = `✅ <b>Reporte N° ${escaparHtml(resultado.numeroReporte)} registrado</b> (${resultado.totalPaginas} pág.)\n\n`;
    mensaje += `<b>Empresa:</b> ${dato('empresa')}\n`;
    mensaje += `<b>Fecha:</b> ${dato('fecha')}\n`;
    mensaje += `<b>Equipo:</b> ${dato('equipo')}\n`;
    mensaje += `<b>Procedimiento:</b> ${dato('procedimiento')}\n`;
    mensaje += `<b>Código repuesto:</b> ${dato('codigo_repuesto')}\n\n`;

    if (resultado.camposDudosos.length > 0) {
      mensaje +=
        `⚠️ <b>Atención:</b> pasó a la <b>Bandeja de Revisión</b> por campos dudosos o ilegibles: ` +
        `<code>${escaparHtml(resultado.camposDudosos.join(', '))}</code>.`;
    } else {
      mensaje += `✨ Todos los campos se leyeron con buena confianza.`;
    }
    return mensaje;
  }

  private async responderError(chatId: number | string, err: any) {
    if (err instanceof EscaneoDuplicadoError) {
      if (err.tipoDuplicado === 'archivo_duplicado') {
        await this.enviarMensaje(
          chatId,
          `⚠️ <b>Aviso:</b> Este archivo ya fue enviado anteriormente.\n<i>(No se crearon registros duplicados)</i>`,
        );
      } else {
        await this.enviarMensaje(
          chatId,
          `⚠️ <b>Aviso:</b> El reporte N° <b>${escaparHtml(String(err.datosExtra?.numeroReporte || ''))}</b> ya se encuentra registrado.`,
        );
      }
      return;
    }

    this.logger.error(`Error procesando reporte en Telegram: ${err?.message ?? err}`);

    if (err instanceof LecturaIAError) {
      await this.enviarMensaje(
        chatId,
        `❌ <b>No pude leer el reporte con la IA en este momento.</b>\nNo se guardó nada. Intenta de nuevo en unos minutos; si se repite, avisa al equipo de desarrollo.`,
      );
      return;
    }

    // Errores 4xx propios del sistema (PDF dañado, demasiadas páginas...) traen un mensaje pensado para la secretaria.
    // Cualquier otro error es técnico (base de datos, red) y se muestra genérico.
    const mensajeUsuario =
      err instanceof HttpException && err.getStatus() < 500
        ? escaparHtml(String(err.message)).slice(0, 500)
        : 'Ocurrió un error interno. No se guardó el reporte.';

    await this.enviarMensaje(chatId, `❌ <b>Error al procesar el reporte:</b>\n${mensajeUsuario}\nVerifica el archivo y vuelve a intentar.`);
  }

  /**
   * fetch con tiempo límite y reintentos. "fetch failed" es un fallo de red (DNS, IPv6, VPN,
   * antivirus, corte momentáneo) y casi siempre se resuelve al reintentar; el motivo real
   * viene en `err.cause`, que antes no se registraba.
   */
  private async fetchConReintentos(
    url: string,
    init: RequestInit,
    etiqueta: string,
    { intentos = 3, timeoutMs = 30_000 }: { intentos?: number; timeoutMs?: number } = {},
  ): Promise<Response> {
    let ultimoError: any;
    for (let intento = 1; intento <= intentos; intento++) {
      try {
        return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      } catch (err: any) {
        ultimoError = err;
        const causa = err?.cause?.code ?? err?.cause?.message ?? err?.name ?? err?.message;
        this.logger.warn(`${etiqueta}: intento ${intento}/${intentos} falló (${causa})`);
        if (intento < intentos) await new Promise((r) => setTimeout(r, 1000 * 2 ** (intento - 1)));
      }
    }
    throw ultimoError;
  }

  async descargarArchivo(fileId: string): Promise<Buffer> {
    if (!this.token) {
      throw new Error('TELEGRAM_BOT_TOKEN no configurado');
    }

    const resInfo = await this.fetchConReintentos(
      `${this.apiBase}/getFile?file_id=${encodeURIComponent(fileId)}`,
      {},
      'Telegram getFile',
    );
    const dataInfo: any = await resInfo.json().catch(() => ({}));
    if (!resInfo.ok || !dataInfo.ok) {
      throw new Error(`Fallo al consultar getFile en Telegram: HTTP ${resInfo.status} ${dataInfo.description ?? ''}`.trim());
    }

    const filePath = dataInfo.result?.file_path;
    if (!filePath) {
      throw new Error('Telegram no devolvió la ruta del archivo (file_path).');
    }

    const resArchivo = await this.fetchConReintentos(`${this.fileBase}/${filePath}`, {}, 'Telegram descarga', {
      timeoutMs: 90_000,
    });
    if (!resArchivo.ok) {
      throw new Error(`Fallo al descargar archivo desde Telegram: HTTP ${resArchivo.status}`);
    }

    return Buffer.from(await resArchivo.arrayBuffer());
  }

  async enviarMensaje(chatId: number | string, texto: string) {
    if (!this.token) {
      this.logger.warn(`Simulado mensaje a chat ${chatId}: ${texto}`);
      return;
    }

    try {
      const res = await this.fetchConReintentos(
        `${this.apiBase}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: texto.slice(0, LIMITE_MENSAJE),
            parse_mode: 'HTML',
          }),
        },
        'Telegram sendMessage',
      );
      if (!res.ok) {
        // Antes un 400 (HTML mal formado, chat bloqueado) se ignoraba en silencio y la secretaria nunca recibía respuesta
        this.logger.error(`Telegram rechazó sendMessage: HTTP ${res.status} ${await res.text().catch(() => '')}`);
      }
    } catch (err: any) {
      this.logger.error(
        `Error enviando mensaje a Telegram: ${err?.message} (${err?.cause?.code ?? err?.cause?.message ?? 'sin detalle'})`,
      );
    }
  }
}