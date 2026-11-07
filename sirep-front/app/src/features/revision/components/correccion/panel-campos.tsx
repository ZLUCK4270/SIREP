/**
 * Responsabilidad: listar los campos agrupados por sección, con los dudosos
 * pendientes primero y el filtro "solo dudosos / todos los campos".
 * Existe porque el orden de esta lista es el ahorro de trabajo del producto:
 * si el técnico tiene que leer el formulario entero, el modelo no sirvió de
 * nada, por eso la vista por defecto muestra solo lo dudoso.
 *
 * La lista se pagina (TAMANO_PAGINA campos por página) para que el panel no
 * crezca sin límite; la paginación es solo de presentación.
 */

"use client";

import { AlertTriangle, ListChecks, Rows3 } from "lucide-react";
import { useMemo, useRef, useState, type CSSProperties } from "react";

import { Boton } from "@/components/ui/boton";
import { Insignia } from "@/components/ui/insignia";
import type { ErrorAccion } from "@/features/revision/hooks/use-revision-reporte";
import type { GrupoCampos } from "@/features/revision/lib/dudosos";
import { pluralizar } from "@/features/revision/lib/formato";
import type {
    CampoVista,
    ReporteVista,
} from "@/features/revision/types/dominio";

import { PaginacionCampos } from "./paginacion-campos";
import { TarjetaCampo, type AccionesCampo } from "./tarjeta-campo";

const TAMANO_PAGINA = 4;

interface PanelCamposProps {
    reporte: ReporteVista;
    grupos: GrupoCampos[];
    soloDudosos: boolean;
    campoActivo: CampoVista | null;
    /** `true` mientras el repositorio procesa cualquier acción. */
    enCurso: boolean;
    /** Mensaje de error para el campo activo en vuelo. */
    errorAccion?: ErrorAccion | null;
    /** Modo de edición activado por el técnico. */
    modoEdicion?: boolean;
    onCambiarVista: (soloDudosos: boolean) => void;
    acciones: AccionesCampo;
}

const OPCIONES_VISTA = [
    { solo: true, etiqueta: "Solo dudosos", Icono: AlertTriangle },
    { solo: false, etiqueta: "Todos los campos", Icono: Rows3 },
] as const;

