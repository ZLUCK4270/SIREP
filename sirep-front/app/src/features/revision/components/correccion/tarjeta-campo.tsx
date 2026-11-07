/**
 * Responsabilidad: presentar un campo con su recorte, su lectura, su estado y
 * las acciones que corresponden en ese momento.
 * Existe porque es la pieza que el técnico mira cientos de veces por turno:
 * tiene que responder de un vistazo qué leyó el modelo, qué hizo una persona y
 * qué falta, sin abrir nada.
 */

"use client";

import { useState } from "react";
import { twMerge } from "tailwind-merge";
import {
    AlertOctagon,
    AlertTriangle,
    Ban,
    CheckCircle2,
    Info,
    PencilLine,
    RotateCcw,
    X,
} from "lucide-react";

import { Boton } from "@/components/ui/boton";
import { EtiquetaRevision } from "@/features/revision/components/comunes/etiqueta-estado";
import { IndicadorConfianza } from "@/features/revision/components/comunes/indicador-confianza";
import {
    HojaEscaneada,
    type TonoResaltado,
} from "@/features/revision/components/escaneo/hoja-escaneada";
import { RecorteEscaneo } from "@/features/revision/components/escaneo/recorte";
import { valorVigente } from "@/features/revision/lib/campos";
import { fueResueltoPorPersona, requiereRevision } from "@/features/revision/lib/dudosos";
import { detalleDuda } from "@/features/revision/lib/detalle-duda";
import { formatearFechaHora } from "@/features/revision/lib/formato";
import type {
    CampoVista,
    IdCampo,
    ReporteVista,
} from "@/features/revision/types/dominio";

import { EditorCorreccion } from "./editor-correccion";
import { tonoDeCampo } from "./estado-visual";

/**
 * El filo izquierdo es el estado del campo a la periferia de la vista; el tono
 * nunca va solo: al lado siempre están la etiqueta de revisión y el indicador
 * de confianza, que traen ícono y texto.
 */
const BORDE_POR_TONO: Record<TonoResaltado, string> = {
    petrol: "border-l-petrol-600",
    amber: "border-l-amber-600",
    brick: "border-l-brick-600",
    green: "border-l-green-600",
};

export interface AccionesCampo {
    seleccionar: (campo: IdCampo) => void;
    confirmar: (campo: IdCampo) => void;
    corregir: (campo: IdCampo, valor: string) => Promise<boolean>;
    ilegible: (campo: IdCampo) => void;
    reabrir: (campo: IdCampo) => void;
    descartarError: () => void;
}

export interface TarjetaCampoProps {
    /** Aporta el mapa y los valores manuscritos para dibujar el recorte. */
    reporte: ReporteVista;
    campo: CampoVista;
    activo: boolean;
    /** Bloquea las acciones mientras el repositorio procesa cualquier campo. */
    enCurso: boolean;
    /** Mensaje de `ErrorRepositorio` para este campo, si lo hay. */
    error: string | null;
    /** `amplio` es el flujo móvil: un campo por pantalla, recorte arriba. */
    variante?: "compacto" | "amplio";
    /** Modo edición habilitado desde la barra de herramientas superior. */
    modoEdicion?: boolean;
    onSeleccionar: () => void;
    onConfirmar: () => void;
    onCorregir: (valor: string) => Promise<boolean>;
    onIlegible: () => void;
    onReabrir: () => void;
    onDescartarError: () => void;
}

