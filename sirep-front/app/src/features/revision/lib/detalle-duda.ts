/**
 * Responsabilidad: explicar en una frase por qué un campo quedó dudoso.
 * Existe para que la persona que revisa no tenga que adivinar: junto al valor
 * se muestra el motivo (sin lectura, letra difícil, carácter dudoso) y, si el
 * modelo dejó una observación, esa observación.
 */

import type { CampoReporte } from "@/features/revision/types/dominio";

export interface DetalleDuda {
    /** Motivo general, deducido del estado de lectura. */
    motivo: string;
    /** Nota puntual del modelo (qué letra o número dudó), si la dejó. */
    observacion: string | null;
}

// El backend rellena esta frase cuando el modelo no devuelve nada; no aporta.
const OBSERVACION_GENERICA = /^no detectado en el documento\.?$/i;

export function detalleDuda(campo: CampoReporte): DetalleDuda | null {
    const sinValor = (campo.valor_modelo ?? "").trim() === "";

    let motivo: string | null = null;
    if (campo.no_leido || sinValor) {
        motivo =
            "El modelo no pudo leer nada aquí. Puede que el campo esté vacío en el papel o que la letra no se distinga.";
    } else if (campo.confianza === "baja") {
        motivo =
            "Letra muy difícil de descifrar: el modelo no está seguro del valor.";
    } else if (campo.confianza === "media") {
        motivo =
            "Se entiende por el contexto, pero algún carácter o número es dudoso.";
    }
    if (!motivo) return null;

    const nota = campo.observacion?.trim() ?? "";
    return {
        motivo,
        observacion: nota && !OBSERVACION_GENERICA.test(nota) ? nota : null,
    };
}