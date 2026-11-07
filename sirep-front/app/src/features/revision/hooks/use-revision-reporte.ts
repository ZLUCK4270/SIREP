/**
 * Responsabilidad: orquestar la vista de corrección: cargar el reporte,
 * mantener el campo activo, filtrar la lista y ejecutar las acciones de
 * revisión sobre el repositorio.
 * Existe separado de los componentes porque es la única capa que habla con
 * `RepositorioReportes`: ahí vive el manejo de `ErrorRepositorio` y las
 * decisiones de flujo (qué campo sigue después de confirmar), y los
 * componentes reciben datos y callbacks ya resueltos.
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { obtenerMapa } from "@/config/regiones";
import { USUARIO_ACTUAL } from "@/config/sesion";
import { componerReporte, valorVigente } from "@/features/revision/lib/campos";
import {
    agruparCampos,
    calcularPendientes,
    camposPendientesOrdenados,
    esDudoso,
    requiereRevision,
    siguienteCampoPendiente,
    type GrupoCampos,
} from "@/features/revision/lib/dudosos";
import { pluralizar } from "@/features/revision/lib/formato";
import { useTiempoReal } from "@/features/revision/hooks/use-tiempo-real";
import { useRepositorio } from "@/features/revision/providers/repositorio-contexto";
import { ErrorRepositorio } from "@/features/revision/services";
import type {
    AccionRevision,
    CampoVista,
    IdCampo,
    PendientesRevision,
    ReporteVista,
} from "@/features/revision/types/dominio";

export type EstadoCarga = "cargando" | "listo" | "no_encontrado" | "error";

export interface ErrorAccion {
    campo: IdCampo;
    mensaje: string;
}

export interface RevisionReporte {
    estado: EstadoCarga;
    mensajeError: string | null;
    recargar: () => void;
    reporte: ReporteVista | null;
    pendientes: PendientesRevision;
    grupos: GrupoCampos[];
    /** Campos visibles en el orden en que se listan, para el avance del móvil. */
    visibles: CampoVista[];
    campoActivo: CampoVista | null;
    soloDudosos: boolean;
    cambiarVista: (soloDudosos: boolean) => void;
    seleccionar: (campo: IdCampo) => void;
    mover: (direccion: 1 | -1) => void;
    confirmar: (campo: IdCampo) => Promise<boolean>;
    corregir: (campo: IdCampo, valor: string) => Promise<boolean>;
    marcarIlegible: (campo: IdCampo) => Promise<boolean>;
    reabrir: (campo: IdCampo) => Promise<boolean>;
    confirmarCampoActivo: () => Promise<void>;
    deshacer: () => Promise<void>;
    /** Campo con una acción en vuelo; mientras dura, la lista queda bloqueada. */
    campoEnCurso: IdCampo | null;
    errorAccion: ErrorAccion | null;
    descartarError: () => void;
    /** Texto para el `aria-live` que anuncia confirmaciones y avances. */
    anuncio: string;
    /** Último campo resuelto, para el "Deshacer" de la barra de progreso. */
    ultimaAccion: IdCampo | null;
}

const PENDIENTES_VACIOS: PendientesRevision = {
    total: 0,
    resueltos: 0,
    dudosos: 0,
};

function primerCampoVisible(reporte: ReporteVista): IdCampo | null {
    return (
        camposPendientesOrdenados(reporte.campos)[0]?.id ??
        reporte.campos[0]?.id ??
        null
    );
}

function mensajeDeError(error: unknown): string {
    // Solo el error de dominio tiene un texto pensado para la persona; cualquier
    // otro fallo se traduce a un mensaje genérico para no filtrar detalles
    // internos a la interfaz.
    return error instanceof ErrorRepositorio
        ? error.message
        : "No se pudo guardar la revisión. El resto de la vista sigue funcionando.";
}

function anuncioDeAccion(
    accion: AccionRevision,
    campo: CampoVista,
    pendientes: PendientesRevision,
): string {
    const etiqueta = campo.definicion.etiqueta;
    let frase: string;
    switch (accion.tipo) {
        case "confirmar":
            frase = `Campo ${etiqueta} confirmado.`;
            break;
        case "corregir":
            frase = `Campo ${etiqueta} corregido por ${accion.actor}.`;
            break;
        case "ilegible":
            frase = `Campo ${etiqueta} marcado ilegible.`;
            break;
        case "reabrir":
            frase = `Campo ${etiqueta} reabierto.`;
            break;
    }

    const cierre =
        pendientes.dudosos === 0
            ? " No quedan dudosos pendientes: el reporte está completo."
            : ` Quedan ${pluralizar(
                pendientes.dudosos,
                "dudoso pendiente",
                "dudosos pendientes",
            )}.`;

    return `${frase}${cierre}`;
}

