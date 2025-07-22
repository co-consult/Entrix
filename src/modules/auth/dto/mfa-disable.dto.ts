// src/modules/auth/dto/mfa-disable.dto.ts
/**
 * DTO pour désactivation de l'authentification multi-facteurs
 * 
 * Validation :
 * - Méthode MFA à désactiver (optionnel = toutes)
 * - Code de confirmation requis
 * - Mot de passe requis pour sécurité
 * 
 * Sécurité :
 * - Confirmation identité avant désactivation
 * - Log événement sécurité
 * - Notification email automatique
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { 
  IsEnum, 
  IsString, 
  IsOptional, 
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { mfa_method } from '@prisma/client';

export class MfaDisableDto {
  /**
   * Méthode MFA à désactiver (optionnel = toutes)
   */
  @ApiPropertyOptional({
    description: 'Méthode MFA spécifique à désactiver. Si non fourni, désactive toutes les méthodes',
    enum: mfa_method,
    example: 'SMS',
  })
  @IsOptional()
  @IsEnum(mfa_method, { 
    message: 'La méthode MFA doit être valide' 
  })
  method?: mfa_method;

  /**
   * Mot de passe actuel pour confirmation
   */
  @ApiProperty({
    description: 'Mot de passe actuel pour confirmer la désactivation',
    example: 'MonMotDePasse123!',
    minLength: 6,
    maxLength: 128,
  })
  @IsString({ 
    message: 'Le mot de passe doit être une chaîne de caractères' 
  })
  @IsNotEmpty({ 
    message: 'Le mot de passe est requis pour désactiver MFA' 
  })
  @MinLength(6, { 
    message: 'Le mot de passe doit contenir au moins 6 caractères' 
  })
  @MaxLength(128, { 
    message: 'Le mot de passe ne peut pas dépasser 128 caractères' 
  })
  password: string;

  /**
   * Code MFA de confirmation
   */
  @ApiProperty({
    description: 'Code MFA actuel pour confirmer la désactivation',
    example: '123456',
    minLength: 4,
    maxLength: 10,
  })
  @IsString({ 
    message: 'Le code MFA doit être une chaîne de caractères' 
  })
  @IsNotEmpty({ 
    message: 'Le code MFA est requis pour confirmer la désactivation' 
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
  confirmationCode: string;

  /**
   * Raison de la désactivation (optionnel)
   */
  @ApiPropertyOptional({
    description: 'Raison de la désactivation MFA',
    example: 'Changement de téléphone',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ 
    message: 'La raison doit être une chaîne de caractères' 
  })
  @MaxLength(500, { 
    message: 'La raison ne peut pas dépasser 500 caractères' 
  })
  reason?: string;
}