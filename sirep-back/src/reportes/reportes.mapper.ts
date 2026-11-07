import { IDS_CAMPOS_FORMULARIO, IDS_CAMPOS_OPCIONALES } from '../escaneos/campos-formulario';
import { aTexto } from './reportes.columnas';

export type Confianza = 'alta' | 'media' | 'baja';
export type EstadoEscaneo = 'recibido' | 'procesado' | 'en_revision' | 'completo';
export type EstadoRevisionCampo = 'auto' | 'pendiente' | 'confirmado' | 'corregido' | 'ilegible';

/** Revisión humana de un campo. Se guarda aparte de lo que leyó el modelo para que siempre se sepa quién cambió qué. */
export interface RevisionCampo {
  estado: EstadoRevisionCampo;
  valor_corregido: string | null;
  revisado_por: string | null;
  revisado_en: string | null;
  corregido_por: string | null;
  corregido_en: string | null;
}

/** Forma en que `escaneos.service` guarda cada campo en `reportes.campos_extraidos`. */
export interface CampoGuardado {
  clave: string;
  valor: unknown;
  confianza?: Confianza | null;
  noLeido?: boolean;
  dudoso?: boolean;
  /** Nota del modelo sobre qué le hizo dudar. */
  observacion?: string | null;
  /** Zona del campo en la imagen (coordenadas 0–1) según el modelo; ausente en reportes anteriores. */
  caja?: { x: number; y: number; ancho: number; alto: number; pagina?: number } | null;
  revision?: RevisionCampo;
}

export interface RegionContrato {
  x: number;
  y: number;
  ancho: number;
  alto: number;
  pagina: number;
}

export interface CampoContrato {
  id: string;
  valor_modelo: string | null;
  confianza: Confianza | null;
  no_leido: boolean;
  observacion: string | null;
  valor_corregido: string | null;
  estado_revision: EstadoRevisionCampo;
  revisado_por: string | null;
  revisado_en: string | null;
  corregido_por: string | null;
  corregido_en: string | null;
  /** Región medida por el modelo sobre este escaneo. Si es null el frontend usa el mapa fijo del talonario. */
  region: RegionContrato | null;
}

export const DISENO_TALONARIO = 'talonario-go-service-carta';

/** Mismo criterio con el que se decide qué campos llegan a la bandeja de revisión. */
export function campoRequiereRevision(campo: CampoGuardado | undefined | null): boolean {
  if (!campo) return true;
  return Boolean(campo.dudoso) || campo.confianza === 'baja' || Boolean(campo.noLeido);
}

/** Solo se acepta una caja completa y dentro de la hoja; cualquier otra cosa cae al mapa fijo del frontend. */
export function regionDesdeCaja(caja: CampoGuardado['caja']): RegionContrato | null {
  if (!caja) return null;
  const { x, y, ancho, alto } = caja;
  const validos = [x, y, ancho, alto].every((v) => typeof v === 'number' && Number.isFinite(v));
  if (!validos || ancho <= 0 || alto <= 0 || x < 0 || y < 0 || x >= 1 || y >= 1) return null;
  return {
    x,
    y,
    ancho: Math.min(ancho, 1 - x),
    alto: Math.min(alto, 1 - y),
    pagina: Math.max(1, Math.floor(caja.pagina ?? 1)),
  };
}

export function construirCampos(guardados: Record<string, CampoGuardado> | null | undefined): CampoContrato[] {
  const fuente = guardados ?? {};
  return IDS_CAMPOS_FORMULARIO.map((id) => {
    const campo = fuente[id];
    const revision = campo?.revision;
    // Un campo opcional que este reporte no trae (reportes procesados antes de ampliar el
    // formulario) es "en blanco", no un fallo de lectura: no debe inundar la bandeja.
    const ausenteOpcional = !campo && IDS_CAMPOS_OPCIONALES.has(id);
    return {
      id,
      valor_modelo: aTexto(campo?.valor),
      confianza: campo?.confianza ?? (ausenteOpcional ? 'alta' : null),
      no_leido: campo ? Boolean(campo.noLeido) : !ausenteOpcional,
      observacion: typeof campo?.observacion === 'string' && campo.observacion.trim() ? campo.observacion.trim() : null,
      valor_corregido: revision?.valor_corregido ?? null,
      estado_revision: revision?.estado ?? (!ausenteOpcional && campoRequiereRevision(campo) ? 'pendiente' : 'auto'),
      revisado_por: revision?.revisado_por ?? null,
      revisado_en: revision?.revisado_en ?? null,
      corregido_por: revision?.corregido_por ?? null,
      corregido_en: revision?.corregido_en ?? null,
      region: regionDesdeCaja(campo?.caja),
    };
  });
}

