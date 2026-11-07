import { IDS_CAMPOS_FORMULARIO, IDS_CAMPOS_OPCIONALES } from '../escaneos/campos-formulario';
import {
  CampoGuardado,
  aReporteContrato,
  construirCampos,
  derivarEstado,
  numeroVisible,
  valorVigente,
} from './reportes.mapper';

const campoOk = (clave: string, valor: unknown = 'x'): CampoGuardado => ({
  clave,
  valor,
  confianza: 'alta',
  noLeido: false,
  dudoso: false,
});

/** Un reporte donde el modelo leyó todo con confianza alta. */
export function guardadosLimpios(): Record<string, CampoGuardado> {
  return Object.fromEntries(IDS_CAMPOS_FORMULARIO.map((id) => [id, campoOk(id, `valor ${id}`)]));
}

describe('reportes.mapper', () => {
  it('devuelve un campo por cada campo del formulario, en orden', () => {
    const campos = construirCampos(guardadosLimpios());
    expect(campos.map((c) => c.id)).toEqual([...IDS_CAMPOS_FORMULARIO]);
  });

  it('un campo leído con confianza alta queda "auto" y uno dudoso, ilegible o de baja confianza queda "pendiente"', () => {
    const g = guardadosLimpios();
    g.codigo_repuesto = { clave: 'codigo_repuesto', valor: null, confianza: 'baja', noLeido: true, dudoso: true };
    g.procedimiento = { clave: 'procedimiento', valor: 'texto', confianza: 'baja', noLeido: false, dudoso: false };
    g.fecha = { clave: 'fecha', valor: '03/02/26', confianza: 'media', noLeido: false, dudoso: true };

    const por = Object.fromEntries(construirCampos(g).map((c) => [c.id, c]));
    expect(por.empresa.estado_revision).toBe('auto');
    expect(por.codigo_repuesto.estado_revision).toBe('pendiente');
    expect(por.codigo_repuesto.no_leido).toBe(true);
    expect(por.procedimiento.estado_revision).toBe('pendiente');
    expect(por.fecha.estado_revision).toBe('pendiente');
  });

  it('un campo obligatorio que falta en lo guardado queda pendiente sin lectura, no se inventa un valor', () => {
    const obligatorios = construirCampos({}).filter((c) => !IDS_CAMPOS_OPCIONALES.has(c.id));
    expect(obligatorios.length).toBeGreaterThan(0);
    expect(obligatorios.every((c) => c.estado_revision === 'pendiente' && c.valor_modelo === null && c.no_leido)).toBe(true);
  });

  it('un campo opcional que falta (reporte anterior a la ampliación del formulario) queda en blanco, no pendiente', () => {
    const opcionales = construirCampos({}).filter((c) => IDS_CAMPOS_OPCIONALES.has(c.id));
    expect(opcionales.length).toBeGreaterThan(10);
    expect(opcionales.every((c) => c.estado_revision === 'auto' && c.valor_modelo === null && !c.no_leido)).toBe(true);
  });

  it('convierte casillas y números a texto', () => {
    const g = guardadosLimpios();
    g.estado_del_equipo = campoOk('estado_del_equipo', true);
    g.hora_llegada = campoOk('hora_llegada', 455);
    const por = Object.fromEntries(construirCampos(g).map((c) => [c.id, c]));
    expect(por.estado_del_equipo.valor_modelo).toBe('Sí');
    expect(por.hora_llegada.valor_modelo).toBe('455');
  });

  describe('derivarEstado (misma regla que la bandeja)', () => {
    it('sin pendientes: completo', () => {
      expect(derivarEstado(construirCampos(guardadosLimpios()))).toBe('completo');
    });

    it('con pendientes y sin intervención humana: procesado', () => {
      const g = guardadosLimpios();
      g.codigo_repuesto = { clave: 'codigo_repuesto', valor: null, confianza: 'baja', noLeido: true };
      expect(derivarEstado(construirCampos(g))).toBe('procesado');
    });

    it('con pendientes y alguien ya intervino: en_revision', () => {
      const g = guardadosLimpios();
      g.codigo_repuesto = { clave: 'codigo_repuesto', valor: null, confianza: 'baja', noLeido: true };
      g.fecha = {
        ...campoOk('fecha'),
        confianza: 'baja',
        revision: {
          estado: 'confirmado',
          valor_corregido: null,
          revisado_por: 'ana',
          revisado_en: 'x',
          corregido_por: null,
          corregido_en: null,
        },
      };
      expect(derivarEstado(construirCampos(g))).toBe('en_revision');
    });
  });

  it('valorVigente: la corrección manda y un campo ilegible no deja valor', () => {
    const base = construirCampos(guardadosLimpios())[0];
    expect(valorVigente({ ...base, valor_corregido: 'Corregido' })).toBe('Corregido');
    expect(valorVigente({ ...base })).toBe(base.valor_modelo);
    expect(valorVigente({ ...base, estado_revision: 'ilegible' })).toBeNull();
  });

  it('numeroVisible usa el N° del talonario o un identificador SN- si no se pudo leer', () => {
    expect(numeroVisible({ id: 'abcdef12-0000', numero_talonario: '000214' })).toBe('000214');
    expect(numeroVisible({ id: 'abcdef12-0000', numero_talonario: null })).toBe('SN-abcdef12');
  });

  it('aReporteContrato arma el contrato de la bandeja con las imágenes firmadas', () => {
    const r = aReporteContrato(
      {
        id: 'id-1',
        numero_talonario: '000214',
        origen: 'historico',
        cliente: 'Area 51',
        fecha: '2026-02-03',
        serie_equipo: null,
        tecnico_asignado: 'Angelo',
        campos_extraidos: guardadosLimpios(),
        creado_en: '2026-11-02T10:00:00Z',
        actualizado_en: '2026-11-02T10:00:00Z',
        escaneo: { id: 'e-1', ruta_original: 'a/b.pdf', paginas: 1, enviado_por: 'secre', estado: 'completo', creado_en: '2026-11-02T10:00:00Z' },
      },
      ['https://firmada/1.png'],
    );
    expect(r).toMatchObject({
      numero_reporte: '000214',
      cliente: 'Area 51',
      equipo: '',
      fecha_reporte: '2026-02-03',
      estado: 'completo',
      escaneo: { paginas_urls: ['https://firmada/1.png'], enviado_por: 'secre', canal: 'telegram' },
    });
    expect(r.campos).toHaveLength(IDS_CAMPOS_FORMULARIO.length);
  });
});