// src/modules/qr-codes/dto/qr-codes/create-qr-code.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUUID, IsObject } from 'class-validator';
import { QRCodeType } from '../../interfaces/qr-code.interface';

export class CreateQRCodeDto {
  @ApiProperty({
    description: 'Code QR unique',
    example: 'QR-2024-001',
  })
  @IsString({ message: 'Le code QR doit être une chaîne de caractères' })
  code: string;

  @ApiProperty({
    description: 'Type de QR code',
    enum: QRCodeType,
    example: QRCodeType.SEAT,
  })
  @IsEnum(QRCodeType, { message: 'Le type doit être l\'un des types valides' })
  type: QRCodeType;

  @ApiPropertyOptional({
    description: 'Numéro de siège (optionnel)',
    example: 'A12',
  })
  @IsOptional()
  @IsString({ message: 'Le numéro de siège doit être une chaîne de caractères' })
  seat_number?: string;

  @ApiPropertyOptional({
    description: 'ID du lieu (optionnel)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID(4, { message: 'L\'ID du lieu doit être un UUID valide' })
  venue_id?: string;

  @ApiPropertyOptional({
    description: 'ID de l\'événement (optionnel)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID(4, { message: 'L\'ID de l\'événement doit être un UUID valide' })
  event_id?: string;

  @ApiPropertyOptional({
    description: 'Métadonnées supplémentaires',
    example: { location: 'Zone VIP', section: 'A' },
  })
  @IsOptional()
  @IsObject({ message: 'Les métadonnées doivent être un objet' })
  metadata?: Record<string, any>;
} 