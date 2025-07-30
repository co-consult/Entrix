// src/modules/users/dto/profiles/create-profile.dto.ts

import {
  IsString,
  IsOptional,
  IsDateString,
  IsIn,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

// DTO pour les préférences utilisateur
export class ProfilePreferencesDto {
  @ApiPropertyOptional({
    description: 'Autoriser les notifications par email',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'La valeur doit être un booléen' })
  emailNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Autoriser les notifications push',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'La valeur doit être un booléen' })
  pushNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Profil visible publiquement',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'La valeur doit être un booléen' })
  publicProfile?: boolean;

  @ApiPropertyOptional({
    description: 'Paramètres de confidentialité',
  })
  @IsOptional()
  privacy?: {
    showEmail?: boolean;
    showPhone?: boolean;
    showActivity?: boolean;
    allowFriendRequests?: boolean;
    showPurchaseHistory?: boolean;
  };
}

export class CreateProfileDto {
  @ApiProperty({
    description: 'ID de l\'utilisateur associé',
    example: 'user-123-456',
  })
  @IsString({ message: 'L\'ID utilisateur doit être une chaîne de caractères' })
  userId: string;

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

  @ApiPropertyOptional({
    description: 'Ville de résidence',
    example: 'Tunis',
  })
  @IsOptional()
  @IsString({ message: 'La ville doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'La ville ne peut pas dépasser 100 caractères' })
  @Transform(({ value }) => value?.trim())
  city?: string;

  @ApiProperty({
    description: 'Pays de résidence (code ISO 2 lettres)',
    example: 'TN',
  })
  @IsString({ message: 'Le pays doit être une chaîne de caractères' })
  @MinLength(2, { message: 'Le code pays doit contenir 2 caractères' })
  @MaxLength(2, { message: 'Le code pays doit contenir 2 caractères' })
  @Transform(({ value }) => value?.toUpperCase()?.trim())
  country: string;

  @ApiProperty({
    description: 'Langue principale',
    example: 'fr',
    enum: ['fr', 'ar', 'en'],
  })
  @IsString({ message: 'La langue doit être une chaîne de caractères' })
  @IsIn(['fr', 'ar', 'en'], {
    message: 'La langue doit être fr, ar ou en',
  })
  language: string;

  @ApiPropertyOptional({
    description: 'Profession/Métier',
    example: 'Ingénieur informatique',
  })
  @IsOptional()
  @IsString({ message: 'La profession doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'La profession ne peut pas dépasser 100 caractères' })
  @Transform(({ value }) => value?.trim())
  occupation?: string;

  @ApiPropertyOptional({
    description: 'Niveau d\'éducation',
    example: 'BAC+5',
    enum: ['PRIMARY', 'SECONDARY', 'BAC', 'BAC+2', 'BAC+3', 'BAC+5', 'BAC+8', 'OTHER'],
  })
  @IsOptional()
  @IsString({ message: 'Le niveau d\'éducation doit être une chaîne de caractères' })
  @IsIn(['PRIMARY', 'SECONDARY', 'BAC', 'BAC+2', 'BAC+3', 'BAC+5', 'BAC+8', 'OTHER'], {
    message: 'Niveau d\'éducation invalide',
  })
  educationLevel?: string;

  @ApiPropertyOptional({
    description: 'Biographie/Description personnelle',
    example: 'Passionné de football et supporter du Club Africain depuis toujours !',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'La biographie doit être une chaîne de caractères' })
  @MaxLength(500, { message: 'La biographie ne peut pas dépasser 500 caractères' })
  @Transform(({ value }) => value?.trim())
  bio?: string;

  @ApiPropertyOptional({
    description: 'Site web personnel',
    example: 'https://mon-site.com',
  })
  @IsOptional()
  @IsUrl({}, { message: 'L\'URL du site web n\'est pas valide' })
  @Transform(({ value }) => value?.trim())
  website?: string;

  @ApiPropertyOptional({
    description: 'ID de l\'équipe favorite',
    example: 'team-club-africain',
  })
  @IsOptional()
  @IsString({ message: 'L\'ID de l\'équipe favorite doit être une chaîne de caractères' })
  favoriteTeamId?: string;

  @ApiPropertyOptional({
    description: 'Date depuis laquelle supporter de l\'équipe',
    example: '2010-01-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Format de date invalide (YYYY-MM-DD)' })
  supporterSince?: string;

  @ApiPropertyOptional({
    description: 'ID Fan - Identifiant unique du supporter',
    example: 'FAN_2025_001',
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'Le fan ID doit être une chaîne de caractères' })
  @MaxLength(50, { message: 'Le fan ID ne peut pas dépasser 50 caractères' })
  @Transform(({ value }) => value?.trim().toUpperCase())
  fanId?: string;

  @ApiPropertyOptional({
    description: 'Préférences utilisateur',
    type: ProfilePreferencesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProfilePreferencesDto)
  preferences?: ProfilePreferencesDto;
}