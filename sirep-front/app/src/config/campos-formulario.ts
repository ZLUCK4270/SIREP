/**
 * Responsabilidad: inventario de los campos del formulario físico de GO Service
 * Latam, agrupado por secciones, y accesos indexados para el resto de la app.
 * Existe como el único archivo que hay que tocar cuando el equipo agregue o
 * renombre un campo: nada de esto vive dentro de un componente.
 *
 * Debe coincidir con `sirep-back/src/escaneos/campos-formulario.ts`. El orden es
 * el de lectura del papel, de arriba abajo.
 *
 * `opcional: true` marca lo que el papel suele traer en blanco (teléfono, tinta,
 * casillas sin marcar, firmas): vacío ahí no es un problema de lectura.
 *
 * TODO(inventario): la frecuencia real de "lleno / vacío" de cada campo se
 * confirma con los 5 reportes del inventario formal.
 */

import type {
  DefinicionCampo,
  IdCampo,
  IdSeccion,
  SeccionFormulario,
} from "@/features/revision/types/campos";

export const SECCIONES_FORMULARIO: readonly SeccionFormulario[] = [
  {
    id: "identificacion",
    titulo: "Identificación",
    descripcion: "Quién atendió, a quién y cuándo.",
  },
  {
    id: "equipo",
    titulo: "Equipo y motivo",
    descripcion: "Equipo intervenido y motivo de la visita.",
  },
  {
    id: "revision",
    titulo: "Revisión inicial",
    descripcion: "Estado, limpieza, cabezales, protección y medidas de línea.",
  },
  {
    id: "servicio",
    titulo: "Servicio realizado",
    descripcion: "Procedimiento, conclusión y recomendaciones.",
  },
  {
    id: "repuestos",
    titulo: "Repuestos",
    descripcion: "Repuestos requeridos: tipo, código, descripción y cantidad.",
  },
  {
    id: "cierre",
    titulo: "Cierre de la visita",
    descripcion: "Horas, garantía, facturación y firmas.",
  },
] as const;

