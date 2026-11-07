/**
 * Responsabilidad: vocabulario visible de estados, orígenes y confianza.
 * Existe para que la misma palabra describa el mismo hecho en la bandeja, el
 * escaneo y la auditoría de campos. Los componentes deciden los íconos; acá sólo
 * viven las etiquetas, los tonos y las explicaciones.
 */

import type { CampoReporte, Confianza, EstadoEscaneo, EstadoRevisionCampo, OrigenReporte } from "@/features/revision/types/dominio";

export type Tono = "petrol" | "amber" | "brick" | "green" | "neutral";

export interface DescripcionSemantica {
    etiqueta: string;
    descripcion: string;
    tono: Tono;
}

export const ETIQUETAS_ESTADO: Record<EstadoEscaneo, DescripcionSemantica> = {
    recibido: {
        etiqueta: "Recibido",
        descripcion: "El escaneo llegó y espera la lectura del modelo.",
        tono: "neutral",
    },
    procesado: {
        etiqueta: "Procesado",
        descripcion: "El modelo terminó de leer; hay campos por revisar.",
        tono: "petrol",
    },
    en_revision: {
        etiqueta: "En revisión",
        descripcion: "Un técnico ya empezó a resolver campos dudosos.",
        tono: "amber",
    },
    completo: {
        etiqueta: "Completo",
        descripcion: "No quedan campos dudosos pendientes.",
        tono: "green",
    },
};

export const ETIQUETAS_ORIGEN: Record<OrigenReporte, DescripcionSemantica> = {
    historico: {
        etiqueta: "Histórico",
        descripcion: "Reporte previo a SIREP, digitalizado desde papel.",
        tono: "neutral",
    },
    sistema: {
        etiqueta: "Sistema",
        descripcion: "Reporte generado en el sistema actual.",
        tono: "petrol",
    },
};

export const ETIQUETAS_REVISION: Record<
    EstadoRevisionCampo,
    DescripcionSemantica
> = {
    auto: {
        etiqueta: "Lectura automática",
        descripcion: "Confianza alta: el modelo lo aceptó sin revisión humana.",
        tono: "petrol",
    },
    pendiente: {
        etiqueta: "Pendiente",
        descripcion: "Todavía nadie resolvió este campo.",
        tono: "amber",
    },
    confirmado: {
        etiqueta: "Confirmado",
        descripcion: "Una persona revisó y aceptó la lectura del modelo.",
        tono: "green",
    },
    corregido: {
        etiqueta: "Corregido",
        descripcion: "Una persona reemplazó el valor del modelo.",
        tono: "green",
    },
    ilegible: {
        etiqueta: "Ilegible",
        descripcion: "Una persona revisó el recorte y no pudo leerlo.",
        tono: "brick",
    },
};

export const ETIQUETAS_CONFIANZA: Record<Confianza, DescripcionSemantica> = {
    alta: {
        etiqueta: "Alta",
        descripcion: "El modelo leyó el campo con confianza alta.",
        tono: "petrol",
    },
    media: {
        etiqueta: "Media",
        descripcion: "Lectura probable; conviene confirmarla.",
        tono: "amber",
    },
    baja: {
        etiqueta: "Baja",
        descripcion: "Lectura poco confiable; requiere corrección.",
        tono: "brick",
    },
};

export const ETIQUETA_NO_LEIDO: DescripcionSemantica = {
    etiqueta: "No leído",
    descripcion: "El modelo no pudo leerlo y la secretaría tampoco.",
    tono: "brick",
};

export function describirConfianza(
    campo: Pick<CampoReporte, "confianza" | "no_leido">,
): DescripcionSemantica {
    if (campo.no_leido || campo.confianza === null) {
        return ETIQUETA_NO_LEIDO;
    }
    return ETIQUETAS_CONFIANZA[campo.confianza];
}