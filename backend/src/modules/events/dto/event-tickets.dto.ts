import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertEventTicketConfigDto {
  @ApiPropertyOptional({ description: 'Zone ID for zone-specific pricing' })
  @IsOptional()
  @IsString()
  zone_id?: string;

  @ApiProperty({ description: 'Ticket type display name', example: 'Standard' })
  @IsString()
  ticket_type_name: string;

  @ApiProperty({ description: 'Price in TND', example: 25 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({ description: 'Available quantity for this config' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  available_quantity?: number;
}

export class GenerateEventTicketsBatchDto {
  @ApiPropertyOptional({ description: 'Zone ID' })
  @IsOptional()
  @IsString()
  zone_id?: string;

  @ApiProperty({ description: 'Number of tickets to generate', example: 10 })
  @IsInt()
  @Min(1)
  @Max(5000)
  @Type(() => Number)
  count: number;

  @ApiProperty({ description: 'Price per ticket', example: 25 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({ description: 'Ticket type name', example: 'Standard' })
  @IsOptional()
  @IsString()
  ticket_type_name?: string;

  @ApiPropertyOptional({ description: 'Existing ticket type ID' })
  @IsOptional()
  @IsUUID()
  ticket_type_id?: string;
}
