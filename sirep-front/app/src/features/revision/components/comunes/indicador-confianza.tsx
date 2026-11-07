/**
 * Responsabilidad: comunicar la confianza de una lectura con ícono, etiqueta de
 * texto y tono de color.
 * Existe porque es una regla de accesibilidad del producto: el técnico no
 * puede depender del color para saber si confía en un valor, y la misma
 * pieza se usa en la bandeja y en la tarjeta de campo.
 */

import {
    AlertTriangle,
    Ban,
    CheckCircle2,
    type LucideIcon,
} from "lucide-react";

import { Insignia } from "@/components/ui/insignia";
import { describirConfianza } from "@/features/revision/lib/etiquetas";
import type { CampoReporte } from "@/features/revision/types/dominio";

const ICONOS: Record<string, LucideIcon> = {
    petrol: CheckCircle2,
    amber: AlertTriangle,
    brick: Ban,
    green: CheckCircle2,
    neutral: Ban,
};

interface IndicadorConfianzaProps {
    campo: Pick<CampoReporte, "confianza" | "no_leido">;
    className?: string;
}

export function IndicadorConfianza({
    campo,
    className,
}: IndicadorConfianzaProps) {
    const descripcion = describirConfianza(campo);
    const Icono = ICONOS[descripcion.tono] ?? Ban;

    return (
        <Insignia
            tono={descripcion.tono}
            title={descripcion.descripcion}
            className={className}
        >
            <Icono className="size-3.5 shrink-0" aria-hidden="true" />
            {descripcion.etiqueta}
        </Insignia>
    );
}