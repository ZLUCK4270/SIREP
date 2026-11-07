/**
 * Responsabilidad: contrato del dominio de SIREP tal como lo consumen la bandeja
 * y la vista de corrección.
 * Existe para que los componentes no sepan de dónde salen los datos: hoy los
 * entrega la API de SIREP (`repositorio-api.ts`), que devuelve exactamente esta
 * forma desde el backend (`sirep-back/src/reportes`).
 */

import type { DefinicionCampo, IdCampo, IdSeccion } from "./campos";
import type { MapaRegiones, Region } from "./regiones";

export type Confianza = "alta" | "media" | "baja";

export type EstadoEscaneo = "recibido" | "procesado" | "en_revision" | "completo";

export type OrigenReporte = "historico" | "sistema";

/**
 * `auto` existe para no mentir: un campo de confianza alta fue aceptado por el
 * modelo y no pasó por manos de una persona. Confundirlo con "confirmado" haría
 * que la auditoría mostrara revisión humana donde no la hubo.
 */
export type EstadoRevisionCampo =
  | "auto"
  | "pendiente"
  | "confirmado"
  | "corregido"
  | "ilegible";

export interface CampoReporte {
  id: IdCampo;
  valor_modelo: string | null;
  confianza: Confianza | null;
  no_leido: boolean;
  valor_corregido: string | null;
  estado_revision: EstadoRevisionCampo;
  revisado_por: string | null;
  revisado_en: string | null;
  corregido_por: string | null;
  corregido_en: string | null;
  /** Nota del modelo sobre qué le hizo dudar (ej. "la 2.ª letra parece una o o una a"). */
  observacion?: string | null;
  /**
   * Región del campo medida por el modelo sobre ESTE escaneo. Si falta (reportes
   * anteriores o caja inválida) se usa el mapa fijo del talonario.
   */
  region?: Region | null;
}

export interface Escaneo {
  id: string;
  numero_reporte: string;
  /** Ruta del original en Storage (solo informativa; el navegador usa `paginas_urls`). */
  ruta_original: string;
  paginas: number;
  /** Enlaces temporales y firmados a la imagen de cada página, en orden. Vacío si no se pudieron firmar. */
  paginas_urls: string[];
  enviado_por: string;
  canal: "telegram";
  estado: EstadoEscaneo;
  recibido_en: string;
  procesado_en: string | null;
}

export interface Reporte {
  id: string;
  numero_reporte: string;
  numero_talonario: string;
  cliente: string;
  equipo: string;
  tecnico: string;
  fecha_reporte: string;
  origen: OrigenReporte;
  estado: EstadoEscaneo;
  diseno_talonario: string;
  escaneo: Escaneo;
  campos: CampoReporte[];
  creado_en: string;
  actualizado_en: string;
  completado_en: string | null;
}

/**
 * Campo del reporte enriquecido con su definición y su región. Es lo que
 * consumen los componentes: nunca tienen que cruzar el inventario a mano.
 */
export interface CampoVista extends CampoReporte {
  definicion: DefinicionCampo;
  region: Region;
}

export interface ReporteVista extends Omit<Reporte, "campos"> {
  campos: CampoVista[];
  mapa: MapaRegiones;
}

export interface PendientesRevision {
  total: number;
  resueltos: number;
  dudosos: number;
}

export interface ResumenBandeja {
  reportes_pendientes: number;
  campos_dudosos: number;
  completados: number;
  total: number;
}

export type OrdenBandeja = "dudosos" | "recientes" | "numero";

export type FiltroEstado = EstadoEscaneo | "todos";
export type FiltroOrigen = OrigenReporte | "todos";

export interface FiltrosBandeja {
  busqueda: string;
  estado: FiltroEstado;
  origen: FiltroOrigen;
}

export type AccionRevision =
  | { tipo: "confirmar"; actor: string }
  | { tipo: "corregir"; actor: string; valor: string }
  | { tipo: "ilegible"; actor: string }
  | { tipo: "reabrir"; actor: string };

export type CodigoErrorRepositorio =
  | "sin_conexion"
  | "no_encontrado"
  | "conflicto";

export interface RepositorioReportes {
  /** Devuelve todos los reportes del archivo. La bandeja filtra y ordena en memoria. */
  listarReportes(): Promise<Reporte[]>;
  obtenerReporte(numero: string): Promise<Reporte | null>;
  revisarCampo(
    numero: string,
    campoId: IdCampo,
    accion: AccionRevision,
  ): Promise<Reporte>;
}

export type { IdCampo, IdSeccion };