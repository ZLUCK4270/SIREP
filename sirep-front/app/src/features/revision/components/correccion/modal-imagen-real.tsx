/**
 * Responsabilidad: modal de alta resolución para visualizar el escaneo real
 * original del talonario físico.
 * Permite al técnico comparar campo por campo con el documento original,
 * hacer zoom, rotar o arrastrar la imagen sin perder la vista de trabajo.
 */

"use client";

import { useState } from "react";
import { Eye, RotateCw, X, ZoomIn, ZoomOut } from "lucide-react";

import { Boton } from "@/components/ui/boton";

interface ModalImagenRealProps {
  abierto: boolean;
  /** Enlace firmado a la imagen de la página; `null` si no se pudo obtener. */
  rutaImagen: string | null;
  numeroReporte: string;
  cliente: string;
  onCerrar: () => void;
}

export function ModalImagenReal({
  abierto,
  rutaImagen,
  numeroReporte,
  cliente,
  onCerrar,
}: ModalImagenRealProps) {
  const [zoom, setZoom] = useState(1);
  const [rotacion, setRotacion] = useState(0);

  if (!abierto) return null;

  const aumentarZoom = () => setZoom((z) => Math.min(z + 0.25, 3));
  const disminuirZoom = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const resetZoom = () => {
    setZoom(1);
    setRotacion(0);
  };
  const rotar = () => setRotacion((r) => (r + 90) % 360);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Escaneo original del reporte técnico"
      className="fixed inset-0 z-50 flex flex-col bg-ink/90 backdrop-blur-xs animate-in fade-in duration-200"
    >
      {/* Barra superior del visor */}
      <header className="flex h-14 items-center justify-between border-b border-paper/10 bg-raised/80 px-4 text-paper backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-xs bg-petrol-700/80 text-paper">
            <Eye className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-body font-semibold tracking-tight text-ink">
              Escaneo Original — Reporte N° {numeroReporte}
            </h2>
            <p className="text-micro text-muted">{cliente} · Archivo físico escaneado</p>
          </div>
        </div>

        {/* Controles de imagen */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xs border border-line bg-paper/50 p-0.5">
            <button
              type="button"
              onClick={disminuirZoom}
              title="Reducir zoom"
              aria-label="Reducir zoom"
              className="flex size-7 items-center justify-center rounded-xs text-muted hover:bg-raised hover:text-ink"
            >
              <ZoomOut className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={resetZoom}
              title="Restablecer zoom"
              className="px-2 text-micro font-mono text-ink"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={aumentarZoom}
              title="Aumentar zoom"
              aria-label="Aumentar zoom"
              className="flex size-7 items-center justify-center rounded-xs text-muted hover:bg-raised hover:text-ink"
            >
              <ZoomIn className="size-3.5" />
            </button>
          </div>

          <Boton
            variante="fantasma"
            tamano="sm"
            onClick={rotar}
            title="Rotar 90°"
            aria-label="Rotar 90 grados"
          >
            <RotateCw className="size-4" />
          </Boton>

          <Boton
            variante="primario"
            tamano="sm"
            onClick={onCerrar}
            aria-label="Cerrar visor de imagen real"
            className="ml-2"
          >
            <X className="size-4" />
            Cerrar
          </Boton>
        </div>
      </header>

      {/* Contenedor de la imagen con scroll y zoom */}
      <main className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center">
        <div
          className="relative transition-transform duration-150 ease-out flex items-center justify-center shadow-2xl rounded-xs bg-paper p-2"
          style={{
            transform: `scale(${zoom}) rotate(${rotacion}deg)`,
            transformOrigin: "center center",
          }}
        >
          {rutaImagen ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={rutaImagen}
              alt={`Escaneo original de reporte N° ${numeroReporte}`}
              className="max-h-[85vh] w-auto max-w-none rounded-xs object-contain select-none shadow-md"
              draggable={false}
            />
          ) : (
            <p className="px-10 py-16 text-body text-muted">
              No se pudo cargar la imagen del escaneo. Recarga la página para
              obtener un enlace nuevo.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
