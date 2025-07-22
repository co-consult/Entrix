// src/modules/auth/dto/verify-email.dto.ts
/**
 * DTO pour vérification d'email
 * 
 * Validation :
 * - Token de vérification requis
 * - Format token valide
 * - Token usage unique
 * 
 * Utilisation :
 * - Confirmation email après inscription
 * - Changement d'email
 * - Réactivation compte
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { 
  IsString, 
  IsNotEmpty, 
  MinLength, 
  MaxLength,
  Matches
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  /**
   * Token de vérification email
   */
  @ApiProperty({
    description: 'Token de vérification reçu par email',
    example: 'abc123def456ghi789jkl012mno345pqr678',
    minLength: 32,
    maxLength: 128,
  })
  @IsString({ 
    message: 'Le token doit être une chaîne de caractères' 
  })
  @IsNotEmpty({ 
    message: 'Le token de vérification est requis' 
  })
  @MinLength(32, { 
    message: 'Le token doit contenir au moins 32 caractères' 
  })
  @MaxLength(128, { 
    message: 'Le token ne peut pas dépasser 128 caractères' 
  })
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'Le token ne peut contenir que des lettres et des chiffres'
  })
  token: string;
}

/**
 * DTO pour renvoyer un email de vérification
 */
export class ResendVerificationEmailDto {
  /**
   * Adresse email pour renvoyer la vérification
   */
  @ApiProperty({
    description: 'Adresse email pour renvoyer le lien de vérification',
    example: 'user@example.com',
    format: 'email',
  })
  @IsString({ 
    message: 'L\'email doit être une chaîne de caractères' 
  })
  @IsNotEmpty({ 
    message: 'L\'email est requis' 
  })
  @MaxLength(255, { 
    message: 'L\'email ne peut pas dépasser 255 caractères' 
  })
  @Matches(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/, {
    message: 'L\'adresse email doit être valide'
  })
  email: string;
}