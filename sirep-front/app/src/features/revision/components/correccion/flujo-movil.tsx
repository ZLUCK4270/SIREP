/**
 * Responsabilidad: la vista móvil de la corrección, con un campo por pantalla.
 * Existe porque en 360 px no caben dos paneles: el recorte ocupa el ancho
 * completo, las acciones quedan abajo con objetivos de 44 px y el avance es con
 * botones grandes, no con atajos de teclado que en el celular no existen.
 */

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Boton } from "@/components/ui/boton";
import type { ErrorAccion } from "@/features/revision/hooks/use-revision-reporte";
import type {
    CampoVista,
    ReporteVista,
} from "@/features/revision/types/dominio";

import { TarjetaCampo, type AccionesCampo } from "./tarjeta-campo";

interface FlujoMovilProps {
    reporte: ReporteVista;
    campo: CampoVista;
    posicion: { actual: number; total: number };
    enCurso: boolean;
    errorAccion: ErrorAccion | null;
    acciones: AccionesCampo;
    onAnterior: () => void;
    onSiguiente: () => void;
}

export function FlujoMovil({
    reporte,
    campo,
    posicion,
    enCurso,
    errorAccion,
    acciones,
    onAnterior,
    onSiguiente,
}: FlujoMovilProps) {
    const sinAvance = posicion.total <= 1;

    return (
        <section aria-label="Campo activo" className="flex flex-col gap-3">
            <p className="text-micro uppercase tracking-label text-faint">
                Campo {posicion.actual} de {posicion.total}
            </p>

            <TarjetaCampo
                reporte={reporte}
                campo={campo}
                activo
                variante="amplio"
                enCurso={enCurso}
                error={errorAccion?.campo === campo.id ? errorAccion.mensaje : null}
                onSeleccionar={() => acciones.seleccionar(campo.id)}
                onConfirmar={() => acciones.confirmar(campo.id)}
                onCorregir={(valor) => acciones.corregir(campo.id, valor)}
                onIlegible={() => acciones.ilegible(campo.id)}
                onReabrir={() => acciones.reabrir(campo.id)}
                onDescartarError={acciones.descartarError}
            />

            <div className="grid grid-cols-2 gap-2">
                <Boton
                    variante="secundario"
                    tamano="lg"
                    onClick={onAnterior}
                    disabled={sinAvance}
                >
                    <ChevronLeft className="size-4 shrink-0" aria-hidden="true" />
                    Anterior
                </Boton>
                <Boton
                    variante="secundario"
                    tamano="lg"
                    onClick={onSiguiente}
                    disabled={sinAvance}
                >
                    Siguiente
                    <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
                </Boton>
            </div>
        </section>
    );
}