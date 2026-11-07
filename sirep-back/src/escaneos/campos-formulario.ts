import { CampoEsperado } from '../ia-extractor/types';

/**
 * Campos del formulario físico de GO Service Latam que se le piden al modelo.
 * Vive aparte del servicio porque lo usan tres piezas que deben coincidir: lo que
 * se le pide al modelo, lo que se guarda en `reportes` y lo que la bandeja de
 * revisión muestra y recorta. Agregar un campo aquí obliga a agregarlo también en
 * el inventario del frontend (`campos-formulario.ts`), en su mapa de regiones y en
 * una columna de `reportes` (ver `reportes.columnas.ts` y la migración).
 *
 * El orden es el de lectura del papel, de arriba abajo.
 *
 * `opcional: true` = el papel suele traerlo en blanco (teléfono, tinta, casillas sin marcar).
 * Si el modelo confirma que está en blanco no pasa a la bandeja de revisión; si hay algo
 * escrito que no pudo leer, sí.
 */
export const CAMPOS_FORMULARIO: readonly CampoEsperado[] = [
  // Cabecera y datos del cliente
  { clave: 'tecnico', tipo: 'texto', descripcion: 'Nombre del técnico' },
  { clave: 'empresa', tipo: 'texto', descripcion: 'Nombre del cliente o empresa atendida' },
  { clave: 'fecha', tipo: 'fecha', descripcion: 'Fecha de atención en el reporte' },
  { clave: 'telefono', tipo: 'texto', opcional: true, descripcion: 'Teléfono del cliente (casillero TELF)' },
  { clave: 'direccion', tipo: 'texto', descripcion: 'Dirección de la empresa' },
  { clave: 'contacto', tipo: 'texto', opcional: true, descripcion: 'Persona de contacto en el cliente (casillero CONTACTO)' },
  { clave: 'equipo', tipo: 'texto', descripcion: 'Modelo y marca del equipo técnico' },
  { clave: 'motivo', tipo: 'texto', descripcion: 'Motivo de la orden de servicio' },

  // Revisión inicial
  { clave: 'estado_del_equipo', tipo: 'opcion', opcional: true, opciones: ['Operativo', 'Inoperativo'], descripcion: 'Casilla marcada en ESTADO DEL EQUIPO' },
  { clave: 'ultimo_mantenimiento', tipo: 'texto', opcional: true, descripcion: 'Dato escrito en ULTIMO MANT. (fecha u observación)' },
  { clave: 'limpieza_equipo', tipo: 'opcion', opcional: true, opciones: ['Limpio', 'Sucio'], descripcion: 'Casilla marcada en LIMPIEZA DEL EQUIPO' },
  { clave: 'cabezales', tipo: 'opcion', opcional: true, opciones: ['Bueno', 'Regular', 'Malo'], descripcion: 'Casilla marcada en CABEZALES' },
  { clave: 'sistema_proteccion', tipo: 'texto', opcional: true, descripcion: 'SIST. DE PROTECCION: casillas Estab. / UPS marcadas y/o lo escrito en el recuadro libre (ej. "UPS", "Estab.")' },
  { clave: 'tinta', tipo: 'texto', opcional: true, descripcion: 'Dato escrito en TINTA' },
  { clave: 'revision_linea_ln', tipo: 'texto', opcional: true, descripcion: 'Medida escrita en REVISION DE LINEAS, casillero L+N' },
  { clave: 'revision_linea_lt', tipo: 'texto', opcional: true, descripcion: 'Medida escrita en REVISION DE LINEAS, casillero L+T' },
  { clave: 'revision_linea_nt', tipo: 'texto', opcional: true, descripcion: 'Medida escrita en REVISION DE LINEAS, casillero N+T' },
  { clave: 'operador', tipo: 'texto', opcional: true, descripcion: 'Nombre escrito en OPERADOR (quien opera el equipo en el cliente)' },

  // Servicio realizado
  { clave: 'procedimiento', tipo: 'texto', descripcion: 'Descripción detallada del trabajo realizado' },
  { clave: 'conclusion', tipo: 'texto', descripcion: 'Conclusión técnica final' },
  { clave: 'recomendaciones', tipo: 'texto', opcional: true, descripcion: 'Recomendaciones para el cliente' },

  // Repuestos requeridos
  { clave: 'repuestos_tipo', tipo: 'opcion', opcional: true, opciones: ['Venta', 'Descarte', 'Garantía'], descripcion: 'Casilla marcada en REPUESTOS REQUERIDOS' },
  { clave: 'codigo_repuesto', tipo: 'texto', descripcion: 'Código o número de parte de repuestos usados (columna CODIGO; una línea por fila de la tabla)' },
  { clave: 'repuestos_descripcion', tipo: 'texto', opcional: true, descripcion: 'Columna DESCRIPCION de la tabla de repuestos (una línea por fila)' },
  { clave: 'repuestos_cantidad', tipo: 'texto', opcional: true, descripcion: 'Columna CANT de la tabla de repuestos (una línea por fila)' },

  // Información de la labor y cierre
  { clave: 'hora_llegada', tipo: 'hora', descripcion: 'Hora de ingreso del técnico' },
  { clave: 'hora_salida', tipo: 'hora', descripcion: 'Hora de salida del técnico' },
  { clave: 'garantia', tipo: 'casilla', opcional: true, descripcion: 'Casilla GARANTIA de INFORMACION DE LA LABOR' },
  { clave: 'facturado', tipo: 'casilla', opcional: true, descripcion: 'Casilla FACTURADO de INFORMACION DE LA LABOR' },
  { clave: 'firma_operador', tipo: 'casilla', opcional: true, descripcion: 'true si hay firma manuscrita sobre "Firma del Operador del Equipo"' },
  { clave: 'firma_cliente', tipo: 'casilla', opcional: true, descripcion: 'true si hay firma manuscrita sobre "Firma del Cliente o Administrador"' },
];

export const IDS_CAMPOS_FORMULARIO: readonly string[] = CAMPOS_FORMULARIO.map((c) => c.clave);

/** Campos que el papel suele traer en blanco: vacíos no cuentan como dudosos. */
export const IDS_CAMPOS_OPCIONALES: ReadonlySet<string> = new Set(
  CAMPOS_FORMULARIO.filter((c) => c.opcional).map((c) => c.clave),
);