export function useRevisionReporte(numero: string): RevisionReporte {
    const repositorio = useRepositorio();

    const [estado, setEstado] = useState<EstadoCarga>("cargando");
    const [reporte, setReporte] = useState<ReporteVista | null>(null);
    const [mensajeError, setMensajeError] = useState<string | null>(null);
    const [cicloCarga, setCicloCarga] = useState(0);
    const [campoActivoId, setCampoActivoId] = useState<IdCampo | null>(null);
    const [soloDudosos, setSoloDudosos] = useState(true);
    const [campoEnCurso, setCampoEnCurso] = useState<IdCampo | null>(null);
    const [errorAccion, setErrorAccion] = useState<ErrorAccion | null>(null);
    const [anuncio, setAnuncio] = useState("");
    const [ultimaAccion, setUltimaAccion] = useState<IdCampo | null>(null);

    useEffect(() => {
        let vigente = true;

        // Se encadena con `.then` y no con `async/await` a propósito: la carga
        // vive en un efecto y el linter de React prohíbe el `setState` síncrono
        // dentro de él, que es exactamente lo que haría un `await` seguido de
        // `setEstado`.
        repositorio
            .obtenerReporte(numero)
            .then((encontrado) => {
                if (!vigente) return;
                if (!encontrado) {
                    setReporte(null);
                    setEstado("no_encontrado");
                    return;
                }
                const mapa = obtenerMapa(encontrado.diseno_talonario);
                const vista = componerReporte(encontrado, mapa);
                setReporte(vista);
                setCampoActivoId((actual) => {
                    if (actual && vista.campos.some((campo) => campo.id === actual)) {
                        return actual;
                    }
                    return primerCampoVisible(vista);
                });
                setErrorAccion(null);
                setUltimaAccion(null);
                setEstado("listo");
            })
            .catch(() => {
                if (!vigente) return;
                setReporte(null);
                setMensajeError(
                    "No se pudo cargar el reporte. Revisá la conexión e intentá otra vez.",
                );
                setEstado("error");
            });

        return () => {
            vigente = false;
        };
    }, [numero, repositorio, cicloCarga]);

    // Marca de la última acción hecha por esta pantalla: el servidor avisa de
    // todo cambio, también del propio, y recargar justo después de guardar solo
    // repetiría el mismo dato.
    const ultimaAccionPropia = useRef(0);

    useTiempoReal((evento) => {
        const esteReporte =
            !evento.numero ||
            evento.numero === numero ||
            evento.numero === reporte?.numero_reporte;
        if (!esteReporte || campoEnCurso) return;
        if (Date.now() - ultimaAccionPropia.current < 2500) return;

        repositorio
            .obtenerReporte(numero)
            .then((encontrado) => {
                if (!encontrado) return;
                const vista = componerReporte(
                    encontrado,
                    obtenerMapa(encontrado.diseno_talonario),
                );
                // Solo se reemplazan los datos: el campo activo, el filtro y el
                // "deshacer" siguen como estaban.
                setReporte(vista);
            })
            .catch(() => {
                // Un fallo de la actualización en vivo no interrumpe la revisión
            });
    });

    const recargar = useCallback(() => {
        setMensajeError(null);
        setEstado("cargando");
        setCicloCarga((valor) => valor + 1);
    }, []);

    const pendientes = useMemo<PendientesRevision>(
        () => (reporte ? calcularPendientes(reporte.campos) : PENDIENTES_VACIOS),
        [reporte],
    );

    const grupos = useMemo<GrupoCampos[]>(
        () => (reporte ? agruparCampos(reporte.campos, { soloDudosos }) : []),
        [reporte, soloDudosos],
    );

    const visibles = useMemo(
        () => grupos.flatMap((grupo) => grupo.campos),
        [grupos],
    );

    const campoActivo = useMemo(
        () =>
            reporte?.campos.find((campo) => campo.id === campoActivoId) ?? null,
        [reporte, campoActivoId],
    );

    const seleccionar = useCallback((campo: IdCampo) => {
        setCampoActivoId(campo);
    }, []);

    const cambiarVista = useCallback(
        (siguiente: boolean) => {
            setSoloDudosos(siguiente);
            // Al volver a "solo dudosos" el campo activo puede quedar fuera de la
            // lista: se reposiciona para que Enter, el resaltado del visor y el foco
            // apunten a algo que el técnico esté viendo.
            if (!siguiente || !reporte) return;
            const activo = reporte.campos.find(
                (campo) => campo.id === campoActivoId,
            );
            if (activo && esDudoso(activo)) return;
            const primero = camposPendientesOrdenados(reporte.campos)[0];
            if (primero) setCampoActivoId(primero.id);
        },
        [reporte, campoActivoId],
    );

    /**
     * Las flechas recorren los dudosos pendientes, que es el trabajo real; si no
     * queda ninguno (reporte completo o escaneo sin leer), recorren los campos
     * visibles para que la navegación nunca se quede sin movimiento.
     */
    const mover = useCallback(
        (direccion: 1 | -1) => {
            if (!reporte) return;
            const pendiente = siguienteCampoPendiente(
                reporte.campos,
                campoActivoId,
                direccion,
            );
            if (pendiente) {
                setCampoActivoId(pendiente);
                return;
            }
            if (visibles.length === 0) return;
            const indice = visibles.findIndex(
                (campo) => campo.id === campoActivoId,
            );
            const destino =
                indice === -1
                    ? direccion === 1
                        ? visibles[0]
                        : visibles[visibles.length - 1]
                    : visibles[(indice + direccion + visibles.length) % visibles.length];
            setCampoActivoId(destino.id);
        },
        [reporte, campoActivoId, visibles],
    );

    const ejecutar = useCallback(
        async (campo: IdCampo, accion: AccionRevision): Promise<boolean> => {
            if (!reporte || campoEnCurso) return false;
            const afectado = reporte.campos.find((item) => item.id === campo);
            if (!afectado) return false;

            // Se resuelve ANTES de la acción: una vez resuelto, el campo deja de estar
            // pendiente y `siguienteCampoPendiente` devolvería el primero de la cola
            // en lugar del que sigue.
            const proximo = siguienteCampoPendiente(reporte.campos, campo, 1);

            setCampoEnCurso(campo);
            setErrorAccion(null);
            ultimaAccionPropia.current = Date.now();
            try {
                const actualizado = await repositorio.revisarCampo(
                    reporte.numero_reporte,
                    campo,
                    accion,
                );
                const mapa = obtenerMapa(actualizado.diseno_talonario);
                const vista = componerReporte(actualizado, mapa);
                setReporte(vista);
                setAnuncio(
                    anuncioDeAccion(accion, afectado, calcularPendientes(vista.campos)),
                );
                // Confirmar, corregir o marcar ilegible hacen avanzar la cola; cuando
                // era el único pendiente, el campo se queda en pantalla para que el
                // técnico vea el resultado y el cierre.
                setCampoActivoId(
                    accion.tipo !== "reabrir" && proximo && proximo !== campo
                        ? proximo
                        : campo,
                );
                setUltimaAccion(accion.tipo === "reabrir" ? null : campo);
                return true;
            } catch (error) {
                setErrorAccion({ campo, mensaje: mensajeDeError(error) });
                return false;
            } finally {
                ultimaAccionPropia.current = Date.now();
                setCampoEnCurso(null);
            }
        },
        [reporte, campoEnCurso, repositorio],
    );

    const confirmar = useCallback(
        (campo: IdCampo) =>
            ejecutar(campo, { tipo: "confirmar", actor: USUARIO_ACTUAL.nombre }),
        [ejecutar],
    );

    const corregir = useCallback(
        (campo: IdCampo, valor: string) =>
            ejecutar(campo, {
                tipo: "corregir",
                actor: USUARIO_ACTUAL.nombre,
                valor,
            }),
        [ejecutar],
    );

    const marcarIlegible = useCallback(
        (campo: IdCampo) =>
            ejecutar(campo, { tipo: "ilegible", actor: USUARIO_ACTUAL.nombre }),
        [ejecutar],
    );

    const reabrir = useCallback(
        (campo: IdCampo) =>
            ejecutar(campo, { tipo: "reabrir", actor: USUARIO_ACTUAL.nombre }),
        [ejecutar],
    );

    const confirmarCampoActivo = useCallback(async () => {
        if (!campoActivo || !requiereRevision(campoActivo)) return;
        // Confirmar sin valor no tiene objeto: el repositorio lo rechazaría y el
        // técnico vería un error para una acción que ni siquiera pudo completarse.
        if ((valorVigente(campoActivo) ?? "").trim() === "") return;
        await ejecutar(campoActivo.id, {
            tipo: "confirmar",
            actor: USUARIO_ACTUAL.nombre,
        });
    }, [campoActivo, ejecutar]);

    const deshacer = useCallback(async () => {
        if (!ultimaAccion) return;
        await ejecutar(ultimaAccion, {
            tipo: "reabrir",
            actor: USUARIO_ACTUAL.nombre,
        });
    }, [ultimaAccion, ejecutar]);

    const descartarError = useCallback(() => {
        setErrorAccion(null);
    }, []);

    return {
        estado,
        mensajeError,
        recargar,
        reporte,
        pendientes,
        grupos,
        visibles,
        campoActivo,
        soloDudosos,
        cambiarVista,
        seleccionar,
        mover,
        confirmar,
        corregir,
        marcarIlegible,
        reabrir,
        confirmarCampoActivo,
        deshacer,
        campoEnCurso,
        errorAccion,
        descartarError,
        anuncio,
        ultimaAccion,
    };
}