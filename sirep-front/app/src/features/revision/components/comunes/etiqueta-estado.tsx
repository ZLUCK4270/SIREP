/**
 * Responsabilidad: etiquetas de estado del reporte y de revisión del campo.
 * Existe para que la misma palabra describa el mismo hecho en la bandeja, en la
 * cabecera del reporte y en la tarjeta de campo, siempre con ícono además del
 * color y con la explicación disponible al pasar el cursor.
 */

import {
    AlertOctagon,
    CheckCircle2,
    Inbox,
    PencilLine,
    RotateCcw,
    ScanLine,
    type LucideIcon,
} from "lucide-react";

import { Insignia } from "@/components/ui/insignia";
import {
    ETIQUETAS_ESTADO,
    ETIQUETAS_REVISION,
} from "@/features/revision/lib/etiquetas";
import type {
    EstadoEscaneo,
    EstadoRevisionCampo,
} from "@/features/revision/types/dominio";

const ICONOS_REPORTE: Record<EstadoEscaneo, LucideIcon> = {
    recibido: Inbox,
    procesado: ScanLine,
    en_revision: PencilLine,
    completo: CheckCircle2,
};

const ICONOS_CAMPO: Record<EstadoRevisionCampo, LucideIcon> = {
    auto: ScanLine,
    pendiente: RotateCcw,
    confirmado: CheckCircle2,
    corregido: PencilLine,
    ilegible: AlertOctagon,
};

interface EtiquetaEstadoProps {
    estado: EstadoEscaneo;
}

export function EtiquetaEstado({ estado }: EtiquetaEstadoProps) {
    const descripcion = ETIQUETAS_ESTADO[estado];
    const Icono = ICONOS_REPORTE[estado];

    return (
        <Insignia tono={descripcion.tono} title={descripcion.descripcion}>
            <Icono className="size-3.5 shrink-0" aria-hidden="true" />
            {descripcion.etiqueta}
        </Insignia>
    );
}

interface EtiquetaRevisionProps {
    estado: EstadoRevisionCampo;
}

export function EtiquetaRevision({ estado }: EtiquetaRevisionProps) {
    const descripcion = ETIQUETAS_REVISION[estado];
    const Icono = ICONOS_CAMPO[estado];

    return (
        <Insignia tono={descripcion.tono} title={descripcion.descripcion}>
            <Icono className="size-3.5 shrink-0" aria-hidden="true" />
            {descripcion.etiqueta}
        </Insignia>
    );
}