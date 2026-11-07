import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { SupabaseService } from '../common/supabase.service';
import { EventosGateway } from '../realtime/eventos.gateway';
import { IDS_CAMPOS_FORMULARIO } from '../escaneos/campos-formulario';
import { EMPRESA_POR_DEFECTO } from '../escaneos/escaneos.service';
import { AccionRevisionDto } from './dto/accion-revision.dto';
import { columnasDesdeValores } from './reportes.columnas';
import {
  CampoGuardado,
  CampoContrato,
  FilaReporte,
  RevisionCampo,
  aReporteContrato,
  construirCampos,
  derivarEstado,
  valorVigente,
} from './reportes.mapper';

const BUCKET = 'escaneos-originales';
// Las imágenes se piden a Storage con un enlace firmado y temporal: el bucket es privado porque son datos de clientes.
const VIGENCIA_ENLACES_SEG = 60 * 60;

// Sin `metadatos` completo: trae la salida cruda del modelo y no hace falta para listar.
const SELECCION =
  '*, escaneo:escaneos(id, ruta_original, paginas, enviado_por, estado, creado_en, metadatos)';

@Injectable()
export class ReportesService {
  private readonly logger = new Logger(ReportesService.name);

  constructor(
    private readonly supabase: SupabaseService,
    // Opcional para que las pruebas unitarias no necesiten el canal en vivo
    @Optional() private readonly eventos?: EventosGateway,
  ) { }

  private get client() {
    return this.supabase.getClient();
  }

  async listar(limite = 1000) {
    const { data, error } = await this.client
      .from('reportes')
      .select(SELECCION)
      .eq('empresa_id', EMPRESA_POR_DEFECTO)
      .order('creado_en', { ascending: false })
      .limit(limite);

    if (error) {
      this.logger.error(`No se pudieron listar los reportes: ${error.message}`);
      throw new InternalServerErrorException('No se pudieron cargar los reportes.');
    }
    // En la lista no se firman enlaces de imagen: el visor los pide al abrir un reporte.
    return (data as FilaReporte[]).map((fila) => aReporteContrato(fila));
  }

  async obtener(numero: string) {
    const fila = await this.buscarFila(numero);
    const urls = await this.firmarPaginas(fila);
    return aReporteContrato(fila, urls);
  }

  async revisarCampo(numero: string, campoId: string, accion: AccionRevisionDto) {
    if (!IDS_CAMPOS_FORMULARIO.includes(campoId)) {
      throw new NotFoundException(`El formulario no tiene el campo "${campoId}".`);
    }

    const fila = await this.buscarFila(numero);
    const guardados: Record<string, CampoGuardado> = { ...(fila.campos_extraidos ?? {}) };
    const camposActuales = construirCampos(guardados);
    const actual = camposActuales.find((c) => c.id === campoId) as CampoContrato;
    const pendiente = actual.estado_revision === 'pendiente';

    if (accion.tipo === 'reabrir') {
      if (pendiente) throw new ConflictException(`El campo "${campoId}" no está resuelto.`);
    } else if (!pendiente) {
      throw new ConflictException(`El campo "${campoId}" no está pendiente de revisión.`);
    }

    const valorNuevo = accion.valor?.trim() ?? '';
    if (accion.tipo === 'corregir' && valorNuevo === '') {
      throw new BadRequestException('La corrección no puede quedar vacía.');
    }

    const ahora = new Date().toISOString();
    const revision = this.aplicarAccion(accion, valorNuevo, ahora);
    const base: CampoGuardado = guardados[campoId] ?? {
      clave: campoId,
      valor: null,
      confianza: 'baja',
      noLeido: true,
      dudoso: true,
    };
    guardados[campoId] = { ...base, revision };

    const camposNuevos = construirCampos(guardados);
    const estado = derivarEstado(camposNuevos);
    const pendientes = camposNuevos.filter((c) => c.estado_revision === 'pendiente').map((c) => c.id);

    // Las columnas consultables reflejan el valor vigente (el corregido), no el que leyó el modelo.
    const valores = Object.fromEntries(camposNuevos.map((c) => [c.id, valorVigente(c)]));

    const { data: actualizadas, error } = await this.client
      .from('reportes')
      .update({
        campos_extraidos: guardados,
        campos_dudosos: pendientes,
        estado_reporte: pendientes.length === 0 ? 'aprobado' : 'pendiente_revision',
        ...columnasDesdeValores(valores),
        ...(accion.tipo === 'corregir' ? { corregido_por: accion.actor, fecha_correccion: ahora } : {}),
      })
      .eq('id', fila.id)
      // Control de concurrencia: si otra persona guardó en el medio, `actualizado_en` ya cambió y no se pisa su trabajo.
      .eq('actualizado_en', fila.actualizado_en)
      .select('id');

    if (error) {
      this.logger.error(`No se pudo guardar la revisión de ${campoId}: ${error.message}`);
      throw new InternalServerErrorException('No se pudo guardar la revisión.');
    }
    if (!actualizadas || actualizadas.length === 0) {
      throw new ConflictException('El reporte cambió mientras lo revisabas. Recarga e inténtalo de nuevo.');
    }

    if (fila.escaneo?.id) {
      const { error: errorEscaneo } = await this.client
        .from('escaneos')
        .update({ estado })
        .eq('id', fila.escaneo.id);
      if (errorEscaneo) {
        this.logger.warn(`No se pudo sincronizar el estado del escaneo: ${errorEscaneo.message}`);
      }
    }

    this.eventos?.emitirCambio('actualizado', numero);

    return this.obtener(numero);
  }

