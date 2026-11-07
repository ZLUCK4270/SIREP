/**
 * Responsibilidad: página de calibración del mapa de regiones.
 * Existe para verificar, sobre el escaneo real de un reporte, que cada campo del
 * inventario tenga su región dibujada donde de verdad está: es la herramienta que
 * hace confiable el recorte.
 */

import { Suspense } from "react";
import { notFound } from "next/navigation";

import { MAPA_POR_DEFECTO, obtenerMapa } from "@/config/regiones";
import { MOSTRAR_CALIBRACION } from "@/config/entorno";
import { CalibracionConReporte } from "@/features/revision/components/calibracion/calibracion-con-reporte";

export const metadata = {
  title: "Calibración de regiones",
  robots: { index: false, follow: false },
};

export default function PaginaCalibracion() {
  if (!MOSTRAR_CALIBRACION) notFound();

  const mapa = obtenerMapa(MAPA_POR_DEFECTO);

  return (
    <div className="mx-auto w-full max-w-(--layout-max) px-(--space-gutter) py-8">
      <header className="mb-6 max-w-3xl">
        <p className="text-micro uppercase tracking-label text-faint">
          Solo desarrollo
        </p>
        <h1 className="text-display font-semibold tracking-tight">
          Calibración del talonario
        </h1>
        <p className="mt-2 text-base text-muted">
          {mapa.nombre} · {mapa.paginas} páginas ·{" "}
          {Object.keys(mapa.regiones).length} regiones.{" "}
          {mapa.descripcion}
        </p>
        <p className="mt-1 text-meta text-faint">
          Si una región no coincide con la hoja, el recorte del campo va a
          mostrar otra cosa: ajusta el mapa en `config/regiones` antes de confiar en la vista de
          corrección.
        </p>
      </header>

      <Suspense fallback={<p className="text-body text-muted">Cargando…</p>}>
        <CalibracionConReporte />
      </Suspense>
    </div>
  );
}
