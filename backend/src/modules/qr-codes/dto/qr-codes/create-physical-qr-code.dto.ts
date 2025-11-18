// src/modules/qr-codes/dto/qr-codes/create-physical-qr-code.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { QRCodeType } from '../../interfaces/qr-code.interface';

export enum QRCodeCreationMode {
  SINGULAR = 'SINGULAR',
  BULK = 'BULK',
}

export class CreatePhysicalQRCodeDto {
  @ApiProperty({
    description: 'Subscription plan ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID(4, { message: 'L\'ID du plan d\'abonnement doit être un UUID valide' })
  subscription_plan_id: string;

  @ApiProperty({
    description: 'Creation mode: SINGULAR or BULK',
    enum: QRCodeCreationMode,
    example: QRCodeCreationMode.SINGULAR,
  })
  @IsEnum(QRCodeCreationMode, { message: 'Le mode doit être SINGULAR ou BULK' })
  mode: QRCodeCreationMode;

  @ApiPropertyOptional({
    description: 'Number of QR codes to create (required for BULK mode)',
    example: 10,
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @IsInt({ message: 'Le nombre doit être un entier' })
  @Min(1, { message: 'Le nombre doit être au moins 1' })
  @Max(1000, { message: 'Le nombre ne peut pas dépasser 1000' })
  count?: number;

  @ApiPropertyOptional({
    description: 'Card type',
    example: 'STANDARD',
  })
  @IsOptional()
  @IsString({ message: 'Le type de carte doit être une chaîne de caractères' })
  card_type?: string;

  @ApiPropertyOptional({
    description: 'Card batch identifier',
    example: 'BATCH-2024-001',
  })
  @IsOptional()
  @IsString({ message: 'Le lot doit être une chaîne de caractères' })
  card_batch?: string;

  @ApiPropertyOptional({
    description: 'Zone ID override (if not provided, will be determined from subscription plan)',
    example: 'H0',
  })
  @IsOptional()
  @IsString({ message: 'La zone doit être une chaîne de caractères' })
  zone_id?: string;

  @ApiPropertyOptional({
    description: 'Suffix type override (SUB or SUBVB, if not provided, will be determined from subscription plan)',
    example: 'SUB',
  })
  @IsOptional()
  @IsString({ message: 'Le suffixe doit être SUB ou SUBVB' })
  suffix_type?: string;

  @ApiPropertyOptional({
    description: 'Seat row character (A, B, C, etc.) - required if subscription plan has seats',
    example: 'A',
  })
  @IsOptional()
  @IsString({ message: 'La rangée doit être un caractère' })
  seat_row?: string;

  @ApiPropertyOptional({
    description: 'Starting seat number (auto-incremented for bulk creation)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Le numéro de siège doit être un entier' })
  @Min(1, { message: 'Le numéro de siège doit être au moins 1' })
  seat_start_number?: number;

  @ApiPropertyOptional({
    description: 'Porte (gate) number (1-4) - only for subscription plans with no existing QR codes',
    example: 1,
    minimum: 1,
    maximum: 4,
  })
  @IsOptional()
  @IsInt({ message: 'Le numéro de porte doit être un entier' })
  @Min(1, { message: 'Le numéro de porte doit être au moins 1' })
  @Max(4, { message: 'Le numéro de porte ne peut pas dépasser 4' })
  porte?: number;
}