  private aplicarAccion(accion: AccionRevisionDto, valor: string, ahora: string): RevisionCampo {
    const vacia: RevisionCampo = {
      estado: 'pendiente',
      valor_corregido: null,
      revisado_por: null,
      revisado_en: null,
      corregido_por: null,
      corregido_en: null,
    };
    switch (accion.tipo) {
      case 'confirmar':
        return { ...vacia, estado: 'confirmado', revisado_por: accion.actor, revisado_en: ahora };
      case 'ilegible':
        return { ...vacia, estado: 'ilegible', revisado_por: accion.actor, revisado_en: ahora };
      case 'corregir':
        return {
          estado: 'corregido',
          valor_corregido: valor,
          revisado_por: accion.actor,
          revisado_en: ahora,
          corregido_por: accion.actor,
          corregido_en: ahora,
        };
      case 'reabrir':
        return vacia;
    }
  }

  /** Busca por N° de talonario; los reportes sin N° se abren con `SN-` + inicio de su id. */
  private async buscarFila(numero: string): Promise<FilaReporte> {
    const limpio = numero.trim();
    const sinNumero = limpio.match(/^SN-([0-9a-f]{8})$/i);

    if (sinNumero) {
      const { data, error } = await this.client
        .from('reportes')
        .select(SELECCION)
        .eq('empresa_id', EMPRESA_POR_DEFECTO)
        .is('numero_talonario', null);
      if (error) throw new InternalServerErrorException('No se pudo buscar el reporte.');
      const fila = (data as FilaReporte[] | null)?.find((f) => f.id.startsWith(sinNumero[1].toLowerCase()));
      if (!fila) throw new NotFoundException(`No existe el reporte N° ${limpio}.`);
      return fila;
    }

    const { data, error } = await this.client
      .from('reportes')
      .select(SELECCION)
      .eq('empresa_id', EMPRESA_POR_DEFECTO)
      .eq('numero_talonario', limpio)
      .order('creado_en', { ascending: false })
      .limit(1);

    if (error) {
      this.logger.error(`No se pudo buscar el reporte ${limpio}: ${error.message}`);
      throw new InternalServerErrorException('No se pudo buscar el reporte.');
    }
    const fila = (data as FilaReporte[] | null)?.[0];
    if (!fila) throw new NotFoundException(`No existe el reporte N° ${limpio}.`);
    return fila;
  }

  private async firmarPaginas(fila: FilaReporte): Promise<string[]> {
    const rutas = fila.escaneo?.metadatos?.rutas_paginas?.length
      ? fila.escaneo.metadatos.rutas_paginas
      : fila.escaneo?.ruta_original
        ? [fila.escaneo.ruta_original]
        : [];
    if (rutas.length === 0) return [];

    const { data, error } = await this.client.storage.from(BUCKET).createSignedUrls(rutas, VIGENCIA_ENLACES_SEG);
    if (error || !data) {
      this.logger.warn(`No se pudieron firmar las imágenes del reporte ${fila.id}: ${error?.message}`);
      return [];
    }
    // Se conserva el orden de las páginas; una ruta que falló queda fuera en lugar de romper el visor.
    return data.map((d) => d.signedUrl).filter((u): u is string => Boolean(u));
  }
}