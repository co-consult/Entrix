import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class RollbackSeasonDto {
  @ApiProperty({ example: '2025-2026' })
  @IsString()
  @Matches(/^\d{4}-\d{4}$/)
  sourceSeason: string;
}
