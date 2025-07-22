// src/modules/auth/dto/mfa-backup-codes.dto.ts
/**
 * DTO pour gestion des codes de secours MFA
 * 
 * Validation :
 * - Mot de passe requis pour génération
 * - Code de secours pour utilisation
 * - Format codes standardisé
 * 
 * Utilisation :
 * - Génération nouveaux codes
 * - Utilisation code de secours
 * - Révocation codes existants
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
  IsOptional,
  IsArray,
  ArrayMaxSize
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateBackupCodesDto {
  /**
   * Mot de passe actuel pour confirmation
   */
  @ApiProperty({
    description: 'Mot de passe actuel pour générer les codes de secours',
    example: 'MonMotDePasse123!',
    minLength: 6,
    maxLength: 128,
  })
  @IsString({ 
    message: 'Le mot de passe doit être une chaîne de caractères' 
  })
  @IsNotEmpty({ 
    message: 'Le mot de passe est requis pour générer les codes de secours' 
  })
  @MinLength(6, { 
    message: 'Le mot de passe doit contenir au moins 6 caractères' 
  })
  @MaxLength(128, { 
    message: 'Le mot de passe ne peut pas dépasser 128 caractères' 
  })
  password: string;

  /**
   * Forcer la régénération (remplace les anciens codes)
   */
  @ApiPropertyOptional({
    description: 'Forcer la régénération des codes (remplace les anciens)',
    example: false,
    default: false,
  })
  @IsOptional()
  forceRegenerate?: boolean;
}

export class UseBackupCodeDto {
  /**
   * Code de secours à utiliser
   */
  @ApiProperty({
    description: 'Code de secours MFA à utiliser',
    example: 'ABC123-DEF456',
    minLength: 8,
    maxLength: 20,
  })
  @IsString({ 
    message: 'Le code de secours doit être une chaîne de caractères' 
  })
  @IsNotEmpty({ 
    message: 'Le code de secours est requis' 
  })
  @MinLength(8, { 
    message: 'Le code de secours doit contenir au moins 8 caractères' 
  })
  @MaxLength(20, { 
    message: 'Le code de secours ne peut pas dépasser 20 caractères' 
  })
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'Le code de secours ne peut contenir que des lettres majuscules, chiffres et tirets'
  })
  backupCode: string;
}

export class RevokeBackupCodesDto {
  /**
   * Mot de passe actuel pour confirmation
   */
  @ApiProperty({
    description: 'Mot de passe actuel pour révoquer les codes de secours',
    example: 'MonMotDePasse123!',
    minLength: 6,
    maxLength: 128,
  })
  @IsString({ 
    message: 'Le mot de passe doit être une chaîne de caractères' 
  })
  @IsNotEmpty({ 
    message: 'Le mot de passe est requis pour révoquer les codes de secours' 
  })
  @MinLength(6, { 
    message: 'Le mot de passe doit contenir au moins 6 caractères' 
  })
  @MaxLength(128, { 
    message: 'Le mot de passe ne peut pas dépasser 128 caractères' 
  })
  password: string;

  /**
   * Raison de la révocation
   */
  @ApiPropertyOptional({
    description: 'Raison de la révocation des codes',
    example: 'Codes compromis',
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

/**
 * DTO de réponse pour les codes de secours
 */
export class BackupCodesResponseDto {
  @ApiProperty({ 
    description: 'Liste des codes de secours générés',
    example: ['ABC123-DEF456', 'GHI789-JKL012', 'MNO345-PQR678'],
    type: [String],
  })
  @IsArray()
  @ArrayMaxSize(10)
  codes: string[];

  @ApiProperty({ 
    description: 'Date de génération des codes',
    example: '2025-01-07T10:30:00.000Z' 
  })
  generatedAt: string;

  @ApiProperty({ 
    description: 'Nombre de codes générés',
    example: 8 
  })
  totalCodes: number;

  @ApiProperty({ 
    description: 'Codes utilisés (nombre)',
    example: 0 
  })
  usedCodes: number;

  @ApiPropertyOptional({ 
    description: 'Date d\'expiration des codes',
    example: '2026-01-07T10:30:00.000Z' 
  })
  expiresAt?: string;

  @ApiProperty({ 
    description: 'Instructions d\'utilisation',
    example: 'Conservez ces codes en lieu sûr. Chaque code ne peut être utilisé qu\'une seule fois.' 
  })
  instructions: string;
}