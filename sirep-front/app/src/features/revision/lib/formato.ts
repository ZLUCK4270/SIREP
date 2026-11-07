/**
 * Responsabilidad: formatear fechas, números de reporte y cantidades para la
 * interfaz.
 * Existe para que la vista no repita reglas de presentación y para que el
 * formato de fecha del talonario (día/mes/año) no se confunda con el de la
 * auditoría (fecha y hora).
 */

const FORMATO_FECHA = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
});

const FORMATO_HORA = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
});

/**
 * Las fechas sin hora se construyen en local: `new Date("2026-10-14")` se
 * interpreta como UTC y en Argentina mostraría el día anterior.
 */
function aFechaLocal(valor: string): Date {
    const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
    if (!coincidencia) return new Date(valor);

    const [, anio, mes, dia] = coincidencia;
    return new Date(Number(anio), Number(mes) - 1, Number(dia));
}

export function formatearFecha(valor: string): string {
    const fecha = aFechaLocal(valor);
    if (Number.isNaN(fecha.getTime())) return valor;
    return FORMATO_FECHA.format(fecha).replace(/\./g, "");
}

export function formatearFechaHora(valor: string): string {
    const fecha = aFechaLocal(valor);
    if (Number.isNaN(fecha.getTime())) return valor;
    return `${FORMATO_FECHA.format(fecha).replace(/\./g, "")} · ${FORMATO_HORA.format(fecha)}`;
}

export function formatearNumeroReporte(numero: string): string {
    return `N° ${numero}`;
}

export function pluralizar(
    cantidad: number,
    singular: string,
    plural: string,
): string {
    return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

export function inicialesDe(nombre: string): string {
    return nombre
        .replace(/^(Téc\.|Tec\.|Ing\.|Lic\.)\s*/i, "")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0]?.toUpperCase() ?? "")
        .join("");
}