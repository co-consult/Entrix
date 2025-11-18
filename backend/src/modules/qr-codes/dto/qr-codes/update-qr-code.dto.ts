// src/modules/qr-codes/dto/qr-codes/update-qr-code.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUUID, IsObject, IsDateString } from 'class-validator';
import { QRCodeType, QRCodeStatus } from '../../interfaces/qr-code.interface';

export class UpdateQRCodeDto {
  @ApiPropertyOptional({
    description: 'Code QR unique',
    example: 'QR-2024-001',
  })
  @IsOptional()
  @IsString({ message: 'Le code QR doit être une chaîne de caractères' })
  code?: string;

  @ApiPropertyOptional({
    description: 'Type de QR code',
    enum: QRCodeType,
    example: QRCodeType.SEAT,
  })
  @IsOptional()
  @IsEnum(QRCodeType, { message: 'Le type doit être l\'un des types valides' })
  type?: QRCodeType;

  @ApiPropertyOptional({
    description: 'Statut du QR code',
    enum: QRCodeStatus,
    example: QRCodeStatus.ASSIGNED,
  })
  @IsOptional()
  @IsEnum(QRCodeStatus, { message: 'Le statut doit être l\'un des statuts valides' })
  status?: QRCodeStatus;

  @ApiPropertyOptional({
    description: 'Numéro de siège',
    example: 'A12',
  })
  @IsOptional()
  @IsString({ message: 'Le numéro de siège doit être une chaîne de caractères' })
  seat_number?: string;

  @ApiPropertyOptional({
    description: 'ID du lieu',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID(4, { message: 'L\'ID du lieu doit être un UUID valide' })
  venue_id?: string;

  @ApiPropertyOptional({
    description: 'ID de l\'événement',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID(4, { message: 'L\'ID de l\'événement doit être un UUID valide' })
  event_id?: string;

  @ApiPropertyOptional({
    description: 'ID de l\'abonnement assigné',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID(4, { message: 'L\'ID de l\'abonnement doit être un UUID valide' })
  subscription_id?: string;

  @ApiPropertyOptional({
    description: 'ID de l\'utilisateur assigné',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID(4, { message: 'L\'ID de l\'utilisateur doit être un UUID valide' })
  assigned_to?: string;

  @ApiPropertyOptional({
    description: 'Date d\'assignation',
    example: '2024-01-15T10:30:00Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La date d\'assignation doit être une date valide' })
  assigned_at?: string;

  @ApiPropertyOptional({
    description: 'Métadonnées supplémentaires',
    example: { location: 'Zone VIP', section: 'A' },
  })
  @IsOptional()
  @IsObject({ message: 'Les métadonnées doivent être un objet' })
  metadata?: Record<string, any>;
} 