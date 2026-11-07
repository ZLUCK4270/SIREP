/**
 * Responsabilidad: mostrar si la bandeja recibe cambios en vivo.
 * Existe para que la persona sepa si la pantalla se actualiza sola o si debe
 * recargar a mano cuando se cae la conexión.
 */

"use client";

import { useConexionEnVivo } from "@/features/revision/hooks/use-tiempo-real";

export function IndicadorEnVivo() {
    const conectado = useConexionEnVivo();

    return (
        <span
            role="status"
            aria-live="polite"
            title={
                conectado
                    ? "Conectado: la bandeja se actualiza sola"
                    : "Sin conexión en vivo: recarga para ver cambios"
            }
            className={[
                "hidden items-center gap-2 rounded-full border px-2.5 py-1 text-micro font-medium transition-colors duration-300 sm:inline-flex",
                conectado
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-line bg-sunken text-faint",
            ].join(" ")}
        >
            <span className="relative flex size-2">
                {conectado ? (
                    <span
                        aria-hidden="true"
                        className="absolute inline-flex size-full animate-ping rounded-full bg-green-600 opacity-60"
                    />
                ) : null}
                <span
                    aria-hidden="true"
                    className={[
                        "relative inline-flex size-2 rounded-full transition-colors duration-300",
                        conectado ? "bg-green-600" : "bg-faint",
                    ].join(" ")}
                />
            </span>
            {conectado ? "En vivo" : "Sin conexión"}
        </span>
    );
}