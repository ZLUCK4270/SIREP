/**
 * Responsabilidad: calcular, a partir de una región normalizada, la posición y
 * el tamaño con los que se recorta el escaneo dentro de un contenedor.
 * Existe porque el recorte se resuelve con CSS puro (sin canvas ni librerías) y
 * esa matemática tiene que estar aislada y probada: un error de un decimal deja
 * el campo fuera de foco y el técnico corrige a ciegas.
 */

import type { MapaRegiones, Region } from "@/features/revision/types/regiones";

export interface OpcionesRecorte {
    /**
     * Margen adicional alrededor del campo, en coordenadas normalizadas. Da
     * contexto de renglón y evita recortar la tinta del borde.
     */
    padding?: number;
}

export interface RecorteCalculado {
    /** Porcentaje de desplazamiento de la hoja dentro del contenedor (≤ 0). */
    desplazamiento_x: number;
    desplazamiento_y: number;
    /** Tamaño de la hoja como porcentaje del contenedor. */
    ancho_hoja: number;
    alto_hoja: number;
    /** Relación de aspecto que debe tener la ventana de recorte. */
    aspecto_ventana: number;
}

const PADDING_POR_DEFECTO = 0.008;

function validarRegion(region: Region): void {
    const valores = [region.x, region.y, region.ancho, region.alto];
    if (valores.some((valor) => !Number.isFinite(valor))) {
        throw new RangeError("La región contiene coordenadas no numéricas.");
    }
    if (region.ancho <= 0 || region.alto <= 0) {
        throw new RangeError("La región debe tener ancho y alto positivos.");
    }
    if (
        region.x < 0 ||
        region.y < 0 ||
        region.x + region.ancho > 1 ||
        region.y + region.alto > 1
    ) {
        throw new RangeError("La región debe estar dentro de los límites de la página (0–1).");
    }
}

export function calcularRecorte(
    region: Region,
    mapa: Pick<MapaRegiones, "ancho_pagina" | "alto_pagina">,
    opciones: OpcionesRecorte = {},
): RecorteCalculado {
    validarRegion(region);

    const padding = opciones.padding ?? PADDING_POR_DEFECTO;
    if (!Number.isFinite(padding) || padding < 0 || padding >= 0.5) {
        throw new RangeError("El margen del recorte debe estar entre 0 y 0.5.");
    }

    // El margen se recorta contra los bordes de la hoja para que el recorte nunca
    // muestre espacio vacío fuera del escaneo.
    const izquierda = Math.max(0, region.x - padding);
    const arriba = Math.max(0, region.y - padding);
    const derecha = Math.min(1, region.x + region.ancho + padding);
    const abajo = Math.min(1, region.y + region.alto + padding);

    const anchoVentana = derecha - izquierda;
    const altoVentana = abajo - arriba;

    return {
        desplazamiento_x: (-izquierda / anchoVentana) * 100,
        desplazamiento_y: (-arriba / altoVentana) * 100,
        ancho_hoja: (1 / anchoVentana) * 100,
        alto_hoja: (1 / altoVentana) * 100,
        aspecto_ventana:
            (anchoVentana * mapa.ancho_pagina) / (altoVentana * mapa.alto_pagina),
    };
}