// src/modules/auth/dto/forgot-password.dto.ts
/**
 * DTO pour demande de réinitialisation de mot de passe
 * 
 * Validation :
 * - Email requis et format valide
 * - Normalisation automatique (lowercase, trim)
 * 
 * Sécurité :
 * - Rate limiting appliqué au niveau controller
 * - Pas de révélation si email existe ou non
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { 
  IsEmail, 
  IsNotEmpty, 
  MaxLength 
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  /**
   * Adresse email pour réinitialisation
   */
  @ApiProperty({
    description: 'Adresse email pour recevoir le lien de réinitialisation',
    example: 'user@example.com',
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
}