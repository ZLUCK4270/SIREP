/**
 * Responsabilidad: tabla densa de escritorio con un reporte por fila y la
 * fila entera como enlace accesible al detalle.
 * Existe porque en pantalla grande el técnico compara reportes uno debajo del
 * otro: separadores de 1 px, cabecera tenue sobre una tarjeta con borde; el
 * enlace extendido hace que cualquier punto de la fila abra el reporte sin
 * apuntar a un texto chico.
 */

import Link from "next/link";

import { CeldaDudosos } from "@/features/revision/components/bandeja/celda-dudosos";
import { EtiquetaEstado } from "@/features/revision/components/comunes/etiqueta-estado";
import { EtiquetaOrigen } from "@/features/revision/components/comunes/etiqueta-origen";
import {
  formatearFecha,
  formatearNumeroReporte,
} from "@/features/revision/lib/formato";
import type { Reporte } from "@/features/revision/types/dominio";

interface TablaReportesProps {
  reportes: readonly Reporte[];
}

const CLASE_CELDA = "border-b border-line px-4 py-2.5";

const CLASE_CABECERA =
  "border-b border-line px-4 py-3 text-left text-micro font-medium uppercase tracking-label text-muted";

function FilaReporte({ reporte }: { reporte: Reporte }) {
  const {
    numero_reporte,
    cliente,
    equipo,
    tecnico,
    estado,
    origen,
    campos,
    fecha_reporte,
  } = reporte;

  return (
    <tr className="relative transition-colors duration-150 ease-[var(--ease-salida)] hover:bg-petrol-50/60">
      <td className={CLASE_CELDA}>
        {/*
         * El `::after` extendido usa la fila como bloque contenedor (por eso
         * la fila es `relative`): cubre las ocho columnas, así el clic en
         * cualquier punto navega y el foco visible se dibuja sobre la fila
         * completa. El nombre accesible agrega el cliente porque el texto
         * visible solo dice el N°.
         */}
        <Link
          href={`/reportes/${numero_reporte}`}
          aria-label={`Abrir el reporte N° ${numero_reporte} de ${cliente}`}
          className={[
            "rounded-xs font-mono text-meta font-medium text-petrol-700",
            "after:absolute after:inset-0 after:rounded-xs after:content-['']",
            "focus-visible:outline-2",
            "focus-visible:after:outline-2 focus-visible:after:outline-offset-[-2px] focus-visible:after:outline-petrol-600",
          ].join(" ")}
        >
          {formatearNumeroReporte(numero_reporte)}
        </Link>
      </td>
      <td className={`${CLASE_CELDA} text-body text-ink`}>{cliente}</td>
      <td className={`${CLASE_CELDA} text-meta text-muted`}>{equipo}</td>
      <td className={`${CLASE_CELDA} text-meta text-muted`}>{tecnico}</td>
      <td className={CLASE_CELDA}>
        <EtiquetaEstado estado={estado} />
      </td>
      <td className={CLASE_CELDA}>
        <EtiquetaOrigen origen={origen} />
      </td>
      <td className={CLASE_CELDA}>
        <CeldaDudosos campos={campos} />
      </td>
      <td className={`${CLASE_CELDA} font-mono text-meta text-faint`}>
        {formatearFecha(fecha_reporte)}
      </td>
    </tr>
  );
}

export function TablaReportes({ reportes }: TablaReportesProps) {
  return (
    <div className="hidden overflow-hidden rounded-lg border border-line bg-raised shadow-lift lg:block">
      <div className="overflow-x-auto scroll-fino">
      <table className="w-full border-collapse">
        <caption className="sr-only">
          Reportes de la bandeja: número, cliente, equipo, técnico, estado,
          origen, dudosos pendientes y fecha del reporte.
        </caption>
        <thead>
          <tr className="bg-sunken/70">
            <th scope="col" className={CLASE_CABECERA}>
              N° de reporte
            </th>
            <th scope="col" className={CLASE_CABECERA}>
              Cliente
            </th>
            <th scope="col" className={CLASE_CABECERA}>
              Equipo
            </th>
            <th scope="col" className={CLASE_CABECERA}>
              Técnico
            </th>
            <th scope="col" className={CLASE_CABECERA}>
              Estado
            </th>
            <th scope="col" className={CLASE_CABECERA}>
              Origen
            </th>
            <th scope="col" className={CLASE_CABECERA}>
              Dudosos pendientes
            </th>
            <th scope="col" className={CLASE_CABECERA}>
              Fecha
            </th>
          </tr>
        </thead>
        <tbody>
          {reportes.map((reporte) => (
            <FilaReporte key={reporte.id} reporte={reporte} />
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
