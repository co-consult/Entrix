// src/modules/auth/dto/auth/register.dto.ts

import { 
  IsEmail, 
  IsString, 
  MinLength, 
  MaxLength,
  Matches, 
  IsOptional, 
  IsBoolean,
  IsDateString,
  IsPhoneNumber,
  IsNotEmpty,
  Equals,
  ValidateIf
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AUTH_CONSTANTS } from '../../constants/auth.constants';

/**
 * DTO Register Request Entrix V3.0
 * Respecte api_specs_auth_session.md
 * CORRIGÉ : Utilise les validateurs corrects de class-validator
 */

export class RegisterDto {
  @ApiProperty({
    description: 'Email utilisateur',
    example: 'nouveau@entrix.tn',
    format: 'email',
    maxLength: AUTH_CONSTANTS.VALIDATION.EMAIL_MAX_LENGTH,
  })
  @IsEmail({}, { message: 'Format email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  @MaxLength(AUTH_CONSTANTS.VALIDATION.EMAIL_MAX_LENGTH, { 
    message: `Email trop long (max ${AUTH_CONSTANTS.VALIDATION.EMAIL_MAX_LENGTH} caractères)` 
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    description: 'Mot de passe sécurisé',
    minLength: AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH,
    maxLength: AUTH_CONSTANTS.VALIDATION.PASSWORD_MAX_LENGTH,
    pattern: AUTH_CONSTANTS.VALIDATION.PASSWORD_REGEX.source,
  })
  @IsString()
  @IsNotEmpty({ message: 'Mot de passe requis' })
  @MinLength(AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH, { 
    message: `Mot de passe minimum ${AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH} caractères` 
  })
  @MaxLength(AUTH_CONSTANTS.VALIDATION.PASSWORD_MAX_LENGTH, { 
    message: `Mot de passe maximum ${AUTH_CONSTANTS.VALIDATION.PASSWORD_MAX_LENGTH} caractères` 
  })
  @Matches(AUTH_CONSTANTS.VALIDATION.PASSWORD_REGEX, { 
    message: 'Mot de passe doit contenir majuscule, minuscule, chiffre et symbole' 
  })
  password: string;

  @ApiProperty({
    description: 'Prénom utilisateur',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Prénom requis' })
  @MinLength(2, { message: 'Prénom minimum 2 caractères' })
  @MaxLength(100, { message: 'Prénom maximum 100 caractères' })
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, { message: 'Prénom: caractères alphabétiques uniquement' })
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @ApiProperty({
    description: 'Nom de famille utilisateur',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Nom requis' })
  @MinLength(2, { message: 'Nom minimum 2 caractères' })
  @MaxLength(100, { message: 'Nom maximum 100 caractères' })
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, { message: 'Nom: caractères alphabétiques uniquement' })
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @ApiPropertyOptional({
    description: 'Numéro de téléphone (optionnel)',
    example: '+21612345678',
  })
  @IsOptional()
  @IsString({ message: 'Le téléphone doit être une chaîne de caractères' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Date de naissance',
    format: 'date',
    example: '1990-01-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Format date invalide (YYYY-MM-DD)' })
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Accepter communications marketing',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  marketingConsent?: boolean = false;

  @ApiPropertyOptional({
    description: 'Clé secrète onboarding (conversion anonyme)',
  })
  @IsOptional()
  @IsString()
  onboardingSecret?: string;

  @ApiProperty({
    description: 'Acceptation conditions obligatoire',
    default: true,
    enum: [true],
  })
  @IsBoolean({ message: 'Acceptation des conditions doit être un booléen' })
  @Equals(true, { message: 'Vous devez accepter les conditions d\'utilisation' })
  @Transform(({ value }) => value === 'true' || value === true)
  termsAccepted: boolean;
}

/**
 * Validateur custom pour vérifier l'acceptation des conditions
 * Alternative si Equals(true) ne fonctionne pas
 */
export class RegisterDtoAlternative {
  // ... autres champs identiques ...

  @ApiProperty({
    description: 'Acceptation conditions obligatoire',
    default: true,
  })
  @IsBoolean({ message: 'Acceptation des conditions doit être un booléen' })
  @ValidateIf((o) => o.termsAccepted !== true)
  @Equals(true, { message: 'Vous devez accepter les conditions d\'utilisation' })
  @Transform(({ value }) => value === 'true' || value === true)
  termsAccepted: boolean;
}

/**
 * Version avec validateur personnalisé si les validateurs standards posent problème
 */
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

function MustBeTrue(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'mustBeTrue',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return value === true;
        },
        defaultMessage(args: ValidationArguments) {
          return 'Vous devez accepter les conditions d\'utilisation';
        },
      },
    });
  };
}

export class RegisterDtoCustomValidator {
  // ... autres champs identiques ...

  @ApiProperty({
    description: 'Acceptation conditions obligatoire',
    default: true,
  })
  @IsBoolean({ message: 'Acceptation des conditions doit être un booléen' })
  @MustBeTrue({ message: 'Vous devez accepter les conditions d\'utilisation' })
  @Transform(({ value }) => value === 'true' || value === true)
  termsAccepted: boolean;
}