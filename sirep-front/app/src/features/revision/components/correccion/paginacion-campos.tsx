/**
 * Responsabilidad: controles de paginado de la lista de campos del reporte.
 * Existe para que la lista no crezca sin límite hacia abajo: muestra un
 * rango ("1–4 de 9") y botones de página, sin conocer nada del dominio.
 */

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginacionCamposProps {
    /** Página actual, base 0. */
    pagina: number;
    totalPaginas: number;
    tamanoPagina: number;
    totalItems: number;
    onCambiar: (pagina: number) => void;
}

/** Devuelve las páginas a mostrar, con `null` como puntos suspensivos. */
function paginasVisibles(actual: number, total: number): (number | null)[] {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i);
    const set = new Set([0, total - 1, actual - 1, actual, actual + 1]);
    const orden = [...set]
        .filter((p) => p >= 0 && p < total)
        .sort((a, b) => a - b);
    const salida: (number | null)[] = [];
    orden.forEach((p, i) => {
        if (i > 0 && p - orden[i - 1] > 1) salida.push(null);
        salida.push(p);
    });
    return salida;
}

const baseBoton =
    "inline-flex size-8 items-center justify-center rounded-sm text-meta font-medium transition-[background-color,color,transform] duration-150 ease-[var(--ease-salida)] active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-petrol-600 disabled:pointer-events-none disabled:opacity-40";

export function PaginacionCampos({
    pagina,
    totalPaginas,
    tamanoPagina,
    totalItems,
    onCambiar,
}: PaginacionCamposProps) {
    if (totalPaginas <= 1) return null;

    const desde = pagina * tamanoPagina + 1;
    const hasta = Math.min((pagina + 1) * tamanoPagina, totalItems);

    return (
        <nav
            aria-label="Paginado de campos"
            className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-raised px-3 py-2 shadow-xs"
        >
            <p className="text-meta text-muted">
                <span className="font-mono font-medium text-ink">
                    {desde}–{hasta}
                </span>{" "}
                de <span className="font-mono">{totalItems}</span> campos
            </p>

            <div className="flex items-center gap-1">
                <button
                    type="button"
                    aria-label="Página anterior"
                    disabled={pagina === 0}
                    onClick={() => onCambiar(pagina - 1)}
                    className={`${baseBoton} text-muted hover:bg-sunken hover:text-ink`}
                >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                </button>

                {paginasVisibles(pagina, totalPaginas).map((p, i) =>
                    p === null ? (
                        <span
                            key={`gap-${i}`}
                            aria-hidden="true"
                            className="px-1 text-meta text-faint"
                        >
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            type="button"
                            aria-label={`Página ${p + 1}`}
                            aria-current={p === pagina ? "page" : undefined}
                            onClick={() => onCambiar(p)}
                            className={[
                                baseBoton,
                                "font-mono",
                                p === pagina
                                    ? "bg-petrol-600 text-paper shadow-xs"
                                    : "text-muted hover:bg-sunken hover:text-ink",
                            ].join(" ")}
                        >
                            {p + 1}
                        </button>
                    ),
                )}

                <button
                    type="button"
                    aria-label="Página siguiente"
                    disabled={pagina >= totalPaginas - 1}
                    onClick={() => onCambiar(pagina + 1)}
                    className={`${baseBoton} text-muted hover:bg-sunken hover:text-ink`}
                >
                    <ChevronRight className="size-4" aria-hidden="true" />
                </button>
            </div>
        </nav>
    );
}