/**
 * Responsabilidad: describir la geometría del talonario en coordenadas
 * normalizadas (0 a 1) para poder recortar cualquier campo sin depender de que
 * el modelo de IA indique dónde está.
 * Existe porque el formulario físico es siempre el mismo: se marca una vez por
 * diseño y se reutiliza en todos los reportes.
 */

import type { IdCampo } from "./campos";

/** Un reporte puede traer anverso, reverso y hojas adicionales. */
export type NumeroPagina = number;

export interface Region {
  x: number;
  y: number;
  ancho: number;
  alto: number;
  pagina: NumeroPagina;
}

export interface MapaRegiones {
  id: string;
  nombre: string;
  descripcion: string;
  /** Dimensiones reales en píxeles del escaneo de referencia. */
  ancho_pagina: number;
  alto_pagina: number;
  paginas: number;
  /**
   * Un registro por campo: si el inventario agrega un campo, TypeScript obliga
   * a calibrar su región antes de compilar.
   */
  regiones: Record<IdCampo, Region>;
}
