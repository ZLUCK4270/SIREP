/**
 * Responsabilidad: los tres estados que la vista de corrección puede tener
 * antes de mostrar datos: cargando, reporte no encontrado y error de carga.
 * Existe aparte para que `vista-revision` reparta paneles y no tenga que
 * mezclar esqueletos y mensajes de error con la lógica de revisión; cada uno
 * con su propio copy, porque "todavía no hay datos", "ese número no existe" y
 * "algo falló" son tres cosas distintas para quien las lee.
 */

import Link from "next/link";
import { AlertTriangle, Inbox, RotateCcw } from "lucide-react";

import { Boton } from "@/components/ui/boton";
import { Esqueleto } from "@/components/ui/esqueleto";

import { EnlaceBandeja } from "./enlace-bandeja";

export function CargandoRevision() {
    return (
        <div
            role="status"
            className="mx-auto flex max-w-(--layout-max) flex-col gap-4 px-(--space-gutter) py-5"
        >
            <span className="sr-only">Cargando el reporte…</span>
            <Esqueleto className="h-20 w-full" />
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                <Esqueleto className="h-[520px] w-full" />
                <div className="flex flex-col gap-3">
                    <Esqueleto className="h-16 w-full" />
                    <Esqueleto className="h-36 w-full" />
                    <Esqueleto className="h-36 w-full" />
                    <Esqueleto className="h-36 w-full" />
                </div>
            </div>
        </div>
    );
}

export function ReporteNoEncontrado({ numero }: { numero: string }) {
    return (
        <div className="mx-auto flex max-w-xl flex-col items-center gap-3 px-(--space-gutter) py-16 text-center">
            <span
                aria-hidden="true"
                className="flex size-12 items-center justify-center rounded-md bg-sunken text-muted"
            >
                <Inbox className="size-6" />
            </span>
            <h1 className="text-title font-semibold text-ink">
                No encontramos el reporte N° {numero}
            </h1>
            <p className="text-body text-muted">
                Puede que el número esté mal escrito o que el reporte todavía no se haya
                cargado en el sistema.
            </p>
            <EnlaceBandeja className="mt-2" />
        </div>
    );
}

export function ErrorDeCarga({
    mensaje,
    onReintentar,
}: {
    mensaje: string;
    onReintentar: () => void;
}) {
    return (
        <div
            role="alert"
            className="mx-auto flex max-w-xl flex-col items-center gap-3 px-(--space-gutter) py-16 text-center"
        >
            <span
                aria-hidden="true"
                className="flex size-12 items-center justify-center rounded-md bg-brick-50 text-brick-700"
            >
                <AlertTriangle className="size-6" />
            </span>
            <h1 className="text-title font-semibold text-ink">
                No se pudo abrir el reporte
            </h1>
            <p className="text-body text-muted">{mensaje}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                <Boton variante="primario" onClick={onReintentar}>
                    <RotateCcw className="size-4 shrink-0" aria-hidden="true" />
                    Intentar de nuevo
                </Boton>
                <Link
                    href="/"
                    className="text-body font-medium text-petrol-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-petrol-600"
                >
                    Volver a la bandeja
                </Link>
            </div>
        </div>
    );
}