import { Global, Module } from '@nestjs/common';
import { EventosGateway } from './eventos.gateway';

@Global()
@Module({
    providers: [EventosGateway],
    exports: [EventosGateway],
})
export class RealtimeModule { }