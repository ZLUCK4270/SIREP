import {
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EscaneosService } from './escaneos.service';

@Controller('escaneos')
export class EscaneosController {
  constructor(private readonly escaneosService: EscaneosService) { }

  @Get()
  async listar(@Query('limite') limite?: string) {
    const lim = limite ? parseInt(limite, 10) : 50;
    return this.escaneosService.listarEscaneos(lim);
  }

  @Get(':id')
  async obtenerPorId(@Param('id') id: string) {
    return this.escaneosService.obtenerEscaneoPorId(id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async subirEscaneo(
    @UploadedFile() file: Express.Multer.File,
    @Body('numeroReporte') numeroReporte?: string,
    @Body('enviadoPor') enviadoPor?: string,
  ) {
    if (!file) {
      throw new BadRequestException("Falta el archivo (campo 'file' en multipart/form-data).");
    }
    return this.escaneosService.procesarEscaneo({
      buffer: file.buffer,
      filename: file.originalname,
      caption: numeroReporte,
      mimetype: file.mimetype,
      enviadoPor: enviadoPor || 'web',
    });
  }
}