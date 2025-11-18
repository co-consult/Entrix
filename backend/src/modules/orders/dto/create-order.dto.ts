import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, IsUUID, IsEmail, IsPhoneNumber, IsObject, Min, Max } from 'class-validator';
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

export class CreateOrderDto {
  @ApiPropertyOptional({ description: 'User ID if order is for registered user' })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiProperty({ description: 'Primary organizer ID' })
  @IsUUID()
  primary_organizer_id: string;

  @ApiPropertyOptional({ description: 'Order status', enum: OrderStatus, default: OrderStatus.DRAFT })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus = OrderStatus.DRAFT;

  @ApiProperty({ description: 'Subtotal amount' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  subtotal_amount: number;

  @ApiPropertyOptional({ description: 'Discount amount', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discount_amount?: number = 0;

  @ApiPropertyOptional({ description: 'Tax amount', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  tax_amount?: number = 0;

  @ApiPropertyOptional({ description: 'Processing fee', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  processing_fee?: number = 0;

  @ApiProperty({ description: 'Total amount' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  total_amount: number;

  @ApiPropertyOptional({ description: 'Currency', default: 'TND' })
  @IsOptional()
  @IsString()
  currency?: string = 'TND';

  @ApiPropertyOptional({ description: 'Purchase channel', enum: PurchaseChannel, default: PurchaseChannel.WEB })
  @IsOptional()
  @IsEnum(PurchaseChannel)
  purchase_channel?: PurchaseChannel = PurchaseChannel.WEB;

  @ApiPropertyOptional({ description: 'Coupon code' })
  @IsOptional()
  @IsString()
  coupon_code?: string;

  @ApiPropertyOptional({ description: 'Guest name for guest orders' })
  @IsOptional()
  @IsString()
  guest_name?: string;

  @ApiPropertyOptional({ description: 'Guest email for guest orders' })
  @IsOptional()
  @IsEmail()
  guest_email?: string;

  @ApiPropertyOptional({ description: 'Guest phone for guest orders' })
  @IsOptional()
  @IsString()
  guest_phone?: string;

  @ApiPropertyOptional({ description: 'Order notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Order metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiPropertyOptional({ description: 'Order expiration date' })
  @IsOptional()
  @Type(() => Date)
  expires_at?: Date;
}
