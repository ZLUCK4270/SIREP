/**
 * Responsabilidad: comunicar cuánto falta para cerrar el reporte y ofrecer
 * deshacer la última disposición.
 * Existe porque "3 de 5 dudosos resueltos" es la única métrica que le importa
 * al técnico: le dice si todavía hay trabajo y cuánto, sin tener que recorrer
 * la lista entera.
 */

"use client";

import { Undo2 } from "lucide-react";

import { Boton } from "@/components/ui/boton";
import { Insignia } from "@/components/ui/insignia";
import { pluralizar } from "@/features/revision/lib/formato";
import type { PendientesRevision } from "@/features/revision/types/dominio";

interface ProgresoRevisionProps {
    pendientes: PendientesRevision;
    /** Etiqueta del último campo resuelto; `null` no muestra el deshacer. */
    ultimoResuelto: string | null;
    onDeshacer: () => void;
}

export function ProgresoRevision({
    pendientes,
    ultimoResuelto,
    onDeshacer,
}: ProgresoRevisionProps) {
    const { total, resueltos, dudosos } = pendientes;

    // Sin dudosos no hay progreso que mostrar: en un escaneo que el modelo todavía
    // no leyó, una barra al 0 % sugeriría un trabajo que todavía no existe.
    if (total === 0) {
        return (
            <section
                aria-label="Progreso de la revisión"
                className="rounded-md border border-line bg-raised px-3 py-2.5"
            >
                <p className="text-body text-muted">
                    Sin campos dudosos: el modelo todavía no leyó este escaneo.
                </p>
            </section>
        );
    }

    const porcentaje = Math.round((resueltos / total) * 100);
    const textoProgreso = `${resueltos} de ${total} dudosos resueltos`;

    return (
        <section
            aria-label="Progreso de la revisión"
            className="rounded-md border border-line bg-raised px-3 py-2.5"
        >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="text-body text-ink">
                    <span className="font-mono font-semibold text-ink">{resueltos}</span>{" "}
                    de{" "}
                    <span className="font-mono font-semibold text-ink">{total}</span>{" "}
                    dudosos resueltos
                </p>
                <Insignia
                    tono={dudosos === 0 ? "green" : "amber"}
                    tamano="micro"
                    title={
                        dudosos === 0
                            ? "No queda ningún dudoso pendiente."
                            : "Todavía quedan dudosos por revisar."
                    }
                >
                    {dudosos === 0
                        ? "Sin pendientes"
                        : pluralizar(dudosos, "pendiente", "pendientes")}
                </Insignia>
                {ultimoResuelto ? (
                    <Boton
                        variante="fantasma"
                        tamano="sm"
                        onClick={onDeshacer}
                        title={`Reabrir ${ultimoResuelto}`}
                        className="ml-auto"
                    >
                        <Undo2 className="size-4 shrink-0" aria-hidden="true" />
                        Deshacer
                    </Boton>
                ) : null}
            </div>

            <div
                role="progressbar"
                aria-label="Dudosos resueltos"
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={resueltos}
                aria-valuetext={textoProgreso}
                className="mt-2.5 h-2 overflow-hidden rounded-xs bg-sunken"
            >
                <div
                    className="h-full rounded-xs bg-green-600 transition-[width] duration-200 ease-[var(--ease-salida)] motion-reduce:transition-none"
                    style={{ width: `${porcentaje}%` }}
                />
            </div>
        </section>
    );
}