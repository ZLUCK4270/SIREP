/**
 * Responsabilidad: búsqueda por N°, filtros de estado y origen, orden y
 * limpieza, con el conteo de resultados anunciado en vivo.
 * Existe porque es el panel de control de la bandeja: el técnico lo usa cientos
 * de veces por jornada, así que cada control lleva etiqueta visible, objetivo
 * táctil de 44 px en móvil y el resultado se anuncia por `aria-live` sin exigir
 * que la persona note el cambio en pantalla.
 */

import { Search, X } from "lucide-react";

import { Boton } from "@/components/ui/boton";
import { Entrada } from "@/components/ui/entrada";
import {
    ETIQUETAS_ESTADO,
    ETIQUETAS_ORIGEN,
    type DescripcionSemantica,
} from "@/features/revision/lib/etiquetas";
import { pluralizar } from "@/features/revision/lib/formato";
import { OPCIONES_ORDEN } from "@/features/revision/lib/orden";
import type {
    FiltrosBandeja,
    FiltroEstado,
    FiltroOrigen,
    OrdenBandeja,
} from "@/features/revision/types/dominio";

interface BarraHerramientasProps {
    filtros: FiltrosBandeja;
    orden: OrdenBandeja;
    filtrosActivos: boolean;
    resultados: number;
    totalArchivo: number;
    onCambioBusqueda: (valor: string) => void;
    onCambioEstado: (valor: FiltroEstado) => void;
    onCambioOrigen: (valor: FiltroOrigen) => void;
    onCambioOrden: (valor: OrdenBandeja) => void;
    onLimpiar: () => void;
}

/**
 * Las opciones salen de las etiquetas del dominio para que el menú y las
 * insignias de la tabla digan siempre lo mismo. El cast de las claves es
 * seguro: `ETIQUETAS_ESTADO` está declarado como `Record<EstadoEscaneo, …>`.
 */
const OPCIONES_ESTADO: readonly { valor: FiltroEstado; etiqueta: string }[] = [
    { valor: "todos", etiqueta: "Todos los estados" },
    ...(Object.entries(ETIQUETAS_ESTADO) as [
        FiltroEstado,
        DescripcionSemantica,
    ][]).map(([valor, descripcion]) => ({
        valor,
        etiqueta: descripcion.etiqueta,
    })),
];

const OPCIONES_ORIGEN: readonly { valor: FiltroOrigen; etiqueta: string }[] = [
    { valor: "todos", etiqueta: "Todos los orígenes" },
    ...(Object.entries(ETIQUETAS_ORIGEN) as [
        FiltroOrigen,
        DescripcionSemantica,
    ][]).map(([valor, descripcion]) => ({
        valor,
        etiqueta: descripcion.etiqueta,
    })),
];

const CLASE_SELECT = [
    "h-11 w-full rounded-sm border border-line-strong bg-inset px-3",
    "text-base text-ink",
    "transition-colors duration-150 ease-[var(--ease-salida)]",
    "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-petrol-600",
    "md:h-9",
].join(" ");

const CLASE_ETIQUETA =
    "mb-1.5 block text-micro uppercase tracking-label text-faint";

export function BarraHerramientas({
    filtros,
    orden,
    filtrosActivos,
    resultados,
    totalArchivo,
    onCambioBusqueda,
    onCambioEstado,
    onCambioOrigen,
    onCambioOrden,
    onLimpiar,
}: BarraHerramientasProps) {
    return (
        <div className="border-b border-line py-4">
            {/*
       * `flex-wrap` y no `flex-col`: en móvil los controles fluyen y se
       * acomodan de a dos (estado y origen comparten fila al ser 50% menos
       * la mitad del gap), y a partir de 768 px pasan a una sola fila
       * alineada por la base con las etiquetas arriba.
       */}
            <div className="flex flex-wrap gap-3 md:items-end">
                <div className="w-full md:w-64">
                    <label htmlFor="busqueda-bandeja" className={CLASE_ETIQUETA}>
                        N° de reporte
                    </label>
                    <div className="relative">
                        <Search
                            aria-hidden="true"
                            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint"
                        />
                        <Entrada
                            id="busqueda-bandeja"
                            type="search"
                            value={filtros.busqueda}
                            onChange={(evento) => onCambioBusqueda(evento.target.value)}
                            placeholder="Ej. 000845"
                            autoComplete="off"
                            className="h-11 pl-9 md:h-9"
                        />
                    </div>
                </div>

                <div className="w-[calc(50%-0.375rem)] md:w-auto">
                    <label htmlFor="filtro-estado" className={CLASE_ETIQUETA}>
                        Estado
                    </label>
                    <select
                        id="filtro-estado"
                        value={filtros.estado}
                        onChange={(evento) =>
                            onCambioEstado(evento.target.value as FiltroEstado)
                        }
                        className={CLASE_SELECT}
                    >
                        {OPCIONES_ESTADO.map((opcion) => (
                            <option key={opcion.valor} value={opcion.valor}>
                                {opcion.etiqueta}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="w-[calc(50%-0.375rem)] md:w-auto">
                    <label htmlFor="filtro-origen" className={CLASE_ETIQUETA}>
                        Origen
                    </label>
                    <select
                        id="filtro-origen"
                        value={filtros.origen}
                        onChange={(evento) =>
                            onCambioOrigen(evento.target.value as FiltroOrigen)
                        }
                        className={CLASE_SELECT}
                    >
                        {OPCIONES_ORIGEN.map((opcion) => (
                            <option key={opcion.valor} value={opcion.valor}>
                                {opcion.etiqueta}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="w-full md:w-auto">
                    <label htmlFor="orden-bandeja" className={CLASE_ETIQUETA}>
                        Ordenar por
                    </label>
                    <select
                        id="orden-bandeja"
                        value={orden}
                        onChange={(evento) =>
                            onCambioOrden(evento.target.value as OrdenBandeja)
                        }
                        className={CLASE_SELECT}
                    >
                        {OPCIONES_ORDEN.map((opcion) => (
                            <option key={opcion.valor} value={opcion.valor}>
                                {opcion.etiqueta}
                            </option>
                        ))}
                    </select>
                </div>

                {filtrosActivos ? (
                    <div className="w-full md:w-auto">
                        <Boton
                            variante="secundario"
                            onClick={onLimpiar}
                            className="h-11 w-full md:h-9 md:w-auto"
                        >
                            <X aria-hidden="true" className="size-4" />
                            Limpiar filtros
                        </Boton>
                    </div>
                ) : null}

                <p
                    aria-live="polite"
                    className="w-full pt-1 text-meta text-muted md:ml-auto md:w-auto md:pt-0 md:text-right"
                >
                    Mostrando{" "}
                    <span className="font-mono text-ink">{resultados}</span> de{" "}
                    {pluralizar(totalArchivo, "reporte", "reportes")}
                </p>
            </div>
        </div>
    );
}