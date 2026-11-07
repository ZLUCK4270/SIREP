/**
 * Responsabilidad: ordenar la bandeja según la intención del técnico.
 * Existe separado de la tabla porque "más dudosos primero" es una regla de
 * negocio —define qué se revisa antes— y tiene que poder probarse sin renderizar.
 */

import { contarPendientes } from "@/features/revision/lib/dudosos";
import type {
    OrdenBandeja,
    Reporte,
} from "@/features/revision/types/dominio";

export interface OpcionOrden {
    valor: OrdenBandeja;
    etiqueta: string;
}

export const OPCIONES_ORDEN: readonly OpcionOrden[] = [
    { valor: "dudosos", etiqueta: "Más dudosos primero" },
    { valor: "recientes", etiqueta: "Actualizados hace poco" },
    { valor: "numero", etiqueta: "N° de reporte" },
] as const;

const PESO_ESTADO: Record<Reporte["estado"], number> = {
    recibido: 0,
    procesado: 1,
    en_revision: 2,
    completo: 3,
};

function compararPorNumero(a: Reporte, b: Reporte): number {
    return a.numero_reporte.localeCompare(b.numero_reporte, "es", {
        numeric: true,
    });
}

function compararPorActualizacion(a: Reporte, b: Reporte): number {
    return b.actualizado_en.localeCompare(a.actualizado_en);
}

export function compararPorDudosos(a: Reporte, b: Reporte): number {
    const pendientesA = contarPendientes(a.campos);
    const pendientesB = contarPendientes(b.campos);

    if (pendientesA !== pendientesB) return pendientesB - pendientesA;

    // Sin dudosos, un reporte completo deja de competir por atención: primero los
    // que todavía esperan lectura o cierre, y al final los terminados.
    if (PESO_ESTADO[a.estado] !== PESO_ESTADO[b.estado]) {
        return PESO_ESTADO[a.estado] - PESO_ESTADO[b.estado];
    }

    const porFecha = compararPorActualizacion(a, b);
    return porFecha !== 0 ? porFecha : compararPorNumero(a, b);
}

export function ordenarReportes(
    reportes: readonly Reporte[],
    orden: OrdenBandeja,
): Reporte[] {
    const copia = [...reportes];

    switch (orden) {
        case "dudosos":
            copia.sort(compararPorDudosos);
            break;
        case "recientes":
            copia.sort(
                (a, b) => compararPorActualizacion(a, b) || compararPorNumero(a, b),
            );
            break;
        case "numero":
            copia.sort(compararPorNumero);
            break;
    }

    return copia;
}