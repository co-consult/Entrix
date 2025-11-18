// src/modules/zones/dto/zone.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsEnum,
  IsUUID,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * DTO for zone response
 */
export class ZoneDto {
  @ApiProperty({ description: 'Zone ID', example: 'zone-123' })
  id: string;

  @ApiProperty({ description: 'Zone code', example: 'ZONE-A' })
  code: string;

  @ApiProperty({ description: 'Zone name', example: 'Gradin 4' })
  name: string;

  @ApiPropertyOptional({ description: 'Zone description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Zone capacity', example: 500 })
  capacity?: number;

  @ApiPropertyOptional({ description: 'Base price', example: 50.00 })
  base_price?: number;

  @ApiPropertyOptional({ description: 'Currency', example: 'TND' })
  currency?: string;

  @ApiPropertyOptional({ description: 'Is zone active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Zone type' })
  zone_type?: string;

  @ApiPropertyOptional({ description: 'Zone category' })
  category?: string;

  @ApiPropertyOptional({ description: 'Amenities (array of strings)', type: [String] })
  amenities?: string[];

  @ApiPropertyOptional({ description: 'Mapping ID' })
  mapping_id?: string;
}

/**
 * DTO for listing zones query parameters
 */
export class GetZonesQueryDto {
  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Filter by zone type' })
  @IsOptional()
  @IsString()
  zone_type?: string;

  @ApiPropertyOptional({ description: 'Filter by category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Search by name or code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by venue ID (through mapping)' })
  @IsOptional()
  @IsString()
  @IsUUID('4', { message: 'Venue ID must be a valid UUID' })
  venue_id?: string;
}

/**
 * DTO for creating a new zone
 */
export class CreateZoneDto {
  @ApiProperty({ description: 'Venue mapping ID (required)', example: 'mapping-123' })
  @IsString({ message: 'Mapping ID must be a string' })
  mapping_id: string;

  @ApiProperty({ description: 'Zone name', example: 'Gradin 4' })
  @IsString({ message: 'Name must be a string' })
  @Length(1, 200, { message: 'Name must be between 1 and 200 characters' })
  name: string;

  @ApiProperty({ description: 'Zone code (unique within mapping)', example: 'ZONE-A' })
  @IsString({ message: 'Code must be a string' })
  @Length(1, 100, { message: 'Code must be between 1 and 100 characters' })
  code: string;

  @ApiProperty({ 
    description: 'Zone type', 
    enum: ['SEATING_AREA', 'STANDING_AREA', 'VIP_AREA', 'SERVICE_AREA', 'STAFF_AREA'],
    example: 'SEATING_AREA'
  })
  @IsEnum(['SEATING_AREA', 'STANDING_AREA', 'VIP_AREA', 'SERVICE_AREA', 'STAFF_AREA'], {
    message: 'Zone type must be a valid zone type'
  })
  zone_type: string;

  @ApiProperty({ 
    description: 'Zone category', 
    enum: ['STANDARD', 'PREMIUM', 'BASIC', 'VIP', 'ACCESSIBLE'],
    example: 'STANDARD'
  })
  @IsEnum(['STANDARD', 'PREMIUM', 'BASIC', 'VIP', 'ACCESSIBLE'], {
    message: 'Category must be a valid zone category'
  })
  category: string;

  @ApiProperty({ description: 'Zone capacity', example: 500, minimum: 1 })
  @IsNumber({}, { message: 'Capacity must be a number' })
  @Min(1, { message: 'Capacity must be at least 1' })
  @Type(() => Number)
  capacity: number;

