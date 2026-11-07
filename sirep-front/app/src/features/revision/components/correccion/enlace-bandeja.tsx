/**
 * Responsabilidad: enlace de vuelta a la bandeja con el aspecto de una acción.
 * Existe porque tres momentos distintos (cabecera, cierre y "no encontrado")
 * ofrecen la misma salida y el estilo no puede divergir entre ellos. Es un
 * enlace y no un botón porque navega: un `<Link>` envolviendo un botón sería
 * HTML inválido y confunde a los lectores de pantalla.
 */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface EnlaceBandejaProps {
    children?: ReactNode;
    className?: string;
}

export function EnlaceBandeja({
    children = "Volver a la bandeja",
    className,
}: EnlaceBandejaProps) {
    return (
        <Link
            href="/"
            className={twMerge(
                [
                    "inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap",
                    "rounded-sm border border-line-strong bg-raised px-4 text-body font-medium text-ink",
                    "transition-colors duration-150 ease-[var(--ease-salida)] hover:bg-sunken",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-petrol-600",
                ],
                className,
            )}
        >
            <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
            {children}
        </Link>
    );
}