// src/modules/auth/dto/register.dto.ts
/**
 * DTO pour l'inscription d'un nouvel utilisateur
 * 
 * Validation :
 * - Email unique et format valide
 * - Mot de passe sécurisé (complexité)
 * - Noms requis et formats valides
 * - Téléphone optionnel avec format international
 * - Acceptation conditions obligatoire
 * 
 * Sécurité :
 * - Validation mot de passe complexe
 * - Nettoyage et normalisation des données
 * - Vérification acceptation conditions
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { 
  IsEmail, 
  IsString, 
  IsNotEmpty, 
  MinLength, 
  MaxLength,
  IsOptional, 
  IsBoolean,
  Matches,
  IsPhoneNumber,
  ValidateIf
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Match } from '../../../common/decorators/match.decorator';

export class RegisterDto {
  /**
   * Adresse email (unique)
   */
  @ApiProperty({
    description: 'Adresse email unique de l\'utilisateur',
    example: 'nouveau.supporter@gmail.com',
    format: 'email',
    uniqueItems: true,
  })
  @IsEmail({}, { 
    message: 'L\'adresse email doit être valide' 
  })
  @IsNotEmpty({ 
    message: 'L\'email est requis' 
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @MaxLength(255, { 
    message: 'L\'email ne peut pas dépasser 255 caractères' 
  })
  email: string;

  /**
   * Mot de passe (complexité requise)
   */
  @ApiProperty({
    description: 'Mot de passe sécurisé (min 8 caractères, majuscule, minuscule, chiffre, caractère spécial)',
    example: 'MonMotDePasse123!',
    minLength: 8,
    maxLength: 128,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
  })
  @IsString({ 
    message: 'Le mot de passe doit être une chaîne de caractères' 
  })
  @IsNotEmpty({ 
    message: 'Le mot de passe est requis' 
  })
  @MinLength(8, { 
    message: 'Le mot de passe doit contenir au moins 8 caractères' 
  })
  @MaxLength(128, { 
    message: 'Le mot de passe ne peut pas dépasser 128 caractères' 
  })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'Le mot de passe doit contenir au moins : 1 minuscule, 1 majuscule, 1 chiffre et 1 caractère spécial (@$!%*?&)'
    }
  )
  password: string;

  /**
   * Confirmation du mot de passe
   */
  @ApiProperty({
    description: 'Confirmation du mot de passe (doit être identique)',
    example: 'MonMotDePasse123!',
  })
  @IsString({ 
    message: 'La confirmation doit être une chaîne de caractères' 
  })
  @IsNotEmpty({ 
    message: 'La confirmation du mot de passe est requise' 
  })
  @Match('password', { 
    message: 'Les mots de passe ne correspondent pas' 
  })
  passwordConfirm: string;

  /**
   * Prénom
   */
  @ApiProperty({
    description: 'Prénom de l\'utilisateur',
    example: 'Mohamed',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ 
    message: 'Le prénom doit être une chaîne de caractères' 
  })
  @IsNotEmpty({ 
    message: 'Le prénom est requis' 
  })
  @MinLength(2, { 
    message: 'Le prénom doit contenir au moins 2 caractères' 
  })
  @MaxLength(100, { 
    message: 'Le prénom ne peut pas dépasser 100 caractères' 
  })
  @Transform(({ value }) => value?.trim())
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
    message: 'Le prénom ne peut contenir que des lettres, espaces, apostrophes et tirets'
  })
  firstName: string;

  /**
   * Nom de famille
   */
  @ApiProperty({
    description: 'Nom de famille de l\'utilisateur',
    example: 'Ben Ali',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ 
    message: 'Le nom doit être une chaîne de caractères' 
  })
  @IsNotEmpty({ 
    message: 'Le nom est requis' 
  })
  @MinLength(2, { 
    message: 'Le nom doit contenir au moins 2 caractères' 
  })
  @MaxLength(100, { 
    message: 'Le nom ne peut pas dépasser 100 caractères' 
  })
  @Transform(({ value }) => value?.trim())
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
    message: 'Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets'
  })
  lastName: string;

  /**
   * Numéro de téléphone (optionnel)
   */
  @ApiPropertyOptional({
    description: 'Numéro de téléphone au format international',
    example: '+216 20 123 456',
    pattern: '^\\+[1-9]\\d{1,14}$',
  })
  @IsOptional()
  @IsString({ 
    message: 'Le téléphone doit être une chaîne de caractères' 
  })
  @Transform(({ value }) => value?.replace(/\s/g, ''))
  @IsPhoneNumber(null, { 
    message: 'Le numéro de téléphone doit être au format international valide (+216...)' 
  })
  phone?: string;

  /**
   * Acceptation des conditions d'utilisation
   */
  @ApiProperty({
    description: 'Acceptation des conditions d\'utilisation et politique de confidentialité',
    example: true,
  })
  @IsBoolean({ 
    message: 'L\'acceptation des conditions doit être un booléen' 
  })
  @IsNotEmpty({ 
    message: 'L\'acceptation des conditions est requise' 
  })
  @ValidateIf((o) => o.acceptTerms !== true)
  @Matches(/^true$/, {
    message: 'Vous devez accepter les conditions d\'utilisation pour vous inscrire'
  })
  acceptTerms: boolean;

  /**
   * Consentement marketing (optionnel)
   */
  @ApiPropertyOptional({
    description: 'Consentement pour recevoir des communications marketing',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ 
    message: 'Le consentement marketing doit être un booléen' 
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  marketingConsent?: boolean;

  /**
   * Langue préférée
   */
  @ApiPropertyOptional({
    description: 'Langue préférée de l\'utilisateur',
    example: 'fr',
    enum: ['fr', 'ar', 'en'],
    default: 'fr',
  })
  @IsOptional()
  @IsString({ 
    message: 'La langue doit être une chaîne de caractères' 
  })
  @Matches(/^(fr|ar|en)$/, {
    message: 'La langue doit être fr, ar ou en'
  })
  language?: string;

  /**
   * Source d'inscription (tracking)
   */
  @ApiPropertyOptional({
    description: 'Source d\'inscription pour le tracking',
    example: 'website',
    enum: ['website', 'mobile', 'facebook', 'google', 'referral'],
  })
  @IsOptional()
  @IsString()
  @Matches(/^(website|mobile|facebook|google|referral)$/, {
    message: 'La source doit être website, mobile, facebook, google ou referral'
  })
  source?: string;

  /**
   * Code de parrainage (optionnel)
   */
  @ApiPropertyOptional({
    description: 'Code de parrainage d\'un utilisateur existant',
    example: 'REF123456',
    minLength: 6,
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { 
    message: 'Le code de parrainage doit contenir au moins 6 caractères' 
  })
  @MaxLength(20, { 
    message: 'Le code de parrainage ne peut pas dépasser 20 caractères' 
  })
  @Matches(/^[A-Z0-9]+$/, {
    message: 'Le code de parrainage ne peut contenir que des lettres majuscules et des chiffres'
  })
  referralCode?: string;
}

/**
 * DTO pour vérification de disponibilité email
 */
export class CheckEmailAvailabilityDto {
  /**
   * Email à vérifier
   */
  @ApiProperty({
    description: 'Email à vérifier',
    example: 'test@example.com',
  })
  @IsEmail({}, { 
    message: 'L\'adresse email doit être valide' 
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;
}

/**
 * DTO pour vérification de force du mot de passe
 */
export class CheckPasswordStrengthDto {
  /**
   * Mot de passe à tester
   */
  @ApiProperty({
    description: 'Mot de passe à analyser',
    example: 'MonMotDePasse123!',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}