// src/modules/auth/dto/logout-all.dto.ts
/**
 * DTO pour déconnexion de toutes les sessions
 * 
 * Validation :
 * - Mot de passe requis pour sécurité
 * - Confirmation optionnelle
 * - Exclusion session courante optionnelle
 * 
 * Utilisation :
 * - Sécurisation compte après compromission
 * - Changement mot de passe
 * - Nettoyage sessions suspectes
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { 
  IsString, 
  IsOptional, 
  IsBoolean,
  IsNotEmpty,
  MinLength,
  MaxLength
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LogoutAllDto {
  /**
   * Mot de passe pour confirmation de sécurité
   */
  @ApiProperty({
    description: 'Mot de passe actuel pour confirmer la déconnexion de toutes les sessions',
    example: 'MonMotDePasse123!',
    minLength: 6,
    maxLength: 128,
  })
  @IsString({ 
    message: 'Le mot de passe doit être une chaîne de caractères' 
  })
  @IsNotEmpty({ 
    message: 'Le mot de passe est requis pour déconnecter toutes les sessions' 
  })
  @MinLength(6, { 
    message: 'Le mot de passe doit contenir au moins 6 caractères' 
  })
  @MaxLength(128, { 
    message: 'Le mot de passe ne peut pas dépasser 128 caractères' 
  })
  password: string;

  /**
   * Exclure la session courante de la déconnexion
   */
  @ApiPropertyOptional({
    description: 'Garder la session courante active (déconnecter seulement les autres)',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ 
    message: 'La valeur doit être un booléen' 
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  keepCurrentSession?: boolean;

  /**
   * Révoquer aussi tous les refresh tokens
   */
  @ApiPropertyOptional({
    description: 'Révoquer également tous les refresh tokens',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ 
    message: 'La valeur doit être un booléen' 
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  revokeRefreshTokens?: boolean;

  /**
   * Raison de la déconnexion (optionnel)
   */
  @ApiPropertyOptional({
    description: 'Raison de la déconnexion massive',
    example: 'Sécurisation du compte après activité suspecte',
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
 * DTO de réponse pour déconnexion massive
 */
export class LogoutAllResponseDto {
  @ApiProperty({ 
    description: 'Nombre de sessions déconnectées',
    example: 3 
  })
  sessionsTerminated: number;

  @ApiProperty({ 
    description: 'Nombre de tokens révoqués',
    example: 6 
  })
  tokensRevoked: number;

  @ApiProperty({ 
    description: 'Session courante conservée',
    example: true 
  })
  currentSessionKept: boolean;

  @ApiProperty({ 
    description: 'Timestamp de l\'opération',
    example: '2025-01-07T10:30:00.000Z' 
  })
  timestamp: string;

  @ApiProperty({ 
    description: 'Message de confirmation',
    example: 'Toutes les autres sessions ont été déconnectées avec succès' 
  })
  message: string;
}