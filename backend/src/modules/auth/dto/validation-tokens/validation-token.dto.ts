// src/modules/auth/dto/validation-tokens/validation-token.dto.ts

import { IsEmail, IsEnum, IsOptional, IsString, IsNumber, IsObject, IsBoolean, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { validation_token_type } from '@prisma/client';

/**
 * DTOs pour Validation Tokens Entrix V3.0
 */

// ============================================================================
// DTO CRÉATION EMAIL VERIFICATION
// ============================================================================

export class CreateEmailVerificationDto {
  @ApiProperty({ description: 'Adresse email à vérifier' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ 
    enum: ['registration', 'email_change'],
    description: 'Type de vérification email' 
  })
  @IsOptional()
  @IsEnum(['registration', 'email_change'])
  verification_type?: 'registration' | 'email_change';

  @ApiPropertyOptional({ description: 'Email précédent (pour changement d\'email)' })
  @IsOptional()
  @IsEmail()
  previous_email?: string;
}

// ============================================================================
// DTO CRÉATION PASSWORD RESET
// ============================================================================

export class CreatePasswordResetDto {
  @ApiProperty({ description: 'Adresse email du compte' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Informations client pour audit' })
  @IsOptional()
  @IsObject()
  client_info?: {
    ip_address?: string;
    user_agent?: string;
    device_fingerprint?: string;
  };
}

// ============================================================================
// DTO UTILISATION PASSWORD RESET
// ============================================================================

export class UsePasswordResetDto {
  @ApiProperty({ description: 'Token de reset reçu par email' })
  @IsString()
  token: string;

  @ApiProperty({ 
    description: 'Nouveau mot de passe',
    minLength: 8,
    example: 'NewSecurePassword123!'
  })
  @IsString()
  new_password: string;

  @ApiPropertyOptional({ description: 'Confirmer le nouveau mot de passe' })
  @IsOptional()
  @IsString()
  confirm_password?: string;
}

// ============================================================================
// DTO CRÉATION INVITATION
// ============================================================================

export class CreateInvitationDto {
  @ApiProperty({ description: 'Email de la personne invitée' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Rôle à attribuer' })
  @IsString()
  role: string;

  @ApiPropertyOptional({ description: 'ID du groupe/organisation' })
  @IsOptional()
  @IsString()
  group_id?: string;

  @ApiPropertyOptional({ description: 'ID de l\'organisation' })
  @IsOptional()
  @IsString()
  organization_id?: string;

  @ApiPropertyOptional({ description: 'Permissions spécifiques' })
  @IsOptional()
  permissions?: string[];

  @ApiPropertyOptional({ description: 'Message de bienvenue personnalisé' })
  @IsOptional()
  @IsString()
  welcome_message?: string;

  @ApiPropertyOptional({ description: 'Acceptation automatique' })
  @IsOptional()
  @IsBoolean()
  auto_accept?: boolean;
}

// ============================================================================
// DTO ACCEPTATION INVITATION
// ============================================================================

export class AcceptInvitationDto {
  @ApiProperty({ description: 'Token d\'invitation' })
  @IsString()
  token: string;

  @ApiProperty({ description: 'Prénom' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Nom' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Mot de passe' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ description: 'Numéro de téléphone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Accepter les conditions' })
  @IsOptional()
  @IsBoolean()
  terms_accepted?: boolean;
}

// ============================================================================
// DTO CRÉATION MAGIC LINK
// ============================================================================

export class CreateMagicLinkDto {
  @ApiProperty({ description: 'Email pour le magic link' })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    description: 'Action du magic link',
    example: 'login'
  })
  @IsString()
  action: string;

  @ApiPropertyOptional({ description: 'URL de redirection après utilisation' })
  @IsOptional()
  @IsString()
  redirect_url?: string;

  @ApiPropertyOptional({ description: 'Données contextuelles' })
  @IsOptional()
  @IsObject()
  context_data?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Expire après utilisation' })
  @IsOptional()
  @IsBoolean()
  expires_after_use?: boolean;
}

// ============================================================================
// DTO UTILISATION MAGIC LINK
// ============================================================================

export class UseMagicLinkDto {
  @ApiProperty({ description: 'Token du magic link' })
  @IsString()
  token: string;

  @ApiPropertyOptional({ description: 'Informations client' })
  @IsOptional()
  @IsObject()
  client_info?: {
    ip_address?: string;
    user_agent?: string;
    device_fingerprint?: string;
  };
}

// ============================================================================
// DTO VÉRIFICATION TÉLÉPHONE
// ============================================================================

export class CreatePhoneVerificationDto {
  @ApiProperty({ description: 'Numéro de téléphone' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ description: 'ID utilisateur (si connecté)' })
  @IsOptional()
  @IsString()
  user_id?: string;
}

export class VerifyPhoneDto {
  @ApiProperty({ description: 'Code de vérification reçu par SMS' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Numéro de téléphone vérifié' })
  @IsString()
  phone: string;
}

// ============================================================================
// DTO VALIDATION ET UTILISATION GÉNÉRIQUES
// ============================================================================

export class ValidateTokenDto {
  @ApiProperty({ description: 'Token à valider' })
  @IsString()
  token: string;
}

export class UseTokenDto {
  @ApiProperty({ description: 'Token à utiliser' })
  @IsString()
  token: string;

  @ApiPropertyOptional({ description: 'Informations client pour audit' })
  @IsOptional()
  @IsObject()
  client_info?: {
    ip_address?: string;
    user_agent?: string;
    device_fingerprint?: string;
  };
}

// ============================================================================
// DTO RENVOI TOKEN
// ============================================================================

export class ResendTokenDto {
  @ApiProperty({ description: 'Email pour renvoyer le token' })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    enum: validation_token_type,
    description: 'Type de token à renvoyer' 
  })
  @IsEnum(validation_token_type)
  token_type: validation_token_type;
}

// ============================================================================
// DTO FILTRES RECHERCHE VALIDATION TOKENS
// ============================================================================

export class ValidationTokenFiltersDto {
  @ApiPropertyOptional({ description: 'Filtrer par email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ 
    enum: validation_token_type,
    description: 'Filtrer par type' 
  })
  @IsOptional()
  @IsEnum(validation_token_type)
  token_type?: validation_token_type;

  @ApiPropertyOptional({ description: 'Filtrer par statut utilisé' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  is_used?: boolean;

  @ApiPropertyOptional({ description: 'Filtrer par statut bloqué' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  is_blocked?: boolean;

  @ApiPropertyOptional({ description: 'Créés après cette date' })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  created_after?: Date;

  @ApiPropertyOptional({ description: 'Créés avant cette date' })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  created_before?: Date;
}

// ============================================================================
// DTO RESPONSES
// ============================================================================

export class ValidationTokenResponseDto {
  @ApiProperty({ description: 'ID du token' })
  id: string;

  @ApiProperty({ description: 'Type de token' })
  token_type: validation_token_type;

  @ApiProperty({ description: 'Email associé' })
  email: string;

  @ApiPropertyOptional({ description: 'ID utilisateur' })
  user_id?: string;

  @ApiProperty({ description: 'Date d\'expiration (ISO 8601)' })
  expires_at: string;

  @ApiProperty({ description: 'Token utilisé' })
  is_used: boolean;

  @ApiPropertyOptional({ description: 'Date d\'utilisation (ISO 8601)' })
  used_at?: string;

  @ApiProperty({ description: 'Nombre de tentatives' })
  attempt_count: number;

  @ApiProperty({ description: 'Limite de tentatives' })
  max_attempts: number;

  @ApiProperty({ description: 'Token bloqué' })
  is_blocked: boolean;

  @ApiProperty({ description: 'Date de création (ISO 8601)' })
  created_at: string;
}

export class GeneratedValidationTokenResponseDto {
  @ApiProperty({ description: 'ID du token généré' })
  id: string;

  @ApiProperty({ description: 'Type de token' })
  token_type: validation_token_type;

  @ApiProperty({ description: 'Email de destination' })
  email: string;

  @ApiProperty({ description: 'Date d\'expiration (ISO 8601)' })
  expires_at: string;

  @ApiProperty({ description: 'Nombre max de tentatives' })
  max_attempts: number;

  @ApiPropertyOptional({ description: 'URL de vérification complète' })
  verification_url?: string;

  @ApiPropertyOptional({ description: 'URL magic link complète' })
  magic_link_url?: string;

  @ApiProperty({ description: 'Message de confirmation' })
  message: string;
}

export class TokenValidationResponseDto {
  @ApiProperty({ description: 'Token valide' })
  isValid: boolean;

  @ApiPropertyOptional({ description: 'Erreurs de validation' })
  errors?: Array<{
    code: string;
    message: string;
    field?: string;
  }>;

  @ApiPropertyOptional({ description: 'Tentatives restantes' })
  attempts_remaining?: number;

  @ApiPropertyOptional({ description: 'Token bloqué' })
  is_blocked?: boolean;

  @ApiPropertyOptional({ description: 'Date d\'expiration' })
  expires_at?: string;

  @ApiPropertyOptional({ description: 'Peut renvoyer le token' })
  can_resend?: boolean;
}

export class TokenUsageResponseDto {
  @ApiProperty({ description: 'Utilisation réussie' })
  success: boolean;

  @ApiPropertyOptional({ description: 'ID utilisateur' })
  user_id?: string;

  @ApiPropertyOptional({ description: 'Email' })
  email?: string;

  @ApiPropertyOptional({ description: 'Données d\'action' })
  action_data?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Prochaines étapes' })
  next_steps?: string[];

  @ApiPropertyOptional({ description: 'Erreurs' })
  errors?: Array<{
    code: string;
    message: string;
  }>;

  @ApiPropertyOptional({ description: 'Message de succès' })
  message?: string;
}

// ============================================================================
// DTO STATISTIQUES VALIDATION TOKENS
// ============================================================================

export class ValidationTokenStatsResponseDto {
  @ApiProperty({ description: 'Nombre total de tokens' })
  total: number;

  @ApiProperty({ description: 'Tokens actifs' })
  active: number;

  @ApiProperty({ description: 'Tokens utilisés' })
  used: number;

  @ApiProperty({ description: 'Tokens expirés' })
  expired: number;

  @ApiProperty({ description: 'Tokens bloqués' })
  blocked: number;

  @ApiProperty({ 
    description: 'Répartition par type',
    example: {
      'EMAIL_VERIFICATION': 15,
      'PASSWORD_RESET': 5,
      'INVITATION_USER': 3
    }
  })
  by_type: Record<string, number>;

  @ApiProperty({ description: 'Taux de succès (%)' })
  success_rate: number;

  @ApiProperty({ 
    description: 'Activité récente',
    example: {
      last_24h: 8,
      last_7d: 45,
      last_30d: 120
    }
  })
  recent_activity: {
    last_24h: number;
    last_7d: number;
    last_30d: number;
  };
}

// ============================================================================
// DTO VÉRIFICATION EMAIL SPÉCIALISÉE
// ============================================================================

export class VerifyEmailResponseDto extends TokenUsageResponseDto {
  @ApiPropertyOptional({ description: 'Email vérifié avec succès' })
  email_verified?: boolean;

  @ApiPropertyOptional({ description: 'Date de vérification' })
  verified_at?: string;
}

// ============================================================================
// DTO RESET PASSWORD SPÉCIALISÉE
// ============================================================================

export class PasswordResetResponseDto extends TokenUsageResponseDto {
  @ApiPropertyOptional({ description: 'Mot de passe mis à jour' })
  password_updated?: boolean;

  @ApiPropertyOptional({ description: 'Sessions fermées' })
  sessions_closed?: number;
}

// ============================================================================
// DTO INVITATION SPÉCIALISÉE
// ============================================================================

export class InvitationResponseDto extends TokenUsageResponseDto {
  @ApiPropertyOptional({ description: 'Compte créé' })
  account_created?: boolean;

  @ApiPropertyOptional({ description: 'Rôle attribué' })
  role_assigned?: string;

  @ApiPropertyOptional({ description: 'Permissions accordées' })
  permissions_granted?: string[];
}