/**
 * Responsabilidad: filtrar la bandeja por número, estado y origen.
 * Existe como función pura para que la búsqueda tolerante (con o sin ceros,
 * con "N°" o separadores) esté probada y no dependa del componente que la usa.
 */

import type {
    FiltrosBandeja,
    Reporte,
} from "@/features/revision/types/dominio";

function soloDigitos(valor: string): string {
    return valor.replace(/\D/g, "");
}

/**
 * Busca únicamente por N° de reporte. Acepta "845", "000845" o "N° 000.845".
 * Si la consulta tiene texto pero ningún dígito, no hay coincidencias: evita
 * devolver todo el archivo por accidente y ocultar que la búsqueda no aplica.
 */
export function coincideNumeroReporte(
    numeroReporte: string,
    consulta: string,
): boolean {
    const termino = consulta.trim();
    if (!termino) return true;

    const digitosConsulta = soloDigitos(termino);
    if (!digitosConsulta) return false;

    const digitosNumero = soloDigitos(numeroReporte);
    return (
        digitosNumero.includes(digitosConsulta) ||
        digitosNumero.replace(/^0+/, "").includes(digitosConsulta)
    );
}

export function filtrarReportes(
    reportes: readonly Reporte[],
    filtros: FiltrosBandeja,
): Reporte[] {
    return reportes.filter((reporte) => {
        if (filtros.estado !== "todos" && reporte.estado !== filtros.estado) {
            return false;
        }
        if (filtros.origen !== "todos" && reporte.origen !== filtros.origen) {
            return false;
        }
        return coincideNumeroReporte(reporte.numero_reporte, filtros.busqueda);
    });
}

export function hayFiltrosActivos(filtros: FiltrosBandeja): boolean {
    return (
        filtros.busqueda.trim().length > 0 ||
        filtros.estado !== "todos" ||
        filtros.origen !== "todos"
    );
}