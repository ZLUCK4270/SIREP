/**
 * Responsabilidad: etiqueta de procedencia del reporte (histórico vs sistema).
 * Existe porque la bandeja mezcla ambos orígenes y el técnico necesita saber
 * si el papel fue digitalizado o si el registro nació en el sistema.
 */

import { Archive, FileCheck2 } from "lucide-react";

import { Insignia } from "@/components/ui/insignia";
import { ETIQUETAS_ORIGEN } from "@/features/revision/lib/etiquetas";
import type { OrigenReporte } from "@/features/revision/types/dominio";

const ICONOS: Record<OrigenReporte, typeof Archive> = {
    historico: Archive,
    sistema: FileCheck2,
};

interface EtiquetaOrigenProps {
    origen: OrigenReporte;
}

export function EtiquetaOrigen({ origen }: EtiquetaOrigenProps) {
    const descripcion = ETIQUETAS_ORIGEN[origen];
    const Icono = ICONOS[origen];

    return (
        <Insignia
            tono={descripcion.tono}
            title={descripcion.descripcion}
            className="border-transparent bg-transparent px-0 py-0"
        >
            <Icono className="size-3.5 shrink-0" aria-hidden="true" />
            {descripcion.etiqueta}
        </Insignia>
    );
}