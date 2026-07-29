import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

export class GenerateSeasonQRsDto {
  @ApiProperty({ example: '2025-2026' })
  @IsString()
  @Matches(/^\d{4}-\d{4}$/)
  sourceSeason: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  archiveSource?: boolean = true;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean = false;
}
