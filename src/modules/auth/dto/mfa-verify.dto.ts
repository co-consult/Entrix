// src/modules/auth/dto/mfa-verify.dto.ts
/**
 * DTO pour vérification de code MFA
 * 
 * Validation :
 * - Méthode MFA utilisée
 * - Code de vérification
 * - Format selon la méthode
 * 
 * Utilisation :
 * - Complétion authentification avec MFA
 * - Vérification codes de secours
 * - Validation TOTP
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { 
  IsEnum, 
  IsString, 
  IsNotEmpty, 
  MinLength, 
  MaxLength,
  Matches,
  ValidateIf
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { mfa_method } from '@prisma/client';

export class MfaVerifyDto {
  /**
   * Méthode MFA utilisée
   */
  @ApiProperty({
    description: 'Méthode MFA utilisée pour la vérification',
    enum: mfa_method,
    example: 'SMS',
  })
  @IsEnum(mfa_method, { 
    message: 'La méthode MFA doit être valide' 
  })
  method: mfa_method;

  /**
   * Code de vérification
   */
  @ApiProperty({
    description: 'Code de vérification MFA',
    example: '123456',
    minLength: 4,
    maxLength: 10,
  })
  @IsString({ 
    message: 'Le code doit être une chaîne de caractères' 
  })
  @IsNotEmpty({ 
    message: 'Le code de vérification est requis' 
  })
  @MinLength(4, { 
    message: 'Le code doit contenir au moins 4 caractères' 
  })
  @MaxLength(10, { 
    message: 'Le code ne peut pas dépasser 10 caractères' 
  })
  @ValidateIf(o => o.method === 'SMS' || o.method === 'EMAIL' || o.method === 'TOTP')
  @Matches(/^[0-9]+$/, {
    message: 'Le code ne peut contenir que des chiffres'
  })
  code: string;

  /**
   * Se souvenir de cet appareil (optionnel)
   */
  @ApiPropertyOptional({
    description: 'Se souvenir de cet appareil pour éviter MFA répétés',
    example: false,
    default: false,
  })
  @ValidateIf(o => o.rememberDevice !== undefined)
  @IsString({ 
    message: 'La valeur doit être un booléen' 
  })
  rememberDevice?: boolean;
}