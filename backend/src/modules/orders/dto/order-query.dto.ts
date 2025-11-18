import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber, IsUUID, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export enum OrderStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  EXPIRED = 'EXPIRED',
  PARTIALLY_FULFILLED = 'PARTIALLY_FULFILLED',
  ON_HOLD = 'ON_HOLD',
}

export enum PurchaseChannel {
  WEB = 'WEB',
  MOBILE_APP = 'MOBILE_APP',
  PHONE = 'PHONE',
  COUNTER = 'COUNTER',
  PARTNER = 'PARTNER',
}

export class OrderQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Search term for order number, customer name, or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by order status', enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Filter by purchase channel', enum: PurchaseChannel })
  @IsOptional()
  @IsEnum(PurchaseChannel)
  channel?: PurchaseChannel;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiPropertyOptional({ description: 'Filter by organizer ID' })
  @IsOptional()
  @IsUUID()
  organizer_id?: string;

  @ApiPropertyOptional({ description: 'Filter by date from (ISO string)' })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({ description: 'Filter by date to (ISO string)' })
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiPropertyOptional({ description: 'Filter by minimum amount' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  min_amount?: number;

  @ApiPropertyOptional({ description: 'Filter by maximum amount' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  max_amount?: number;

  @ApiPropertyOptional({ description: 'Sort field', default: 'created_at' })
  @IsOptional()
  @IsString()
  sort_by?: string = 'created_at';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc' = 'desc';
}