/**
 * "Procesado" = el modelo leyó y hay campos esperando a una persona; "en revisión" =
 * alguien ya intervino y aún quedan pendientes; "completo" = nada pendiente.
 * Es la misma regla que usa la bandeja (lib/estados.ts) para que ambas coincidan.
 */
export function derivarEstado(campos: readonly CampoContrato[]): EstadoEscaneo {
  const hayPendientes = campos.some((c) => c.estado_revision === 'pendiente');
  if (!hayPendientes) return 'completo';
  const intervino = campos.some((c) => ['confirmado', 'corregido', 'ilegible'].includes(c.estado_revision));
  return intervino ? 'en_revision' : 'procesado';
}

/** Valor que hoy representa al campo: la corrección humana manda y un "ilegible" no deja valor. */
export function valorVigente(campo: CampoContrato): string | null {
  if (campo.estado_revision === 'ilegible') return null;
  if (campo.valor_corregido !== null && campo.valor_corregido !== '') return campo.valor_corregido;
  return campo.valor_modelo;
}

export interface FilaEscaneo {
  id: string;
  ruta_original: string;
  paginas: number;
  enviado_por: string | null;
  estado: EstadoEscaneo;
  creado_en: string;
  metadatos?: { rutas_paginas?: string[] } | null;
}

export interface FilaReporte {
  id: string;
  numero_talonario: string | null;
  origen: 'historico' | 'sistema';
  cliente: string | null;
  fecha: string | null;
  serie_equipo: string | null;
  tecnico_asignado: string | null;
  campos_extraidos: Record<string, CampoGuardado> | null;
  creado_en: string;
  actualizado_en: string;
  escaneo?: FilaEscaneo | null;
}

/** Los reportes sin N° legible se identifican por el inicio de su id para poder abrirlos igual desde la bandeja. */
export function numeroVisible(fila: Pick<FilaReporte, 'id' | 'numero_talonario'>): string {
  return fila.numero_talonario ?? `SN-${fila.id.slice(0, 8)}`;
}

/** Contrato que consume la bandeja de revisión del frontend (`RepositorioReportes`). */
export function aReporteContrato(fila: FilaReporte, urlsPaginas: string[] = []) {
  const campos = construirCampos(fila.campos_extraidos);
  const estado = derivarEstado(campos);
  const escaneo = fila.escaneo;
  const numero = numeroVisible(fila);

  return {
    id: fila.id,
    numero_reporte: numero,
    numero_talonario: numero,
    cliente: fila.cliente ?? '',
    equipo: fila.serie_equipo ?? '',
    tecnico: fila.tecnico_asignado ?? '',
    fecha_reporte: fila.fecha ?? '',
    origen: fila.origen,
    estado,
    diseno_talonario: DISENO_TALONARIO,
    escaneo: {
      id: escaneo?.id ?? '',
      numero_reporte: numero,
      ruta_original: escaneo?.ruta_original ?? '',
      paginas: escaneo?.paginas ?? 1,
      paginas_urls: urlsPaginas,
      enviado_por: escaneo?.enviado_por ?? 'telegram',
      canal: 'telegram' as const,
      estado,
      recibido_en: escaneo?.creado_en ?? fila.creado_en,
      procesado_en: escaneo?.creado_en ?? fila.creado_en,
    },
    campos,
    creado_en: fila.creado_en,
    actualizado_en: fila.actualizado_en,
    completado_en: estado === 'completo' ? fila.actualizado_en : null,
  };
}