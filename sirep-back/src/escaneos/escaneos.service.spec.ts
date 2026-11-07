import sharp from 'sharp';
import { InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import { EscaneosService, EscaneoDuplicadoError, LecturaIAError } from './escaneos.service';
import { SupabaseService } from '../common/supabase.service';
import { LectorDeReportes, ResultadoLectura } from '../ia-extractor/types';
import { calcularHuellaSHA256, renderizarPaginasPDF } from './escaneos.util';

// El render real de PDF usa import() dinámico de un módulo ESM, que Jest no soporta.
// Se simula aquí; la conversión real se verifica con el PDF de ejemplo (ver README).
jest.mock('./escaneos.util', () => ({
  ...jest.requireActual('./escaneos.util'),
  renderizarPaginasPDF: jest.fn(),
}));

interface Config {
  huellaExiste?: boolean;
  numeroExiste?: boolean;
  errorInsertEscaneo?: any;
  errorInsertReporte?: any;
}

describe('EscaneosService', () => {
  let service: EscaneosService;
  let lector: LectorDeReportes;
  let inserts: Record<string, any[]>;
  let deletes: string[];
  let upload: jest.Mock;
  let remove: jest.Mock;
  let config: Config;
  let png: Buffer;

  const lecturaBase = (): ResultadoLectura => ({
    numeroReporte: '000845',
    campos: [
      { clave: 'tecnico', valor: 'Angelo / Fabian', confianza: 'alta', noLeido: false, dudoso: false },
      { clave: 'empresa', valor: 'Minera Los Andes', confianza: 'alta', noLeido: false, dudoso: false },
      { clave: 'fecha', valor: '15-10-26', confianza: 'alta', noLeido: false, dudoso: false },
      { clave: 'procedimiento', valor: 'Cambio de rodamiento', confianza: 'media', noLeido: false, dudoso: false },
      { clave: 'codigo_repuesto', valor: null, confianza: 'baja', noLeido: true, dudoso: true },
    ],
    uso: { proveedor: 'mock-ia', modelo: 'mock-model', tokensEntrada: 1000, tokensSalida: 200, costoUsd: 0.0001, latenciaMs: 150 },
    salidaCruda: '{"test": true}',
  });

  function crearSupabase(): SupabaseService {
    const crearBuilder = (tabla: string) => {
      const filtros: string[] = [];
      const b: any = {
        select: jest.fn(() => b),
        eq: jest.fn((col: string) => {
          filtros.push(col);
          return b;
        }),
        maybeSingle: jest.fn(async () => {
          const existe =
            (filtros.includes('huella') && config.huellaExiste) ||
            (filtros.includes('numero_reporte') && config.numeroExiste);
          filtros.length = 0;
          return { data: existe ? { id: 'uuid-existente', numero_reporte: '000845' } : null, error: null };
        }),
        insert: jest.fn((fila: any) => {
          (inserts[tabla] ||= []).push(fila);
          return b;
        }),
        single: jest.fn(async () =>
          config.errorInsertEscaneo
            ? { data: null, error: config.errorInsertEscaneo }
            : { data: { id: 'nuevo-escaneo-uuid' }, error: null },
        ),
        delete: jest.fn(() => {
          deletes.push(tabla);
          return b;
        }),
        // `await from('reportes').insert(...)` y `await ...delete().eq(...)` se esperan directamente
        then: (res: any, rej: any) =>
          Promise.resolve({ error: tabla === 'reportes' ? config.errorInsertReporte ?? null : null }).then(res, rej),
      };
      return b;
    };

    return {
      getClient: () => ({
        from: jest.fn((tabla: string) => crearBuilder(tabla)),
        storage: { from: jest.fn(() => ({ upload, remove })) },
      }),
    } as unknown as SupabaseService;
  }

  beforeAll(async () => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    png = await sharp({ create: { width: 40, height: 40, channels: 3, background: '#ffffff' } }).png().toBuffer();
  });

  afterAll(() => jest.restoreAllMocks());

  beforeEach(() => {
    config = {};
    inserts = {};
    deletes = [];
    upload = jest.fn().mockResolvedValue({ data: { path: 'ok' }, error: null });
    remove = jest.fn().mockResolvedValue({ data: [], error: null });
    (renderizarPaginasPDF as jest.Mock).mockReset();

    lector = { nombre: 'mock-ia', modelo: 'mock-model', leer: jest.fn().mockResolvedValue(lecturaBase()) };
    service = new EscaneosService(crearSupabase());
    service.setLectorIA(lector);
  });

  it('rechaza un archivo con la misma huella SHA-256 (archivo_duplicado) sin subir nada', async () => {
    config.huellaExiste = true;
    const buffer = Buffer.from('contenido-del-reporte-845');
    expect(calcularHuellaSHA256(buffer)).toHaveLength(64);

    await expect(service.procesarEscaneo({ buffer, filename: '000845.pdf' })).rejects.toMatchObject({
      tipoDuplicado: 'archivo_duplicado',
    });
    expect(upload).not.toHaveBeenCalled();
    expect(lector.leer).not.toHaveBeenCalled();
  });

  it('rechaza un N° de reporte ya registrado (reporte_duplicado) sin subir ni gastar IA', async () => {
    config.numeroExiste = true;
    const err = await service
      .procesarEscaneo({ buffer: png, caption: 'Reporte N° 000845', filename: 'scan.png' })
      .catch((e) => e);

    expect(err).toBeInstanceOf(EscaneoDuplicadoError);
    expect(err.tipoDuplicado).toBe('reporte_duplicado');
    expect(err.message).toContain('El reporte N° 000845 ya se encuentra registrado');
    expect(upload).not.toHaveBeenCalled();
    expect(lector.leer).not.toHaveBeenCalled();
  });

  it('una foto se guarda una sola vez, pasa por la IA y queda procesado, con campos dudosos y la fecha en ISO', async () => {
    const r = await service.procesarEscaneo({
      buffer: png,
      filename: '000845.png',
      caption: '000845',
      mimetype: 'image/png',
      enviadoPor: 'secretaria',
      telegramChatId: 777,
    });

    expect(upload).toHaveBeenCalledTimes(1);
    expect(r.totalPaginas).toBe(1);
    expect(r.escaneoId).toBe('nuevo-escaneo-uuid');
    expect(r.numeroReporte).toBe('000845');
    expect(r.estado).toBe('procesado');
    expect(r.camposDudosos).toEqual(['codigo_repuesto']);
    expect(r.campos.empresa.valor).toBe('Minera Los Andes');
    expect(r.metricasIA.costoUsd).toBe(0.0001);

    // La fecha manuscrita 15-10-26 se guarda como date válido de Postgres
    expect(inserts.reportes[0]).toMatchObject({
      fecha: '2026-10-15',
      origen: 'historico',
      escaneo_id: 'nuevo-escaneo-uuid',
      numero_talonario: '000845',
      cliente: 'Minera Los Andes',
      estado_reporte: 'pendiente_revision',
    });
    expect(inserts.escaneos[0]).toMatchObject({ huella: calcularHuellaSHA256(png), paginas: 1, telegram_chat_id: 777 });
  });

  it('un PDF de dos páginas guarda su original y sus dos imágenes, y lee cada página con la IA', async () => {
    (renderizarPaginasPDF as jest.Mock).mockResolvedValue([png, png]);
    const pdf = Buffer.from('%PDF-1.7 contenido de prueba');

    const r = await service.procesarEscaneo({ buffer: pdf, filename: '000845.pdf', mimetype: 'application/pdf' });

    expect(upload).toHaveBeenCalledTimes(3);
    const rutas = upload.mock.calls.map((c) => c[0] as string);
    expect(rutas[0]).toMatch(/_orig\.pdf$/);
    expect(rutas[1]).toMatch(/_pag_1\.png$/);
    expect(rutas[2]).toMatch(/_pag_2\.png$/);
    expect(upload.mock.calls[0][1]).toBe(pdf); // el original va tal cual, sin comprimir
    expect(lector.leer).toHaveBeenCalledTimes(2);
    expect(r.totalPaginas).toBe(2);
    expect(r.rutasPaginas).toHaveLength(2);
    expect(r.metricasIA.tokensEntrada).toBe(2000);
    expect(inserts.escaneos[0].paginas).toBe(2);
  });

  it('la copia que recibe la IA es una imagen JPEG, nunca el PDF (así sirve para OpenAI y Gemini)', async () => {
    (renderizarPaginasPDF as jest.Mock).mockResolvedValue([png]);
    await service.procesarEscaneo({ buffer: Buffer.from('%PDF-1.7 x'), filename: '000845.pdf' });
    expect((lector.leer as jest.Mock).mock.calls[0][1]).toBe('image/jpeg');
  });

  it('usa el N° leído por el modelo cuando el envío no lo traía', async () => {
    const r = await service.procesarEscaneo({ buffer: png, filename: 'scan.png' });
    expect(r.numeroReporte).toBe('000845');
    expect(inserts.escaneos[0].numero_reporte).toBe('000845');
  });

  it('si el N° leído por el modelo ya existe, rechaza y borra lo que se había subido', async () => {
    config.numeroExiste = true;
    await expect(service.procesarEscaneo({ buffer: png, filename: 'scan.png' })).rejects.toBeInstanceOf(
      EscaneoDuplicadoError,
    );
    expect(remove).toHaveBeenCalledTimes(1);
    expect(inserts.escaneos).toBeUndefined();
  });

  it('si el proveedor de IA falla devuelve LecturaIAError, no crea registros y limpia Storage', async () => {
    (lector.leer as jest.Mock).mockRejectedValue(new Error('[gemini] HTTP 429: cuota'));
    (renderizarPaginasPDF as jest.Mock).mockResolvedValue([png, png]);

    await expect(
      service.procesarEscaneo({ buffer: Buffer.from('%PDF-1.7 x'), filename: '000845.pdf' }),
    ).rejects.toBeInstanceOf(LecturaIAError);

    expect(inserts.escaneos).toBeUndefined();
    expect(inserts.reportes).toBeUndefined();
    expect(remove).toHaveBeenCalledWith(expect.arrayContaining([expect.stringMatching(/_orig\.pdf$/)]));
    expect(remove.mock.calls[0][0]).toHaveLength(3);
  });

  it('sin proveedor de IA configurado falla antes de subir cualquier archivo', async () => {
    const sinIA = new EscaneosService(crearSupabase());
    (sinIA as any).lectorIA = null;
    const clave = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    process.env.IA_PROVIDER = 'gemini';
    delete process.env.IA_PROVEEDOR;

    try {
      await expect(sinIA.procesarEscaneo({ buffer: png, filename: '000845.png' })).rejects.toBeInstanceOf(LecturaIAError);
      expect(upload).not.toHaveBeenCalled();
    } finally {
      if (clave) process.env.GEMINI_API_KEY = clave;
    }
  });

  it('rechaza con 400 un archivo que no es PDF ni imagen', async () => {
    await expect(
      service.procesarEscaneo({ buffer: Buffer.from('esto es texto'), filename: 'nota.pdf' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(upload).not.toHaveBeenCalled();
  });

  it('lanza InternalServerErrorException si la subida del original a Storage falla', async () => {
    upload.mockResolvedValue({ data: null, error: new Error('Bucket no accesible') });
    await expect(
      service.procesarEscaneo({ buffer: png, filename: '000845.png', caption: '000845' }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
    expect(lector.leer).not.toHaveBeenCalled();
  });

  it('si falla la inserción del escaneo en la BD, lanza 500 y limpia Storage', async () => {
    config.errorInsertEscaneo = { message: 'Fallo de constraint en BD' };
    await expect(service.procesarEscaneo({ buffer: png, filename: '000845.png' })).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('si dos envíos iguales llegan a la vez, el índice único (23505) se traduce en un aviso de duplicado', async () => {
    config.errorInsertEscaneo = { code: '23505', message: 'duplicate key value violates unique constraint "idx_escaneos_huella_empresa"' };
    const err = await service.procesarEscaneo({ buffer: png, filename: '000845.png' }).catch((e) => e);
    expect(err).toBeInstanceOf(EscaneoDuplicadoError);
    expect(err.tipoDuplicado).toBe('archivo_duplicado');
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('si falla el insert del reporte, borra el escaneo y Storage para que se pueda reenviar', async () => {
    config.errorInsertReporte = { message: 'columna inexistente' };
    await expect(service.procesarEscaneo({ buffer: png, filename: '000845.png' })).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    expect(deletes).toContain('escaneos');
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
