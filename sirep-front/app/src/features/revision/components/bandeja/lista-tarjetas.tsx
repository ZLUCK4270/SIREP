/**
 * Responsabilidad: la misma información de la tabla en tarjetas apiladas para
 * móvil y tablet (una columna a 360 px, dos a 768 px).
 * Existe porque la tabla de ocho columnas no cabe en una pantalla chica: acá
 * cada tarjeta es un solo enlace con nombre accesible explícito, para que el
 * gesto de abrir el reporte siga siendo de un toque y no de precisiones.
 */

import Link from "next/link";

import { CeldaDudosos } from "@/features/revision/components/bandeja/celda-dudosos";
import { EtiquetaEstado } from "@/features/revision/components/comunes/etiqueta-estado";
import { EtiquetaOrigen } from "@/features/revision/components/comunes/etiqueta-origen";
import {
    formatearFecha,
    formatearNumeroReporte,
} from "@/features/revision/lib/formato";
import type { Reporte } from "@/features/revision/types/dominio";

interface ListaTarjetasProps {
    reportes: readonly Reporte[];
}

export function ListaTarjetas({ reportes }: ListaTarjetasProps) {
    return (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:hidden">
            {reportes.map((reporte) => (
                <li key={reporte.id} className="min-w-0">
                    <Link
                        href={`/reportes/${reporte.numero_reporte}`}
                        aria-label={`Abrir el reporte N° ${reporte.numero_reporte} de ${reporte.cliente}`}
                        className={[
                            "flex h-full flex-col gap-3 rounded-md border border-line bg-raised p-4",
                            "transition-colors duration-150 ease-[var(--ease-salida)]",
                            "hover:border-line-strong hover:bg-sunken",
                        ].join(" ")}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="font-mono text-meta font-medium text-petrol-700">
                                    {formatearNumeroReporte(reporte.numero_reporte)}
                                </p>
                                <p className="mt-1 truncate text-base font-medium text-ink">
                                    {reporte.cliente}
                                </p>
                                <p className="mt-0.5 truncate text-meta text-muted">
                                    {reporte.equipo}
                                </p>
                                <p className="mt-0.5 truncate text-meta text-faint">
                                    {reporte.tecnico}
                                </p>
                            </div>
                            <CeldaDudosos
                                campos={reporte.campos}
                                etiqueta="Dudosos"
                                className="shrink-0"
                            />
                        </div>

                        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-line pt-3">
                            <EtiquetaEstado estado={reporte.estado} />
                            <EtiquetaOrigen origen={reporte.origen} />
                            <span className="ml-auto font-mono text-meta text-faint">
                                {formatearFecha(reporte.fecha_reporte)}
                            </span>
                        </div>
                    </Link>
                </li>
            ))}
        </ul>
    );
}