/**
 * Responsabilidad: primitiva de campo de texto (input) alineada a los tokens de
 * papel y con foco visible heredado de `globals.css`.
 * Existe para que la corrección inline, la búsqueda de la bandeja y cualquier
 * formulario futuro compartan altura, radio y contraste.
 */

import type { InputHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export type EntradaProps = InputHTMLAttributes<HTMLInputElement>;

export function Entrada({ className, type = "text", ...props }: EntradaProps) {
    return (
        <input
            type={type}
            {...props}
            className={twMerge(
                [
                    "h-9 w-full rounded-sm border border-line-strong bg-inset px-3",
                    "text-base text-ink placeholder:text-faint",
                    "transition-colors duration-150 ease-[var(--ease-salida)]",
                    "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-petrol-600",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                ],
                className,
            )}
        />
    );
}