// src/modules/users/dto/users/create-user.dto.ts

import {
  IsEmail,
  IsString,
  IsOptional,
  IsBoolean,
  IsPhoneNumber,
  MinLength,
  MaxLength,
  Matches,
  IsObject,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { USER_CONSTANTS } from '../../constants/user.constants';

export class CreateUserDto {
  @ApiProperty({
    description: 'Adresse email de l\'utilisateur',
    example: 'ahmed.ben.salem@gmail.com',
    maxLength: USER_CONSTANTS.VALIDATION.EMAIL.MAX_LENGTH,
  })
  @IsEmail({}, { message: 'Format d\'email invalide' })
  @MaxLength(USER_CONSTANTS.VALIDATION.EMAIL.MAX_LENGTH, {
    message: `L'email ne peut pas dépasser ${USER_CONSTANTS.VALIDATION.EMAIL.MAX_LENGTH} caractères`,
  })
  @Transform(({ value }) => value?.toLowerCase()?.trim())
  email: string;

  @ApiProperty({
    description: 'Mot de passe de l\'utilisateur',
    example: 'MotdepasseSecurise2024!',
    minLength: 8,
    maxLength: 128,
  })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @MaxLength(128, { message: 'Le mot de passe ne peut pas dépasser 128 caractères' })
  password: string;

  @ApiProperty({
    description: 'Prénom de l\'utilisateur',
    example: 'Ahmed',
    minLength: USER_CONSTANTS.VALIDATION.FIRST_NAME.MIN_LENGTH,
    maxLength: USER_CONSTANTS.VALIDATION.FIRST_NAME.MAX_LENGTH,
  })
  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  @MinLength(USER_CONSTANTS.VALIDATION.FIRST_NAME.MIN_LENGTH, {
    message: `Le prénom doit contenir au moins ${USER_CONSTANTS.VALIDATION.FIRST_NAME.MIN_LENGTH} caractères`,
  })
  @MaxLength(USER_CONSTANTS.VALIDATION.FIRST_NAME.MAX_LENGTH, {
    message: `Le prénom ne peut pas dépasser ${USER_CONSTANTS.VALIDATION.FIRST_NAME.MAX_LENGTH} caractères`,
  })
  @Transform(({ value }) => value?.trim())
  first_name: string;

  @ApiProperty({
    description: 'Nom de famille de l\'utilisateur',
    example: 'Ben Salem',
    minLength: USER_CONSTANTS.VALIDATION.LAST_NAME.MIN_LENGTH,
    maxLength: USER_CONSTANTS.VALIDATION.LAST_NAME.MAX_LENGTH,
  })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MinLength(USER_CONSTANTS.VALIDATION.LAST_NAME.MIN_LENGTH, {
    message: `Le nom doit contenir au moins ${USER_CONSTANTS.VALIDATION.LAST_NAME.MIN_LENGTH} caractères`,
  })
  @MaxLength(USER_CONSTANTS.VALIDATION.LAST_NAME.MAX_LENGTH, {
    message: `Le nom ne peut pas dépasser ${USER_CONSTANTS.VALIDATION.LAST_NAME.MAX_LENGTH} caractères`,
  })
  @Transform(({ value }) => value?.trim())
  last_name: string;

  @ApiPropertyOptional({
    description: 'Numéro de téléphone de l\'utilisateur',
    example: '+21697123456',
    maxLength: USER_CONSTANTS.VALIDATION.PHONE.MAX_LENGTH,
  })
  @IsOptional()
  @IsString({ message: 'Le téléphone doit être une chaîne de caractères' })
  @MaxLength(USER_CONSTANTS.VALIDATION.PHONE.MAX_LENGTH, {
    message: `Le téléphone ne peut pas dépasser ${USER_CONSTANTS.VALIDATION.PHONE.MAX_LENGTH} caractères`,
  })
  @Matches(USER_CONSTANTS.VALIDATION.PHONE.REGEX, {
    message: 'Format de téléphone invalide (ex: +21697123456)',
  })
  @Transform(({ value }) => value?.trim())
  phone?: string;

  @ApiPropertyOptional({
    description: 'URL de l\'avatar de l\'utilisateur',
    example: 'https://cdn.entrix.tn/avatars/user123.jpg',
  })
  @IsOptional()
  @IsString({ message: 'L\'avatar doit être une URL valide' })
  @Transform(({ value }) => value?.trim())
  avatar?: string;

  @ApiPropertyOptional({
    description: 'Statut d\'activation du compte',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'is_active doit être un booléen' })
  is_active?: boolean = true;

  @ApiPropertyOptional({
    description: 'Email vérifié',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'email_verified doit être un booléen' })
  email_verified?: boolean = false;

  @ApiPropertyOptional({
    description: 'Téléphone vérifié',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'phone_verified doit être un booléen' })
  phone_verified?: boolean = false;

  @ApiPropertyOptional({
    description: 'Métadonnées additionnelles en format JSON',
    example: { source: 'web', campaign: 'summer2025' },
  })
  @IsOptional()
  @IsObject({ message: 'Les métadonnées doivent être un objet JSON valide' })
  metadata?: Record<string, any>;
}