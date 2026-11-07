/**
 * Responsabilidad: contar dudosos, resolver la navegación entre campos
 * pendientes y agruparlos para la vista de corrección.
 * Existe separado de los componentes porque es la lógica que define el ahorro
 * real del producto: si esta cuenta se equivoca, el técnico revisa de más o de
 * menos.
 */

import { ORDEN_CAMPOS, SECCIONES_FORMULARIO } from "@/config/campos-formulario";
import type { IdCampo, SeccionFormulario } from "@/features/revision/types/campos";
import type {
    CampoReporte,
    CampoVista,
    PendientesRevision,
} from "@/features/revision/types/dominio";

/** Un campo es dudoso por cómo lo leyó el modelo, no por su estado de revisión. */
export function esDudoso(
    campo: Pick<CampoReporte, "confianza" | "no_leido">,
): boolean {
    return (
        campo.no_leido ||
        campo.confianza === "media" ||
        campo.confianza === "baja"
    );
}

export function requiereRevision(
    campo: Pick<CampoReporte, "estado_revision">,
): boolean {
    return campo.estado_revision === "pendiente";
}

export function fueResueltoPorPersona(
    campo: Pick<CampoReporte, "estado_revision">,
): boolean {
    return (
        campo.estado_revision === "confirmado" ||
        campo.estado_revision === "corregido" ||
        campo.estado_revision === "ilegible"
    );
}

export function contarPendientes(campos: readonly CampoReporte[]): number {
    return campos.filter(requiereRevision).length;
}

export function calcularPendientes(
    campos: readonly CampoReporte[],
): PendientesRevision {
    const dudosos = campos.filter(esDudoso);
    return {
        total: dudosos.length,
        resueltos: dudosos.filter(fueResueltoPorPersona).length,
        dudosos: dudosos.filter(requiereRevision).length,
    };
}

export interface ResumenDisposiciones {
    confirmados: number;
    corregidos: number;
    ilegibles: number;
}

export function resumirDisposiciones(
    campos: readonly CampoReporte[],
): ResumenDisposiciones {
    return {
        confirmados: campos.filter((campo) => campo.estado_revision === "confirmado")
            .length,
        corregidos: campos.filter((campo) => campo.estado_revision === "corregido")
            .length,
        ilegibles: campos.filter((campo) => campo.estado_revision === "ilegible")
            .length,
    };
}

/**
 * Devuelve el siguiente (o anterior) campo pendiente en el orden del inventario.
 * Itera circularmente porque el técnico puede volver al principio sin usar el
 * mouse; si el campo actual ya no está pendiente, arranca por el primero.
 */
export function siguienteCampoPendiente(
    campos: readonly CampoReporte[],
    actual: IdCampo | null,
    direccion: 1 | -1 = 1,
): IdCampo | null {
    const pendientes = campos
        .filter(requiereRevision)
        .sort((a, b) => ORDEN_CAMPOS[a.id] - ORDEN_CAMPOS[b.id])
        .map((campo) => campo.id);

    if (pendientes.length === 0) return null;

    const indiceActual = actual ? pendientes.indexOf(actual) : -1;
    if (indiceActual === -1) {
        return direccion === 1 ? pendientes[0] : pendientes[pendientes.length - 1];
    }

    const siguiente =
        (indiceActual + direccion + pendientes.length) % pendientes.length;
    return pendientes[siguiente];
}

export interface GrupoCampos {
    seccion: SeccionFormulario;
    campos: CampoVista[];
    pendientes: number;
}

/**
 * Agrupa por sección con los pendientes primero, tanto entre secciones como
 * dentro de cada una. En modo "solo dudosos" se omiten los campos automáticos,
 * que son la mayoría del formulario.
 */
export function agruparCampos(
    campos: readonly CampoVista[],
    opciones: { soloDudosos?: boolean } = {},
): GrupoCampos[] {
    const visibles = opciones.soloDudosos
        ? campos.filter((campo) => esDudoso(campo))
        : campos;

    return SECCIONES_FORMULARIO.map((seccion) => {
        const delGrupo = visibles
            .filter((campo) => campo.definicion.seccion === seccion.id)
            .sort((a, b) => {
                const pendienteA = requiereRevision(a) ? 0 : 1;
                const pendienteB = requiereRevision(b) ? 0 : 1;
                if (pendienteA !== pendienteB) return pendienteA - pendienteB;
                return ORDEN_CAMPOS[a.id] - ORDEN_CAMPOS[b.id];
            });

        return {
            seccion,
            campos: delGrupo,
            pendientes: delGrupo.filter(requiereRevision).length,
        };
    })
        .filter((grupo) => grupo.campos.length > 0)
        .sort((a, b) => {
            if (a.pendientes !== b.pendientes) return b.pendientes - a.pendientes;
            return (
                SECCIONES_FORMULARIO.findIndex((s) => s.id === a.seccion.id) -
                SECCIONES_FORMULARIO.findIndex((s) => s.id === b.seccion.id)
            );
        });
}

export function camposPendientesOrdenados(
    campos: readonly CampoVista[],
): CampoVista[] {
    return campos
        .filter(requiereRevision)
        .sort((a, b) => ORDEN_CAMPOS[a.id] - ORDEN_CAMPOS[b.id]);
}