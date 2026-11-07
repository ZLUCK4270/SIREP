/**
 * Responsabilidad: barra superior del reporte (identificación, modo edición,
 * descarga y visor del escaneo original).
 * Existe porque cada revisión se guarda en el servidor al instante: la barra ya
 * no ofrece "Guardar" ni "Revertir" (antes existían porque los datos vivían en
 * memoria) y avisa que el guardado es automático.
 */

"use client";

import { Check, Download, Eye, FileText, Lock, Unlock } from "lucide-react";

import { Boton } from "@/components/ui/boton";

interface BarraAccionesReporteProps {
  numeroReporte: string;
  cliente: string;
  modoEdicion: boolean;
  onAlternarEdicion: () => void;
  onDescargarPDF: () => void;
  onVerImagenReal: () => void;
}

export function BarraAccionesReporte({
  numeroReporte,
  cliente,
  modoEdicion,
  onAlternarEdicion,
  onDescargarPDF,
  onVerImagenReal,
}: BarraAccionesReporteProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-raised p-3 shadow-lift sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-md bg-petrol-50 text-petrol-700"
          aria-hidden="true"
        >
          <FileText className="size-4" />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold tracking-tight text-ink">
            Reporte N° <span className="font-mono">{numeroReporte}</span>
            {cliente ? <span className="font-normal text-muted"> · {cliente}</span> : null}
          </h1>
          <p className="flex items-center gap-1.5 text-micro text-faint">
            <Check className="size-3 text-green-600" aria-hidden="true" />
            Los cambios se guardan automáticamente
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Boton
          variante="secundario"
          tamano="sm"
          onClick={onVerImagenReal}
          aria-label="Ver archivo escaneado original"
          className="gap-1.5"
        >
          <Eye className="size-3.5" aria-hidden="true" />
          Ver original
        </Boton>

        <Boton
          variante={modoEdicion ? "primario" : "secundario"}
          tamano="sm"
          onClick={onAlternarEdicion}
          aria-pressed={modoEdicion}
          aria-label={modoEdicion ? "Desactivar modo edición" : "Activar modo edición"}
          className="gap-1.5"
        >
          {modoEdicion ? (
            <>
              <Unlock className="size-3.5" aria-hidden="true" />
              Edición habilitada
            </>
          ) : (
            <>
              <Lock className="size-3.5" aria-hidden="true" />
              Editar
            </>
          )}
        </Boton>

        <Boton
          variante="secundario"
          tamano="sm"
          onClick={onDescargarPDF}
          aria-label="Descargar reporte como PDF"
          className="gap-1.5"
        >
          <Download className="size-3.5" aria-hidden="true" />
          Descargar PDF
        </Boton>
      </div>
    </div>
  );
}
