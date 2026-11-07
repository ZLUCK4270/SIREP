import { Injectable, Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { corsOriginCallback } from '../common/cors.util';

export type TipoCambioReporte = 'creado' | 'actualizado';

export interface EventoCambioReporte {
    tipo: TipoCambioReporte;
    /** N° visible del reporte afectado (el mismo que usa la URL del frontend). Vacío si aún no tiene. */
    numero: string;
}

export const EVENTO_CAMBIO_REPORTE = 'reportes:cambio';

/**
 * Canal en vivo hacia la bandeja de revisión. Solo avisa "algo cambió" (sin datos del reporte):
 * el frontend vuelve a pedir lo que necesita por la API normal, que es la que valida permisos
 * y firma las imágenes. Así no se filtran datos de clientes por el socket.
 */
@Injectable()
@WebSocketGateway({ cors: { origin: corsOriginCallback } })
export class EventosGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(EventosGateway.name);

    @WebSocketServer()
    private server?: Server;

    handleConnection() {
        this.logger.debug(`Cliente en vivo conectado (${this.server?.engine?.clientsCount ?? '?'})`);
    }

    handleDisconnect() {
        this.logger.debug(`Cliente en vivo desconectado (${this.server?.engine?.clientsCount ?? '?'})`);
    }

    emitirCambio(tipo: TipoCambioReporte, numero: string | null | undefined) {
        // Nunca debe romper el flujo que lo llama: un aviso perdido solo retrasa la actualización
        try {
            this.server?.emit(EVENTO_CAMBIO_REPORTE, { tipo, numero: numero ?? '' } satisfies EventoCambioReporte);
        } catch (err: any) {
            this.logger.warn(`No se pudo emitir el evento en vivo: ${err?.message}`);
        }
    }
}