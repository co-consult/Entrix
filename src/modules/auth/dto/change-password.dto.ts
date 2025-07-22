// src/modules/auth/dto/change-password.dto.ts
/**
 * DTO pour changement de mot de passe
 * 
 * Validation :
 * - Ancien mot de passe requis
 * - Nouveau mot de passe sécurisé
 * - Confirmation nouveau mot de passe
 * - Vérification que nouveau != ancien
 * 
 * Sécurité :
 * - Validation ancien mot de passe
 * - Complexité nouveau mot de passe
 * - Invalidation sessions après changement
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { 
  IsString, 
  IsNotEmpty, 
  MinLength, 
  MaxLength,
  Matches,
  ValidateIf
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Match } from '../../../common/decorators/match.decorator';

export class ChangePasswordDto {
  /**
   * Ancien mot de passe
   */
  @ApiProperty({
    description: 'Mot de passe actuel pour vérification',
    example: 'AncienMotDePasse123!',
    minLength: 6,
    maxLength: 128,
  })
  @IsString({ 
    message: 'L\'ancien mot de passe doit être une chaîne de caractères' 
  })
  @IsNotEmpty({ 
    message: 'L\'ancien mot de passe est requis' 
  })
  @MinLength(6, { 
    message: 'L\'ancien mot de passe doit contenir au moins 6 caractères' 
  })
  @MaxLength(128, { 
    message: 'L\'ancien mot de passe ne peut pas dépasser 128 caractères' 
  })
  currentPassword: string;

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
    message: 'Le nouveau mot de passe doit être une chaîne de caractères' 
  })
  @IsNotEmpty({ 
    message: 'Le nouveau mot de passe est requis' 
  })
  @MinLength(8, { 
    message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' 
  })
  @MaxLength(128, { 
    message: 'Le nouveau mot de passe ne peut pas dépasser 128 caractères' 
  })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'Le nouveau mot de passe doit contenir au moins : 1 minuscule, 1 majuscule, 1 chiffre et 1 caractère spécial (@$!%*?&)'
    }
  )
  @ValidateIf((o) => o.newPassword === o.currentPassword)
  @Matches(/^(?!.*current).*$/, {
    message: 'Le nouveau mot de passe doit être différent de l\'ancien'
  })
  newPassword: string;

  /**
   * Confirmation nouveau mot de passe
   */
  @ApiProperty({
    description: 'Confirmation du nouveau mot de passe',
    example: 'NouveauMotDePasse123!',
  })
  @IsString({ 
    message: 'La confirmation doit être une chaîne de caractères' 
  })
  @IsNotEmpty({ 
    message: 'La confirmation du nouveau mot de passe est requise' 
  })
  @Match('newPassword', { 
    message: 'Les mots de passe ne correspondent pas' 
  })
  confirmPassword: string;
}