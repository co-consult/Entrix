// src/modules/auth/dto/token-pair.dto.ts
/**
 * DTO pour paire de tokens JWT
 * 
 * Structure :
 * - Access token pour authentification
 * - Refresh token pour renouvellement
 * - Métadonnées d'expiration
 * - Type de token standard
 * 
 * Utilisation :
 * - Réponse login/refresh
 * - Exchange de tokens
 * - Validation durées de vie
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class TokenPairDto {
  /**
   * Access token JWT
   */
  @ApiProperty({
    description: 'Access token JWT pour authentification des requêtes',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    pattern: '^[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]*$',
  })
  @IsString({ 
    message: 'L\'access token doit être une chaîne de caractères' 
  })
  @IsNotEmpty({ 
    message: 'L\'access token est requis' 
  })
  accessToken: string;

  /**
   * Refresh token JWT
   */
  @ApiProperty({
    description: 'Refresh token JWT pour renouveler l\'access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE1MTYyMzkwMjJ9.kVL8RJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    pattern: '^[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]*$',
  })
  @IsString({ 
    message: 'Le refresh token doit être une chaîne de caractères' 
  })
  @IsNotEmpty({ 
    message: 'Le refresh token est requis' 
  })
  refreshToken: string;

  /**
   * Type de token (toujours "Bearer")
   */
  @ApiProperty({
    description: 'Type de token pour l\'en-tête Authorization',
    example: 'Bearer',
    default: 'Bearer',
  })
  @IsString({ 
    message: 'Le type de token doit être une chaîne de caractères' 
  })
  @IsNotEmpty({ 
    message: 'Le type de token est requis' 
  })
  tokenType: string;

  /**
   * Durée de vie de l'access token (secondes)
   */
  @ApiProperty({
    description: 'Durée de vie de l\'access token en secondes',
    example: 900,
    minimum: 60,
    maximum: 86400,
  })
  @IsNumber({}, { 
    message: 'La durée d\'expiration doit être un nombre' 
  })
  @Min(60, { 
    message: 'La durée d\'expiration doit être d\'au moins 60 secondes' 
  })
  @Max(86400, { 
    message: 'La durée d\'expiration ne peut pas dépasser 24 heures' 
  })
  expiresIn: number;

  /**
   * Durée de vie du refresh token (secondes)
   */
  @ApiProperty({
    description: 'Durée de vie du refresh token en secondes',
    example: 604800,
    minimum: 3600,
    maximum: 2592000,
  })
  @IsNumber({}, { 
    message: 'La durée d\'expiration du refresh token doit être un nombre' 
  })
  @Min(3600, { 
    message: 'La durée d\'expiration du refresh token doit être d\'au moins 1 heure' 
  })
  @Max(2592000, { 
    message: 'La durée d\'expiration du refresh token ne peut pas dépasser 30 jours' 
  })
  refreshExpiresIn: number;

  /**
   * Timestamp d'émission des tokens
   */
  @ApiProperty({
    description: 'Timestamp d\'émission des tokens (ISO string)',
    example: '2025-01-07T10:30:00.000Z',
  })
  issuedAt?: string;

  /**
   * Timestamp d'expiration de l'access token
   */
  @ApiProperty({
    description: 'Timestamp d\'expiration de l\'access token (ISO string)',
    example: '2025-01-07T10:45:00.000Z',
  })
  accessTokenExpiresAt?: string;

  /**
   * Timestamp d'expiration du refresh token
   */
  @ApiProperty({
    description: 'Timestamp d\'expiration du refresh token (ISO string)',
    example: '2025-01-14T10:30:00.000Z',
  })
  refreshTokenExpiresAt?: string;
}