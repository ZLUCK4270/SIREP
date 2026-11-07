/**
 * Responsabilidad: dejar a la vista los atajos de teclado, sin modal.
 * Existe porque un atajo que nadie sabe que existe no existe: la línea se
 * muestra solo en escritorio, que es donde hay teclado, y usa `<kbd>` para que
 * los lectores de pantalla la anuncien como teclas y no como texto corrido.
 */

import { Keyboard } from "lucide-react";
import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface AyudaTecladoProps {
    className?: string;
}

function Tecla({ children }: { children: ReactNode }) {
    return (
        <kbd className="rounded-xs border border-line bg-sunken px-1.5 py-0.5 font-mono text-micro text-muted">
            {children}
        </kbd>
    );
}

export function AyudaTeclado({ className }: AyudaTecladoProps) {
    return (
        <div
            className={twMerge(
                [
                    "hidden flex-wrap items-center gap-x-4 gap-y-1.5",
                    "text-micro text-faint lg:flex",
                ],
                className,
            )}
        >
            <span className="flex items-center gap-1.5 uppercase tracking-label">
                <Keyboard className="size-3.5 shrink-0" aria-hidden="true" />
                Atajos
            </span>
            <span className="flex items-center gap-1">
                <Tecla>↑</Tecla>
                <Tecla>↓</Tecla>
                <Tecla>j</Tecla>
                <Tecla>k</Tecla>
                moverse entre dudosos
            </span>
            <span className="flex items-center gap-1">
                <Tecla>Enter</Tecla>
                confirmar
            </span>
            <span className="flex items-center gap-1">
                <Tecla>Tab</Tecla>
                recorrer controles
            </span>
            <span className="flex items-center gap-1">
                <Tecla>Esc</Tecla>
                cancelar corrección
            </span>
        </div>
    );
}