/**
 * Responsabilidad: presentar el reporte que se está revisando (identidad,
 * origen, escaneo y salida a la bandeja) antes de entrar en los campos.
 * Existe porque el técnico llega de una fila de la bandeja: necesita confirmar
 * en un vistazo que abrió el reporte correcto antes de tocar valores.
 */

import { ScanLine } from "lucide-react";

import { EtiquetaEstado } from "@/features/revision/components/comunes/etiqueta-estado";
import { EtiquetaOrigen } from "@/features/revision/components/comunes/etiqueta-origen";
import {
    formatearFecha,
    formatearFechaHora,
    pluralizar,
} from "@/features/revision/lib/formato";
import type { ReporteVista } from "@/features/revision/types/dominio";

import { EnlaceBandeja } from "./enlace-bandeja";

interface CabeceraReporteProps {
    reporte: ReporteVista;
}

export function CabeceraReporte({ reporte }: CabeceraReporteProps) {
    return (
        <header className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <EnlaceBandeja className="border-transparent bg-transparent px-2 text-meta text-muted hover:text-ink">
                    Bandeja
                </EnlaceBandeja>
                <span className="h-5 w-px bg-line" aria-hidden="true" />
                <EtiquetaEstado estado={reporte.estado} />
                <EtiquetaOrigen origen={reporte.origen} />
                <p className="ml-auto flex items-center gap-1.5 text-micro text-faint">
                    <ScanLine className="size-3.5 shrink-0" aria-hidden="true" />
                    {pluralizar(reporte.escaneo.paginas, "página", "páginas")} · recibido{" "}
                    {formatearFechaHora(reporte.escaneo.recibido_en)}
                </p>
            </div>

            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                <h1 className="font-mono text-title font-semibold text-ink">
                    N° {reporte.numero_reporte}
                </h1>
                <p className="text-base text-ink">{reporte.cliente}</p>
                <p className="text-body text-muted">{reporte.equipo}</p>
                <p className="text-meta text-muted">Técnico: {reporte.tecnico}</p>
                <p className="text-meta text-muted">
                    Fecha: {formatearFecha(reporte.fecha_reporte)}
                </p>
            </div>
        </header>
    );
}