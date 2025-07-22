// src/modules/users/dto/users/user-preferences.dto.ts

import {
    IsString,
    IsOptional,
    IsArray,
    IsObject,
    IsBoolean,
    IsIn,
    ValidateNested,
    IsNumber,
    Min,
    Max,
  } from 'class-validator';
  import { Type } from 'class-transformer';
  import { ApiPropertyOptional } from '@nestjs/swagger';
  
  class PriceRangeDto {
    @ApiPropertyOptional({
      description: 'Prix minimum (TND)',
      example: 10,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Le prix minimum doit être un nombre' })
    @Min(0, { message: 'Le prix minimum doit être positif' })
    min?: number;
  
    @ApiPropertyOptional({
      description: 'Prix maximum (TND)',
      example: 500,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Le prix maximum doit être un nombre' })
    @Min(0, { message: 'Le prix maximum doit être positif' })
    max?: number;
  }
  
  class LocationPreferenceDto {
    @ApiPropertyOptional({
      description: 'Ville préférée',
      example: 'Tunis',
    })
    @IsOptional()
    @IsString({ message: 'La ville doit être une chaîne de caractères' })
    city?: string;
  
    @ApiPropertyOptional({
      description: 'Rayon de recherche (km)',
      example: 50,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Le rayon doit être un nombre' })
    @Min(1, { message: 'Le rayon doit être au moins 1 km' })
    @Max(500, { message: 'Le rayon ne peut pas dépasser 500 km' })
    radius?: number;
  }
  
  class EventPreferencesDto {
    @ApiPropertyOptional({
      description: 'Types d\'événements préférés',
      example: ['SPORT', 'MUSIC', 'CULTURE'],
    })
    @IsOptional()
    @IsArray({ message: 'Les types d\'événements doivent être un tableau' })
    @IsString({ each: true, message: 'Chaque type d\'événement doit être une chaîne' })
    eventTypes?: string[];
  
    @ApiPropertyOptional({
      description: 'Lieux favoris',
      example: ['venue-001', 'venue-002'],
    })
    @IsOptional()
    @IsArray({ message: 'Les lieux favoris doivent être un tableau' })
    @IsString({ each: true, message: 'Chaque lieu doit être une chaîne' })
    favoriteVenues?: string[];
  
    @ApiPropertyOptional({
      description: 'Gamme de prix préférée',
      type: PriceRangeDto,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => PriceRangeDto)
    priceRange?: PriceRangeDto;
  
    @ApiPropertyOptional({
      description: 'Préférence de localisation',
      type: LocationPreferenceDto,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => LocationPreferenceDto)
    location?: LocationPreferenceDto;
  }
  
  class AccessibilityPreferencesDto {
    @ApiPropertyOptional({
      description: 'Texte agrandi',
      example: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'largeText doit être un booléen' })
    largeText?: boolean;
  
    @ApiPropertyOptional({
      description: 'Contraste élevé',
      example: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'highContrast doit être un booléen' })
    highContrast?: boolean;
  
    @ApiPropertyOptional({
      description: 'Lecteur d\'écran',
      example: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'screenReader doit être un booléen' })
    screenReader?: boolean;
  
    @ApiPropertyOptional({
      description: 'Accès fauteuil roulant requis',
      example: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'wheelchairAccess doit être un booléen' })
    wheelchairAccess?: boolean;
  }
  
  export class UserPreferencesDto {
    @ApiPropertyOptional({
      description: 'Langue préférée',
      example: 'fr',
      enum: ['fr', 'ar', 'en'],
    })
    @IsOptional()
    @IsString({ message: 'La langue doit être une chaîne de caractères' })
    @IsIn(['fr', 'ar', 'en'], {
      message: 'La langue doit être fr, ar ou en',
    })
    language?: string;
  
    @ApiPropertyOptional({
      description: 'Fuseau horaire',
      example: 'Africa/Tunis',
    })
    @IsOptional()
    @IsString({ message: 'Le fuseau horaire doit être une chaîne de caractères' })
    timezone?: string;
  
    @ApiPropertyOptional({
      description: 'Devise préférée',
      example: 'TND',
      enum: ['TND', 'EUR', 'USD'],
    })
    @IsOptional()
    @IsString({ message: 'La devise doit être une chaîne de caractères' })
    @IsIn(['TND', 'EUR', 'USD'], {
      message: 'La devise doit être TND, EUR ou USD',
    })
    currency?: string;
  
    @ApiPropertyOptional({
      description: 'Format de date',
      example: 'DD/MM/YYYY',
      enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
    })
    @IsOptional()
    @IsString({ message: 'Le format de date doit être une chaîne de caractères' })
    @IsIn(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'], {
      message: 'Format de date invalide',
    })
    dateFormat?: string;
  
    @ApiPropertyOptional({
      description: 'Préférences d\'événements',
      type: EventPreferencesDto,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => EventPreferencesDto)
    eventPreferences?: EventPreferencesDto;
  
    @ApiPropertyOptional({
      description: 'Préférences d\'accessibilité',
      type: AccessibilityPreferencesDto,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => AccessibilityPreferencesDto)
    accessibility?: AccessibilityPreferencesDto;
  
    @ApiPropertyOptional({
      description: 'Champs personnalisés',
      example: { newsletter: true, smsAlerts: false },
    })
    @IsOptional()
    @IsObject({ message: 'Les champs personnalisés doivent être un objet' })
    customFields?: Record<string, any>;
  }