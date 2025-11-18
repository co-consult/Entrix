import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, IsUUID, IsObject, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum OrderItemType {
  SUBSCRIPTION = 'SUBSCRIPTION',
  TICKET = 'TICKET',
  MERCHANDISE = 'MERCHANDISE',
  PARKING = 'PARKING',
  HOSPITALITY = 'HOSPITALITY',
  MEMBERSHIP = 'MEMBERSHIP',
  UPGRADE = 'UPGRADE',
  FEE = 'FEE',
  SERVICE = 'SERVICE',
  INSURANCE = 'INSURANCE',
}

export class CreateOrderItemDto {
  @ApiProperty({ description: 'Item type', enum: OrderItemType })
  @IsEnum(OrderItemType)
  item_type: OrderItemType;

  @ApiProperty({ description: 'Item name' })
  @IsString()
  item_name: string;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ description: 'Unit price' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unit_price: number;

  @ApiPropertyOptional({ description: 'Discount amount', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discount_amount?: number = 0;

  @ApiPropertyOptional({ description: 'Currency', default: 'TND' })
  @IsOptional()
  @IsString()
  currency?: string = 'TND';

  @ApiPropertyOptional({ description: 'Subscription plan ID' })
  @IsOptional()
  @IsUUID()
  subscription_plan_id?: string;

  @ApiPropertyOptional({ description: 'Ticket type ID' })
  @IsOptional()
  @IsUUID()
  ticket_type_id?: string;

  @ApiPropertyOptional({ description: 'Event ID' })
  @IsOptional()
  @IsUUID()
  event_id?: string;

  @ApiPropertyOptional({ description: 'Item configuration' })
  @IsOptional()
  @IsObject()
  item_configuration?: any;

  @ApiPropertyOptional({ description: 'Item metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class UpdateOrderItemDto {
  @ApiPropertyOptional({ description: 'Item type', enum: OrderItemType })
  @IsOptional()
  @IsEnum(OrderItemType)
  item_type?: OrderItemType;

  @ApiPropertyOptional({ description: 'Item name' })
  @IsOptional()
  @IsString()
  item_name?: string;

  @ApiPropertyOptional({ description: 'Quantity' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Unit price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unit_price?: number;

  @ApiPropertyOptional({ description: 'Discount amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discount_amount?: number;

  @ApiPropertyOptional({ description: 'Currency' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Subscription plan ID' })
  @IsOptional()
  @IsUUID()
  subscription_plan_id?: string;

  @ApiPropertyOptional({ description: 'Ticket type ID' })
  @IsOptional()
  @IsUUID()
  ticket_type_id?: string;

  @ApiPropertyOptional({ description: 'Event ID' })
  @IsOptional()
  @IsUUID()
  event_id?: string;

  @ApiPropertyOptional({ description: 'Item configuration' })
  @IsOptional()
  @IsObject()
  item_configuration?: any;

  @ApiPropertyOptional({ description: 'Item metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;
}
