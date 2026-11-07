import { BadRequestException, ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase.service';
import { IDS_CAMPOS_FORMULARIO } from '../escaneos/campos-formulario';
import { ReportesService } from './reportes.service';
import { CampoGuardado, FilaReporte } from './reportes.mapper';

function fila(extra: Partial<FilaReporte> = {}, pendientes: string[] = ['codigo_repuesto']): FilaReporte {
  const campos: Record<string, CampoGuardado> = Object.fromEntries(
    IDS_CAMPOS_FORMULARIO.map((id) => [
      id,
      pendientes.includes(id)
        ? { clave: id, valor: null, confianza: 'baja', noLeido: true, dudoso: true }
        : { clave: id, valor: id === 'fecha' ? '03/02/26' : `valor ${id}`, confianza: 'alta', noLeido: false, dudoso: false },
    ]),
  );
  return {
    id: 'a1b2c3d4-0000-0000-0000-000000000000',
    numero_talonario: '000214',
    origen: 'historico',
    cliente: 'valor empresa',
    fecha: '2026-02-03',
    serie_equipo: 'valor equipo',
    tecnico_asignado: 'valor tecnico',
    campos_extraidos: campos,
    creado_en: '2026-11-02T10:00:00Z',
    actualizado_en: '2026-11-02T10:00:00Z',
    escaneo: {
      id: 'esc-1',
      ruta_original: 'emp/1_000214_orig.pdf',
      paginas: 2,
      enviado_por: 'secretaria',
      estado: 'procesado',
      creado_en: '2026-11-02T10:00:00Z',
      metadatos: { rutas_paginas: ['emp/1_pag_1.png', 'emp/1_pag_2.png'] },
    },
    ...extra,
  };
}

describe('ReportesService', () => {
  let filas: FilaReporte[];
  let actualizaciones: { tabla: string; datos: any; filtros: Record<string, any> }[];
  let filasActualizadas: { id: string }[];
  let service: ReportesService;

  function crearSupabase(): SupabaseService {
    const builder = (tabla: string) => {
      const filtros: Record<string, any> = {};
      let datosUpdate: any = null;
      const b: any = {
        select: jest.fn(() => b),
        eq: jest.fn((col: string, val: any) => {
          filtros[col] = val;
          return b;
        }),
        is: jest.fn((col: string, val: any) => {
          filtros[`${col}:is`] = val;
          return b;
        }),
        order: jest.fn(() => b),
        limit: jest.fn(() => b),
        update: jest.fn((datos: any) => {
          datosUpdate = datos;
          return b;
        }),
        then: (res: any, rej: any) => {
          if (datosUpdate) {
            actualizaciones.push({ tabla, datos: datosUpdate, filtros: { ...filtros } });
            const resultado = tabla === 'reportes' ? { data: filasActualizadas, error: null } : { data: [], error: null };
            return Promise.resolve(resultado).then(res, rej);
          }
          let data = filas;
          if (filtros.numero_talonario) data = filas.filter((f) => f.numero_talonario === filtros.numero_talonario);
          if (filtros['numero_talonario:is'] === null) data = filas.filter((f) => f.numero_talonario === null);
          return Promise.resolve({ data, error: null }).then(res, rej);
        },
      };
      return b;
    };
    return {
      getClient: () => ({
        from: jest.fn((tabla: string) => builder(tabla)),
        storage: {
          from: jest.fn(() => ({
            createSignedUrls: jest.fn(async (rutas: string[]) => ({
              data: rutas.map((r) => ({ path: r, signedUrl: `https://storage/firmado/${r}`, error: null })),
              error: null,
            })),
          })),
        },
      }),
    } as unknown as SupabaseService;
  }

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });
  afterAll(() => jest.restoreAllMocks());

  beforeEach(() => {
    filas = [fila()];
    actualizaciones = [];
    filasActualizadas = [{ id: 'a1b2c3d4-0000-0000-0000-000000000000' }];
    service = new ReportesService(crearSupabase());
  });

  it('lista los reportes con el contrato de la bandeja y sin firmar imágenes', async () => {
    const lista = await service.listar();
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({ numero_reporte: '000214', estado: 'procesado', cliente: 'valor empresa' });
    expect(lista[0].escaneo.paginas_urls).toEqual([]);
  });

  it('al abrir un reporte devuelve enlaces firmados para cada página, en orden', async () => {
    const r = await service.obtener('000214');
    expect(r.escaneo.paginas_urls).toEqual([
      'https://storage/firmado/emp/1_pag_1.png',
      'https://storage/firmado/emp/1_pag_2.png',
    ]);
    expect(r.campos.find((c) => c.id === 'codigo_repuesto')?.estado_revision).toBe('pendiente');
    expect(r.campos.find((c) => c.id === 'empresa')?.estado_revision).toBe('auto');
  });

  it('un reporte inexistente da 404', async () => {
    await expect(service.obtener('999999')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('abre un reporte sin N° legible por su identificador SN-', async () => {
    filas = [fila({ numero_talonario: null })];
    const r = await service.obtener('SN-a1b2c3d4');
    expect(r.numero_reporte).toBe('SN-a1b2c3d4');
  });

  describe('revisarCampo', () => {
    it('corregir guarda el valor, quién y cuándo, actualiza las columnas y completa el reporte', async () => {
      await service.revisarCampo('000214', 'codigo_repuesto', { tipo: 'corregir', actor: 'Ana', valor: '  SN-4455 ' });

      const rep = actualizaciones.find((a) => a.tabla === 'reportes')!;
      const revision = rep.datos.campos_extraidos.codigo_repuesto.revision;
      expect(revision).toMatchObject({ estado: 'corregido', valor_corregido: 'SN-4455', corregido_por: 'Ana', revisado_por: 'Ana' });
      expect(revision.corregido_en).toEqual(expect.any(String));
      // el valor del modelo no se pierde
      expect(rep.datos.campos_extraidos.codigo_repuesto.valor).toBeNull();
      // columna consultable con el valor corregido
      expect(rep.datos.codigo_repuesto).toBe('SN-4455');
      expect(rep.datos.fecha).toBe('2026-02-03');
      expect(rep.datos.campos_dudosos).toEqual([]);
      expect(rep.datos.estado_reporte).toBe('aprobado');
      expect(rep.datos.corregido_por).toBe('Ana');
      // control de concurrencia
      expect(rep.filtros.actualizado_en).toBe('2026-11-02T10:00:00Z');

      const esc = actualizaciones.find((a) => a.tabla === 'escaneos')!;
      expect(esc.datos).toEqual({ estado: 'completo' });
    });

    it('confirmar deja el valor del modelo y registra quién lo revisó', async () => {
      filas = [fila({}, ['direccion'])];
      await service.revisarCampo('000214', 'direccion', { tipo: 'confirmar', actor: 'Luis' });
      const rep = actualizaciones.find((a) => a.tabla === 'reportes')!;
      expect(rep.datos.campos_extraidos.direccion.revision).toMatchObject({ estado: 'confirmado', revisado_por: 'Luis', valor_corregido: null });
    });

    it('marcar ilegible deja la columna vacía en lugar de guardar una lectura dudosa', async () => {
      filas = [fila({}, ['procedimiento'])];
      filas[0].campos_extraidos!.procedimiento.valor = 'texto dudoso';
      await service.revisarCampo('000214', 'procedimiento', { tipo: 'ilegible', actor: 'Luis' });
      const rep = actualizaciones.find((a) => a.tabla === 'reportes')!;
      expect(rep.datos.procedimiento).toBeNull();
    });

    it('con campos aún pendientes el reporte queda en revisión', async () => {
      filas = [fila({}, ['codigo_repuesto', 'direccion'])];
      await service.revisarCampo('000214', 'direccion', { tipo: 'corregir', actor: 'Ana', valor: 'Av. Lima 123' });
      const rep = actualizaciones.find((a) => a.tabla === 'reportes')!;
      expect(rep.datos.campos_dudosos).toEqual(['codigo_repuesto']);
      expect(rep.datos.estado_reporte).toBe('pendiente_revision');
      expect(actualizaciones.find((a) => a.tabla === 'escaneos')!.datos).toEqual({ estado: 'en_revision' });
    });

    it('no permite revisar un campo que no está pendiente', async () => {
      await expect(
        service.revisarCampo('000214', 'empresa', { tipo: 'confirmar', actor: 'Ana' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(actualizaciones).toHaveLength(0);
    });

    it('no permite reabrir un campo pendiente', async () => {
      await expect(
        service.revisarCampo('000214', 'codigo_repuesto', { tipo: 'reabrir', actor: 'Ana' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rechaza una corrección vacía', async () => {
      await expect(
        service.revisarCampo('000214', 'codigo_repuesto', { tipo: 'corregir', actor: 'Ana', valor: '   ' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza un campo que el formulario no tiene', async () => {
      await expect(
        service.revisarCampo('000214', 'color_favorito', { tipo: 'confirmar', actor: 'Ana' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('si otra persona guardó en el medio avisa del conflicto en vez de pisar su trabajo', async () => {
      filasActualizadas = [];
      await expect(
        service.revisarCampo('000214', 'codigo_repuesto', { tipo: 'corregir', actor: 'Ana', valor: 'X1' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
