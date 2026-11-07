import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TelegramModule } from './telegram/telegram.module';
import { EscaneosModule } from './escaneos/escaneos.module';
import { ReportesModule } from './reportes/reportes.module';
import { HealthController } from './health/health.controller';
import { AppController } from './app.controller';
import { CommonModule } from './common/common.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    CommonModule,
    RealtimeModule,
    EscaneosModule,
    ReportesModule,
    TelegramModule,
  ],
  controllers: [AppController, HealthController],
})
export class AppModule { }