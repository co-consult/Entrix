// src/modules/auth/dto/mfa-enable.dto.ts
/**
 * DTO pour l'activation de l'authentification multi-facteurs
 * 
 * Validation :
 * - Méthode MFA requise et valide
 * - Numéro de téléphone si SMS
 * - Email de backup optionnel
 * 
 * Méthodes supportées :
 * - SMS : Code par SMS
 * - EMAIL : Code par email
 * - TOTP : Google Authenticator/Authy
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { 
  IsEnum, 
  IsString, 
  IsOptional, 
  IsEmail,
  IsPhoneNumber,
  ValidateIf,
  MaxLength
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { mfa_method } from '@prisma/client';

export class MfaEnableDto {
  /**
   * Méthode MFA à activer
   */
  @ApiProperty({
    description: 'Méthode d\'authentification multi-facteurs à activer',
    enum: mfa_method,
    example: 'SMS',
  })
  @IsEnum(mfa_method, { 
    message: 'La méthode MFA doit être valide (SMS, EMAIL, TOTP, APP_PUSH, HARDWARE_TOKEN, BIOMETRIC, BACKUP_CODES)' 
  })
  method: mfa_method;

  /**
   * Numéro de téléphone (requis pour SMS)
   */
  @ApiPropertyOptional({
    description: 'Numéro de téléphone au format international (requis pour SMS)',
    example: '+216 20 123 456',
    pattern: '^\\+[1-9]\\d{1,14}$',
  })
  @ValidateIf(o => o.method === 'SMS')
  @IsPhoneNumber(null, { 
    message: 'Le numéro de téléphone doit être au format international valide' 
  })
  @Transform(({ value }) => value?.replace(/\s/g, ''))
  phoneNumber?: string;

  /**
   * Email de backup (optionnel)
   */
  @ApiPropertyOptional({
    description: 'Email de backup pour la récupération',
    example: 'backup@example.com',
    format: 'email',
  })
  @IsOptional()
  @IsEmail({}, { 
    message: 'L\'email de backup doit être valide' 
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @MaxLength(255, { 
    message: 'L\'email de backup ne peut pas dépasser 255 caractères' 
  })
  backupEmail?: string;

  /**
   * Code de vérification initial (pour certaines méthodes)
   */
  @ApiPropertyOptional({
    description: 'Code de vérification initial pour valider la configuration',
    example: '123456',
    minLength: 4,
    maxLength: 10,
  })
  @IsOptional()
  @IsString({ 
    message: 'Le code de vérification doit être une chaîne de caractères' 
  })
  @MaxLength(10, { 
    message: 'Le code de vérification ne peut pas dépasser 10 caractères' 
  })
  verificationCode?: string;
}