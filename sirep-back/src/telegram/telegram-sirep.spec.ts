import { BadRequestException, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService, escaparHtml } from './telegram.service';
import { EscaneosService, EscaneoDuplicadoError, LecturaIAError } from '../escaneos/escaneos.service';

describe('Backend 2: Telegram Webhook y Respuestas', () => {
  let controller: TelegramController;
  let telegramService: TelegramService;
  let mockEscaneosService: any;
  let mockConfigService: any;
  let enviar: jest.SpyInstance;

  const documento = (extra: Record<string, any> = {}) => ({
    message: {
      chat: { id: 999 },
      message_id: 1,
      document: { file_id: 'file-123', file_name: '000845.pdf', mime_type: 'application/pdf', ...extra },
    },
  });

  const resultadoOk = (campos: Record<string, any> = {}, extra: Record<string, any> = {}) => ({
    escaneoId: 'uuid',
    numeroReporte: '000845',
    estado: 'procesado',
    totalPaginas: 2,
    camposDudosos: [],
    campos: {
      empresa: { valor: 'Minera Los Andes' },
      fecha: { valor: '03/02/26' },
      equipo: { valor: 'Mimaki JV300' },
      procedimiento: { valor: 'Cambio de sensor' },
      codigo_repuesto: { valor: 'SN-4455' },
      ...campos,
    },
    ...extra,
  });

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => { });
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => { });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'TELEGRAM_WEBHOOK_SECRET') return 'super-secret-123';
        if (key === 'TELEGRAM_BOT_TOKEN') return 'fake-bot-token';
        return null;
      }),
    };

    mockEscaneosService = { procesarEscaneo: jest.fn() };

    telegramService = new TelegramService(mockConfigService, mockEscaneosService as EscaneosService);
    enviar = jest.spyOn(telegramService, 'enviarMensaje').mockResolvedValue(undefined as any);
    jest.spyOn(telegramService, 'descargarArchivo').mockResolvedValue(Buffer.from('dummy-pdf'));

    controller = new TelegramController(telegramService, mockConfigService);
  });

  describe('TelegramController (Validación de secret_token)', () => {
    it('rechaza con 401 si el secret_token no se envía en los headers', async () => {
      await expect(controller.telegramWebhook({ message: {} }, undefined)).rejects.toThrow(UnauthorizedException);
    });

    it('rechaza con 401 si el secret_token es incorrecto', async () => {
      await expect(controller.telegramWebhook({ message: {} }, 'token-incorrecto')).rejects.toThrow(
        'Secret token inválido',
      );
    });

    it('rechaza un secret_token del mismo largo pero distinto', async () => {
      await expect(controller.telegramWebhook({ message: {} }, 'super-secret-124')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rechaza todo si el servidor no tiene TELEGRAM_WEBHOOK_SECRET configurado', async () => {
      mockConfigService.get.mockReturnValue(undefined);
      await expect(controller.telegramWebhook({ message: {} }, '')).rejects.toThrow(UnauthorizedException);
    });

    it('con secret válido responde { ok: true } y procesa el update en segundo plano', async () => {
      const espia = jest.spyOn(telegramService, 'handleUpdate').mockResolvedValue(undefined);
      const update = { message: { chat: { id: 123 }, text: '/start' } };
      const res = await controller.telegramWebhook(update, 'super-secret-123');
      expect(res).toEqual({ ok: true });
      expect(espia).toHaveBeenCalledWith(update);
    });

    it('con secret inválido NO procesa el update', async () => {
      const espia = jest.spyOn(telegramService, 'handleUpdate');
      await controller.telegramWebhook({ message: {} }, 'malo').catch(() => { });
      expect(espia).not.toHaveBeenCalled();
    });
  });

  describe('TelegramService (flujo feliz)', () => {
    it('descarga, procesa y responde al chat con los campos que realmente devuelve el modelo', async () => {
      mockEscaneosService.procesarEscaneo.mockResolvedValue(resultadoOk());

      await telegramService.handleUpdate(documento());

      expect(telegramService.descargarArchivo).toHaveBeenCalledWith('file-123');
      expect(mockEscaneosService.procesarEscaneo).toHaveBeenCalledWith(
        expect.objectContaining({ filename: '000845.pdf', mimetype: 'application/pdf', telegramChatId: 999 }),
      );
      const ultimo = enviar.mock.calls[enviar.mock.calls.length - 1];
      expect(ultimo[0]).toBe(999);
      expect(ultimo[1]).toContain('Reporte N° 000845 registrado');
      // Antes "Cliente" y "Serie" salían siempre como [No detectado] por usar claves que no existen
      expect(ultimo[1]).toContain('Minera Los Andes');
      expect(ultimo[1]).toContain('Mimaki JV300');
      expect(ultimo[1]).toContain('SN-4455');
      expect(ultimo[1]).not.toContain('[No detectado]');
    });

    it('avisa de la Bandeja de Revisión y lista los campos dudosos', async () => {
      mockEscaneosService.procesarEscaneo.mockResolvedValue(
        resultadoOk({ codigo_repuesto: { valor: null } }, { estado: 'en_revision', camposDudosos: ['codigo_repuesto'] }),
      );
      await telegramService.handleUpdate(documento());
      const texto = enviar.mock.calls[enviar.mock.calls.length - 1][1];
      expect(texto).toContain('Bandeja de Revisión');
      expect(texto).toContain('codigo_repuesto');
      expect(texto).toContain('[No detectado]');
    });

    it('escapa el HTML de lo que escribió el técnico para que Telegram no descarte el mensaje', async () => {
      mockEscaneosService.procesarEscaneo.mockResolvedValue(
        resultadoOk({ procedimiento: { valor: 'presión < 3 bar & válvula <b>' } }),
      );
      await telegramService.handleUpdate(documento());
      const texto = enviar.mock.calls[enviar.mock.calls.length - 1][1];
      expect(texto).toContain('presión &lt; 3 bar &amp; válvula &lt;b&gt;');
      expect(texto).not.toContain('<b>>');
    });

    it('acepta fotos (sin documento)', async () => {
      mockEscaneosService.procesarEscaneo.mockResolvedValue(resultadoOk());
      await telegramService.handleUpdate({
        message: { chat: { id: 5 }, message_id: 2, photo: [{ file_id: 'chica' }, { file_id: 'grande' }], caption: '000845' },
      });
      expect(telegramService.descargarArchivo).toHaveBeenCalledWith('grande');
      expect(mockEscaneosService.procesarEscaneo).toHaveBeenCalledWith(expect.objectContaining({ caption: '000845' }));
    });

    it('responde con instrucciones a /start y no procesa nada', async () => {
      await telegramService.handleUpdate({ message: { chat: { id: 1 }, message_id: 1, text: '/start' } });
      expect(enviar).toHaveBeenCalledWith(1, expect.stringContaining('Bienvenido'));
      expect(mockEscaneosService.procesarEscaneo).not.toHaveBeenCalled();
    });
  });

  describe('TelegramService (archivos no válidos)', () => {
    it('rechaza antes de descargar un documento que no es PDF ni imagen', async () => {
      await telegramService.handleUpdate(
        documento({ file_name: 'informe.docx', mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
      );
      expect(telegramService.descargarArchivo).not.toHaveBeenCalled();
      expect(enviar).toHaveBeenCalledWith(999, expect.stringContaining('Solo puedo procesar'));
    });

    it('avisa cuando el archivo supera los 20 MB que permite descargar Telegram', async () => {
      await telegramService.handleUpdate(documento({ file_size: 25 * 1024 * 1024 }));
      expect(telegramService.descargarArchivo).not.toHaveBeenCalled();
      expect(enviar).toHaveBeenCalledWith(999, expect.stringContaining('20 MB'));
    });
  });

  describe('TelegramService (manejo de errores)', () => {
    it('avisa al usuario cuando un archivo ya fue enviado anteriormente', async () => {
      mockEscaneosService.procesarEscaneo.mockRejectedValue(
        new EscaneoDuplicadoError('archivo_duplicado', 'Archivo ya enviado'),
      );
      await telegramService.handleUpdate(documento());
      expect(enviar).toHaveBeenCalledWith(999, expect.stringContaining('Este archivo ya fue enviado anteriormente'));
    });

    it('avisa al usuario cuando un número de reporte ya está registrado', async () => {
      mockEscaneosService.procesarEscaneo.mockRejectedValue(
        new EscaneoDuplicadoError('reporte_duplicado', 'Reporte registrado', { numeroReporte: '000845' }),
      );
      await telegramService.handleUpdate(documento());
      expect(enviar).toHaveBeenCalledWith(
        999,
        expect.stringContaining('El reporte N° <b>000845</b> ya se encuentra registrado'),
      );
    });

    it('si falla la IA muestra un mensaje claro sin el detalle técnico del proveedor', async () => {
      mockEscaneosService.procesarEscaneo.mockRejectedValue(
        new LecturaIAError('[gemini] HTTP 429: {"error":{"message":"quota exceeded"}}'),
      );
      await telegramService.handleUpdate(documento());
      const texto = enviar.mock.calls[enviar.mock.calls.length - 1][1];
      expect(texto).toContain('No pude leer el reporte con la IA');
      expect(texto).toContain('No se guardó nada');
      expect(texto).not.toContain('quota');
    });

    it('errores de validación (PDF largo o dañado) se explican a la secretaria', async () => {
      mockEscaneosService.procesarEscaneo.mockRejectedValue(
        new BadRequestException('El PDF tiene 10 páginas y el máximo por reporte es 4 (anverso y reverso).'),
      );
      await telegramService.handleUpdate(documento());
      expect(enviar.mock.calls[enviar.mock.calls.length - 1][1]).toContain('El PDF tiene 10 páginas');
    });

    it('errores internos (base de datos) no filtran detalles técnicos al chat', async () => {
      mockEscaneosService.procesarEscaneo.mockRejectedValue(
        new InternalServerErrorException('relation "reportes" does not exist'),
      );
      await telegramService.handleUpdate(documento());
      const texto = enviar.mock.calls[enviar.mock.calls.length - 1][1];
      expect(texto).toContain('Ocurrió un error interno');
      expect(texto).not.toContain('relation');
    });

    it('si falla la descarga de Telegram responde con un error en vez de quedarse mudo', async () => {
      (telegramService.descargarArchivo as jest.Mock).mockRejectedValue(new Error('HTTP 400'));
      await telegramService.handleUpdate(documento());
      expect(enviar.mock.calls[enviar.mock.calls.length - 1][1]).toContain('Error al procesar el reporte');
      expect(mockEscaneosService.procesarEscaneo).not.toHaveBeenCalled();
    });
  });

  describe('escaparHtml', () => {
    it('escapa &, < y >', () => {
      expect(escaparHtml('a & b < c > d')).toBe('a &amp; b &lt; c &gt; d');
    });
  });
});