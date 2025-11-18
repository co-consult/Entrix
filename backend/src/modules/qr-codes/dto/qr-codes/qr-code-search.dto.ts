// src/modules/qr-codes/dto/qr-codes/qr-code-search.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUUID, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { QRCodeType, QRCodeStatus } from '../../interfaces/qr-code.interface';

export class QRCodeSearchDto {
  @ApiPropertyOptional({
    description: 'Recherche textuelle (code, siège, etc.)',
    example: 'QR-2024',
  })
  @IsOptional()
  @IsString({ message: 'La recherche doit être une chaîne de caractères' })
  query?: string;

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
    example: QRCodeStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(QRCodeStatus, { message: 'Le statut doit être l\'un des statuts valides' })
  status?: QRCodeStatus;

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
    description: 'ID de l\'abonnement',
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
    description: 'Numéro de siège',
    example: 'A12',
  })
  @IsOptional()
  @IsString({ message: 'Le numéro de siège doit être une chaîne de caractères' })
  seat_number?: string;

  @ApiPropertyOptional({
    description: 'Date de création après',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La date de création doit être une date valide' })
  created_after?: string;

  @ApiPropertyOptional({
    description: 'Date de création avant',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La date de création doit être une date valide' })
  created_before?: string;

  @ApiPropertyOptional({
    description: 'Date d\'assignation après',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La date d\'assignation doit être une date valide' })
  assigned_after?: string;

  @ApiPropertyOptional({
    description: 'Date d\'assignation avant',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La date d\'assignation doit être une date valide' })
  assigned_before?: string;

  @ApiPropertyOptional({
    description: 'Numéro de page',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Le numéro de page doit être un entier' })
  @Min(1, { message: 'Le numéro de page doit être au moins 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Nombre d\'éléments par page',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La limite doit être un entier' })
  @Min(1, { message: 'La limite doit être au moins 1' })
  @Max(100, { message: 'La limite ne peut pas dépasser 100' })
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Champ de tri',
    example: 'created_at',
  })
  @IsOptional()
  @IsString({ message: 'Le champ de tri doit être une chaîne de caractères' })
  sort_by?: string = 'created_at';

  @ApiPropertyOptional({
    description: 'Ordre de tri',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString({ message: 'L\'ordre de tri doit être une chaîne de caractères' })
  @Transform(({ value }) => value?.toLowerCase())
  sort_order?: 'asc' | 'desc' = 'desc';



  @ApiPropertyOptional({
    description: 'Filtrer par plan d\'abonnement (ID du plan ou "assigned"/"unassigned")',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString({ message: 'Le filtre de plan d\'abonnement doit être une chaîne de caractères' })
  subscription_plan_id?: string;
} 