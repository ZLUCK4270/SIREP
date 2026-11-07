/**
 * Responsabilidad: primitiva de esqueleto de carga.
 * Existe para que la bandeja, la vista de corrección y la calibración muestren
 * la misma forma de "todavía no hay datos" sin inventar spinners.
 */

import type { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export type EsqueletoProps = HTMLAttributes<HTMLDivElement>;

export function Esqueleto({ className, ...props }: EsqueletoProps) {
    return (
        <div
            aria-hidden="true"
            {...props}
            className={twMerge(
                "animate-pulse rounded-sm bg-line/70 motion-reduce:animate-none",
                className,
            )}
        />
    );
}