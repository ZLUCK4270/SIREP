import { normalizarFecha } from '../escaneos/escaneos.util';

/** Lo que el modelo devuelve como valor puede ser texto, número o casilla (booleano). En BD todo se guarda como texto. */
export function aTexto(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  if (typeof valor === 'string' || typeof valor === 'number') {
    const texto = String(valor).trim();
    return texto === '' ? null : texto;
  }
  return null;
}

/**
 * Traduce los valores del formulario a las columnas de `reportes`.
 * Se usa al guardar lo que leyó el modelo y otra vez al corregir en la bandeja, para
 * que las columnas consultables siempre muestren el valor vigente y no el del modelo.
 */
export function columnasDesdeValores(valores: Record<string, string | null>) {
  return {
    cliente: valores.empresa ?? null,
    fecha: normalizarFecha(valores.fecha),
    serie_equipo: valores.equipo ?? null,
    procedimiento: valores.procedimiento ?? null,
    codigo_repuesto: valores.codigo_repuesto ?? null,
    tecnico_asignado: valores.tecnico ?? null,
    direccion: valores.direccion ?? null,
    motivo: valores.motivo ?? null,
    estado_equipo: valores.estado_del_equipo ?? null,
    conclusion: valores.conclusion ?? null,
    recomendaciones: valores.recomendaciones ?? null,
    hora_llegada: valores.hora_llegada ?? null,
    hora_salida: valores.hora_salida ?? null,
    telefono: valores.telefono ?? null,
    contacto: valores.contacto ?? null,
    ultimo_mantenimiento: valores.ultimo_mantenimiento ?? null,
    limpieza_equipo: valores.limpieza_equipo ?? null,
    cabezales: valores.cabezales ?? null,
    sistema_proteccion: valores.sistema_proteccion ?? null,
    tinta: valores.tinta ?? null,
    revision_linea_ln: valores.revision_linea_ln ?? null,
    revision_linea_lt: valores.revision_linea_lt ?? null,
    revision_linea_nt: valores.revision_linea_nt ?? null,
    operador: valores.operador ?? null,
    repuestos_tipo: valores.repuestos_tipo ?? null,
    repuestos_descripcion: valores.repuestos_descripcion ?? null,
    repuestos_cantidad: valores.repuestos_cantidad ?? null,
    garantia: valores.garantia ?? null,
    facturado: valores.facturado ?? null,
    firma_operador: valores.firma_operador ?? null,
    firma_cliente: valores.firma_cliente ?? null,
  };
}