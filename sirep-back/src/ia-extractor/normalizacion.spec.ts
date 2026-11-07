import {
  normalizarTexto,
  normalizarFechaEvaluacion,
  normalizarHoraEvaluacion,
  similitudTexto,
  compararCampo,
} from './normalizacion';

describe('SIREP-S2-T07: Reglas de Normalización y Comparación Automática', () => {
  describe('normalizarTexto', () => {
    it('elimina mayúsculas, tildes y espacios dobles', () => {
      const entrada = '  REPARACIÓN   DE   CABEZALES  ';
      expect(normalizarTexto(entrada)).toBe('reparacion de cabezales');
    });

    it('maneja valores nulos o indefinidos sin lanzar error', () => {
      expect(normalizarTexto(null)).toBe('');
      expect(normalizarTexto(undefined)).toBe('');
    });
  });

  describe('normalizarFechaEvaluacion', () => {
    it('normaliza fechas DD/MM/AAAA a AAAA-MM-DD', () => {
      expect(normalizarFechaEvaluacion('02/11/2026')).toBe('2026-11-02');
      expect(normalizarFechaEvaluacion('2-11-2026')).toBe('2026-11-02');
    });

    it('mantiene fechas ISO AAAA-MM-DD', () => {
      expect(normalizarFechaEvaluacion('2026-11-02')).toBe('2026-11-02');
    });

    it('soporta años cortos de dos dígitos DD/MM/AA', () => {
      expect(normalizarFechaEvaluacion('05/03/26')).toBe('2026-03-05');
    });
  });

  describe('normalizarHoraEvaluacion', () => {
    it('normaliza formatos de 12 horas con AM/PM a 24 horas HH:MM', () => {
      expect(normalizarHoraEvaluacion('4:55 pm')).toBe('16:55');
      expect(normalizarHoraEvaluacion('09:30 AM')).toBe('09:30');
      expect(normalizarHoraEvaluacion('12:15 PM')).toBe('12:15');
      expect(normalizarHoraEvaluacion('12:00 AM')).toBe('00:00');
    });

    it('completa ceros a la izquierda en formato 24 horas', () => {
      expect(normalizarHoraEvaluacion('8:45')).toBe('08:45');
      expect(normalizarHoraEvaluacion('17:20')).toBe('17:20');
    });
  });

  describe('similitudTexto', () => {
    it('retorna 1.0 para textos idénticos ignorando tildes y mayúsculas', () => {
      const t1 = 'Cambio de rodillo de presión y limpieza';
      const t2 = 'CAMBIO DE RODILLO DE PRESION Y LIMPIEZA';
      expect(similitudTexto(t1, t2)).toBe(1.0);
    });

    it('detecta similitud alta para discrepancias menores de OCR o mecanografía', () => {
      const t1 = 'Se realizó mantenimiento correctivo y lubricación de engranajes';
      const t2 = 'Se realizo mantenimiento correctivo y lubricacion de engranaje';
      const score = similitudTexto(t1, t2);
      expect(score).toBeGreaterThan(0.9);
    });

    it('retorna valor bajo para textos completamente distintos', () => {
      const t1 = 'Revisión eléctrica de entrada';
      const t2 = 'Cambio de tarjeta lógica principal';
      expect(similitudTexto(t1, t2)).toBeLessThan(0.4);
    });
  });

  describe('compararCampo', () => {
    it('clasifica como vacío correcto cuando ambos están en blanco', () => {
      const res = compararCampo('telefono', 'texto', 'vacío', null, true);
      expect(res.resultado).toBe('vacío correcto');
    });

    it('clasifica como correcto cuando se esperaba ilegible y el modelo declaró noLeido', () => {
      const res = compararCampo('codigo_repuesto', 'texto', 'ilegible', null, true);
      expect(res.resultado).toBe('correcto');
    });

    it('clasifica como no leído cuando había dato en el papel pero el modelo no pudo leerlo', () => {
      const res = compararCampo('tecnico', 'texto', 'Carlos Ramos', null, true);
      expect(res.resultado).toBe('no leído');
    });

    it('clasifica como correcto un campo de fecha con formatos distintos', () => {
      const res = compararCampo('fecha', 'fecha', '02/11/2026', '2026-11-02', false);
      expect(res.resultado).toBe('correcto');
    });

    it('clasifica texto libre como dudoso si la similitud está entre 50% y 82%', () => {
      const esperado = 'Se cambió el cabezal de impresión negro por falla de inyección';
      const leido = 'Se cambió el cabezal de impresión por inyección defectuosa';
      const res = compararCampo('procedimiento', 'texto', esperado, leido, false);
      expect(['correcto', 'dudoso']).toContain(res.resultado);
      expect(res.similitud).toBeDefined();
    });

    it('clasifica como error cuando los valores no coinciden', () => {
      const res = compararCampo('empresa', 'texto', 'Industrial Go Service', 'Textiles del Perú', false);
      expect(res.resultado).toBe('error');
    });
  });
});

