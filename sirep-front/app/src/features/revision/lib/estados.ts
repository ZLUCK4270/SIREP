/**
 * Responsabilidad: derivar el estado visible de un reporte a partir de sus
 * campos.
 * Existe porque esa regla define el trabajo real del taller: el estado no se
 * asigna a mano, se deduce de la evidencia. Compartida entre los datos
 * el frontend y el backend (`sirep-back/src/reportes/reportes.mapper.ts`) para
 * que una corrección guardada no pueda contradecir a la bandeja.
 */

import type {
  CampoReporte,
  EstadoEscaneo,
} from "@/features/revision/types/dominio";

import { fueResueltoPorPersona, requiereRevision } from "./dudosos";

export interface OpcionesDerivacion {
  /** `false` cuando el escaneo llegó pero el modelo todavía no lo leyó. */
  procesado: boolean;
}

export function derivarEstadoReporte(
  campos: readonly CampoReporte[],
  { procesado }: OpcionesDerivacion,
): EstadoEscaneo {
  if (!procesado) return "recibido";

  const hayPendientes = campos.some(requiereRevision);
  if (hayPendientes) {
    // "En revisión" exige intervención humana previa: sin eso, el reporte sigue
    // esperando a que alguien abra la bandeja.
    const yaIntervino = campos.some(fueResueltoPorPersona);
    return yaIntervino ? "en_revision" : "procesado";
  }

  return "completo";
}
