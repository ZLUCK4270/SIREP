/**
 * Responsabilidad: ventana de recorte sobre el escaneo, resolviendo la
 * geometría con `calcularRecorte` y CSS puro.
 * Existe para que la miniatura de un campo y el recorte grande del visor
 * muestren exactamente la misma región, sin canvas ni librerías: la ventana
 * tiene la relación de aspecto calculada y la hoja se desplaza dentro.
 */

import type { CSSProperties, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

import { calcularRecorte } from "@/features/revision/lib/recorte";
import type { MapaRegiones, Region } from "@/features/revision/types/regiones";

interface RecorteEscaneoProps {
    mapa: MapaRegiones;
    region: Region;
    /** La hoja ya dibujada; se estira para llenar la ventana. */
    children: ReactNode;
    /** Margen de contexto alrededor del campo, en coordenadas 0–1. */
    padding?: number;
    className?: string;
}

export function RecorteEscaneo({
    mapa,
    region,
    children,
    padding,
    className,
}: RecorteEscaneoProps) {
    const recorte = calcularRecorte(region, mapa, { padding });

    const ventana: CSSProperties = {
        aspectRatio: String(recorte.aspecto_ventana),
    };

    const hoja: CSSProperties = {
        width: `${recorte.ancho_hoja}%`,
        height: `${recorte.alto_hoja}%`,
        left: `${recorte.desplazamiento_x}%`,
        top: `${recorte.desplazamiento_y}%`,
    };

    return (
        <div
            className={twMerge(
                "relative overflow-hidden rounded-xs bg-raised",
                className,
            )}
            style={ventana}
        >
            <div className="absolute" style={hoja}>
                {children}
            </div>
        </div>
    );
}