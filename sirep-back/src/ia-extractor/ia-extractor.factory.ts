import { GeminiConfig, GeminiLector } from './gemini.proveedor';
import { OpenAIConfig, OpenAILector } from './openai.proveedor';
import { LectorDeReportes, ProveedorIaError } from './types';

export interface FactoryOptions {
  proveedor?: string;
  geminiConfig?: Partial<GeminiConfig>;
  openaiConfig?: Partial<OpenAIConfig>;
}

/** Lee un entero positivo de una variable de entorno; si no existe o es inválido devuelve undefined. */
function enteroDeEnv(nombre: string): number | undefined {
  const n = Number(process.env[nombre]);
  return Number.isFinite(n) && n >= 0 && process.env[nombre] !== undefined && process.env[nombre] !== ''
    ? Math.floor(n)
    : undefined;
}

export function crearLectorDeReportes(opciones?: FactoryOptions): LectorDeReportes {
  const proveedor = (
    opciones?.proveedor ||
    process.env.IA_PROVEEDOR ||
    process.env.IA_PROVIDER ||
    'gemini'
  ).toLowerCase();

  if (proveedor === 'gemini') {
    const apiKey =
      opciones?.geminiConfig?.apiKey || process.env.GEMINI_API_KEY || '';
    const modelo =
      opciones?.geminiConfig?.modelo || process.env.GEMINI_MODEL;
    return new GeminiLector({
      apiKey,
      modelo,
      fetchFn: opciones?.geminiConfig?.fetchFn,
      intentosMaximos: opciones?.geminiConfig?.intentosMaximos ?? enteroDeEnv('GEMINI_REINTENTOS'),
      esperaBaseMs: opciones?.geminiConfig?.esperaBaseMs ?? enteroDeEnv('GEMINI_ESPERA_MS'),
    });
  }

  if (proveedor === 'openai') {
    const apiKey =
      opciones?.openaiConfig?.apiKey || process.env.OPENAI_API_KEY || '';
    const modelo =
      opciones?.openaiConfig?.modelo || process.env.OPENAI_MODEL;
    return new OpenAILector({
      apiKey,
      modelo,
      fetchFn: opciones?.openaiConfig?.fetchFn,
    });
  }

  throw new ProveedorIaError(
    proveedor,
    `Proveedor de IA no soportado: "${proveedor}". Opciones válidas: 'gemini', 'openai'.`,
  );
}