export const CAMPOS_FORMULARIO: readonly DefinicionCampo[] = [
  {
    id: "tecnico",
    etiqueta: "Técnico",
    etiqueta_formulario: "Técnico",
    seccion: "identificacion",
    tipo: "texto",
    mono: false,
  },
  {
    id: "empresa",
    etiqueta: "Empresa",
    etiqueta_formulario: "Empresa",
    seccion: "identificacion",
    tipo: "texto",
    mono: false,
    ayuda: "Cliente o empresa atendida.",
  },
  {
    id: "fecha",
    etiqueta: "Fecha",
    etiqueta_formulario: "Fecha",
    seccion: "identificacion",
    tipo: "fecha",
    mono: true,
    ayuda: "Formato día/mes/año, tal como está escrito en el papel.",
  },
  {
    id: "telefono",
    etiqueta: "Teléfono",
    etiqueta_formulario: "Telf.",
    seccion: "identificacion",
    tipo: "codigo",
    mono: true,
    opcional: true,
  },
  {
    id: "direccion",
    etiqueta: "Dirección",
    etiqueta_formulario: "Dirección",
    seccion: "identificacion",
    tipo: "texto",
    mono: false,
  },
  {
    id: "contacto",
    etiqueta: "Contacto",
    etiqueta_formulario: "Contacto",
    seccion: "identificacion",
    tipo: "texto",
    mono: false,
    ayuda: "Persona de contacto en el cliente.",
    opcional: true,
  },
  {
    id: "equipo",
    etiqueta: "Equipo",
    etiqueta_formulario: "Equipo",
    seccion: "equipo",
    tipo: "texto",
    mono: false,
    ayuda: "Marca y modelo del equipo intervenido.",
  },
  {
    id: "motivo",
    etiqueta: "Motivo",
    etiqueta_formulario: "Motivo",
    seccion: "equipo",
    tipo: "texto",
    mono: false,
  },
  {
    id: "estado_del_equipo",
    etiqueta: "Estado del equipo",
    etiqueta_formulario: "Estado del equipo",
    seccion: "revision",
    tipo: "opcion",
    mono: false,
    ayuda: "Casilla marcada: operativo o inoperativo.",
    opcional: true,
  },
  {
    id: "ultimo_mantenimiento",
    etiqueta: "Último mantenimiento",
    etiqueta_formulario: "Último mant.",
    seccion: "revision",
    tipo: "texto",
    mono: false,
    opcional: true,
  },
  {
    id: "limpieza_equipo",
    etiqueta: "Limpieza del equipo",
    etiqueta_formulario: "Limpieza del equipo",
    seccion: "revision",
    tipo: "opcion",
    mono: false,
    ayuda: "Casilla marcada: limpio o sucio.",
    opcional: true,
  },
  {
    id: "cabezales",
    etiqueta: "Cabezales",
    etiqueta_formulario: "Cabezales",
    seccion: "revision",
    tipo: "opcion",
    mono: false,
    ayuda: "Casilla marcada: bueno, regular o malo.",
    opcional: true,
  },
  {
    id: "sistema_proteccion",
    etiqueta: "Sistema de protección",
    etiqueta_formulario: "Sist. de protección",
    seccion: "revision",
    tipo: "texto",
    mono: false,
    ayuda: "Estab. / UPS marcados o lo escrito en el recuadro libre.",
    opcional: true,
  },
  {
    id: "tinta",
    etiqueta: "Tinta",
    etiqueta_formulario: "Tinta",
    seccion: "revision",
    tipo: "texto",
    mono: false,
    opcional: true,
  },
  {
    id: "revision_linea_ln",
    etiqueta: "Revisión de líneas L+N",
    etiqueta_formulario: "L+N",
    seccion: "revision",
    tipo: "codigo",
    mono: true,
    opcional: true,
  },
  {
    id: "revision_linea_lt",
    etiqueta: "Revisión de líneas L+T",
    etiqueta_formulario: "L+T",
    seccion: "revision",
    tipo: "codigo",
    mono: true,
    opcional: true,
  },
  {
    id: "revision_linea_nt",
    etiqueta: "Revisión de líneas N+T",
    etiqueta_formulario: "N+T",
    seccion: "revision",
    tipo: "codigo",
    mono: true,
    opcional: true,
  },
  {
    id: "operador",
    etiqueta: "Operador",
    etiqueta_formulario: "Operador",
    seccion: "revision",
    tipo: "texto",
    mono: false,
    ayuda: "Quien opera el equipo en el cliente.",
    opcional: true,
  },
  {
    id: "procedimiento",
    etiqueta: "Procedimiento",
    etiqueta_formulario: "Procedimiento",
    seccion: "servicio",
    tipo: "multilinea",
    mono: false,
  },
  {
    id: "conclusion",
    etiqueta: "Conclusión",
    etiqueta_formulario: "Conclusión",
    seccion: "servicio",
    tipo: "multilinea",
    mono: false,
  },
  {
    id: "recomendaciones",
    etiqueta: "Recomendaciones",
    etiqueta_formulario: "Recomendaciones",
    seccion: "servicio",
    tipo: "multilinea",
    mono: false,
    opcional: true,
  },
  {
    id: "repuestos_tipo",
    etiqueta: "Tipo de repuestos",
    etiqueta_formulario: "Repuestos requeridos",
    seccion: "repuestos",
    tipo: "opcion",
    mono: false,
    ayuda: "Casilla marcada: venta, descarte o garantía.",
    opcional: true,
  },
  {
    id: "codigo_repuesto",
    etiqueta: "Código de repuesto",
    etiqueta_formulario: "Código",
    seccion: "repuestos",
    tipo: "codigo",
    mono: true,
  },
  {
    id: "repuestos_descripcion",
    etiqueta: "Descripción de repuestos",
    etiqueta_formulario: "Descripción",
    seccion: "repuestos",
    tipo: "multilinea",
    mono: false,
    ayuda: "Una línea por fila de la tabla.",
    opcional: true,
  },
  {
    id: "repuestos_cantidad",
    etiqueta: "Cantidad de repuestos",
    etiqueta_formulario: "Cant.",
    seccion: "repuestos",
    tipo: "codigo",
    mono: true,
    ayuda: "Una línea por fila de la tabla.",
    opcional: true,
  },
  {
    id: "hora_llegada",
    etiqueta: "Hora de llegada",
    etiqueta_formulario: "Hora de llegada cliente",
    seccion: "cierre",
    tipo: "codigo",
    mono: true,
  },
  {
    id: "hora_salida",
    etiqueta: "Hora de salida",
    etiqueta_formulario: "Hora de salida cliente",
    seccion: "cierre",
    tipo: "codigo",
    mono: true,
  },
  {
    id: "garantia",
    etiqueta: "Garantía",
    etiqueta_formulario: "Garantía",
    seccion: "cierre",
    tipo: "casilla",
    mono: false,
    ayuda: "Casilla de información de la labor.",
    opcional: true,
  },
  {
    id: "facturado",
    etiqueta: "Facturado",
    etiqueta_formulario: "Facturado",
    seccion: "cierre",
    tipo: "casilla",
    mono: false,
    ayuda: "Casilla de información de la labor.",
    opcional: true,
  },
  {
    id: "firma_operador",
    etiqueta: "Firma del operador del equipo",
    etiqueta_formulario: "Firma del operador del equipo",
    seccion: "cierre",
    tipo: "firma",
    mono: false,
    ayuda: "Sí si hay una firma sobre la línea.",
    opcional: true,
  },
  {
    id: "firma_cliente",
    etiqueta: "Firma del cliente o administrador",
    etiqueta_formulario: "Firma del cliente o administrador",
    seccion: "cierre",
    tipo: "firma",
    mono: false,
    ayuda: "Sí si hay una firma sobre la línea.",
    opcional: true,
  },
] as const;

export const CAMPOS_POR_ID: Record<IdCampo, DefinicionCampo> = Object.fromEntries(
  CAMPOS_FORMULARIO.map((campo) => [campo.id, campo]),
) as Record<IdCampo, DefinicionCampo>;

export const ORDEN_CAMPOS: Record<IdCampo, number> = Object.fromEntries(
  CAMPOS_FORMULARIO.map((campo, indice) => [campo.id, indice]),
) as Record<IdCampo, number>;

/*
 * `Object.fromEntries` devuelve `{ [k: string]: T }` y TypeScript no puede
 * comprobar que las claves cubren exactamente `IdSeccion`. El doble cast es
 * seguro porque la fuente es `SECCIONES_FORMULARIO`, que es exhaustiva.
 */
export const CAMPOS_POR_SECCION: Record<IdSeccion, readonly DefinicionCampo[]> =
  Object.fromEntries(
    SECCIONES_FORMULARIO.map((seccion) => [
      seccion.id,
      CAMPOS_FORMULARIO.filter((campo) => campo.seccion === seccion.id),
    ]),
  ) as unknown as Record<IdSeccion, readonly DefinicionCampo[]>;