// src/modules/subscription-sales/dto/create-subscription-plan.dto.ts

import {
  IsUUID,
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsOptional,
  IsBoolean,
  IsDateString,
  Min,
  Max,
  Length,
  ValidateNested,
  IsObject,
  ValidateIf,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for linking a zone to a subscription plan
 */
export class SubscriptionPlanZoneDto {
  @ApiProperty({
    description: 'Zone ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString({ message: 'Zone ID must be a string' })
  zone_id: string;

  @ApiPropertyOptional({
    description: 'Whether the zone is included in the plan',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'is_included must be a boolean' })
  is_included?: boolean;

  @ApiPropertyOptional({
    description: 'Price override for this zone',
    example: 150.00,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Price override must be a number with max 2 decimals' })
  @Min(0, { message: 'Price override cannot be negative' })
  @Type(() => Number)
  price_override?: number;

  @ApiPropertyOptional({
    description: 'Priority level for this zone',
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Priority level must be a number' })
  @Type(() => Number)
  priority_level?: number;
}

/**
 * DTO for linking an event to a subscription plan
 */
export class SubscriptionPlanEventDto {
  @ApiProperty({
    description: 'Event ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID(4, { message: 'Event ID must be a valid UUID' })
  event_id: string;

  @ApiPropertyOptional({
    description: 'Whether the event is included in the plan',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'is_included must be a boolean' })
  is_included?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this is a priority event',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'is_priority must be a boolean' })
  is_priority?: boolean;

  @ApiPropertyOptional({
    description: 'Access level for this event',
    example: 'STANDARD',
  })
  @IsOptional()
  @IsString({ message: 'Access level must be a string' })
  access_level?: string;
}

/**
 * DTO for creating a subscription plan
 */
export class CreateSubscriptionPlanDto {
  @ApiProperty({
    description: 'Plan code (unique identifier)',
    example: 'PLAN-2025-SEASON-A',
    minLength: 1,
    maxLength: 50,
  })
  @IsString({ message: 'Code must be a string' })
  @Length(1, 50, { message: 'Code must be between 1 and 50 characters' })
  @Transform(({ value }) => value?.trim().toUpperCase())
  code: string;

  @ApiProperty({
    description: 'Plan name',
    example: 'Season Pass 2025 - Category A',
    maxLength: 200,
  })
  @IsString({ message: 'Name must be a string' })
  @Length(1, 200, { message: 'Name must be between 1 and 200 characters' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiPropertyOptional({
    description: 'Plan description',
    example: 'Full season access to all home games in Category A',
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiProperty({
    description: 'Plan type',
    enum: ['SEASON', 'PARTIAL', 'VIP', 'STUDENT', 'FAMILY', 'CORPORATE', 'LOYALTY', 'FLEX', 'PREMIUM', 'BASIC'],
    example: 'SEASON',
  })
  @IsEnum(['SEASON', 'PARTIAL', 'VIP', 'STUDENT', 'FAMILY', 'CORPORATE', 'LOYALTY', 'FLEX', 'PREMIUM', 'BASIC'], {
    message: 'Type must be a valid subscription plan type',
  })
  type: string;

  @ApiProperty({
    description: 'Plan price',
    example: 500.00,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Price must be a number with max 2 decimals' })
  @Min(0, { message: 'Price cannot be negative' })
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'TND',
    default: 'TND',
    minLength: 3,
    maxLength: 3,
  })
  @IsOptional()
  @IsString({ message: 'Currency must be a string' })
  @Length(3, 3, { message: 'Currency must be exactly 3 characters' })
  @Transform(({ value }) => value?.toUpperCase())
  currency?: string;

  @ApiProperty({
    description: 'Organizer ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID(4, { message: 'Organizer ID must be a valid UUID' })
  organizer_id: string;

  @ApiPropertyOptional({
    description: 'Maximum number of subscribers (null = unlimited)',
    example: 1000,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Max subscribers must be a number' })
  @Min(1, { message: 'Max subscribers must be at least 1' })
  @Type(() => Number)
  max_subscribers?: number;

  @ApiProperty({
    description: 'Plan validity start date',
    example: '2025-01-01',
    format: 'date',
  })
  @IsDateString({}, { message: 'Valid from must be a valid date string' })
  valid_from: string;

  @ApiProperty({
    description: 'Plan validity end date',
    example: '2025-12-31',
    format: 'date',
  })
  @IsDateString({}, { message: 'Valid until must be a valid date string' })
  valid_until: string;

  @ApiPropertyOptional({
    description: 'Sale start date',
    example: '2024-12-01',
    format: 'date',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Sale start date must be a valid date string' })
  sale_start_date?: string;

  @ApiPropertyOptional({
    description: 'Sale end date',
    example: '2025-01-15',
    format: 'date',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Sale end date must be a valid date string' })
  @ValidateIf((o) => o.sale_start_date, {
    message: 'Sale end date must be provided if sale start date is provided',
  })
  sale_end_date?: string;

  @ApiPropertyOptional({
    description: 'Whether subscription is transferable',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Transferable must be a boolean' })
  transferable?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum number of transfers allowed',
    example: 0,
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Max transfers must be a number' })
  @Min(0, { message: 'Max transfers cannot be negative' })
  @Type(() => Number)
  max_transfers?: number;

  @ApiPropertyOptional({
    description: 'Auto-renewal enabled',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Auto renew must be a boolean' })
  auto_renew?: boolean;

  @ApiPropertyOptional({
    description: 'Includes playoff events',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Includes playoffs must be a boolean' })
  includes_playoffs?: boolean;

  @ApiPropertyOptional({
    description: 'Priority booking access',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Priority booking must be a boolean' })
  priority_booking?: boolean;

  @ApiPropertyOptional({
    description: 'Plan benefits (JSON)',
    example: { vip_access: true, parking: true, merchandise_discount: 10 },
  })
  @IsOptional()
  @IsObject({ message: 'Benefits must be an object' })
  benefits?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Plan restrictions (JSON)',
    example: { age_min: 18, age_max: null },
  })
  @IsOptional()
  @IsObject({ message: 'Restrictions must be an object' })
  restrictions?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Additional metadata (JSON)',
    example: { category: 'premium', tags: ['season', 'vip'] },
  })
  @IsOptional()
  @IsObject({ message: 'Metadata must be an object' })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Zones to link to this plan',
    type: [SubscriptionPlanZoneDto],
  })
  @IsOptional()
  @IsArray({ message: 'Zones must be an array' })
  @ValidateNested({ each: true })
  @Type(() => SubscriptionPlanZoneDto)
  zones?: SubscriptionPlanZoneDto[];

  @ApiPropertyOptional({
    description: 'Events to link to this plan',
    type: [SubscriptionPlanEventDto],
  })
  @IsOptional()
  @IsArray({ message: 'Events must be an array' })
  @ValidateNested({ each: true })
  @Type(() => SubscriptionPlanEventDto)
  events?: SubscriptionPlanEventDto[];
}

