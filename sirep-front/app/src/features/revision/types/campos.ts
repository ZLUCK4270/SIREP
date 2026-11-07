/**
 * Responsabilidad: identificadores de los campos del reporte técnico y de las
 * secciones del formulario.
 * Existe como fuente de verdad de los identificadores: el mapa de regiones y la
 * vista de corrección se tipan contra esta lista. Son exactamente las claves que
 * el backend le pide al modelo (`sirep-back/src/escaneos/campos-formulario.ts`):
 * si una cambia, tiene que cambiar en los dos lados.
 */

export const IDS_CAMPOS = [
  "tecnico",
  "empresa",
  "fecha",
  "telefono",
  "direccion",
  "contacto",
  "equipo",
  "motivo",
  "estado_del_equipo",
  "ultimo_mantenimiento",
  "limpieza_equipo",
  "cabezales",
  "sistema_proteccion",
  "tinta",
  "revision_linea_ln",
  "revision_linea_lt",
  "revision_linea_nt",
  "operador",
  "procedimiento",
  "conclusion",
  "recomendaciones",
  "repuestos_tipo",
  "codigo_repuesto",
  "repuestos_descripcion",
  "repuestos_cantidad",
  "hora_llegada",
  "hora_salida",
  "garantia",
  "facturado",
  "firma_operador",
  "firma_cliente",
] as const;

export type IdCampo = (typeof IDS_CAMPOS)[number];

export const IDS_SECCIONES = [
  "identificacion",
  "equipo",
  "revision",
  "servicio",
  "repuestos",
  "cierre",
] as const;

export type IdSeccion = (typeof IDS_SECCIONES)[number];

export type TipoCampo =
  | "texto"
  | "fecha"
  | "numero"
  | "codigo"
  | "opcion"
  | "casilla"
  | "multilinea"
  | "firma"
  | "sello";

export interface DefinicionCampo {
  id: IdCampo;
  etiqueta: string;
  /** Etiqueta impresa en el talonario; puede diferir de la de la interfaz. */
  etiqueta_formulario: string;
  seccion: IdSeccion;
  tipo: TipoCampo;
  /** Los datos que se copian o comparan se muestran en monoespaciada. */
  mono: boolean;
  ayuda?: string;
  /** El papel suele traerlo en blanco: vacío no es un problema de lectura. */
  opcional?: boolean;
}

export interface SeccionFormulario {
  id: IdSeccion;
  titulo: string;
  descripcion?: string;
}