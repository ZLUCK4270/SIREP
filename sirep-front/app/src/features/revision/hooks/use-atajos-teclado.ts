/**
 * Responsabilidad: acelerar la revisión con atajos de teclado sin secuestrar
 * la navegación nativa.
 * Existe como hook porque el listener es global y sus reglas son de estado
 * puro: se apaga mientras se escribe, deja que el navegador active el control
 * enfocado y nunca toca Tab, que sigue siendo del navegador por accesibilidad
 * (decisión L3 del ODD: un atajo global de Tab rompería el foco visible y el
 * recorrido de los lectores de pantalla).
 */

"use client";

import { useEffect } from "react";

export interface OpcionesAtajosTeclado {
    /** Apagado en carga, error y reporte no encontrado: no hay nada que mover. */
    habilitado: boolean;
    onSiguiente: () => void;
    onAnterior: () => void;
    onConfirmar: () => void;
}

export function useAtajosTeclado({
    habilitado,
    onSiguiente,
    onAnterior,
    onConfirmar,
}: OpcionesAtajosTeclado): void {
    useEffect(() => {
        if (!habilitado) return;

        const manejar = (evento: KeyboardEvent): void => {
            if (
                evento.defaultPrevented ||
                evento.ctrlKey ||
                evento.metaKey ||
                evento.altKey
            ) {
                return;
            }

            const destino =
                evento.target instanceof HTMLElement ? evento.target : null;

            // Mientras se corrige, el teclado es del input: ningún atajo puede
            // competir con lo que la persona está escribiendo.
            if (
                destino?.matches(
                    "input, textarea, select, [contenteditable='true']",
                )
            ) {
                return;
            }

            switch (evento.key) {
                case "ArrowDown":
                case "j":
                case "J":
                    evento.preventDefault();
                    onSiguiente();
                    return;
                case "ArrowUp":
                case "k":
                case "K":
                    evento.preventDefault();
                    onAnterior();
                    return;
                case "Enter": {
                    const activo = document.activeElement;
                    const enControl =
                        activo instanceof HTMLElement &&
                        activo.matches(
                            "button, a, input, textarea, select, summary, [role='button'], [tabindex]:not([tabindex='-1'])",
                        );
                    // Si hay un control enfocado, su activación nativa ya hace el
                    // trabajo: confirmar además duplicaría la acción (por ejemplo, en el
                    // botón "Reabrir" de una tarjeta).
                    if (enControl) return;
                    evento.preventDefault();
                    onConfirmar();
                    return;
                }
            }
        };

        document.addEventListener("keydown", manejar);
        return () => document.removeEventListener("keydown", manejar);
    }, [habilitado, onSiguiente, onAnterior, onConfirmar]);
}