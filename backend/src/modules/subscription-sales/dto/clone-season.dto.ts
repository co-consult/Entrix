import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class CloneSeasonDto {
  @ApiProperty({ example: '2026-2027' })
  @IsString()
  @Matches(/^\d{4}-\d{4}$/, { message: 'sourceSeason doit être au format AAAA-AAAA' })
  sourceSeason: string;

  @ApiProperty({ example: '2027-2028' })
  @IsString()
  @Matches(/^\d{4}-\d{4}$/, { message: 'targetSeason doit être au format AAAA-AAAA' })
  targetSeason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID(4)
  organizerId?: string;
}
