/**
 * Responsabilidad: registro de mapas de regiones disponibles y resolución del
 * mapa que corresponde a un reporte.
 * Existe para soportar varios diseños de talonario sin que los componentes
 * conozcan los archivos concretos.
 */

import type { MapaRegiones } from "@/features/revision/types/regiones";
import { MAPA_TALONARIO_GO_SERVICE } from "./talonario-go-service-carta";

export const MAPAS_REGIONES: Readonly<Record<string, MapaRegiones>> = {
  [MAPA_TALONARIO_GO_SERVICE.id]: MAPA_TALONARIO_GO_SERVICE,
};

export const MAPA_POR_DEFECTO = MAPA_TALONARIO_GO_SERVICE.id;

export function buscarMapa(id: string): MapaRegiones | null {
  return MAPAS_REGIONES[id] ?? null;
}

export function obtenerMapa(id: string): MapaRegiones {
  const mapa = buscarMapa(id);
  if (!mapa) {
    // Falla ruidosa a propósito: un reporte sin mapa no puede mostrar recortes
    // y es preferible verlo en desarrollo antes que inventar coordenadas.
    throw new Error(`No existe un mapa de regiones para el diseño "${id}".`);
  }
  return mapa;
}
