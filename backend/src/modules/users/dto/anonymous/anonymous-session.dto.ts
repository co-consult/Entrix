// src/modules/users/dto/anonymous/anonymous-session.dto.ts

import {
    IsString,
    IsOptional,
    IsObject,
    IsInt,
    Min,
    Max,
  } from 'class-validator';
  import { Transform } from 'class-transformer';
  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
  
  export class CreateAnonymousSessionDto {
    @ApiProperty({
      description: 'ID de l\'utilisateur anonyme',
      example: 'anon-123-456',
    })
    @IsString({ message: 'L\'ID utilisateur anonyme doit être une chaîne de caractères' })
    anonymousUserId: string;
  
    @ApiPropertyOptional({
      description: 'Adresse IP de la session',
      example: '192.168.1.100',
    })
    @IsOptional()
    @IsString({ message: 'L\'adresse IP doit être une chaîne de caractères' })
    ipAddress?: string;
  
    @ApiPropertyOptional({
      description: 'User Agent du navigateur',
      example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    })
    @IsOptional()
    @IsString({ message: 'Le User Agent doit être une chaîne de caractères' })
    userAgent?: string;
  
    @ApiPropertyOptional({
      description: 'Empreinte numérique de l\'appareil',
      example: 'fp_1234567890abcdef',
    })
    @IsOptional()
    @IsString({ message: 'L\'empreinte de l\'appareil doit être une chaîne de caractères' })
    deviceFingerprint?: string;
  
    @ApiPropertyOptional({
      description: 'Informations de géolocalisation',
      example: {
        country: 'TN',
        city: 'Tunis',
        latitude: 36.8189,
        longitude: 10.1658
      },
    })
    @IsOptional()
    @IsObject({ message: 'La géolocalisation doit être un objet' })
    geolocation?: {
      country?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
    };
  
    @ApiPropertyOptional({
      description: 'Durée de session souhaitée en minutes',
      example: 60,
      minimum: 5,
      maximum: 1440,
    })
    @IsOptional()
    @IsInt({ message: 'La durée de session doit être un nombre entier' })
    @Min(5, { message: 'La session doit durer au moins 5 minutes' })
    @Max(1440, { message: 'La session ne peut pas dépasser 24 heures' })
    durationMinutes?: number = 60;
  
    @ApiPropertyOptional({
      description: 'Métadonnées de session',
      example: {
        source: 'purchase-flow',
        referrer: 'https://google.com',
        utm_campaign: 'summer2025'
      },
    })
    @IsOptional()
    @IsObject({ message: 'Les métadonnées doivent être un objet' })
    metadata?: Record<string, any>;
  }
  
  export class UpdateAnonymousSessionDto {
    @ApiPropertyOptional({
      description: 'Dernière activité de la session',
      example: '2025-07-17T10:30:00Z',
    })
    @IsOptional()
    @IsString({ message: 'La dernière activité doit être une chaîne de caractères' })
    lastActivity?: string;
  
    @ApiPropertyOptional({
      description: 'Étendre la session de X minutes',
      example: 30,
      minimum: 1,
      maximum: 240,
    })
    @IsOptional()
    @IsInt({ message: 'L\'extension doit être un nombre entier' })
    @Min(1, { message: 'L\'extension doit être d\'au moins 1 minute' })
    @Max(240, { message: 'L\'extension ne peut pas dépasser 4 heures' })
    extendMinutes?: number;
  
    @ApiPropertyOptional({
      description: 'Nouvelles métadonnées à ajouter',
      example: { lastPage: '/checkout', cartItems: 2 },
    })
    @IsOptional()
    @IsObject({ message: 'Les métadonnées doivent être un objet' })
    metadata?: Record<string, any>;
  }
  
  // DTO de réponse pour une session anonyme
  export class AnonymousSessionResponseDto {
    @ApiProperty({
      description: 'ID de la session',
      example: 'sess-anon-123-456',
    })
    sessionId: string;
  
    @ApiProperty({
      description: 'Token de session',
      example: 'anon_token_1234567890abcdef',
    })
    sessionToken: string;
  
    @ApiProperty({
      description: 'ID de l\'utilisateur anonyme',
      example: 'anon-123-456',
    })
    anonymousUserId: string;
  
    @ApiProperty({
      description: 'Date d\'expiration de la session',
      example: '2025-07-17T11:30:00Z',
    })
    expiresAt: string;
  
    @ApiProperty({
      description: 'Statut de la session',
      example: 'ACTIVE',
      enum: ['ACTIVE', 'EXPIRED', 'REVOKED'],
    })
    status: string;
  
    @ApiPropertyOptional({
      description: 'Informations de l\'utilisateur anonyme',
      example: {
        guestName: 'Ahmed Ben Salem',
        guestEmail: 'ahmed.temp@gmail.com',
        onboardingKey: 'ONB_2025_EVT_XY9Z23',
        incentiveType: 'BONUS_POINTS'
      },
    })
    anonymousUser?: {
      guestName: string;
      guestEmail: string;
      onboardingKey?: string;
      incentiveType?: string;
      incentiveValue?: number;
      incentiveDescription?: string;
    };
  
    @ApiProperty({
      description: 'Date de création de la session',
      example: '2025-07-17T10:30:00Z',
    })
    createdAt: string;
  
    @ApiPropertyOptional({
      description: 'Dernière activité',
      example: '2025-07-17T10:45:00Z',
    })
    lastActivity?: string;
  
    @ApiPropertyOptional({
      description: 'Métadonnées de session',
      example: {
        source: 'purchase-flow',
        lastPage: '/events',
        actions: ['view_event', 'add_to_cart']
      },
    })
    metadata?: Record<string, any>;
  }