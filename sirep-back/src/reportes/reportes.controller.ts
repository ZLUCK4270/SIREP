import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AccionRevisionDto } from './dto/accion-revision.dto';
import { ReportesService } from './reportes.service';

@ApiTags('reportes')
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportes: ReportesService) {}

  /** Todos los reportes digitalizados, para la bandeja de revisión. */
  @Get()
  listar() {
    return this.reportes.listar();
  }

  /** Un reporte con sus campos y los enlaces temporales a las imágenes del escaneo. */
  @Get(':numero')
  obtener(@Param('numero') numero: string) {
    return this.reportes.obtener(numero);
  }

  /** Confirmar, corregir, marcar ilegible o reabrir un campo. Devuelve el reporte actualizado. */
  @Patch(':numero/campos/:campoId')
  revisarCampo(
    @Param('numero') numero: string,
    @Param('campoId') campoId: string,
    @Body() accion: AccionRevisionDto,
  ) {
    return this.reportes.revisarCampo(numero, campoId, accion);
  }
}
