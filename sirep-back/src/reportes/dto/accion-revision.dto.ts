import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export const TIPOS_ACCION = ['confirmar', 'corregir', 'ilegible', 'reabrir'] as const;
export type TipoAccion = (typeof TIPOS_ACCION)[number];

export class AccionRevisionDto {
  @IsIn(TIPOS_ACCION)
  tipo!: TipoAccion;

  /** Quién firma la revisión. Mientras no haya autenticación lo envía la bandeja. */
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  actor!: string;

  /** Obligatorio solo al corregir. */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  valor?: string;
}
