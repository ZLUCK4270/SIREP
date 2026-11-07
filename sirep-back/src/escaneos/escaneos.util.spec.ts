import {
    calcularHuellaSHA256,
    esPDF,
    extraerNumeroReporte,
    fusionarLecturas,
    normalizarFecha,
} from './escaneos.util';
import { ResultadoLectura } from '../ia-extractor/types';

describe('escaneos.util', () => {
    describe('extraerNumeroReporte', () => {
        it.each([
            ['000845', '000845'],
            ['000845.pdf', '000845'],
            ['000845_escaneo.pdf', '000845'],
            ['0005-A.pdf', '0005-A'],
            ['Reporte N° 000845', '000845'],
            ['N° 000214', '000214'],
            ['Nº 000214', '000214'],
            ['nro: 001200', '001200'],
        ])('lee el N° de "%s" -> %s', (texto, esperado) => {
            expect(extraerNumeroReporte(texto)).toBe(esperado);
        });

        // Antes estos textos se tomaban como N° de talonario y el reporte se rechazaba como duplicado
        it.each([['scan.pdf'], ['Reporte.pdf'], ['IMG_20261102.jpg'], ['20261102_scan.pdf'], ['escaneo_1762100000000.jpg'], ['hola'], ['']])(
            'no confunde "%s" con un N° de reporte',
            (texto) => {
                expect(extraerNumeroReporte(texto)).toBeNull();
            },
        );

        it('devuelve null si no hay texto', () => {
            expect(extraerNumeroReporte(undefined)).toBeNull();
            expect(extraerNumeroReporte(null)).toBeNull();
        });
    });

    describe('normalizarFecha', () => {
        it.each([
            ['03/02/26', '2026-02-03'],
            ['15-10-26', '2026-10-15'],
            ['3.2.2026', '2026-02-03'],
            ['2026-02-03', '2026-02-03'],
        ])('convierte "%s" a %s (día primero, como en el papel)', (entrada, esperado) => {
            expect(normalizarFecha(entrada)).toBe(esperado);
        });

        it.each([['31/02/26'], ['13/13/26'], ['ilegible'], [''], [null], [undefined], [true]])(
            'devuelve null para %p en lugar de romper el INSERT',
            (entrada) => {
                expect(normalizarFecha(entrada as any)).toBeNull();
            },
        );
    });

    it('esPDF reconoce la firma %PDF- sin fiarse del mimetype', () => {
        expect(esPDF(Buffer.from('%PDF-1.7\n...'))).toBe(true);
        expect(esPDF(Buffer.from('no soy pdf'))).toBe(false);
        expect(esPDF(Buffer.alloc(0))).toBe(false);
    });

    it('calcularHuellaSHA256 es determinista', () => {
        expect(calcularHuellaSHA256(Buffer.from('a'))).toBe(calcularHuellaSHA256(Buffer.from('a')));
        expect(calcularHuellaSHA256(Buffer.from('a'))).not.toBe(calcularHuellaSHA256(Buffer.from('b')));
    });

    describe('fusionarLecturas', () => {
        const uso = (costo: number) => ({
            proveedor: 'mock',
            modelo: 'm',
            tokensEntrada: 100,
            tokensSalida: 10,
            costoUsd: costo,
            latenciaMs: 50,
        });

        const anverso: ResultadoLectura = {
            numeroReporte: '000214',
            campos: [
                { clave: 'empresa', valor: 'Area 51', confianza: 'alta', noLeido: false, dudoso: false },
                { clave: 'codigo_repuesto', valor: null, confianza: 'baja', noLeido: true, dudoso: false },
                { clave: 'conclusion', valor: 'Cambio de sensor', confianza: 'baja', noLeido: false, dudoso: true },
            ],
            uso: uso(0.001),
        };
        const reverso: ResultadoLectura = {
            numeroReporte: null,
            campos: [
                { clave: 'empresa', valor: null, confianza: 'baja', noLeido: true, dudoso: false },
                { clave: 'codigo_repuesto', valor: 'SN-4455', confianza: 'media', noLeido: false, dudoso: false },
                { clave: 'conclusion', valor: 'Cambio de sensor', confianza: 'alta', noLeido: false, dudoso: false },
            ],
            uso: uso(0.002),
        };

        it('un campo vacío en una página no tapa el valor leído en la otra', () => {
            const r = fusionarLecturas([anverso, reverso]);
            const por = (c: string) => r.campos.find((x) => x.clave === c)!;
            expect(por('empresa').valor).toBe('Area 51');
            expect(por('codigo_repuesto').valor).toBe('SN-4455');
        });

        it('entre dos lecturas del mismo campo gana la de mayor confianza', () => {
            const r = fusionarLecturas([anverso, reverso]);
            expect(r.campos.find((x) => x.clave === 'conclusion')!.confianza).toBe('alta');
        });

        it('suma tokens y costo, y conserva el N° leído', () => {
            const r = fusionarLecturas([anverso, reverso]);
            expect(r.numeroReporte).toBe('000214');
            expect(r.uso.tokensEntrada).toBe(200);
            expect(r.uso.costoUsd).toBeCloseTo(0.003, 6);
            expect(r.uso.latenciaMs).toBe(100);
        });

        it('con una sola página devuelve la lectura tal cual', () => {
            expect(fusionarLecturas([anverso])).toBe(anverso);
        });
    });
});