export function TarjetaCampo({
    reporte,
    campo,
    activo,
    enCurso,
    error,
    variante = "compacto",
    modoEdicion = false,
    onSeleccionar,
    onConfirmar,
    onCorregir,
    onIlegible,
    onReabrir,
    onDescartarError,
}: TarjetaCampoProps) {
    const [editando, setEditando] = useState(false);

    const amplio = variante === "amplio";
    const pendiente = requiereRevision(campo);
    const resuelto = fueResueltoPorPersona(campo);
    const valorModelo = campo.valor_modelo?.trim() ? campo.valor_modelo : null;
    const vigente = valorVigente(campo);
    const tieneValor = (vigente ?? "").trim() !== "";
    const tono = tonoDeCampo(campo);
    const tamanio = amplio ? "lg" : "sm";
    const duda =
        campo.estado_revision === "pendiente" ? detalleDuda(campo) : null;

    const anchoRecorte = amplio ? "w-full" : "w-28";
    const apilar = amplio ? "flex-col" : "";
    const llenar = amplio ? "w-full" : "";

    return (
        <article
            aria-current={activo ? "true" : undefined}
            aria-busy={enCurso || undefined}
            onClick={onSeleccionar}
            onFocus={onSeleccionar}
            className={twMerge(
                "rounded-md border border-line border-l-4 bg-raised p-3",
                "transition-[box-shadow] duration-150 ease-[var(--ease-salida)]",
                BORDE_POR_TONO[tono],
                activo && "shadow-lift ring-1 ring-petrol-600",
                !modoEdicion ? "cursor-not-allowed select-none" : "cursor-pointer",
            )}
        >
            <div className="flex flex-wrap items-center gap-2">
                <EtiquetaRevision estado={campo.estado_revision} />
                {!modoEdicion ? (
                    <span
                        className="flex items-center gap-1 rounded-xs bg-line px-1.5 py-0.5 text-micro font-medium text-faint"
                        title="Para editar este campo, hacé clic en 'Editar' en la barra superior"
                    >
                        Bloqueado
                    </span>
                ) : null}
                {activo ? (
                    <span className="ml-auto font-mono text-micro uppercase tracking-label text-petrol-700">
                        Activo
                    </span>
                ) : null}
            </div>

            <div className={twMerge("mt-2.5 flex gap-3", amplio && "flex-col")}>
                {/* El recorte es evidencia visual; para los lectores de pantalla el
            valor ya está escrito en texto, así que se oculta para no repetir la
            descripción del escaneo en cada tarjeta. */}
                <div aria-hidden="true" className={twMerge("shrink-0", amplio && "w-full")}>
                    <RecorteEscaneo
                        mapa={reporte.mapa}
                        region={campo.region}
                        padding={amplio ? 0.025 : 0.012}
                        className={anchoRecorte}
                    >
                        <HojaEscaneada
                            mapa={reporte.mapa}
                            pagina={campo.region.pagina}
                            reporte={reporte}
                            className="h-full w-full"
                        />
                    </RecorteEscaneo>
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-micro uppercase tracking-label text-faint">
                            Lectura del modelo
                        </p>
                        <IndicadorConfianza campo={campo} />
                    </div>
                    <p
                        className={twMerge(
                            "mt-0.5 break-words text-base text-ink",
                            campo.definicion.mono && "font-mono",
                            campo.estado_revision === "ilegible" &&
                            valorModelo &&
                            "text-faint line-through",
                            !valorModelo && "text-faint",
                        )}
                    >
                        {valorModelo ?? (campo.no_leido ? "Sin lectura" : "En blanco en el papel")}
                    </p>

                    {duda ? (
                        <div className="mt-2 flex items-start gap-2 rounded-xs border border-amber-200 bg-amber-50 px-2.5 py-1.5">
                            <Info
                                className="mt-0.5 size-3.5 shrink-0 text-amber-700"
                                aria-hidden="true"
                            />
                            <div className="min-w-0 text-micro text-amber-700">
                                <p className="font-semibold uppercase tracking-label">
                                    Por qué es dudoso
                                </p>
                                <p className="mt-0.5 text-meta leading-snug text-ink">
                                    {duda.motivo}
                                </p>
                                {duda.observacion ? (
                                    <p className="mt-0.5 text-meta leading-snug text-muted">
                                        Nota del modelo: {duda.observacion}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    ) : null}

                    {campo.estado_revision === "confirmado" ? (
                        <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-micro text-green-700">
                            <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
                            Confirmado por {campo.revisado_por}
                            {campo.revisado_en
                                ? ` · ${formatearFechaHora(campo.revisado_en)}`
                                : ""}
                        </p>
                    ) : null}

                    {campo.estado_revision === "corregido" ? (
                        <div className="mt-2 rounded-xs border border-green-200 bg-green-50 px-2 py-1.5">
                            <p className="text-micro uppercase tracking-label text-green-700">
                                Corregido por {campo.corregido_por}
                                {campo.corregido_en
                                    ? ` · ${formatearFechaHora(campo.corregido_en)}`
                                    : ""}
                            </p>
                            <p
                                className={twMerge(
                                    "mt-0.5 break-words text-base text-ink",
                                    campo.definicion.mono && "font-mono",
                                )}
                            >
                                {campo.valor_corregido}
                            </p>
                            <p className="mt-0.5 text-micro text-muted">
                                El modelo leyó: {valorModelo ?? "sin lectura"}
                            </p>
                        </div>
                    ) : null}

                    {campo.estado_revision === "ilegible" ? (
                        <div className="mt-2 rounded-xs border border-brick-200 bg-brick-50 px-2 py-1.5">
                            <p className="flex items-center gap-1.5 text-micro uppercase tracking-label text-brick-700">
                                <AlertOctagon className="size-3.5 shrink-0" aria-hidden="true" />
                                Marcado ilegible
                            </p>
                            <p className="mt-0.5 text-micro text-muted">
                                Revisado por {campo.revisado_por}
                                {campo.revisado_en
                                    ? ` · ${formatearFechaHora(campo.revisado_en)}`
                                    : ""}
                            </p>
                        </div>
                    ) : null}
                </div>
            </div>

            {editando ? (
                <div className="mt-3">
                    <EditorCorreccion
                        valorInicial={vigente ?? ""}
                        etiqueta={campo.definicion.etiqueta}
                        enCurso={enCurso}
                        onGuardar={async (valor) => {
                            const guardado = await onCorregir(valor);
                            if (guardado) setEditando(false);
                            return guardado;
                        }}
                        onCancelar={() => setEditando(false)}
                    />
                </div>
            ) : null}

            {!editando && pendiente ? (
                <div className={twMerge("mt-3 flex flex-wrap gap-2", apilar)}>
                    {tieneValor ? (
                        <Boton
                            variante="exito"
                            tamano={tamanio}
                            onClick={onConfirmar}
                            disabled={enCurso || !modoEdicion}
                            className={twMerge(llenar, !modoEdicion && "cursor-not-allowed opacity-50")}
                        >
                            <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                            Confirmar
                        </Boton>
                    ) : null}
                    <Boton
                        variante="secundario"
                        tamano={tamanio}
                        onClick={() => {
                            if (modoEdicion) setEditando(true);
                        }}
                        disabled={enCurso || !modoEdicion}
                        className={twMerge(llenar, !modoEdicion && "cursor-not-allowed opacity-50")}
                    >
                        <PencilLine className="size-4 shrink-0" aria-hidden="true" />
                        Corregir
                    </Boton>
                    <Boton
                        variante="fantasma"
                        tamano={tamanio}
                        onClick={onIlegible}
                        disabled={enCurso || !modoEdicion}
                        className={twMerge(
                            llenar,
                            "text-brick-700 hover:bg-brick-50 hover:text-brick-700",
                            !modoEdicion && "cursor-not-allowed opacity-50",
                        )}
                    >
                        <Ban className="size-4 shrink-0" aria-hidden="true" />
                        Marcar ilegible
                    </Boton>
                </div>
            ) : null}

            {!editando && resuelto ? (
                <div className="mt-3">
                    <Boton
                        variante="secundario"
                        tamano={tamanio}
                        onClick={onReabrir}
                        disabled={enCurso || !modoEdicion}
                        className={twMerge(llenar, !modoEdicion && "cursor-not-allowed opacity-50")}
                    >
                        <RotateCcw className="size-4 shrink-0" aria-hidden="true" />
                        Reabrir
                    </Boton>
                </div>
            ) : null}

            {error ? (
                <div
                    role="alert"
                    className="mt-3 flex items-start gap-2 rounded-xs border border-brick-200 bg-brick-50 px-2.5 py-2 text-brick-700"
                >
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <p className="min-w-0 flex-1 text-meta">{error}</p>
                    <button
                        type="button"
                        onClick={onDescartarError}
                        aria-label="Descartar el mensaje de error"
                        className="rounded-xs p-1 hover:bg-brick-200/50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brick-600"
                    >
                        <X className="size-3.5" aria-hidden="true" />
                    </button>
                </div>
            ) : null}
        </article>
    );
}