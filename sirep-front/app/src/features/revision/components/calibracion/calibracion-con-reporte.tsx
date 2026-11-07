/**
 * Responsabilidad: cargar el escaneo de un reporte real para calibrar el mapa de
 * regiones sobre él.
 * Existe porque ya no hay formulario de ejemplo: la calibración se hace sobre un
 * reporte que llegó por Telegram, indicado en la URL (`?reporte=000214`).
 */

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { MAPA_POR_DEFECTO, obtenerMapa } from "@/config/regiones";
import { ListaCobertura } from "@/features/revision/components/calibracion/lista-cobertura";
import { MapaCalibracion } from "@/features/revision/components/calibracion/mapa-calibracion";
import { componerReporte } from "@/features/revision/lib/campos";
import { useRepositorio } from "@/features/revision/providers/repositorio-contexto";
import type { ReporteVista } from "@/features/revision/types/dominio";

type Estado =
  | { tipo: "sin_parametro" }
  | { tipo: "cargando" }
  | { tipo: "error"; mensaje: string }
  | { tipo: "listo"; reporte: ReporteVista };

export function CalibracionConReporte() {
  const numero = useSearchParams().get("reporte");
  const repositorio = useRepositorio();
  const [resultado, setResultado] = useState<Estado | null>(null);

  useEffect(() => {
    if (!numero) return;
    let vigente = true;
    repositorio
      .obtenerReporte(numero)
      .then((encontrado) => {
        if (!vigente) return;
        if (!encontrado) {
          setResultado({ tipo: "error", mensaje: `No existe el reporte N° ${numero}.` });
          return;
        }
        const mapa = obtenerMapa(encontrado.diseno_talonario);
        setResultado({ tipo: "listo", reporte: componerReporte(encontrado, mapa) });
      })
      .catch((error: unknown) => {
        if (!vigente) return;
        setResultado({
          tipo: "error",
          mensaje: error instanceof Error ? error.message : "No se pudo cargar el reporte.",
        });
      });
    return () => {
      vigente = false;
    };
  }, [numero, repositorio]);

  const estado: Estado = !numero
    ? { tipo: "sin_parametro" }
    : (resultado ?? { tipo: "cargando" });

  if (estado.tipo === "sin_parametro") {
    return (
      <p className="rounded-lg border border-line bg-raised p-6 text-body text-muted">
        Indica el reporte con el que calibrar, por ejemplo{" "}
        <code className="font-mono text-ink">/dev/regiones?reporte=000214</code>.
        El mapa se dibuja sobre el escaneo real de ese reporte.
      </p>
    );
  }
  if (estado.tipo === "cargando") {
    return <p className="text-body text-muted">Cargando el escaneo…</p>;
  }
  if (estado.tipo === "error") {
    return (
      <p role="alert" className="rounded-lg border border-brick-200 bg-brick-50 p-4 text-body text-brick-700">
        {estado.mensaje}
      </p>
    );
  }

  const mapa = obtenerMapa(MAPA_POR_DEFECTO);
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <MapaCalibracion mapa={mapa} reporte={estado.reporte} />
      <ListaCobertura mapa={mapa} />
    </div>
  );
}
