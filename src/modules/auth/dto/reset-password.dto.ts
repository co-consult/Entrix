// src/modules/auth/dto/reset-password.dto.ts
/**
 * DTO pour réinitialisation de mot de passe
 * 
 * Validation :
 * - Token de réinitialisation requis
 * - Nouveau mot de passe sécurisé
 * - Confirmation du mot de passe
 * 
 * Sécurité :
 * - Token usage unique avec TTL
 * - Complexité mot de passe appliquée
 * - Invalidation sessions après reset
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
import { Match } from '../../../common/decorators/match.decorator';

export class ResetPasswordDto {
  /**
   * Token de réinitialisation
   */
  @ApiProperty({
    description: 'Token de réinitialisation reçu par email',
    example: 'abc123def456...',
    minLength: 32,
    maxLength: 128,
  })
  @IsString({ 
    message: 'Le token doit être une chaîne de caractères' 
  })
  @IsNotEmpty({ 
    message: 'Le token de réinitialisation est requis' 
  })
  @MinLength(32, { 
    message: 'Le token doit contenir au moins 32 caractères' 
  })
  @MaxLength(128, { 
    message: 'Le token ne peut pas dépasser 128 caractères' 
  })
  token: string;

  /**
   * Nouveau mot de passe
   */
  @ApiProperty({
    description: 'Nouveau mot de passe sécurisé',
    example: 'NouveauMotDePasse123!',
    minLength: 8,
    maxLength: 128,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
  })
  @IsString({ 
    message: 'Le mot de passe doit être une chaîne de caractères' 
  })
  @IsNotEmpty({ 
    message: 'Le nouveau mot de passe est requis' 
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
  newPassword: string;

  /**
   * Confirmation du nouveau mot de passe
   */
  @ApiProperty({
    description: 'Confirmation du nouveau mot de passe',
    example: 'NouveauMotDePasse123!',
  })
  @IsString({ 
    message: 'La confirmation doit être une chaîne de caractères' 
  })
  @IsNotEmpty({ 
    message: 'La confirmation du mot de passe est requise' 
  })
  @Match('newPassword', { 
    message: 'Les mots de passe ne correspondent pas' 
  })
  confirmPassword: string;
}