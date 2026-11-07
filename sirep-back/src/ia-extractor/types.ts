// ==============================================================================
// SIREP: Contrato oficial de la pieza de IA intercambiable (Guía pág. 9 y 10)
// Paquete TypeScript independiente sin dependencias de NestJS ni Next.js
// ==============================================================================

export type Confianza = 'alta' | 'media' | 'baja';

export interface CampoEsperado {
  /** Clave del campo, ej. 'fecha', 'motivo', 'procedimiento', 'numero_reporte' */
  clave: string;
  /** Tipo de campo para guiar la normalización y validación */
  tipo: 'texto' | 'fecha' | 'hora' | 'casilla' | 'opcion' | 'numero' | 'tabla';
  /** Pista contextual o descripción para el modelo de IA */
  descripcion?: string;
  /** Solo para tipo "opcion": las casillas impresas entre las que se marca una (ej. Limpio / Sucio). */
  opciones?: string[];
  /**
   * El papel suele traer este campo en blanco. Si el modelo confirma que está en blanco
   * ("vacio": true) no se marca como dudoso ni como no leído.
   */
  opcional?: boolean;
}

/** Zona del campo en la imagen de la página, en coordenadas normalizadas 0–1 (origen arriba a la izquierda). */
export interface CajaCampo {
  x: number;
  y: number;
  ancho: number;
  alto: number;
  /** Página (base 1) donde está el campo; la asigna EscaneosService al leer cada página. */
  pagina?: number;
}

export interface CampoLeido {
  clave: string;
  /** Valor extraído, booleano para casillas, o null si no se pudo leer */
  valor: string | boolean | null;
  /** Nivel de certeza declarado por el modelo */
  confianza: Confianza;
  /** True si el campo no se leyó o estaba vacío en el formulario físico (no inventar valor) */
  noLeido: boolean;
  /** True si el valor es ambiguo o tiene baja confianza y requiere revisión humana */
  dudoso?: boolean;
  /** Justificación u observación opcional del modelo */
  observacion?: string;
  /** Dónde está el campo en la imagen, según el modelo. Permite resaltar el sitio real aunque el escaneo esté desplazado o inclinado. */
  caja?: CajaCampo | null;
}

export interface UsoLlamada {
  proveedor: string;
  modelo: string;
  tokensEntrada: number;
  tokensSalida: number;
  costoUsd: number;
  latenciaMs: number;
}

export interface ResultadoLectura {
  /** N° de reporte extraído del talonario impreso (si está visible) */
  numeroReporte?: string | null;
  /** Lista de campos extraídos con su respectiva confianza */
  campos: CampoLeido[];
  /** Métricas de consumo y costos para la prueba de viabilidad */
  uso: UsoLlamada;
  /** Salida cruda del proveedor para auditoría (pág. 10) */
  salidaCruda?: string;
}

/** Interfaz unificada para los lectores de IA intercambiables */
export interface LectorDeReportes {
  readonly nombre: string;
  readonly modelo: string;
  leer(
    imagen: Buffer,
    mimeType: string,
    campos: CampoEsperado[],
    temperatura?: number,
  ): Promise<ResultadoLectura>;
}

/** Error tipado que debe lanzarse cuando un proveedor falla (pág. 10) */
export class ProveedorIaError extends Error {
  constructor(
    public readonly proveedor: string,
    mensaje: string,
    public readonly codigoHttp?: number,
    public readonly detalle?: any,
  ) {
    super(`[${proveedor}] ${mensaje}`);
    this.name = 'ProveedorIaError';
  }
}