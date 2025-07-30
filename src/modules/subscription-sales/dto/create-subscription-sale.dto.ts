// src/modules/subscription-sales/dto/create-subscription-sale.dto.ts

import {
  IsUUID,
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsNumber,
  IsEnum,
  IsArray,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  Length,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Types
import { SaleMode, SaleChannel, PaymentMethod } from '../types/sale-types';

/**
 * DTO pour les informations client
 */
export class CustomerInfoDto {
  @ApiProperty({
    description: 'Prénom du client',
    example: 'Ahmed',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  @Length(2, 100, { message: 'Le prénom doit contenir entre 2 et 100 caractères' })
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @ApiProperty({
    description: 'Nom de famille du client',
    example: 'Ben Ali',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @Length(2, 100, { message: 'Le nom doit contenir entre 2 et 100 caractères' })
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @ApiProperty({
    description: 'Adresse email du client',
    example: 'ahmed.benali@email.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'L\'adresse email n\'est pas valide' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    description: 'Numéro de téléphone du client',
    example: '+21697123456',
  })
  @IsPhoneNumber(null, { message: 'Le numéro de téléphone n\'est pas valide' })
  @Transform(({ value }) => value?.trim())
  phone: string;

  @ApiPropertyOptional({
    description: 'ID fan du client (optionnel)',
    example: 'FAN_2025_001',
  })
  @IsOptional()
  @IsString({ message: 'Le fan ID doit être une chaîne de caractères' })
  @Length(1, 50, { message: 'Le fan ID ne peut pas dépasser 50 caractères' })
  @Transform(({ value }) => value?.trim().toUpperCase())
  fanId?: string;
}

/**
 * DTO principal pour création de vente d'abonnement
 */
export class CreateSubscriptionSaleDto {
  @ApiProperty({
    description: 'ID du plan d\'abonnement',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID(4, { message: 'L\'ID du plan doit être un UUID valide' })
  planId: string;

  @ApiProperty({
    description: 'Quantité d\'abonnements à vendre',
    example: 2,
    minimum: 1,
    maximum: 10,
  })
  @IsNumber({}, { message: 'La quantité doit être un nombre' })
  @Min(1, { message: 'La quantité doit être au moins 1' })
  @Max(10, { message: 'La quantité ne peut pas dépasser 10' })
  @Type(() => Number)
  quantity: number;

  @ApiProperty({
    description: 'QR codes des cartes physiques à assigner',
    example: ['QR_2025_ABC123', 'QR_2025_DEF456'],
    type: [String],
  })
  @IsArray({ message: 'Les QR codes doivent être fournis sous forme de tableau' })
  @ArrayMinSize(1, { message: 'Au moins un QR code doit être fourni' })
  @ArrayMaxSize(10, { message: 'Maximum 10 QR codes autorisés' })
  @IsString({ each: true, message: 'Chaque QR code doit être une chaîne de caractères' })
  @Length(10, 255, { each: true, message: 'Chaque QR code doit contenir entre 10 et 255 caractères' })
  qrCodes: string[];

  @ApiProperty({
    description: 'Mode de vente',
    enum: SaleMode,
    example: SaleMode.IDENTIFIED,
  })
  @IsEnum(SaleMode, { message: 'Mode de vente invalide' })
  saleMode: SaleMode;

  @ApiProperty({
    description: 'Canal de vente',
    enum: SaleChannel,
    example: SaleChannel.PHYSICAL,
  })
  @IsEnum(SaleChannel, { message: 'Canal de vente invalide' })
  saleChannel: SaleChannel;

  @ApiProperty({
    description: 'Méthode de paiement',
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  @IsEnum(PaymentMethod, { message: 'Méthode de paiement invalide' })
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Montant total de la vente',
    example: 150.00,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Le montant doit être un nombre avec maximum 2 décimales' })
  @Min(0, { message: 'Le montant ne peut pas être négatif' })
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    description: 'Devise',
    example: 'TND',
    minLength: 3,
    maxLength: 3,
  })
  @IsString({ message: 'La devise doit être une chaîne de caractères' })
  @Length(3, 3, { message: 'La devise doit contenir exactement 3 caractères' })
  @Transform(({ value }) => value?.toUpperCase())
  currency: string;

  @ApiPropertyOptional({
    description: 'Informations client (requis si saleMode = IDENTIFIED)',
    type: CustomerInfoDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customerInfo?: CustomerInfoDto;

  @ApiPropertyOptional({
    description: 'ID du vendeur (pour vente physique)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID(4, { message: 'L\'ID du vendeur doit être un UUID valide' })
  sellerId?: string;

  @ApiPropertyOptional({
    description: 'Métadonnées additionnelles',
    example: { location: 'Stand A', campaign: 'Summer2025' },
  })
  @IsOptional()
  @IsObject({ message: 'Les métadonnées doivent être un objet' })
  metadata?: Record<string, any>;
}