/**
 * Responsabilidad: punto único donde se elige la implementación del
 * repositorio de reportes.
 * Existe para que los componentes reciban siempre el mismo objeto por contexto y
 * que cambiar de origen de datos (pruebas, otro backend) sea un cambio en este
 * archivo.
 */

import type { RepositorioReportes } from "@/features/revision/types/dominio";

import { crearRepositorioApi } from "./repositorio-api";

export { ErrorRepositorio } from "./errores";

export function crearRepositorio(): RepositorioReportes {
  return crearRepositorioApi();
}
