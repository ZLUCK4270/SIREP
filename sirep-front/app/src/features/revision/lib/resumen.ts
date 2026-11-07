/**
 * Responsabilidad: calcular las cifras del resumen superior de la bandeja
 * (reportes pendientes, campos dudosos totales, completados hoy y total).
 * Existe como función pura para que la definición de "pendiente" y de "hoy"
 * esté probada en un solo lugar; si cada vista contara por su cuenta, el
 * resumen y la tabla podrían contradecirse.
 */

import { esDudoso } from "@/features/revision/lib/dudosos";
import type {
    Reporte,
    ResumenBandeja,
} from "@/features/revision/types/dominio";

/**
 * Compara el calendario local (año, mes, día) y no el instante: un reporte
 * cerrado a las 23:30 sigue contando para el día en que se cerró, aunque en
 * otra zona horaria la fecha del ISO ya haya cambiado.
 */
function esMismoDiaLocal(iso: string, dia: Date): boolean {
    const fecha = new Date(iso);
    if (Number.isNaN(fecha.getTime())) return false;
    return (
        fecha.getFullYear() === dia.getFullYear() &&
        fecha.getMonth() === dia.getMonth() &&
        fecha.getDate() === dia.getDate()
    );
}

/**
 * `hoy` es opcional para que las pruebas puedan fijar el día; en producción
 * siempre es la fecha del sistema.
 */
export function calcularResumenBandeja(
    reportes: readonly Reporte[],
    hoy: Date = new Date("2026-11-02T12:00:00Z"),
): ResumenBandeja {
    return {
        // Pendiente es todo lo que todavía espera trabajo del técnico: cualquier
        // estado distinto de "completo", incluido "recibido" (sin leer todavía).
        reportes_pendientes: reportes.filter((reporte) => reporte.estado !== "completo")
            .length,
        // Se cuenta por confianza de lectura (esDudoso), no por revisión: la cifra
        // mide cuánto material dudoso hay en el archivo, resuelto o no.
        campos_dudosos: reportes.reduce(
            (total, reporte) => total + reporte.campos.filter(esDudoso).length,
            0,
        ),
        completados: reportes.filter(
            (reporte) =>
                reporte.completado_en !== null &&
                esMismoDiaLocal(reporte.completado_en, hoy),
        ).length,
        total: reportes.length,
    };
}