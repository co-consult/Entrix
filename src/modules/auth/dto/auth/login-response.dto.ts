// src/modules/auth/dto/auth/login-response.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ITokenPair, ISessionInfo } from '../../interfaces/session.interface';
import { IUserProfile } from '../../interfaces/user.interface';
import { IMfaChallenge } from '../../interfaces/mfa.interface';

/**
 * DTO Login Response Entrix V3.0
 * ✅ AMÉLIORÉ : Support sessions intelligentes
 * Respecte api_specs_auth_session.md
 */

// UserProfileDto (inchangé, déjà correct)
export class UserProfileDto implements Omit<IUserProfile, 'createdAt' | 'updatedAt' | 'emailVerified' | 'phoneVerified' | 'lastLogin'> {
  @ApiProperty({ description: 'Identifiant unique utilisateur' })
  id: string;

  @ApiProperty({ description: 'Adresse email utilisateur' })
  email: string;

  @ApiProperty({ description: 'Prénom utilisateur' })
  firstName: string;

  @ApiProperty({ description: 'Nom utilisateur' })
  lastName: string;

  @ApiPropertyOptional({ description: 'Numéro de téléphone' })
  phone: string | null;

  @ApiPropertyOptional({ description: 'URL avatar utilisateur' })
  avatar: string | null;

  @ApiProperty({ description: 'Compte actif' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Email vérifié' })
  emailVerified?: boolean;

  @ApiPropertyOptional({ description: 'Téléphone vérifié' })
  phoneVerified?: boolean;

  @ApiPropertyOptional({ description: 'Dernière connexion (ISO 8601)' })
  lastLoginAt?: string;

  @ApiPropertyOptional({ description: 'Rôles utilisateur' })
  roles?: string[];

  @ApiPropertyOptional({ description: 'Permissions utilisateur' })
  permissions?: string[];

  @ApiPropertyOptional({ description: 'Informations abonnement' })
  subscription?: {
    tier: 'FREE' | 'PREMIUM' | 'VIP';
    expiresAt?: string;
  };

  @ApiPropertyOptional({ description: 'Préférences utilisateur' })
  preferences?: any;

  @ApiPropertyOptional({ description: 'Métadonnées utilisateur' })
  metadata: any | null;
}

// TokenPairDto (inchangé)
export class TokenPairDto implements ITokenPair {
  @ApiProperty({ description: 'Token d\'accès JWT' })
  accessToken: string;

  @ApiProperty({ description: 'Token de rafraîchissement' })
  refreshToken: string;

  @ApiProperty({ enum: ['Bearer'], description: 'Type de token' })
  tokenType: 'Bearer';

  @ApiProperty({ description: 'Durée de validité en secondes' })
  expiresIn: number;
}

// ✅ AMÉLIORÉ : SessionInfoDto avec nouveaux champs
export class SessionInfoDto implements ISessionInfo {
  @ApiProperty({ description: 'Identifiant de session' })
  sessionId: string;

  @ApiProperty({ description: 'Date d\'expiration (ISO 8601)' })
  expiresAt: string;

  @ApiProperty({ description: 'Informations device' })
  deviceInfo: any;

  @ApiProperty({ description: 'Session active' })
  isActive: boolean;

  @ApiProperty({ description: 'Dernière activité (ISO 8601)' })
  lastActivity: string;

  @ApiPropertyOptional({ description: 'Session réutilisée' })
  isReused?: boolean; // ✅ NOUVEAU

  @ApiPropertyOptional({ 
    enum: ['reused', 'refreshed', 'new'], 
    description: 'Type de session' 
  })
  sessionType?: 'reused' | 'refreshed' | 'new'; // ✅ NOUVEAU
}

// MfaChallengeDto (inchangé)
export class MfaChallengeDto implements IMfaChallenge {
  @ApiProperty({ 
    enum: ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP'], 
    description: 'Méthodes MFA disponibles',
    isArray: true
  })
  methods: any[];

  @ApiProperty({ description: 'Token de challenge MFA' })
  challengeToken: string;

  @ApiProperty({ description: 'Durée de validité en secondes' })
  expiresIn: number;
}

// ✅ AMÉLIORÉ : LoginResponseDto avec nouveaux champs meta
export class LoginResponseDto {
  @ApiProperty({ description: 'Statut de la requête' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Données de connexion' })
  data?: {
    user: UserProfileDto;
    tokens: TokenPairDto;
    session: SessionInfoDto; // ✅ Maintenant avec isReused et sessionType
    mfaRequired?: MfaChallengeDto;
  };

  @ApiPropertyOptional({ description: 'Métadonnées de sécurité' })
  meta?: {
    riskScore: number;
    requiresMfa: boolean;
    ipGeolocation: string;
    sessionType?: 'reused' | 'refreshed' | 'new'; // ✅ NOUVEAU
    wasSessionReused?: boolean; // ✅ NOUVEAU
  };

  @ApiPropertyOptional({ description: 'Message informatif' })
  message?: string; // ✅ NOUVEAU
}

// UserProfileMapper (inchangé, déjà correct)
export class UserProfileMapper {
  static toDto(userProfile: IUserProfile): UserProfileDto {
    return {
      id: userProfile.id,
      email: userProfile.email,
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      phone: userProfile.phone,
      avatar: userProfile.avatar,
      isActive: userProfile.isActive,
      emailVerified: !!userProfile.emailVerified,
      phoneVerified: !!userProfile.phoneVerified,
      lastLoginAt: userProfile.lastLogin?.toISOString(),
      roles: userProfile.roles,
      permissions: userProfile.permissions,
      subscription: userProfile.subscription,
      preferences: userProfile.preferences,
      metadata: userProfile.metadata,
    };
  }
}