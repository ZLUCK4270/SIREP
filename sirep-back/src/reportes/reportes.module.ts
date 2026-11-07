import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';

@Module({
  imports: [CommonModule],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
