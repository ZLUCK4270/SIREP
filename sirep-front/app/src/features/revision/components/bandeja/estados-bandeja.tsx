/**
 * Responsabilidad: los cuatro estados especiales de la bandeja —cargando,
 * archivo vacío, error y filtro sin resultados— con copy y acción propios.
 * Existe porque cada uno pide una respuesta distinta del técnico: si se
 * mezclan en un solo mensaje, no sabe si reintenta, si cambia los filtros o si
 * simplemente todavía no llegó nada al archivo.
 */

import type { ReactNode } from "react";

import { AlertTriangle, Inbox, SearchX, type LucideIcon } from "lucide-react";

import { Boton } from "@/components/ui/boton";
import { Esqueleto } from "@/components/ui/esqueleto";

export type EstadoBandeja =
    | "cargando"
    | "vacio"
    | "error"
    | "sin_resultados";

interface EstadosBandejaProps {
    estado: EstadoBandeja;
    /** Solo para "sin_resultados": quita búsqueda, estado y origen. */
    onLimpiar?: () => void;
    /** Solo para "error": vuelve a pedir el archivo al repositorio. */
    onReintentar?: () => void;
}

/**
 * Anchos de las ocho columnas reales: el esqueleto guarda la forma de la
 * tabla para que la transición a los datos no mueva el layout.
 */
const COLUMNAS_ESQUELETO = [
    { clave: "numero", ancho: "w-24" },
    { clave: "cliente", ancho: "w-40" },
    { clave: "equipo", ancho: "w-28" },
    { clave: "tecnico", ancho: "w-32" },
    { clave: "estado", ancho: "w-20" },
    { clave: "origen", ancho: "w-16" },
    { clave: "dudosos", ancho: "w-12" },
    { clave: "fecha", ancho: "w-28" },
] as const;

function EsqueletoTabla() {
    return (
        <table
            className="hidden w-full border-collapse lg:block"
            aria-hidden="true"
        >
            <thead>
                <tr>
                    <th
                        colSpan={COLUMNAS_ESQUELETO.length}
                        className="h-10 bg-raised"
                    />
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: 6 }, (_, fila) => (
                    <tr key={fila} className="border-b border-line">
                        {COLUMNAS_ESQUELETO.map((columna) => (
                            <td key={columna.clave} className="px-4 py-3">
                                <Esqueleto className={`h-3.5 ${columna.ancho}`} />
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function EsqueletoTarjetas() {
    return (
        <div
            className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:hidden"
            aria-hidden="true"
        >
            {Array.from({ length: 4 }, (_, tarjeta) => (
                <div
                    key={tarjeta}
                    className="rounded-md border border-line bg-raised p-4"
                >
                    <div className="flex justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-2">
                            <Esqueleto className="h-3.5 w-24" />
                            <Esqueleto className="h-5 w-3/4" />
                            <Esqueleto className="h-3.5 w-1/2" />
                        </div>
                        <Esqueleto className="h-6 w-14 shrink-0" />
                    </div>
                    <div className="mt-4 flex gap-2 border-t border-line pt-3">
                        <Esqueleto className="h-5 w-24" />
                        <Esqueleto className="h-5 w-20" />
                    </div>
                </div>
            ))}
        </div>
    );
}

interface PanelProps {
    icono: LucideIcon;
    tono: "error" | "neutro";
    titulo: string;
    texto: string;
    children?: ReactNode;
}

function Panel({ icono: Icono, tono, titulo, texto, children }: PanelProps) {
    return (
        <div className="rounded-md border border-line bg-raised px-6 py-12 text-center">
            <span
                aria-hidden="true"
                className={[
                    "mx-auto flex size-11 items-center justify-center rounded-full",
                    tono === "error"
                        ? "bg-brick-50 text-brick-700"
                        : "bg-sunken text-muted",
                ].join(" ")}
            >
                <Icono className="size-5" />
            </span>
            <h2 className="mt-4 text-base font-semibold text-ink">{titulo}</h2>
            <p className="mx-auto mt-1.5 max-w-md text-meta text-muted">{texto}</p>
            {children ? (
                <div className="mt-5 flex justify-center">{children}</div>
            ) : null}
        </div>
    );
}

export function EstadosBandeja({
    estado,
    onLimpiar,
    onReintentar,
}: EstadosBandejaProps) {
    return (
        <div className="mt-6">
            {estado === "cargando" ? (
                <div role="status" aria-busy="true">
                    <span className="sr-only">Cargando los reportes del archivo.</span>
                    <EsqueletoTabla />
                    <EsqueletoTarjetas />
                </div>
            ) : null}

            {estado === "vacio" ? (
                <Panel
                    icono={Inbox}
                    tono="neutro"
                    titulo="Todavía no hay reportes"
                    texto="El archivo está vacío: cuando se escaneen reportes van a aparecer acá para revisar."
                />
            ) : null}

            {estado === "error" ? (
                <Panel
                    icono={AlertTriangle}
                    tono="error"
                    titulo="No se pudo cargar el archivo"
                    texto="Los reportes no están disponibles en este momento. Revisá la conexión y volvé a intentar."
                >
                    <Boton
                        variante="primario"
                        onClick={onReintentar}
                        className="h-11 md:h-9"
                    >
                        Volver a intentar
                    </Boton>
                </Panel>
            ) : null}

            {estado === "sin_resultados" ? (
                <Panel
                    icono={SearchX}
                    tono="neutro"
                    titulo="Ningún reporte coincide"
                    texto="No hay reportes con esa búsqueda ni con esos filtros. Probá otro N° o quitá los filtros."
                >
                    <Boton
                        variante="primario"
                        onClick={onLimpiar}
                        className="h-11 md:h-9"
                    >
                        Limpiar filtros
                    </Boton>
                </Panel>
            ) : null}
        </div>
    );
}