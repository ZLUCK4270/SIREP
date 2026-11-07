/**
 * Responsabilidad: error de dominio del repositorio, identificado por el código
 * que `RepositorioReportes` ya declara.
 * Existe para que la interfaz distinga "no existe" de "no se puede hacer"
 * sin parsear mensajes, que es frágil y no se traduce.
 */

import type { CodigoErrorRepositorio } from "@/features/revision/types/dominio";

export class ErrorRepositorio extends Error {
    readonly codigo: CodigoErrorRepositorio;

    constructor(mensaje: string, codigo: CodigoErrorRepositorio) {
        super(mensaje);
        this.name = "ErrorRepositorio";
        this.codigo = codigo;
    }
}