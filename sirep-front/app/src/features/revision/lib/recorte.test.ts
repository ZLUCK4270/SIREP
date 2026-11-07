/**
 * Responsabilidad: probar el cálculo de recorte.
 * Existe porque un error de porcentajes desplaza la región del campo y el
 * técnico termina corrigiendo contra la parte equivocada del escaneo.
 */

import { describe, expect, it } from "vitest";
import { calcularRecorte } from "./recorte";

const MAPA = { ancho_pagina: 1000, alto_pagina: 1414 };

describe("calcularRecorte", () => {
    it("devuelve la hoja completa cuando la región es toda la página", () => {
        const recorte = calcularRecorte(
            { x: 0, y: 0, ancho: 1, alto: 1, pagina: 1 },
            MAPA,
            { padding: 0 },
        );

        expect(recorte.desplazamiento_x).toBeCloseTo(0);
        expect(recorte.desplazamiento_y).toBeCloseTo(0);
        expect(recorte.ancho_hoja).toBeCloseTo(100);
        expect(recorte.alto_hoja).toBeCloseTo(100);
        expect(recorte.aspecto_ventana).toBeCloseTo(1000 / 1414, 6);
    });

    it("centra una región sin margen", () => {
        const recorte = calcularRecorte(
            { x: 0.4, y: 0.4, ancho: 0.2, alto: 0.2, pagina: 1 },
            MAPA,
            { padding: 0 },
        );

        expect(recorte.desplazamiento_x).toBeCloseTo(-200);
        expect(recorte.desplazamiento_y).toBeCloseTo(-200);
        expect(recorte.ancho_hoja).toBeCloseTo(500);
        expect(recorte.alto_hoja).toBeCloseTo(500);
        expect(recorte.aspecto_ventana).toBeCloseTo(1000 / 1414, 6);
    });

    it("recorta el margen contra los bordes de la hoja en lugar de salirse", () => {
        const recorte = calcularRecorte(
            { x: 0.01, y: 0.01, ancho: 0.05, alto: 0.05, pagina: 1 },
            MAPA,
            { padding: 0.02 },
        );

        expect(recorte.desplazamiento_x).toBeCloseTo(0);
        expect(recorte.desplazamiento_y).toBeCloseTo(0);
        expect(recorte.ancho_hoja).toBeCloseTo(100 / 0.08);
        expect(recorte.alto_hoja).toBeCloseTo(100 / 0.08);
    });

    it("respetar la relación de aspecto real de la página en el recorte", () => {
        const recorte = calcularRecorte(
            { x: 0.1, y: 0.2, ancho: 0.4, alto: 0.1, pagina: 1 },
            MAPA,
            { padding: 0.01 },
        );

        // (0.42 * 1000) / (0.12 * 1414)
        expect(recorte.aspecto_ventana).toBeCloseTo(2.475, 3);
    });

    it("rechaza regiones fuera de la página", () => {
        expect(() =>
            calcularRecorte(
                { x: 0.9, y: 0.1, ancho: 0.2, alto: 0.1, pagina: 1 },
                MAPA,
            ),
        ).toThrow(RangeError);

        expect(() =>
            calcularRecorte(
                { x: 0.1, y: 0.1, ancho: 0, alto: 0.1, pagina: 1 },
                MAPA,
            ),
        ).toThrow(RangeError);
    });

    it("rechaza un margen inválido", () => {
        expect(() =>
            calcularRecorte(
                { x: 0.1, y: 0.1, ancho: 0.2, alto: 0.1, pagina: 1 },
                MAPA,
                { padding: 0.8 },
            ),
        ).toThrow(RangeError);
    });
});