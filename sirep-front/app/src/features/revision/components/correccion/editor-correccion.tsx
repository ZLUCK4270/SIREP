/**
 * Responsabilidad: input inline de corrección con las teclas que el técnico
 * espera: Enter guarda, Escape cancela.
 * Existe separado de la tarjeta porque escribir es el momento más delicado del
 * flujo: el valor precargado, el foco y las teclas tienen que portarse igual en
 * cualquier campo, y la tarjeta no debería repetir esa lógica.
 */

"use client";

import { useId, useState, type KeyboardEvent } from "react";

import { Boton } from "@/components/ui/boton";
import { Entrada } from "@/components/ui/entrada";

interface EditorCorreccionProps {
    valorInicial: string;
    etiqueta: string;
    enCurso: boolean;
    /**
     * Resuelve en `true` cuando el repositorio guardó. Si falla, el editor queda
     * abierto con lo escrito: cerrarlo haría que la persona perdiera su corrección
     * y no supiera qué había fallado.
     */
    onGuardar: (valor: string) => Promise<boolean>;
    onCancelar: () => void;
}

export function EditorCorreccion({
    valorInicial,
    etiqueta,
    enCurso,
    onGuardar,
    onCancelar,
}: EditorCorreccionProps) {
    const idCampo = useId();
    const [valor, setValor] = useState(valorInicial);
    const [guardando, setGuardando] = useState(false);

    const guardar = async (): Promise<void> => {
        if (guardando) return;
        setGuardando(true);
        try {
            await onGuardar(valor);
        } finally {
            setGuardando(false);
        }
    };

    const alPresionar = (evento: KeyboardEvent<HTMLInputElement>): void => {
        if (evento.key === "Enter") {
            evento.preventDefault();
            void guardar();
            return;
        }
        if (evento.key === "Escape") {
            evento.preventDefault();
            onCancelar();
        }
    };

    return (
        <div className="rounded-xs border border-petrol-200 bg-petrol-50 p-2">
            <label
                htmlFor={idCampo}
                className="block text-micro uppercase tracking-label text-petrol-700"
            >
                Corrección manual
            </label>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Entrada
                    id={idCampo}
                    autoFocus
                    value={valor}
                    onChange={(evento) => setValor(evento.target.value)}
                    onKeyDown={alPresionar}
                    disabled={guardando || enCurso}
                    aria-label={`Valor corregido del campo ${etiqueta}`}
                    className="min-w-40 flex-1"
                />
                <div className="flex gap-2">
                    <Boton
                        variante="primario"
                        tamano="sm"
                        onClick={() => void guardar()}
                        disabled={guardando || enCurso}
                    >
                        Guardar
                    </Boton>
                    <Boton
                        variante="fantasma"
                        tamano="sm"
                        onClick={onCancelar}
                        disabled={guardando}
                    >
                        Cancelar
                    </Boton>
                </div>
            </div>
            <p className="mt-1.5 text-micro text-muted">
                Enter guarda · Escape cancela
            </p>
        </div>
    );
}