/**
 * Responsabilidad: primitiva de etiqueta compacta con los tonos semánticos del
 * sistema (neutral, petróleo, ámbar, ladrillo, verde).
 * Existe para que estado, origen y confianza compartan el mismo tratamiento:
 * cada tono empareja un texto y un borde, nunca color solo, y el tono sólido
 * queda reservado para el contador prominente de dudosos.
 */

import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

const variantes = cva(
  [
    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-medium",
    "transition-colors duration-150 ease-[var(--ease-salida)]",
  ],
  {
    variants: {
      tono: {
        neutral: "border-line bg-sunken text-muted",
        petrol: "border-petrol-200 bg-petrol-50 text-petrol-700",
        amber: "border-amber-200 bg-amber-50 text-amber-700",
        brick: "border-brick-200 bg-brick-50 text-brick-700",
        green: "border-green-200 bg-green-50 text-green-700",
      },
      solido: {
        true: "",
        false: "",
      },
      tamano: {
        micro: "px-2 py-0.5 text-micro uppercase tracking-label",
        normal: "px-2.5 py-0.5 text-meta",
      },
    },
    compoundVariants: [
      // El tono sólido se reserva para cifras: fondo pleno, texto en papel.
      { solido: true, tono: "neutral", class: "border-transparent bg-ink text-paper" },
      { solido: true, tono: "petrol", class: "border-transparent bg-petrol-600 text-paper" },
      { solido: true, tono: "amber", class: "border-transparent bg-amber-600 text-paper" },
      { solido: true, tono: "brick", class: "border-transparent bg-brick-600 text-paper" },
      { solido: true, tono: "green", class: "border-transparent bg-green-600 text-paper" },
    ],
    defaultVariants: {
      tono: "neutral",
      solido: false,
      tamano: "normal",
    },
  },
);

export interface InsigniaProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof variantes> {}

export function Insignia({
  className,
  tono,
  solido,
  tamano,
  ...props
}: InsigniaProps) {
  return (
    <span
      {...props}
      className={twMerge(variantes({ tono, solido, tamano }), className)}
    />
  );
}
