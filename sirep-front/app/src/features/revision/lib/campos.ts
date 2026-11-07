/**
 * Responsabilidad: unir un reporte del repositorio con el inventario de campos y
 * con el mapa de regiones.
 * Existe para que los componentes reciban `CampoVista` ya resuelto y no tengan
 * que buscar definiciones ni coordenadas por su cuenta.
 */

import { CAMPOS_POR_ID } from "@/config/campos-formulario";
import type {
    CampoReporte,
    CampoVista,
    Reporte,
    ReporteVista,
} from "@/features/revision/types/dominio";
import type { MapaRegiones } from "@/features/revision/types/regiones";

export function componerCampo(
    campo: CampoReporte,
    mapa: MapaRegiones,
): CampoVista {
    return {
        ...campo,
        definicion: CAMPOS_POR_ID[campo.id],
        // La región medida sobre el escaneo real manda; el mapa fijo es solo el respaldo.
        region: campo.region ?? mapa.regiones[campo.id],
    };
}

export function componerReporte(
    reporte: Reporte,
    mapa: MapaRegiones,
): ReporteVista {
    return {
        ...reporte,
        mapa,
        campos: reporte.campos.map((campo) => componerCampo(campo, mapa)),
    };
}

/** El valor que hoy representa al campo: la corrección humana manda. */
export function valorVigente(campo: CampoReporte): string | null {
    if (campo.valor_corregido !== null && campo.valor_corregido !== "") {
        return campo.valor_corregido;
    }
    return campo.valor_modelo;
}

export function valorDeRespaldo(campo: CampoReporte): string {
    return valorVigente(campo) ?? "Sin lectura";
}