export function PanelCampos({
    reporte,
    grupos,
    soloDudosos,
    campoActivo,
    enCurso,
    errorAccion,
    modoEdicion = false,
    onCambiarVista,
    acciones,
}: PanelCamposProps) {
    const sinCampos = grupos.length === 0;
    const [pagina, setPagina] = useState(0);
    const raiz = useRef<HTMLElement>(null);
    const lista = useRef<HTMLDivElement>(null);

    // Lista plana en el mismo orden en que se muestran los grupos.
    const plano = useMemo(
        () =>
            grupos.flatMap((grupo) =>
                grupo.campos.map((campo) => ({ grupo, campo })),
            ),
        [grupos],
    );
    const totalPaginas = Math.max(1, Math.ceil(plano.length / TAMANO_PAGINA));
    const paginaSegura = Math.min(pagina, totalPaginas - 1);

    // Ajustes de página derivados de props, hechos durante el render (patrón de
    // React para estado que depende de una prop; evita un render extra por efecto).
    // Al cambiar el filtro se vuelve a la primera página.
    const [filtroPrevio, setFiltroPrevio] = useState(soloDudosos);
    if (filtroPrevio !== soloDudosos) {
        setFiltroPrevio(soloDudosos);
        setPagina(0);
    }

    // Si el campo activo cambia (p. ej. con atajos de teclado), se muestra su página.
    const idActivo = campoActivo?.id;
    const [activoPrevio, setActivoPrevio] = useState<string | undefined>(
        undefined,
    );
    if (activoPrevio !== idActivo) {
        setActivoPrevio(idActivo);
        const indice = plano.findIndex((item) => item.campo.id === idActivo);
        if (indice >= 0) setPagina(Math.floor(indice / TAMANO_PAGINA));
    }

    function cambiarPagina(nueva: number) {
        setPagina(nueva);
        // En pantallas grandes el panel tiene altura fija y la lista scrollea por
        // dentro: basta volver al inicio de la lista, sin mover la página (antes el
        // scroll saltaba hacia arriba al acortarse la página). En móvil, la lista
        // sí crece con la página: solo se ajusta si el inicio quedó fuera de vista.
        lista.current?.scrollTo({ top: 0, behavior: "smooth" });
        const esEscritorio = window.matchMedia("(min-width: 1024px)").matches;
        if (!esEscritorio) {
            const arriba = raiz.current?.getBoundingClientRect().top ?? 0;
            if (arriba < 72) {
                window.scrollBy({ top: arriba - 88, behavior: "smooth" });
            }
        }
    }

    // Campos de la página actual, reagrupados por sección.
    const gruposPagina = useMemo(() => {
        const visibles = plano.slice(
            paginaSegura * TAMANO_PAGINA,
            (paginaSegura + 1) * TAMANO_PAGINA,
        );
        const mapa = new Map<
            string,
            { grupo: GrupoCampos; campos: CampoVista[] }
        >();
        for (const { grupo, campo } of visibles) {
            const existente = mapa.get(grupo.seccion.id);
            if (existente) existente.campos.push(campo);
            else mapa.set(grupo.seccion.id, { grupo, campos: [campo] });
        }
        return [...mapa.values()];
    }, [plano, paginaSegura]);

    return (
        <section
            ref={raiz}
            aria-label="Campos del reporte"
            className="flex min-h-0 flex-col gap-3 lg:h-full"
        >
            <div className="flex shrink-0 flex-col gap-3 rounded-md border border-line bg-raised px-3.5 py-3 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                <h2 className="flex items-center gap-2 text-micro uppercase tracking-label text-faint">
                    <ListChecks className="size-4" aria-hidden="true" />
                    Campos del reporte
                </h2>
                <div
                    role="group"
                    aria-label="Filtrar campos"
                    className="grid grid-cols-2 gap-1 rounded-md border border-line bg-sunken p-1 sm:inline-grid"
                >
                    {OPCIONES_VISTA.map(({ solo, etiqueta, Icono }) => {
                        const activo = soloDudosos === solo;
                        return (
                            <button
                                key={solo ? "dudosos" : "todos"}
                                type="button"
                                aria-pressed={activo}
                                onClick={() => onCambiarVista(solo)}
                                className={[
                                    "inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-sm px-3 text-meta transition-all duration-150 ease-[var(--ease-salida)]",
                                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-petrol-600",
                                    activo
                                        ? "bg-raised font-semibold text-petrol-700 shadow-xs ring-1 ring-petrol-200"
                                        : "font-medium text-muted hover:bg-raised/60 hover:text-ink",
                                ].join(" ")}
                            >
                                <Icono className="size-3.5" aria-hidden="true" />
                                {etiqueta}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div
                ref={lista}
                className="scroll-fino flex min-h-0 flex-1 flex-col gap-4 lg:overflow-y-auto lg:overscroll-contain lg:pr-1.5"
            >
                {sinCampos ? (
                    <div className="animar-aparecer rounded-md border border-dashed border-line-strong bg-raised px-4 py-8 text-center">
                        <p className="text-body text-muted">
                            {soloDudosos
                                ? "No quedan campos dudosos pendientes en este reporte."
                                : "Este reporte no tiene campos para revisar."}
                        </p>
                        {soloDudosos ? (
                            <Boton
                                variante="secundario"
                                tamano="sm"
                                onClick={() => onCambiarVista(false)}
                                className="mt-3"
                            >
                                Ver todos los campos
                            </Boton>
                        ) : null}
                    </div>
                ) : (
                    <>
                        {gruposPagina.map(({ grupo, campos }, g) => (
                            <section
                                key={`${paginaSegura}-${grupo.seccion.id}`}
                                aria-labelledby={`seccion-${grupo.seccion.id}`}
                                className="flex flex-col gap-2"
                            >
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3
                                        id={`seccion-${grupo.seccion.id}`}
                                        className="text-micro uppercase tracking-label text-faint"
                                    >
                                        {grupo.seccion.titulo}
                                    </h3>
                                    <span className="text-micro text-faint">
                                        {pluralizar(grupo.campos.length, "campo", "campos")}
                                    </span>
                                    {grupo.pendientes > 0 ? (
                                        <Insignia tono="amber" tamano="micro">
                                            {pluralizar(
                                                grupo.pendientes,
                                                "pendiente",
                                                "pendientes",
                                            )}
                                        </Insignia>
                                    ) : null}
                                </div>
                                <ul className="flex flex-col gap-2">
                                    {campos.map((campo, i) => (
                                        <li
                                            key={campo.id}
                                            className="animar-tarjeta"
                                            style={
                                                {
                                                    "--i":
                                                        i +
                                                        gruposPagina
                                                            .slice(0, g)
                                                            .reduce(
                                                                (n, item) => n + item.campos.length,
                                                                0,
                                                            ),
                                                } as CSSProperties
                                            }
                                        >
                                            <TarjetaCampo
                                                reporte={reporte}
                                                campo={campo}
                                                activo={campo.id === campoActivo?.id}
                                                enCurso={enCurso}
                                                modoEdicion={modoEdicion}
                                                error={
                                                    errorAccion?.campo === campo.id
                                                        ? errorAccion.mensaje
                                                        : null
                                                }
                                                onSeleccionar={() => acciones.seleccionar(campo.id)}
                                                onConfirmar={() => acciones.confirmar(campo.id)}
                                                onCorregir={(valor) =>
                                                    acciones.corregir(campo.id, valor)
                                                }
                                                onIlegible={() => acciones.ilegible(campo.id)}
                                                onReabrir={() => acciones.reabrir(campo.id)}
                                                onDescartarError={acciones.descartarError}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ))}
                    </>
                )}
            </div>

            {sinCampos ? null : (
                <PaginacionCampos
                    pagina={paginaSegura}
                    totalPaginas={totalPaginas}
                    tamanoPagina={TAMANO_PAGINA}
                    totalItems={plano.length}
                    onCambiar={cambiarPagina}
                />
            )}
        </section>
    );
}