  @ApiPropertyOptional({ description: 'Base price', example: 50.00, default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Base price must be a number with max 2 decimals' })
  @Min(0, { message: 'Base price cannot be negative' })
  @Type(() => Number)
  base_price?: number;

  @ApiPropertyOptional({ description: 'Currency', example: 'TND', default: 'TND' })
  @IsOptional()
  @IsString({ message: 'Currency must be a string' })
  @Length(3, 3, { message: 'Currency must be 3 characters' })
  currency?: string;

  @ApiPropertyOptional({ description: 'Zone description' })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiPropertyOptional({ description: 'Parent zone ID (for hierarchical zones)' })
  @IsOptional()
  @IsString({ message: 'Parent zone ID must be a string' })
  parent_zone_id?: string;

  @ApiPropertyOptional({ description: 'Zone level (for hierarchy)', example: 0, default: 0 })
  @IsOptional()
  @IsNumber({}, { message: 'Level must be a number' })
  @Min(0, { message: 'Level cannot be negative' })
  @Type(() => Number)
  level?: number;

  @ApiPropertyOptional({ description: 'Is accessible (for disabled access)', default: false })
  @IsOptional()
  @IsBoolean({ message: 'is_accessible must be a boolean' })
  is_accessible?: boolean;

  @ApiPropertyOptional({ description: 'Requires special access', default: false })
  @IsOptional()
  @IsBoolean({ message: 'requires_special_access must be a boolean' })
  requires_special_access?: boolean;

  @ApiPropertyOptional({ description: 'Amenities (array of strings)' })
  @IsOptional()
  @IsArray({ message: 'Amenities must be an array' })
  @IsString({ each: true, message: 'Each amenity must be a string' })
  amenities?: string[];

  @ApiPropertyOptional({ description: 'Coordinates (JSON object)' })
  @IsOptional()
  coordinates?: any;

  @ApiPropertyOptional({ description: 'Metadata (JSON object)' })
  @IsOptional()
  metadata?: any;

  @ApiPropertyOptional({ description: 'Is zone active', default: true })
  @IsOptional()
  @IsBoolean({ message: 'is_active must be a boolean' })
  is_active?: boolean;
}

/**
 * DTO for updating a zone
 */
export class UpdateZoneDto {
  @ApiPropertyOptional({ description: 'Zone name' })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @Length(1, 200, { message: 'Name must be between 1 and 200 characters' })
  name?: string;

  @ApiPropertyOptional({ description: 'Zone code' })
  @IsOptional()
  @IsString({ message: 'Code must be a string' })
  @Length(1, 100, { message: 'Code must be between 1 and 100 characters' })
  code?: string;

  @ApiPropertyOptional({ description: 'Zone type' })
  @IsOptional()
  @IsEnum(['SEATING_AREA', 'STANDING_AREA', 'VIP_AREA', 'SERVICE_AREA', 'STAFF_AREA'], {
    message: 'Zone type must be a valid zone type'
  })
  zone_type?: string;

  @ApiPropertyOptional({ description: 'Zone category' })
  @IsOptional()
  @IsEnum(['STANDARD', 'PREMIUM', 'BASIC', 'VIP', 'ACCESSIBLE'], {
    message: 'Category must be a valid zone category'
  })
  category?: string;

  @ApiPropertyOptional({ description: 'Zone capacity' })
  @IsOptional()
  @IsNumber({}, { message: 'Capacity must be a number' })
  @Min(1, { message: 'Capacity must be at least 1' })
  @Type(() => Number)
  capacity?: number;

  @ApiPropertyOptional({ description: 'Base price' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Base price must be a number with max 2 decimals' })
  @Min(0, { message: 'Base price cannot be negative' })
  @Type(() => Number)
  base_price?: number;

  @ApiPropertyOptional({ description: 'Currency' })
  @IsOptional()
  @IsString({ message: 'Currency must be a string' })
  @Length(3, 3, { message: 'Currency must be 3 characters' })
  currency?: string;

  @ApiPropertyOptional({ description: 'Zone description' })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiPropertyOptional({ description: 'Venue mapping ID' })
  @IsOptional()
  @IsString({ message: 'Mapping ID must be a string' })
  @IsUUID(undefined, { message: 'Mapping ID must be a valid UUID' })
  mapping_id?: string;

  @ApiPropertyOptional({ description: 'Parent zone ID' })
  @IsOptional()
  @IsString({ message: 'Parent zone ID must be a string' })
  parent_zone_id?: string;

  @ApiPropertyOptional({ description: 'Zone level' })
  @IsOptional()
  @IsNumber({}, { message: 'Level must be a number' })
  @Min(0, { message: 'Level cannot be negative' })
  @Type(() => Number)
  level?: number;

  @ApiPropertyOptional({ description: 'Is accessible' })
  @IsOptional()
  @IsBoolean({ message: 'is_accessible must be a boolean' })
  is_accessible?: boolean;

  @ApiPropertyOptional({ description: 'Requires special access' })
  @IsOptional()
  @IsBoolean({ message: 'requires_special_access must be a boolean' })
  requires_special_access?: boolean;

  @ApiPropertyOptional({ description: 'Amenities' })
  @IsOptional()
  @IsArray({ message: 'Amenities must be an array' })
  @IsString({ each: true, message: 'Each amenity must be a string' })
  amenities?: string[];

  @ApiPropertyOptional({ description: 'Coordinates' })
  @IsOptional()
  coordinates?: any;

  @ApiPropertyOptional({ description: 'Metadata' })
  @IsOptional()
  metadata?: any;

  @ApiPropertyOptional({ description: 'Is zone active' })
  @IsOptional()
  @IsBoolean({ message: 'is_active must be a boolean' })
  is_active?: boolean;
}

