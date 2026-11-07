import { Controller, Get } from '@nestjs/common';

// Chequeo de vida para Railway/Docker y verificación desde el frontend: responde 200 sin tocar la base.
@Controller('health')
export class HealthController {
    @Get()
    estado() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }
}
