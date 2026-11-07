/**
 * Responsabilidad: dibujar todas las regiones del mapa sobre un escaneo real
 * y permitir activarlas o desactivarlas una por una.
 * Existe para calibrar el talonario a la vista: si una región no cae donde
 * cae el texto en la hoja, el recorte de esa campo va a mostrar otra cosa.
 */

"use client";

import { useState } from "react";

import { Boton } from "@/components/ui/boton";
import { CAMPOS_FORMULARIO } from "@/config/campos-formulario";
import { HojaEscaneada } from "@/features/revision/components/escaneo/hoja-escaneada";
import type { IdCampo } from "@/features/revision/types/campos";
import type { ReporteVista } from "@/features/revision/types/dominio";
import type {
  MapaRegiones,
  NumeroPagina,
} from "@/features/revision/types/regiones";

interface MapaCalibracionProps {
  mapa: MapaRegiones;
  /** Reporte real cuyo escaneo sirve de base para comprobar las regiones. */
  reporte: ReporteVista;
}

const TRAZO_REGION = "var(--petrol-600)";
const RELLENO_ACTIVO = "var(--petrol-50)";

export function MapaCalibracion({ mapa, reporte }: MapaCalibracionProps) {
  const [pagina, setPagina] = useState<NumeroPagina>(1);
  const [ocultos, setOcultos] = useState<ReadonlySet<IdCampo>>(() => new Set());
  const [seleccion, setSeleccion] = useState<IdCampo | null>(null);

  const regionesDePagina = CAMPOS_FORMULARIO.map((definicion) => ({
    definicion,
    region: mapa.regiones[definicion.id],
  })).filter((entrada) => entrada.region.pagina === pagina);

  const alternar = (id: IdCampo) => {
    setOcultos((anterior) => {
      const siguiente = new Set(anterior);
      if (siguiente.has(id)) {
        siguiente.delete(id);
      } else {
        siguiente.add(id);
      }
      return siguiente;
    });
  };

  const visibles = regionesDePagina.filter(
    (entrada) => !ocultos.has(entrada.definicion.id),
  );

  return (
    <section aria-labelledby="titulo-mapa" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="titulo-mapa" className="text-title font-semibold">
          Hoja y regiones
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Página del talonario"
            className="flex overflow-hidden rounded-sm border border-line-strong"
          >
            {Array.from(
              { length: Math.max(1, reporte.escaneo.paginas_urls.length) },
              (_, indice) => indice + 1,
            ).map((numero) => (
              <button
                key={numero}
                type="button"
                onClick={() => setPagina(numero)}
                aria-pressed={pagina === numero}
                className={[
                  "h-9 px-3 text-meta font-medium transition-colors duration-150",
                  pagina === numero
                    ? "bg-petrol-600 text-paper"
                    : "bg-raised text-muted hover:bg-sunken",
                ].join(" ")}
              >
                {`Página ${numero}`}
              </button>
            ))}
          </div>

          <Boton
            variante="secundario"
            tamano="sm"
            onClick={() => setOcultos(new Set())}
            disabled={ocultos.size === 0}
          >
            Mostrar todas
          </Boton>
          <Boton
            variante="secundario"
            tamano="sm"
            onClick={() =>
              setOcultos(
                new Set(regionesDePagina.map((entrada) => entrada.definicion.id)),
              )
            }
            disabled={visibles.length === 0}
          >
            Ocultar todas
          </Boton>
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-lg border border-line bg-raised shadow-sheet"
        style={{ aspectRatio: `${mapa.ancho_pagina} / ${mapa.alto_pagina}` }}
      >
        <HojaEscaneada
          mapa={mapa}
          pagina={pagina}
          reporte={reporte}
          className="absolute inset-0 h-full w-full"
        />

        {/*
          La capa de regiones es solo para el mouse: el control accesible es la
          lista de casillas de abajo, porque un `<g>` enfocable dentro de un SVG
          no tiene un comportamiento de teclado predecible.
        */}
        <svg
          viewBox={`0 0 ${mapa.ancho_pagina} ${mapa.alto_pagina}`}
          className="absolute inset-0 h-full w-full cursor-pointer"
          aria-hidden="true"
        >
          {visibles.map(({ definicion, region }) => {
            const x = region.x * mapa.ancho_pagina;
            const y = region.y * mapa.alto_pagina;
            const ancho = region.ancho * mapa.ancho_pagina;
            const alto = region.alto * mapa.alto_pagina;
            const activo = seleccion === definicion.id;
            const anchoEtiqueta = Math.max(90, definicion.id.length * 9 + 16);

            return (
              <g
                key={definicion.id}
                onClick={() => setSeleccion(definicion.id)}
              >
                <rect
                  x={x}
                  y={y}
                  width={ancho}
                  height={alto}
                  fill={activo ? RELLENO_ACTIVO : "transparent"}
                  stroke={TRAZO_REGION}
                  strokeWidth={2.5}
                  strokeDasharray={activo ? undefined : "9 6"}
                  vectorEffect="non-scaling-stroke"
                />
                <rect
                  x={x}
                  y={Math.max(2, y - 24)}
                  width={anchoEtiqueta}
                  height={22}
                  rx={3}
                  fill={activo ? TRAZO_REGION : "var(--paper-sunken)"}
                />
                <text
                  x={x + 7}
                  y={Math.max(2, y - 24) + 15}
                  fontSize={14}
                  fontFamily="var(--font-plex-mono, monospace)"
                  letterSpacing={0.6}
                  fill={activo ? "var(--paper)" : "var(--ink-muted)"}
                >
                  {definicion.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <fieldset>
        <legend className="mb-2 text-micro uppercase tracking-label text-faint">
          Regiones de la página {pagina} ({visibles.length} de{" "}
          {regionesDePagina.length} visibles)
        </legend>
        <div className="flex flex-wrap gap-2">
          {regionesDePagina.map(({ definicion }) => (
            <label
              key={definicion.id}
              className={[
                "flex min-h-9 cursor-pointer items-center gap-2 rounded-sm border px-2.5 py-1.5",
                "text-meta transition-colors duration-150",
                seleccion === definicion.id
                  ? "border-petrol-600 bg-petrol-50 text-petrol-700"
                  : "border-line bg-raised text-muted hover:bg-sunken",
              ].join(" ")}
            >
              <input
                type="checkbox"
                checked={!ocultos.has(definicion.id)}
                onChange={() => alternar(definicion.id)}
                onFocus={() => setSeleccion(definicion.id)}
                className="size-4 accent-petrol-600"
              />
              <span className="font-mono text-micro">{definicion.id}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
