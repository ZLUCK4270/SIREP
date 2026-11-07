/**
 * Responsabilidad: primitiva de botón con las variantes y tamaños que usa la
 * aplicación, con el mismo contrato de shadcn/ui.
 * Existe para que la acción primaria, la secundaria y la destructiva se vean
 * iguales en la bandeja y en la vista de corrección, y para que el tamaño
 * táctil de 44 px en móvil sea una decisión de un solo lugar.
 */

import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

const variantes = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md",
    "font-medium transition-[background-color,box-shadow,color,transform] duration-150 ease-[var(--ease-salida)]",
    "active:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-petrol-600",
  ],
  {
    variants: {
      variante: {
        primario:
          "bg-petrol-600 text-paper shadow-xs ring-1 ring-inset ring-white/15 hover:bg-petrol-700",
        secundario:
          "border border-line-strong bg-raised text-ink shadow-xs hover:border-petrol-200 hover:bg-petrol-50 hover:text-petrol-700",
        fantasma: "text-muted hover:bg-sunken hover:text-ink",
        peligro: "bg-brick-600 text-paper shadow-xs hover:bg-brick-700",
        exito: "bg-green-600 text-paper shadow-xs hover:bg-green-700",
      },
      tamano: {
        sm: "h-8 px-3 text-meta",
        md: "h-9 px-4 text-body",
        lg: "h-11 px-5 text-base",
        icono: "size-9 p-0",
      },
    },
    defaultVariants: {
      variante: "primario",
      tamano: "md",
    },
  },
);

export interface BotonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variantes> {}

export function Boton({ className, variante, tamano, ...props }: BotonProps) {
  return (
    <button
      type="button"
      {...props}
      className={twMerge(variantes({ variante, tamano }), className)}
    />
  );
}
