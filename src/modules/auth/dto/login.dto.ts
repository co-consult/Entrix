// src/modules/auth/dto/login.dto.ts
/**
 * DTO pour la connexion utilisateur
 * 
 * Validation :
 * - Email format valide et requis
 * - Mot de passe requis avec longueur minimale
 * - Options de connexion (remember me, device info)
 * 
 * Sécurité :
 * - Pas d'exposition du mot de passe dans les logs
 * - Validation stricte des formats
 * - Rate limiting appliqué au niveau controller
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { 
  IsEmail, 
  IsString, 
  IsNotEmpty, 
  MinLength, 
  IsOptional, 
  IsBoolean,
  MaxLength,
  Matches
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  /**
   * Adresse email de l'utilisateur
   */
  @ApiProperty({
    description: 'Adresse email de l\'utilisateur',
    example: 'mohamed.supporter@gmail.com',
    format: 'email',
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
   * Mot de passe de l'utilisateur
   */
  @ApiProperty({
    description: 'Mot de passe de l\'utilisateur',
    example: 'MonMotDePasse123!',
    minLength: 6,
    maxLength: 128,
  })
  @IsString({ 
    message: 'Le mot de passe doit être une chaîne de caractères' 
  })
  @IsNotEmpty({ 
    message: 'Le mot de passe est requis' 
  })
  @MinLength(6, { 
    message: 'Le mot de passe doit contenir au moins 6 caractères' 
  })
  @MaxLength(128, { 
    message: 'Le mot de passe ne peut pas dépasser 128 caractères' 
  })
  password: string;

  /**
   * Se souvenir de moi (session étendue)
   */
  @ApiPropertyOptional({
    description: 'Se souvenir de moi pour une session étendue',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ 
    message: 'La valeur doit être un booléen' 
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  rememberMe?: boolean;

  /**
   * Empreinte du device pour la sécurité
   */
  @ApiPropertyOptional({
    description: 'Empreinte unique du device pour la sécurité',
    example: 'fp_1234567890abcdef',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ 
    message: 'L\'empreinte device doit être une chaîne de caractères' 
  })
  @MaxLength(255, { 
    message: 'L\'empreinte device ne peut pas dépasser 255 caractères' 
  })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'L\'empreinte device contient des caractères invalides'
  })
  deviceFingerprint?: string;

  /**
   * Code MFA si requis
   */
  @ApiPropertyOptional({
    description: 'Code MFA si l\'authentification multi-facteurs est activée',
    example: '123456',
    minLength: 4,
    maxLength: 10,
  })
  @IsOptional()
  @IsString({ 
    message: 'Le code MFA doit être une chaîne de caractères' 
  })
  @MinLength(4, { 
    message: 'Le code MFA doit contenir au moins 4 caractères' 
  })
  @MaxLength(10, { 
    message: 'Le code MFA ne peut pas dépasser 10 caractères' 
  })
  @Matches(/^[0-9]+$/, {
    message: 'Le code MFA ne peut contenir que des chiffres'
  })
  mfaCode?: string;
}

/**
 * DTO pour la réponse de vérification des informations de connexion
 * Utilisé pour validation préliminaire sans authentification complète
 */
export class LoginCheckDto {
  /**
   * Email à vérifier
   */
  @ApiProperty({
    description: 'Email à vérifier',
    example: 'user@example.com',
  })
  @IsEmail({}, { 
    message: 'L\'adresse email doit être valide' 
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;
}

/**
 * DTO pour la connexion avec OAuth (future extension)
 */
export class OAuthLoginDto {
  /**
   * Provider OAuth (google, facebook, etc.)
   */
  @ApiProperty({
    description: 'Fournisseur OAuth',
    enum: ['google', 'facebook', 'apple'],
    example: 'google',
  })
  @IsString()
  @IsNotEmpty()
  provider: 'google' | 'facebook' | 'apple';

  /**
   * Token d'accès OAuth
   */
  @ApiProperty({
    description: 'Token d\'accès OAuth',
    example: 'ya29.a0ARrdaM...',
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  /**
   * Se souvenir de moi
   */
  @ApiPropertyOptional({
    description: 'Se souvenir de moi',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}