/**
 * Responsabilidad: anunciar que el reporte quedó completo y resumir qué se hizo
 * con cada campo.
 * Existe porque cerrar es una decisión de producto: el técnico necesita saber
 * que terminó y poder deshacer, sin tener que releer la lista entera; el
 * resumen sale de `resumirDisposiciones` para que no dependa de lo que la
 * pantalla esté mostrando en ese momento.
 */

"use client";

import { useEffect, useState } from "react";
import { AlertOctagon, CheckCircle2, PencilLine, Stamp } from "lucide-react";

import { formatearFechaHora } from "@/features/revision/lib/formato";
import type { ResumenDisposiciones } from "@/features/revision/lib/dudosos";

import { EnlaceBandeja } from "./enlace-bandeja";

interface CierreRevisionProps {
    disposiciones: ResumenDisposiciones;
    completadoEn: string | null;
}

const FILAS: Array<{
    clave: keyof ResumenDisposiciones;
    etiqueta: string;
    clase: string;
    icono: typeof CheckCircle2;
}> = [
        {
            clave: "confirmados",
            etiqueta: "confirmados",
            clase: "text-green-700",
            icono: CheckCircle2,
        },
        {
            clave: "corregidos",
            etiqueta: "corregidos",
            clase: "text-green-700",
            icono: PencilLine,
        },
        {
            clave: "ilegibles",
            etiqueta: "ilegibles",
            clase: "text-brick-700",
            icono: AlertOctagon,
        },
    ];

export function CierreRevision({
    disposiciones,
    completadoEn,
}: CierreRevisionProps) {
    // La animación de entrada se resuelve con una transición y no con
    // keyframes: los tokens ya exponen `--ease-salida` y `prefers-reduced-motion`
    // la anula desde `globals.css`.
    const [entrando, setEntrando] = useState(true);

    useEffect(() => {
        const cuadro = requestAnimationFrame(() => setEntrando(false));
        return () => cancelAnimationFrame(cuadro);
    }, []);

    return (
        <section
            aria-label="Reporte completo"
            className="rounded-md border border-green-200 bg-green-50 p-4 transition-all duration-200 ease-[var(--ease-salida)] motion-reduce:transition-none"
            style={{
                opacity: entrando ? 0 : 1,
                transform: entrando ? "translateY(-4px)" : "none",
            }}
        >
            <div className="flex items-start gap-3">
                <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-xs bg-green-600 text-paper"
                >
                    <Stamp className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <h2 className="text-title font-semibold text-green-700">
                        Reporte completo
                    </h2>
                    <p className="mt-1 text-body text-ink">
                        No quedan campos dudosos pendientes
                        {completadoEn ? ` · ${formatearFechaHora(completadoEn)}` : ""}.
                    </p>

                    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                        {FILAS.map(({ clave, etiqueta, clase, icono: Icono }) => (
                            <li
                                key={clave}
                                className="flex items-center gap-1.5 text-meta text-ink"
                            >
                                <Icono className={`size-4 shrink-0 ${clase}`} aria-hidden="true" />
                                <span className="font-mono font-semibold">
                                    {disposiciones[clave]}
                                </span>{" "}
                                {etiqueta}
                            </li>
                        ))}
                    </ul>

                    <div className="mt-4">
                        <EnlaceBandeja className="h-11 px-5 text-base" />
                    </div>
                </div>
            </div>
        </section>
    );
}