// src/modules/zones/dto/mapping.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, IsBoolean, IsDateString, IsEnum } from 'class-validator';

export enum MappingType {
  DEFAULT = 'DEFAULT',
  EVENT_SPECIFIC = 'EVENT_SPECIFIC',
  SEASONAL = 'SEASONAL',
  MAINTENANCE = 'MAINTENANCE',
  EMERGENCY = 'EMERGENCY',
  SPECIAL_EVENT = 'SPECIAL_EVENT',
  REDUCED_CAPACITY = 'REDUCED_CAPACITY',
}

export class MappingDto {
  @ApiProperty({ description: 'Mapping ID' })
  id: string;

  @ApiProperty({ description: 'Venue ID' })
  venue_id: string;

  @ApiProperty({ description: 'Mapping name' })
  name: string;

  @ApiProperty({ description: 'Mapping code' })
  code: string;

  @ApiPropertyOptional({ description: 'Mapping description' })
  description?: string;

  @ApiProperty({ enum: MappingType, description: 'Mapping type' })
  mapping_type: string;

  @ApiProperty({ type: [String], description: 'Event categories' })
  event_categories: string[];

  @ApiProperty({ description: 'Effective capacity' })
  effective_capacity: number;

  @ApiPropertyOptional({ description: 'Valid from date' })
  valid_from?: Date;

  @ApiPropertyOptional({ description: 'Valid until date' })
  valid_until?: Date;

  @ApiProperty({ description: 'Is active' })
  is_active: boolean;

  @ApiPropertyOptional({ description: 'Metadata' })
  metadata?: any;
}

export class CreateMappingDto {
  @ApiProperty({ description: 'Venue ID' })
  @IsString()
  @IsNotEmpty()
  venue_id: string;

  @ApiProperty({ description: 'Mapping name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Mapping code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'Mapping description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: MappingType, description: 'Mapping type' })
  @IsEnum(MappingType)
  @IsNotEmpty()
  mapping_type: MappingType;

  @ApiProperty({ type: [String], description: 'Event categories', default: [] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  event_categories?: string[];

  @ApiProperty({ description: 'Effective capacity' })
  @IsNumber()
  @IsNotEmpty()
  effective_capacity: number;

  @ApiPropertyOptional({ description: 'Valid from date' })
  @IsDateString()
  @IsOptional()
  valid_from?: Date;

  @ApiPropertyOptional({ description: 'Valid until date' })
  @IsDateString()
  @IsOptional()
  valid_until?: Date;

  @ApiPropertyOptional({ description: 'Is active', default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Metadata' })
  @IsOptional()
  metadata?: any;
}

export class UpdateMappingDto {
  @ApiPropertyOptional({ description: 'Mapping name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Mapping code' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: 'Mapping description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: MappingType, description: 'Mapping type' })
  @IsEnum(MappingType)
  @IsOptional()
  mapping_type?: string;

  @ApiPropertyOptional({ type: [String], description: 'Event categories' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  event_categories?: string[];

  @ApiPropertyOptional({ description: 'Effective capacity' })
  @IsNumber()
  @IsOptional()
  effective_capacity?: number;

  @ApiPropertyOptional({ description: 'Valid from date' })
  @IsDateString()
  @IsOptional()
  valid_from?: Date;

  @ApiPropertyOptional({ description: 'Valid until date' })
  @IsDateString()
  @IsOptional()
  valid_until?: Date;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Metadata' })
  @IsOptional()
  metadata?: any;
}

