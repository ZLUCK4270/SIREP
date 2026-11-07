import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { TelegramService } from './telegram.service';

/** Comparación en tiempo constante para que el secret_token no se pueda deducir por tiempos de respuesta. */
function secretosIguales(recibido: string | undefined, esperado: string): boolean {
  const a = Buffer.from(recibido ?? '');
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly config: ConfigService,
  ) { }

  @Post('webhook')
  @HttpCode(200)
  async telegramWebhook(
    @Body() update: any,
    @Headers('x-telegram-bot-api-secret-token') secretHeader: string | undefined,
  ) {
    const secretEsperado = this.config.get<string>('TELEGRAM_WEBHOOK_SECRET');
    if (!secretEsperado) {
      throw new UnauthorizedException('TELEGRAM_WEBHOOK_SECRET no configurado en el servidor.');
    }

    if (!secretosIguales(secretHeader, secretEsperado)) {
      this.logger.warn('Rechazado webhook de Telegram por secret_token inválido.');
      throw new UnauthorizedException('Secret token inválido');
    }

    // Se responde 200 de inmediato a Telegram: si el webhook tarda, Telegram reintenta
    // el mismo mensaje. El procesamiento (descarga, IA) y la respuesta al chat ocurren en background.
    this.telegramService.handleUpdate(update).catch((err) => {
      this.logger.error(`Error en procesamiento de update: ${err?.message ?? err}`);
    });

    return { ok: true };
  }
}