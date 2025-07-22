// src/modules/auth/dto/verify-phone.dto.ts
/**
 * DTO pour vérification de téléphone
 * 
 * Validation :
 * - Code SMS requis (4-8 chiffres)
 * - Format numérique uniquement
 * - Validation TTL côté service
 * 
 * Utilisation :
 * - Vérification numéro lors inscription
 * - Changement de numéro
 * - Activation MFA SMS
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
  IsPhoneNumber,
  IsOptional
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyPhoneDto {
  /**
   * Code de vérification SMS
   */
  @ApiProperty({
    description: 'Code de vérification reçu par SMS',
    example: '123456',
    minLength: 4,
    maxLength: 8,
    pattern: '^[0-9]+$',
  })
  @IsString({ 
    message: 'Le code doit être une chaîne de caractères' 
  })
  @IsNotEmpty({ 
    message: 'Le code de vérification est requis' 
  })
  @MinLength(4, { 
    message: 'Le code doit contenir au moins 4 chiffres' 
  })
  @MaxLength(8, { 
    message: 'Le code ne peut pas dépasser 8 chiffres' 
  })
  @Matches(/^[0-9]+$/, {
    message: 'Le code ne peut contenir que des chiffres'
  })
  code: string;

  /**
   * Numéro de téléphone (optionnel pour validation)
   */
  @ApiPropertyOptional({
    description: 'Numéro de téléphone pour validation croisée',
    example: '+216 20 123 456',
    pattern: '^\\+[1-9]\\d{1,14}$',
  })
  @IsOptional()
  @IsString({ 
    message: 'Le téléphone doit être une chaîne de caractères' 
  })
  @Transform(({ value }) => value?.replace(/\s/g, ''))
  @IsPhoneNumber(null, { 
    message: 'Le numéro de téléphone doit être au format international valide' 
  })
  phoneNumber?: string;
}

/**
 * DTO pour demander un code de vérification SMS
 */
export class SendPhoneVerificationDto {
  /**
   * Numéro de téléphone à vérifier
   */
  @ApiProperty({
    description: 'Numéro de téléphone au format international',
    example: '+216 20 123 456',
    pattern: '^\\+[1-9]\\d{1,14}$',
  })
  @IsString({ 
    message: 'Le téléphone doit être une chaîne de caractères' 
  })
  @IsNotEmpty({ 
    message: 'Le numéro de téléphone est requis' 
  })
  @Transform(({ value }) => value?.replace(/\s/g, ''))
  @IsPhoneNumber(null, { 
    message: 'Le numéro de téléphone doit être au format international valide (+216...)' 
  })
  phoneNumber: string;
}