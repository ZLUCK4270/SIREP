import { GeminiLector } from './gemini.proveedor';
import { OpenAILector } from './openai.proveedor';
import { crearLectorDeReportes } from './ia-extractor.factory';
import { CampoEsperado, ProveedorIaError } from './types';

describe('Backend 1: Pieza de IA Intercambiable (Guía SIREP pág. 8-10)', () => {
  const dummyBuffer = Buffer.from('fake-image-bytes-300dpi');
  const camposEsperados: CampoEsperado[] = [
    { clave: 'tecnico', tipo: 'texto', descripcion: 'Nombre del técnico' },
    { clave: 'empresa', tipo: 'texto', descripcion: 'Nombre del cliente' },
    { clave: 'fecha', tipo: 'fecha', descripcion: 'Fecha de atención' },
    { clave: 'procedimiento', tipo: 'texto', descripcion: 'Procedimiento realizado' },
    { clave: 'codigo_repuesto', tipo: 'texto', descripcion: 'Código de repuesto' },
    { clave: 'estado_del_equipo', tipo: 'casilla', descripcion: 'Operativo o Inoperativo' },
  ];

  describe('GeminiLector', () => {
    it('procesa el reporte con Gemini y registra tokens, latencia y costo estimado', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    numero_reporte: '000845',
                    campos: {
                      tecnico: { valor: 'Angelo / Fabian', confianza: 'alta', noLeido: false, dudoso: false },
                      empresa: { valor: 'Minera Los Andes', confianza: 'alta', noLeido: false, dudoso: false },
                      fecha: { valor: '15-10-26', confianza: 'alta', noLeido: false, dudoso: false },
                      procedimiento: { valor: 'Cambio de rodamiento', confianza: 'media', noLeido: false, dudoso: false },
                      codigo_repuesto: { valor: 'RP-4401', confianza: 'baja', noLeido: false, dudoso: true },
                      estado_del_equipo: { valor: true, confianza: 'alta', noLeido: false, dudoso: false },
                    },
                  }),
                },
              ],
            },
          },
        ],
        usageMetadata: {
          promptTokenCount: 1250,
          candidatesTokenCount: 380,
        },
      };

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as any);

      const lector = new GeminiLector({
        apiKey: 'test-gemini-key',
        fetchFn: mockFetch,
      });

      const resultado = await lector.leer(dummyBuffer, 'image/png', camposEsperados);

      expect(resultado.numeroReporte).toBe('000845');
      const campoTecnico = resultado.campos.find((c) => c.clave === 'tecnico');
      expect(campoTecnico?.valor).toBe('Angelo / Fabian');
      expect(campoTecnico?.confianza).toBe('alta');

      const campoRepuesto = resultado.campos.find((c) => c.clave === 'codigo_repuesto');
      expect(campoRepuesto?.confianza).toBe('baja');
      expect(campoRepuesto?.dudoso).toBe(true);

      // Métricas y auditoría (Guía pág. 9 y 10)
      expect(resultado.uso.tokensEntrada).toBe(1250);
      expect(resultado.uso.tokensSalida).toBe(380);
      expect(resultado.uso.costoUsd).toBeGreaterThan(0);
      expect(resultado.salidaCruda).toBeDefined();
    });

    it('marca campos ausentes o no leídos como noLeido: true en lugar de inventar valores', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    numero_reporte: '000845',
                    campos: {
                      empresa: { valor: 'Minera Los Andes', confianza: 'alta' },
                    },
                  }),
                },
              ],
            },
          },
        ],
        usageMetadata: { promptTokenCount: 600, candidatesTokenCount: 100 },
      };

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as any);

      const lector = new GeminiLector({ apiKey: 'test-key', fetchFn: mockFetch });
      const resultado = await lector.leer(dummyBuffer, 'image/jpeg', camposEsperados);

      const campoFecha = resultado.campos.find((c) => c.clave === 'fecha');
      expect(campoFecha?.valor).toBeNull();
      expect(campoFecha?.noLeido).toBe(true);

      const campoRepuesto = resultado.campos.find((c) => c.clave === 'codigo_repuesto');
      expect(campoRepuesto?.valor).toBeNull();
      expect(campoRepuesto?.noLeido).toBe(true);
    });

    it('lanza un error tipado ProveedorIaError cuando el proveedor falla o responde error HTTP', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded',
      } as any);

      const lector = new GeminiLector({ apiKey: 'test-key', fetchFn: mockFetch, esperaBaseMs: 0 });

      await expect(lector.leer(dummyBuffer, 'image/jpeg', camposEsperados)).rejects.toThrow(
        ProveedorIaError,
      );
      // 429 es transitorio: se agotan los 3 intentos antes de rendirse
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('reintenta ante un 503 de sobrecarga y tiene éxito cuando el proveedor se recupera', async () => {
      const respuestaOk = {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify({ numero_reporte: '000845', campos: {} }) }] } }],
          usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
        }),
      };
      const mockFetch = jest
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 503, text: async () => 'high demand' })
        .mockResolvedValueOnce({ ok: false, status: 503, text: async () => 'high demand' })
        .mockResolvedValueOnce(respuestaOk);

      const lector = new GeminiLector({ apiKey: 'test-key', fetchFn: mockFetch as any, esperaBaseMs: 0 });
      const resultado = await lector.leer(dummyBuffer, 'image/jpeg', camposEsperados);

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(resultado.numeroReporte).toBe('000845');
    });

    it('reintenta también si falla la conexión de red', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('fetch failed'));
      const lector = new GeminiLector({ apiKey: 'test-key', fetchFn: mockFetch, esperaBaseMs: 0 });

      await expect(lector.leer(dummyBuffer, 'image/jpeg', camposEsperados)).rejects.toThrow('Error de conexión');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('NO reintenta errores permanentes (clave inválida o modelo inexistente)', async () => {
      const mockFetch = jest.fn().mockResolvedValue({ ok: false, status: 404, text: async () => 'model not found' });
      const lector = new GeminiLector({ apiKey: 'test-key', fetchFn: mockFetch as any, esperaBaseMs: 0 });

      await expect(lector.leer(dummyBuffer, 'image/jpeg', camposEsperados)).rejects.toThrow('HTTP 404');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('OpenAILector', () => {
    it('procesa el mismo reporte con OpenAI con tokens y costos', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                numero_reporte: '000845',
                campos: {
                  tecnico: { valor: 'Angelo', confianza: 'alta', noLeido: false, dudoso: false },
                  empresa: { valor: 'Minera Los Andes', confianza: 'alta', noLeido: false, dudoso: false },
                  fecha: { valor: '15-10-26', confianza: 'alta', noLeido: false, dudoso: false },
                  procedimiento: { valor: 'Reparación de válvula', confianza: 'media', noLeido: false, dudoso: false },
                  codigo_repuesto: { valor: null, confianza: 'baja', noLeido: true, dudoso: true },
                  estado_del_equipo: { valor: false, confianza: 'media', noLeido: false, dudoso: false },
                },
              }),
            },
          },
        ],
        usage: { prompt_tokens: 1400, completion_tokens: 220 },
      };

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as any);

      const lector = new OpenAILector({ apiKey: 'test-openai-key', fetchFn: mockFetch });
      const resultado = await lector.leer(dummyBuffer, 'image/jpeg', camposEsperados);

      expect(resultado.numeroReporte).toBe('000845');
      expect(resultado.uso.proveedor).toBe('openai');
      expect(resultado.uso.tokensEntrada).toBe(1400);
      expect(resultado.uso.costoUsd).toBeGreaterThan(0);
    });

    it('lanza ProveedorIaError si se intenta enviar un PDF directo a OpenAI', async () => {
      const lector = new OpenAILector({ apiKey: 'test-key' });
      await expect(lector.leer(dummyBuffer, 'application/pdf', camposEsperados)).rejects.toThrow(
        'El endpoint multimodal de OpenAI solo admite imágenes',
      );
    });

    it('lanza ProveedorIaError si OpenAI responde con error', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      } as any);

      const lector = new OpenAILector({ apiKey: 'test-key', fetchFn: mockFetch });
      await expect(lector.leer(dummyBuffer, 'image/jpeg', camposEsperados)).rejects.toThrow(
        ProveedorIaError,
      );
    });
  });

  describe('Factory y Selección de Proveedor', () => {
    it('conmuta proveedor según IA_PROVEEDOR', () => {
      process.env.IA_PROVEEDOR = 'gemini';
      process.env.GEMINI_API_KEY = 'key-gemini';
      const l1 = crearLectorDeReportes();
      expect(l1.nombre).toBe('gemini');

      process.env.IA_PROVEEDOR = 'openai';
      process.env.OPENAI_API_KEY = 'key-openai';
      const l2 = crearLectorDeReportes();
      expect(l2.nombre).toBe('openai');
    });
  });
});
describe('Campos opcionales, opciones y casillas', () => {
  const campos: CampoEsperado[] = [
    { clave: 'telefono', tipo: 'texto', opcional: true },
    { clave: 'tinta', tipo: 'texto', opcional: true },
    { clave: 'limpieza_equipo', tipo: 'opcion', opcional: true, opciones: ['Limpio', 'Sucio'] },
    { clave: 'facturado', tipo: 'casilla', opcional: true },
    { clave: 'empresa', tipo: 'texto' },
  ];

  const respuesta = (camposRespuesta: Record<string, unknown>) =>
    jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify({ numero_reporte: '000214', campos: camposRespuesta }) }] } }],
        usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 20 },
      }),
    } as any);

  const leer = async (camposRespuesta: Record<string, unknown>) => {
    const lector = new GeminiLector({ apiKey: 'k', fetchFn: respuesta(camposRespuesta) });
    const r = await lector.leer(Buffer.from('x'), 'image/jpeg', campos);
    return Object.fromEntries(r.campos.map((c) => [c.clave, c]));
  };

  it('un campo opcional en blanco ("vacio": true) no es dudoso ni no leído', async () => {
    const por = await leer({ telefono: { valor: null, vacio: true } });
    expect(por.telefono).toMatchObject({ valor: null, noLeido: false, dudoso: false, confianza: 'alta' });
  });

  it('un campo opcional con algo escrito que no se pudo leer sigue siendo no leído', async () => {
    const por = await leer({ tinta: { valor: null, vacio: false, noLeido: true } });
    expect(por.tinta).toMatchObject({ noLeido: true });
  });

  it('un campo obligatorio vacío sigue siendo no leído aunque el modelo diga "vacio"', async () => {
    const por = await leer({ empresa: { valor: null, vacio: true } });
    expect(por.empresa).toMatchObject({ noLeido: true });
  });

  it('un campo tipo opción conserva el texto de la casilla marcada (antes se convertía en "No")', async () => {
    const por = await leer({ limpieza_equipo: { valor: 'Limpio', confianza: 'alta' } });
    expect(por.limpieza_equipo.valor).toBe('Limpio');
  });

  it('una casilla acepta "Sí" con tilde', async () => {
    const por = await leer({ facturado: { valor: 'Sí', confianza: 'alta' } });
    expect(por.facturado.valor).toBe(true);
  });
});