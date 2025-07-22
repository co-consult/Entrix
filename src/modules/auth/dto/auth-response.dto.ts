// src/modules/auth/dto/auth-response.dto.ts
/**
 * DTO de réponse pour l'authentification
 * 
 * Structure de réponse complète :
 * - Informations utilisateur
 * - Tokens d'authentification
 * - Informations de session
 * - Statut MFA si requis
 * 
 * Utilisé pour :
 * - Réponse login/register
 * - Refresh token
 * - Vérifications diverses
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { mfa_method } from '@prisma/client';

export class UserInfoDto {
  @ApiProperty({ description: 'ID utilisateur' })
  id: string;

  @ApiProperty({ description: 'Email' })
  email: string;

  @ApiProperty({ description: 'Prénom' })
  firstName: string;

  @ApiProperty({ description: 'Nom' })
  lastName: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  avatar?: string;

  @ApiProperty({ description: 'Compte actif' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Email vérifié' })
  emailVerified?: Date;

  @ApiPropertyOptional({ description: 'Téléphone vérifié' })
  phoneVerified?: Date;

  @ApiProperty({ description: 'Rôles utilisateur', type: [Object] })
  roles: any[];

  @ApiProperty({ description: 'Permissions', type: [String] })
  permissions: string[];

  @ApiPropertyOptional({ description: 'Dernière connexion' })
  lastLogin?: Date;
}

export class TokenPairDto {
  @ApiProperty({ description: 'Access token JWT' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh token JWT' })
  refreshToken: string;

  @ApiProperty({ description: 'Type de token', example: 'Bearer' })
  tokenType: string;

  @ApiProperty({ description: 'Durée de vie access token (secondes)' })
  expiresIn: number;

  @ApiProperty({ description: 'Durée de vie refresh token (secondes)' })
  refreshExpiresIn: number;
}

export class SessionInfoDto {
  @ApiProperty({ description: 'ID session' })
  id: string;

  @ApiProperty({ description: 'Adresse IP' })
  ipAddress: string;

  @ApiPropertyOptional({ description: 'User agent' })
  userAgent?: string;

  @ApiPropertyOptional({ description: 'Empreinte device' })
  deviceFingerprint?: string;

  @ApiPropertyOptional({ description: 'Géolocalisation' })
  geolocation?: any;

  @ApiProperty({ description: 'Date création' })
  createdAt: Date;

  @ApiProperty({ description: 'Dernière activité' })
  lastActivity: Date;

  @ApiProperty({ description: 'Expiration' })
  expiresAt: Date;
}

export class AuthResponseDto {
  /**
   * Informations utilisateur (null si MFA requis)
   */
  @ApiPropertyOptional({ description: 'Informations utilisateur', type: UserInfoDto })
  @Type(() => UserInfoDto)
  user?: UserInfoDto;

  /**
   * Tokens d'authentification (null si MFA requis)
   */
  @ApiPropertyOptional({ description: 'Paire de tokens', type: TokenPairDto })
  @Type(() => TokenPairDto)
  tokens?: TokenPairDto;

  /**
   * Informations de session (null si MFA requis)
   */
  @ApiPropertyOptional({ description: 'Informations session', type: SessionInfoDto })
  @Type(() => SessionInfoDto)
  session?: SessionInfoDto;

  /**
   * MFA requis pour compléter l'authentification
   */
  @ApiProperty({ description: 'MFA requis', default: false })
  mfaRequired: boolean;

  /**
   * Méthodes MFA disponibles (si MFA requis)
   */
  @ApiPropertyOptional({ 
    description: 'Méthodes MFA disponibles',
    enum: mfa_method,
    isArray: true
  })
  mfaMethods?: mfa_method[];
}