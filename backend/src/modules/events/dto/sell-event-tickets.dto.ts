import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max, IsUUID, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class SellEventTicketsDto {
  @ApiProperty({ description: 'Ticket type ID (tier)' })
  @IsUUID()
  ticket_type_id: string;

  @ApiPropertyOptional({ description: 'Zone ID (null = all zones tier)' })
  @IsOptional()
  @IsString()
  zone_id?: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ enum: ['CASH', 'CARD', 'FLOUCI', 'BANK_TRANSFER', 'CHEQUE'] })
  @IsIn(['CASH', 'CARD', 'FLOUCI', 'BANK_TRANSFER', 'CHEQUE'])
  payment_method: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  guest_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  guest_phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  guest_email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class ListEventTicketSalesQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
