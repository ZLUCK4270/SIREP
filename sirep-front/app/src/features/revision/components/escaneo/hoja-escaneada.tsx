/**
 * Responsabilidad: mostrar una página del escaneo real dentro de un SVG con la
 * misma geometría que usa el recorte, y resaltar encima la región activa.
 * Existe porque es la fuente de luz de la vista de corrección: el técnico compara
 * lo que leyó el modelo contra su propio papel. La imagen llega como enlace
 * firmado de Storage (`escaneo.paginas_urls`); si no hay imagen se dice, en lugar
 * de dibujar un formulario inventado que parecería un escaneo.
 *
 * La imagen se estira a las dimensiones del mapa (`preserveAspectRatio="none"`)
 * para que las coordenadas normalizadas de las regiones apunten al mismo punto
 * de la hoja en cualquier resolución.
 */

import { twMerge } from "tailwind-merge";

import type { ReporteVista } from "@/features/revision/types/dominio";
import type {
  MapaRegiones,
  NumeroPagina,
  Region,
} from "@/features/revision/types/regiones";

export type TonoResaltado = "petrol" | "amber" | "brick" | "green";

export interface ResaltadoRegion {
  region: Region;
  etiqueta?: string;
  tono?: TonoResaltado;
}

interface HojaEscaneadaProps {
  mapa: MapaRegiones;
  pagina: NumeroPagina;
  /** Reporte cuyo escaneo se muestra. Sin reporte no hay nada que mostrar. */
  reporte?: ReporteVista | null;
  resaltado?: ResaltadoRegion | null;
  className?: string;
}

const COLORES: Record<TonoResaltado, string> = {
  petrol: "#2563eb",
  amber: "#d97706",
  brick: "#dc2626",
  green: "#16a34a",
};

export function HojaEscaneada({
  mapa,
  pagina,
  reporte = null,
  resaltado = null,
  className,
}: HojaEscaneadaProps) {
  const ancho = mapa.ancho_pagina;
  const alto = mapa.alto_pagina;
  const url = reporte?.escaneo?.paginas_urls?.[pagina - 1] ?? null;

  return (
    <svg
      viewBox={`0 0 ${ancho} ${alto}`}
      className={twMerge("block h-full w-full", className)}
      role="img"
      aria-label={
        reporte
          ? `Escaneo del reporte N° ${reporte.numero_reporte}, página ${pagina}`
          : "Escaneo no disponible"
      }
    >
      <rect width={ancho} height={alto} fill="#eef1f6" />

      {url ? (
        <image
          href={url}
          x={0}
          y={0}
          width={ancho}
          height={alto}
          preserveAspectRatio="none"
        />
      ) : (
        <g aria-hidden="true">
          <text
            x={ancho / 2}
            y={alto / 2}
            textAnchor="middle"
            fontSize={Math.round(ancho * 0.035)}
            fill="#64748b"
          >
            Sin imagen del escaneo
          </text>
        </g>
      )}

      {resaltado ? (
        <Resaltado
          region={resaltado.region}
          etiqueta={resaltado.etiqueta}
          tono={resaltado.tono ?? "amber"}
          ancho={ancho}
          alto={alto}
        />
      ) : null}
    </svg>
  );
}

function Resaltado({
  region,
  etiqueta,
  tono,
  ancho,
  alto,
}: {
  region: Region;
  etiqueta?: string;
  tono: TonoResaltado;
  ancho: number;
  alto: number;
}) {
  const color = COLORES[tono];
  const x = region.x * ancho;
  const y = region.y * alto;
  const anchoRegion = region.ancho * ancho;
  const altoRegion = region.alto * alto;
  const texto = etiqueta ?? "";
  const tamanoLetra = Math.round(ancho * 0.0125);
  const altoEtiqueta = Math.round(tamanoLetra * 1.9);
  const anchoEtiqueta = Math.max(
    tamanoLetra * 5,
    texto.length * tamanoLetra * 0.62 + tamanoLetra * 1.6,
  );
  const yEtiqueta = Math.max(4, y - altoEtiqueta - 6);

  return (
    <g aria-hidden="true">
      <rect
        x={x - 5}
        y={y - 5}
        width={anchoRegion + 10}
        height={altoRegion + 10}
        rx={6}
        fill={color}
        fillOpacity={0.1}
        stroke={color}
        strokeWidth={3.5}
      />
      {texto ? (
        <>
          <rect
            x={x - 5}
            y={yEtiqueta}
            width={anchoEtiqueta}
            height={altoEtiqueta}
            rx={5}
            fill={color}
          />
          <text
            x={x + tamanoLetra * 0.4}
            y={yEtiqueta + altoEtiqueta * 0.68}
            fontSize={tamanoLetra}
            fontWeight={600}
            letterSpacing={0.4}
            fill="#ffffff"
          >
            {texto}
          </text>
        </>
      ) : null}
    </g>
  );
}
