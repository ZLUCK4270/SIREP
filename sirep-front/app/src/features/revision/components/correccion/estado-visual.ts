/**
 * Responsabilidad: decidir el tono de un campo y cuándo el reporte está
 * cerrado.
 * Existe como módulo puro y probado porque tres piezas distintas (la tarjeta,
 * el resaltado del visor y el cierre) tienen que interpretar el mismo hecho de
 * la misma manera: si cada una decidiera por su cuenta, el técnico vería un
 * campo ámbar en un lado y verde en el otro.
 */

import type { TonoResaltado } from "@/features/revision/components/escaneo/hoja-escaneada";
import type {
    CampoReporte,
    EstadoEscaneo,
    PendientesRevision,
} from "@/features/revision/types/dominio";

/**
 * El tono sigue el vocabulario de `lib/etiquetas`: petróleo para la lectura
 * automática, ámbar para lo probable, ladrillo para lo ilegible o de confianza
 * baja y verde para lo que resolvió una persona.
 */
export function tonoDeCampo(campo: CampoReporte): TonoResaltado {
    switch (campo.estado_revision) {
        case "auto":
            return "petrol";
        case "pendiente":
            // Un campo que nadie pudo leer no es "probable": es un caso distinto del
            // mismo campo y se resuelve corrigiéndolo, no confirmándolo.
            return campo.no_leido || campo.confianza === "baja" ? "brick" : "amber";
        case "confirmado":
        case "corregido":
            return "green";
        case "ilegible":
            return "brick";
    }
}

/**
 * El reporte está cerrado cuando no queda ningún dudoso pendiente y hay algo
 * que cerrar. Un escaneo recién recibido tiene cero pendientes porque el modelo
 * todavía no lo leyó: mostrarle un "reporte completo" al técnico sería mentirle,
 * igual que hace `lib/estados.ts` al derivar el estado.
 */
export function hayCierre(
    pendientes: PendientesRevision,
    estado: EstadoEscaneo,
): boolean {
    if (pendientes.dudosos > 0) return false;
    return estado !== "recibido";
}