// src/modules/auth/dto/send-verification.dto.ts
/**
 * DTO pour envoi de codes de vérification
 * 
 * Validation :
 * - Type de vérification requis
 * - Contact approprié selon le type
 * - Rate limiting appliqué
 * 
 * Types supportés :
 * - email : Envoi lien par email
 * - sms : Envoi code par SMS
 * - call : Appel vocal (futur)
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { 
  IsEnum, 
  IsString, 
  IsNotEmpty, 
  IsEmail,
  IsPhoneNumber,
  IsOptional,
  ValidateIf,
  MaxLength
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum VerificationType {
  EMAIL = 'email',
  SMS = 'sms',
  CALL = 'call',
}

export class SendVerificationDto {
  /**
   * Type de vérification à envoyer
   */
  @ApiProperty({
    description: 'Type de vérification à envoyer',
    enum: VerificationType,
    example: VerificationType.EMAIL,
  })
  @IsEnum(VerificationType, { 
    message: 'Le type de vérification doit être email, sms ou call' 
  })
  type: VerificationType;

  /**
   * Adresse email (requis si type=email)
   */
  @ApiPropertyOptional({
    description: 'Adresse email pour vérification (requis si type=email)',
    example: 'user@example.com',
    format: 'email',
  })
  @ValidateIf(o => o.type === VerificationType.EMAIL)
  @IsEmail({}, { 
    message: 'L\'adresse email doit être valide' 
  })
  @IsNotEmpty({ 
    message: 'L\'email est requis pour la vérification email' 
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @MaxLength(255, { 
    message: 'L\'email ne peut pas dépasser 255 caractères' 
  })
  email?: string;

  /**
   * Numéro de téléphone (requis si type=sms ou call)
   */
  @ApiPropertyOptional({
    description: 'Numéro de téléphone pour vérification (requis si type=sms ou call)',
    example: '+216 20 123 456',
    pattern: '^\\+[1-9]\\d{1,14}$',
  })
  @ValidateIf(o => o.type === VerificationType.SMS || o.type === VerificationType.CALL)
  @IsPhoneNumber(null, { 
    message: 'Le numéro de téléphone doit être au format international valide' 
  })
  @IsNotEmpty({ 
    message: 'Le téléphone est requis pour la vérification SMS/call' 
  })
  @Transform(({ value }) => value?.replace(/\s/g, ''))
  phoneNumber?: string;

  /**
   * Langue pour le message (optionnel)
   */
  @ApiPropertyOptional({
    description: 'Langue pour le message de vérification',
    example: 'fr',
    enum: ['fr', 'ar', 'en'],
    default: 'fr',
  })
  @IsOptional()
  @IsString({ 
    message: 'La langue doit être une chaîne de caractères' 
  })
  @Transform(({ value }) => value?.toLowerCase())
  language?: 'fr' | 'ar' | 'en';
}

/**
 * DTO de réponse pour envoi de vérification
 */
export class SendVerificationResponseDto {
  @ApiProperty({ 
    description: 'Indique si l\'envoi a réussi',
    example: true 
  })
  success: boolean;

  @ApiProperty({ 
    description: 'Message de confirmation',
    example: 'Code de vérification envoyé par SMS' 
  })
  message: string;

  @ApiPropertyOptional({ 
    description: 'Temps d\'attente avant prochain envoi (secondes)',
    example: 60 
  })
  cooldownSeconds?: number;

  @ApiPropertyOptional({ 
    description: 'Nombre de tentatives restantes',
    example: 2 
  })
  attemptsRemaining?: number;

  @ApiPropertyOptional({ 
    description: 'Expiration du code (ISO string)',
    example: '2025-01-07T11:05:00.000Z' 
  })
  expiresAt?: string;
}