// src/modules/users/dto/anonymous/convert-anonymous.dto.ts

import {
    IsString,
    IsEmail,
    IsOptional,
    IsBoolean,
    IsDateString,
    IsIn,
    MinLength,
    MaxLength,
    Matches,
    ValidateNested,
  } from 'class-validator';
  import { Transform, Type } from 'class-transformer';
  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
  import { USER_CONSTANTS } from '../../constants/user.constants';
  
  class ConversionProfileDataDto {
    @ApiPropertyOptional({
      description: 'Ville de résidence',
      example: 'Tunis',
    })
    @IsOptional()
    @IsString({ message: 'La ville doit être une chaîne de caractères' })
    @MaxLength(100, { message: 'La ville ne peut pas dépasser 100 caractères' })
    @Transform(({ value }) => value?.trim())
    city?: string;
  
    @ApiPropertyOptional({
      description: 'Pays de résidence (code ISO)',
      example: 'TN',
    })
    @IsOptional()
    @IsString({ message: 'Le pays doit être une chaîne de caractères' })
    @MinLength(2, { message: 'Le code pays doit contenir 2 caractères' })
    @MaxLength(2, { message: 'Le code pays doit contenir 2 caractères' })
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    country?: string;
  
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
      description: 'Date de naissance',
      example: '1990-05-15',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Format de date invalide (YYYY-MM-DD)' })
    dateOfBirth?: string;
  
    @ApiPropertyOptional({
      description: 'Genre',
      example: 'M',
      enum: ['M', 'F', 'OTHER', 'PREFER_NOT_TO_SAY'],
    })
    @IsOptional()
    @IsString({ message: 'Le genre doit être une chaîne de caractères' })
    @IsIn(['M', 'F', 'OTHER', 'PREFER_NOT_TO_SAY'], {
      message: 'Le genre doit être M, F, OTHER ou PREFER_NOT_TO_SAY',
    })
    gender?: string;
  }
  
  export class ConvertAnonymousDto {
    @ApiProperty({
      description: 'Clé d\'onboarding secrète',
      example: 'ONB_2025_EVT_XY9Z23',
    })
    @IsString({ message: 'La clé d\'onboarding doit être une chaîne de caractères' })
    @MinLength(10, { message: 'La clé d\'onboarding doit contenir au moins 10 caractères' })
    @MaxLength(50, { message: 'La clé d\'onboarding ne peut pas dépasser 50 caractères' })
    @Transform(({ value }) => value?.trim()?.toUpperCase())
    onboardingKey: string;
  
    @ApiProperty({
      description: 'Prénom de l\'utilisateur',
      example: 'Ahmed',
    })
    @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
    @MinLength(USER_CONSTANTS.VALIDATION.FIRST_NAME.MIN_LENGTH, {
      message: `Le prénom doit contenir au moins ${USER_CONSTANTS.VALIDATION.FIRST_NAME.MIN_LENGTH} caractères`,
    })
    @MaxLength(USER_CONSTANTS.VALIDATION.FIRST_NAME.MAX_LENGTH, {
      message: `Le prénom ne peut pas dépasser ${USER_CONSTANTS.VALIDATION.FIRST_NAME.MAX_LENGTH} caractères`,
    })
    @Transform(({ value }) => value?.trim())
    firstName: string;
  
    @ApiProperty({
      description: 'Nom de famille de l\'utilisateur',
      example: 'Ben Salem',
    })
    @IsString({ message: 'Le nom doit être une chaîne de caractères' })
    @MinLength(USER_CONSTANTS.VALIDATION.LAST_NAME.MIN_LENGTH, {
      message: `Le nom doit contenir au moins ${USER_CONSTANTS.VALIDATION.LAST_NAME.MIN_LENGTH} caractères`,
    })
    @MaxLength(USER_CONSTANTS.VALIDATION.LAST_NAME.MAX_LENGTH, {
      message: `Le nom ne peut pas dépasser ${USER_CONSTANTS.VALIDATION.LAST_NAME.MAX_LENGTH} caractères`,
    })
    @Transform(({ value }) => value?.trim())
    lastName: string;
  
    @ApiProperty({
      description: 'Adresse email (doit correspondre à l\'email anonyme)',
      example: 'ahmed.temp@gmail.com',
    })
    @IsEmail({}, { message: 'Format d\'email invalide' })
    @MaxLength(USER_CONSTANTS.VALIDATION.EMAIL.MAX_LENGTH, {
      message: `L'email ne peut pas dépasser ${USER_CONSTANTS.VALIDATION.EMAIL.MAX_LENGTH} caractères`,
    })
    @Transform(({ value }) => value?.toLowerCase()?.trim())
    email: string;
  
    @ApiPropertyOptional({
      description: 'Numéro de téléphone',
      example: '+21697123456',
    })
    @IsOptional()
    @IsString({ message: 'Le téléphone doit être une chaîne de caractères' })
    @MaxLength(USER_CONSTANTS.VALIDATION.PHONE.MAX_LENGTH, {
      message: `Le téléphone ne peut pas dépasser ${USER_CONSTANTS.VALIDATION.PHONE.MAX_LENGTH} caractères`,
    })
    @Matches(USER_CONSTANTS.VALIDATION.PHONE.REGEX, {
      message: 'Format de téléphone invalide',
    })
    @Transform(({ value }) => value?.trim())
    phone?: string;
  
    @ApiProperty({
      description: 'Mot de passe',
      minLength: USER_CONSTANTS.VALIDATION.PASSWORD.MIN_LENGTH,
      maxLength: USER_CONSTANTS.VALIDATION.PASSWORD.MAX_LENGTH,
    })
    @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
    @MinLength(USER_CONSTANTS.VALIDATION.PASSWORD.MIN_LENGTH, {
      message: `Le mot de passe doit contenir au moins ${USER_CONSTANTS.VALIDATION.PASSWORD.MIN_LENGTH} caractères`,
    })
    @MaxLength(USER_CONSTANTS.VALIDATION.PASSWORD.MAX_LENGTH, {
      message: `Le mot de passe ne peut pas dépasser ${USER_CONSTANTS.VALIDATION.PASSWORD.MAX_LENGTH} caractères`,
    })
    password: string;
  
    @ApiPropertyOptional({
      description: 'Données de profil additionnelles',
      type: ConversionProfileDataDto,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => ConversionProfileDataDto)
    profileData?: ConversionProfileDataDto;
  
    @ApiProperty({
      description: 'Acceptation des conditions générales',
      example: true,
    })
    @IsBoolean({ message: 'L\'acceptation des conditions doit être un booléen' })
    acceptedTerms: boolean;
  
    @ApiPropertyOptional({
      description: 'Consentement marketing',
      example: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'Le consentement marketing doit être un booléen' })
    marketingConsent?: boolean = false;
  }
  
  // DTO de réponse pour la conversion
  export class ConvertAnonymousResponseDto {
    @ApiProperty({
      description: 'Succès de la conversion',
      example: true,
    })
    success: boolean;
  
    @ApiPropertyOptional({
      description: 'Utilisateur créé',
      example: {
        id: 'user-123-456',
        email: 'ahmed.temp@gmail.com',
        firstName: 'Ahmed',
        lastName: 'Ben Salem'
      },
    })
    user?: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
      avatar?: string;
      createdAt: string;
    };
  
    @ApiProperty({
      description: 'Incentive appliqué avec succès',
      example: true,
    })
    incentiveApplied: boolean;
  
    @ApiPropertyOptional({
      description: 'Détails de l\'incentive appliqué',
      example: {
        type: 'BONUS_POINTS',
        value: 100,
        description: '100 points bonus pour votre inscription'
      },
    })
    incentiveDetails?: {
      type: string;
      value: number;
      description: string;
    };
  
    @ApiPropertyOptional({
      description: 'Erreurs rencontrées lors de la conversion',
      example: [],
    })
    errors?: string[];
  
    @ApiPropertyOptional({
      description: 'Résumé de la migration des données',
      example: {
        ticketsMigrated: 2,
        subscriptionsMigrated: 1,
        ordersMigrated: 3
      },
    })
    migrationSummary?: {
      ticketsMigrated: number;
      subscriptionsMigrated: number;
      ordersMigrated: number;
    };
  
    @ApiPropertyOptional({
      description: 'Token d\'authentification pour connexion automatique',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    accessToken?: string;
  
    @ApiPropertyOptional({
      description: 'Prochaines étapes recommandées',
      example: [
        'Compléter votre profil',
        'Ajouter une photo',
        'Explorer les événements recommandés'
      ],
    })
    nextSteps?: string[];
  }