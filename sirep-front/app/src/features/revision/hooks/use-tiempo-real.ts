/**
 * Responsabilidad: conexión en vivo (WebSocket) con el backend para que la
 * bandeja y la vista de corrección se actualicen solas cuando llega un reporte
 * nuevo por Telegram o alguien revisa un campo.
 * Existe como una única conexión compartida: la cabecera, la bandeja y la vista
 * de corrección la usan a la vez sin abrir un socket por componente. El socket
 * solo avisa "algo cambió"; los datos se vuelven a pedir por la API normal.
 */

"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { io, type Socket } from "socket.io-client";

import { API_BASE_URL } from "@/lib/api";

export interface EventoCambioReporte {
    tipo: "creado" | "actualizado";
    /** N° visible del reporte afectado; vacío si aún no tiene. */
    numero: string;
}

const EVENTO_CAMBIO_REPORTE = "reportes:cambio";

let socket: Socket | null = null;
let usuarios = 0;

function adquirir(): Socket {
    if (!socket) {
        socket = io(API_BASE_URL, {
            transports: ["websocket"],
            reconnectionDelayMax: 5000,
        });
    }
    usuarios += 1;
    return socket;
}

function liberar() {
    usuarios = Math.max(0, usuarios - 1);
    if (usuarios === 0 && socket) {
        socket.disconnect();
        socket = null;
    }
}

function suscribirConexion(avisar: () => void) {
    const s = adquirir();
    s.on("connect", avisar);
    s.on("disconnect", avisar);
    s.on("connect_error", avisar);
    return () => {
        s.off("connect", avisar);
        s.off("disconnect", avisar);
        s.off("connect_error", avisar);
        liberar();
    };
}

const instantaneaConexion = () => socket?.connected ?? false;
const instantaneaServidor = () => false;

/** `true` mientras hay conexión en vivo con el servidor. */
export function useConexionEnVivo(): boolean {
    return useSyncExternalStore(
        suscribirConexion,
        instantaneaConexion,
        instantaneaServidor,
    );
}

/**
 * Llama a `onCambio` cada vez que el servidor avisa de un cambio en un
 * reporte. Devuelve si la conexión en vivo está activa.
 */
export function useTiempoReal(
    onCambio: (evento: EventoCambioReporte) => void,
): boolean {
    const conectado = useConexionEnVivo();

    // Siempre se invoca la última versión del callback sin reabrir la suscripción.
    const manejador = useRef(onCambio);
    useEffect(() => {
        manejador.current = onCambio;
    }, [onCambio]);

    useEffect(() => {
        const s = adquirir();
        const alRecibir = (evento: EventoCambioReporte) =>
            manejador.current(evento);
        s.on(EVENTO_CAMBIO_REPORTE, alRecibir);
        return () => {
            s.off(EVENTO_CAMBIO_REPORTE, alRecibir);
            liberar();
        };
    }, []);

    return conectado;
}