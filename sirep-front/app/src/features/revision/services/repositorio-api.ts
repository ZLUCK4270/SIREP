/**
 * Responsabilidad: implementación de `RepositorioReportes` sobre la API de SIREP.
 * Existe para que la bandeja y la vista de corrección trabajen con los reportes
 * que llegaron por Telegram y no con datos de ejemplo. Cada acción de revisión
 * se guarda en el servidor al instante: no hay estado local que se pierda al
 * recargar.
 */

import { ApiError, apiClient } from "@/lib/api";
import type {
  AccionRevision,
  IdCampo,
  RepositorioReportes,
  Reporte,
} from "@/features/revision/types/dominio";

import { ErrorRepositorio } from "./errores";

/** Traduce los errores HTTP a los códigos de dominio que la interfaz ya sabe mostrar. */
function traducirError(error: unknown): ErrorRepositorio {
  if (error instanceof ErrorRepositorio) return error;

  if (error instanceof ApiError) {
    if (error.status === 404) {
      return new ErrorRepositorio(error.message, "no_encontrado");
    }
    // 409: otra persona cambió el reporte o el campo ya no está pendiente.
    // 400: el servidor rechazó el dato (por ejemplo, una corrección vacía).
    if (error.status === 409 || error.status === 400) {
      return new ErrorRepositorio(error.message, "conflicto");
    }
    if (error.status === 0 || error.status === 408) {
      return new ErrorRepositorio(
        "No hay conexión con el servidor de SIREP. Verifica que el backend esté en marcha.",
        "sin_conexion",
      );
    }
    return new ErrorRepositorio(
      "El servidor de SIREP no pudo completar la operación. Inténtalo de nuevo.",
      "sin_conexion",
    );
  }

  return new ErrorRepositorio(
    error instanceof Error ? error.message : "Error desconocido.",
    "sin_conexion",
  );
}

export function crearRepositorioApi(): RepositorioReportes {
  return {
    async listarReportes() {
      try {
        return await apiClient.get<Reporte[]>("/reportes", { cache: "no-store" });
      } catch (error) {
        throw traducirError(error);
      }
    },

    async obtenerReporte(numero: string) {
      try {
        return await apiClient.get<Reporte>(
          `/reportes/${encodeURIComponent(numero)}`,
          { cache: "no-store" },
        );
      } catch (error) {
        // "No existe" es un resultado normal para la interfaz, no un fallo.
        if (error instanceof ApiError && error.status === 404) return null;
        throw traducirError(error);
      }
    },

    async revisarCampo(numero: string, campoId: IdCampo, accion: AccionRevision) {
      try {
        return await apiClient.patch<Reporte>(
          `/reportes/${encodeURIComponent(numero)}/campos/${encodeURIComponent(campoId)}`,
          {
            tipo: accion.tipo,
            actor: accion.actor,
            ...(accion.tipo === "corregir" ? { valor: accion.valor } : {}),
          },
          { cache: "no-store" },
        );
      } catch (error) {
        throw traducirError(error);
      }
    },
  };
}
