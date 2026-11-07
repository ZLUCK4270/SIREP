/**
 * Responsabilidad: traducir los campos dudosos de un reporte en un contador
 * prominente con la composición de confianza a la vista.
 * Existe porque esta cifra decide qué fila se abre primero: el número tiene que
 * leerse de un vistazo, el tono tiene que decir si lo pendiente es solo dudoso
 * o ya es ilegible, y la tira de marcas muestra de qué está hecha la cifra sin
 * depender solo del color.
 */

import { Insignia } from "@/components/ui/insignia";
import {
    calcularPendientes,
    esDudoso,
    fueResueltoPorPersona,
    requiereRevision,
} from "@/features/revision/lib/dudosos";
import type { Tono } from "@/features/revision/lib/etiquetas";
import { pluralizar } from "@/features/revision/lib/formato";
import type { CampoReporte } from "@/features/revision/types/dominio";

interface CeldaDudososProps {
    campos: readonly CampoReporte[];
    /** Etiqueta visible para las tarjetas; en la tabla la aporta el encabezado. */
    etiqueta?: string;
    className?: string;
}

interface ClasificacionContador {
    tono: Tono;
    cualificador: string;
}

/**
 * El tono sigue la severidad de lo pendiente: un no leído o una confianza baja
 * no puede verse igual que una lectura media, porque piden intervención distinta.
 */
function clasificar(
    sinLectura: boolean,
    pendientes: number,
    hayBaja: boolean,
): ClasificacionContador {
    if (sinLectura) {
        return {
            tono: "neutral",
            cualificador: "el modelo todavía no leyó el reporte",
        };
    }
    if (pendientes === 0) {
        return { tono: "green", cualificador: "sin dudosos pendientes" };
    }
    return hayBaja
        ? { tono: "brick", cualificador: "con confianza baja o no leído" }
        : { tono: "amber", cualificador: "de confianza media" };
}

export function CeldaDudosos({ campos, etiqueta, className }: CeldaDudososProps) {
    const dudosos = campos.filter(esDudoso);
    const pendientesDudosos = dudosos.filter(requiereRevision);
    const pendientes = calcularPendientes(campos);

    // Un reporte "recibido" todavía no tiene lectura: mostrar un cero en verde
    // afirmaría que no hay dudosos, cuando en realidad no se sabe todavía.
    const sinLectura = campos.every((campo) => campo.confianza === null);
    const hayBaja = pendientesDudosos.some(
        (campo) => campo.no_leido || campo.confianza === "baja",
    );
    const { tono, cualificador } = clasificar(
        sinLectura,
        pendientes.dudosos,
        hayBaja,
    );

    const titulo = sinLectura
        ? undefined
        : `${pluralizar(pendientes.total, "campo dudoso", "campos dudosos")}: ${pendientes.resueltos} resueltos, ${pendientes.dudosos} pendientes`;

    return (
        <span
            className={[
                "inline-flex flex-wrap items-center gap-x-1.5 gap-y-1",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
            title={titulo}
        >
            {etiqueta ? (
                <span className="text-micro uppercase tracking-label text-faint">
                    {etiqueta}
                </span>
            ) : null}
            <Insignia tono={tono} solido className="font-mono">
                {sinLectura ? "—" : pendientes.dudosos}
            </Insignia>
            <span className="sr-only">{cualificador}</span>
            {dudosos.length > 0 ? (
                <span aria-hidden="true" className="flex flex-wrap gap-0.5">
                    {dudosos.map((campo) => (
                        <span
                            key={campo.id}
                            className={[
                                "size-1.5 rounded-xs",
                                fueResueltoPorPersona(campo)
                                    ? "bg-green-600"
                                    : campo.no_leido || campo.confianza === "baja"
                                        ? "bg-brick-600"
                                        : "bg-amber-600",
                            ].join(" ")}
                        />
                    ))}
                </span>
            ) : null}
        </span>
    );
}