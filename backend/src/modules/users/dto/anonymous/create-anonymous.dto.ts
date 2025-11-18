// src/modules/users/dto/anonymous/create-anonymous.dto.ts

import {
    IsString,
    IsEmail,
    IsOptional,
    IsPhoneNumber,
    IsIn,
    IsInt,
    IsDateString,
    IsObject,
    MinLength,
    MaxLength,
    Min,
    Max,
  } from 'class-validator';
  import { Transform } from 'class-transformer';
  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
  
  export class CreateAnonymousDto {
    @ApiProperty({
      description: 'Nom complet de l\'utilisateur anonyme',
      example: 'Ahmed Ben Salem',
      minLength: 2,
      maxLength: 200,
    })
    @IsString({ message: 'Le nom doit être une chaîne de caractères' })
    @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
    @MaxLength(200, { message: 'Le nom ne peut pas dépasser 200 caractères' })
    @Transform(({ value }) => value?.trim())
    guestName: string;
  
    @ApiProperty({
      description: 'Email de l\'utilisateur anonyme',
      example: 'ahmed.temp@gmail.com',
    })
    @IsEmail({}, { message: 'Format d\'email invalide' })
    @MaxLength(255, { message: 'L\'email ne peut pas dépasser 255 caractères' })
    @Transform(({ value }) => value?.toLowerCase()?.trim())
    guestEmail: string;
  
    @ApiPropertyOptional({
      description: 'Numéro de téléphone (optionnel)',
      example: '+21697123456',
    })
    @IsOptional()
    @IsString({ message: 'Le téléphone doit être une chaîne de caractères' })
    @MaxLength(20, { message: 'Le téléphone ne peut pas dépasser 20 caractères' })
    @Transform(({ value }) => value?.trim())
    guestPhone?: string;
  
    @ApiPropertyOptional({
      description: 'Type d\'incentive pour l\'onboarding',
      example: 'BONUS_POINTS',
      enum: ['BONUS_POINTS', 'DISCOUNT_NEXT', 'FREE_UPGRADE', 'EXCLUSIVE_ACCESS', 'GIFT_VOUCHER'],
    })
    @IsOptional()
    @IsString({ message: 'Le type d\'incentive doit être une chaîne de caractères' })
    @IsIn(['BONUS_POINTS', 'DISCOUNT_NEXT', 'FREE_UPGRADE', 'EXCLUSIVE_ACCESS', 'GIFT_VOUCHER'], {
      message: 'Type d\'incentive invalide',
    })
    incentiveType?: string;
  
    @ApiPropertyOptional({
      description: 'Valeur de l\'incentive',
      example: 100,
      minimum: 0,
      maximum: 10000,
    })
    @IsOptional()
    @IsInt({ message: 'La valeur de l\'incentive doit être un nombre entier' })
    @Min(0, { message: 'La valeur de l\'incentive doit être positive' })
    @Max(10000, { message: 'La valeur de l\'incentive ne peut pas dépasser 10000' })
    incentiveValue?: number;
  
    @ApiPropertyOptional({
      description: 'Description de l\'incentive',
      example: '100 points bonus à l\'inscription + accès ventes privées',
      maxLength: 500,
    })
    @IsOptional()
    @IsString({ message: 'La description doit être une chaîne de caractères' })
    @MaxLength(500, { message: 'La description ne peut pas dépasser 500 caractères' })
    @Transform(({ value }) => value?.trim())
    incentiveDescription?: string;
  
    @ApiPropertyOptional({
      description: 'Date d\'expiration de l\'incentive',
      example: '2025-12-31T23:59:59Z',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Format de date invalide' })
    expiresAt?: string;
  
    @ApiPropertyOptional({
      description: 'Métadonnées additionnelles',
      example: {
        source: 'event-purchase',
        eventId: 'evt-123',
        ticketType: 'STANDARD',
        campaign: 'summer2025'
      },
    })
    @IsOptional()
    @IsObject({ message: 'Les métadonnées doivent être un objet' })
    metadata?: Record<string, any>;
  }
  
  // DTO de réponse pour la création d'un utilisateur anonyme
  export class CreateAnonymousResponseDto {
    @ApiProperty({
      description: 'ID de l\'utilisateur anonyme créé',
      example: 'anon-123-456',
    })
    id: string;
  
    @ApiProperty({
      description: 'Nom de l\'utilisateur anonyme',
      example: 'Ahmed Ben Salem',
    })
    guestName: string;
  
    @ApiProperty({
      description: 'Email de l\'utilisateur anonyme',
      example: 'ahmed.temp@gmail.com',
    })
    guestEmail: string;
  
    @ApiPropertyOptional({
      description: 'Clé d\'onboarding générée',
      example: 'ONB_2025_EVT_XY9Z23',
    })
    onboardingKey?: string;
  
    @ApiPropertyOptional({
      description: 'Détails de l\'incentive',
      example: {
        type: 'BONUS_POINTS',
        value: 100,
        description: '100 points bonus à l\'inscription'
      },
    })
    incentive?: {
      type: string;
      value: number;
      description: string;
      expiresAt?: string;
    };
  
    @ApiProperty({
      description: 'Date de création',
      example: '2025-07-17T10:30:00Z',
    })
    createdAt: string;
  
    @ApiPropertyOptional({
      description: 'Lien d\'onboarding personnalisé',
      example: 'https://entrix.tn/onboard/ONB_2025_EVT_XY9Z23',
    })
    onboardingUrl?: string;
  }