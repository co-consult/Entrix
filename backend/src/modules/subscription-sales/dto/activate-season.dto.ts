import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class ActivateSeasonDto {
  @ApiProperty({ example: '2025-2026' })
  @IsString()
  @Matches(/^\d{4}-\d{4}$/)
  sourceSeason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID(4)
  organizerId?: string;
}
