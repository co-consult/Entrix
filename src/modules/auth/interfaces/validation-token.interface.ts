// src/modules/auth/interfaces/validation-token.interface.ts

import { validation_token_type } from '@prisma/client';

/**
 * Interfaces pour Validation Tokens Entrix V3.0
 * Gestion centralisée des tokens de validation : email, reset password, invitations, magic links
 */

// ============================================================================
// INTERFACES CORE VALIDATION TOKENS
// ============================================================================

/**
 * Interface Validation Token selon schema.prisma exact
 */
export interface IValidationToken {
  id: string;
  user_id?: string | null;
  email: string;
  token_type: validation_token_type;
  token_hash: string;
  token_plain?: string | null;
  expires_at: Date;
  is_used: boolean;
  used_at?: Date | null;
  used_ip?: string | null;
  attempt_count: number;
  max_attempts: number;
  is_blocked: boolean;
  blocked_at?: Date | null;
  reset_password_data?: any | null;
  invitation_data?: any | null;
  verification_data?: any | null;
  magic_link_data?: any | null;
  client_info?: any | null;
  metadata?: any | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Interface données création Validation Token
 */
export interface ICreateValidationTokenData {
  user_id?: string;
  email: string;
  token_type: validation_token_type;
  expires_in_minutes?: number;        // Durée de validité en minutes (défaut selon type)
  max_attempts?: number;              // Nombre max tentatives (défaut 3)
  
  // Données spécifiques selon le type
  reset_password_data?: {
    current_password_hash?: string;
    requires_old_password?: boolean;
    security_questions?: any[];
  };
  
  invitation_data?: {
    inviter_id?: string;
    inviter_name?: string;
    organization_id?: string;
    role?: string;
    group_id?: string;
    permissions?: string[];
    welcome_message?: string;
  };
  
  verification_data?: {
    previous_email?: string;
    verification_type?: 'registration' | 'email_change' | 'account_recovery';
    requires_current_password?: boolean;
  };
  
  magic_link_data?: {
    action: string;                   // 'login', 'reset_password', 'verify_email', etc.
    redirect_url?: string;
    expires_after_use?: boolean;
    one_time_use?: boolean;
    context_data?: Record<string, any>;
  };
  
  client_info?: {
    ip_address?: string;
    user_agent?: string;
    geolocation?: any;
    device_fingerprint?: string;
  };
  
  metadata?: Record<string, any>;
}

/**
 * Interface mise à jour Validation Token
 */
export interface IUpdateValidationTokenData {
  attempt_count?: number;
  is_blocked?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Interface token généré avec informations complètes
 */
export interface IValidationTokenGenerated {
  id: string;
  token: string;                      // Token complet en clair
  token_type: validation_token_type;
  email: string;
  user_id?: string;
  expires_at: Date;
  max_attempts: number;
  verification_url?: string;          // URL complète pour email
  magic_link_url?: string;           // URL magic link si applicable
  created_at: Date;
}

/**
 * Interface validation de token
 */
export interface IValidationTokenValidation {
  isValid: boolean;
  token?: IValidationToken;
  errors?: ValidationTokenError[];
  attempts_remaining?: number;
  is_blocked?: boolean;
  expires_at?: Date;
  can_resend?: boolean;
}

/**
 * Interface erreurs validation token
 */
export interface ValidationTokenError {
  code: string;
  message: string;
  field?: string;
}

// ============================================================================
// INTERFACES SPÉCIALISÉES PAR TYPE DE TOKEN
// ============================================================================

/**
 * Interface vérification email
 */
export interface IEmailVerificationToken extends Omit<IValidationToken, 'token_type'> {
  token_type: 'EMAIL_VERIFICATION';
  verification_data: {
    verification_type: 'registration' | 'email_change';
    previous_email?: string;
  };
}

/**
 * Interface reset password
 */
export interface IPasswordResetToken extends Omit<IValidationToken, 'token_type'> {
  token_type: 'PASSWORD_RESET';
  reset_password_data: {
    current_password_hash?: string;
    requires_old_password?: boolean;
    security_questions?: Array<{
      question: string;
      answer_hash: string;
    }>;
  };
}

/**
 * Interface invitation utilisateur
 */
export interface IUserInvitationToken extends Omit<IValidationToken, 'token_type'> {
  token_type: 'INVITATION_USER' | 'INVITATION_GROUP';
  invitation_data: {
    inviter_id: string;
    inviter_name: string;
    organization_id?: string;
    role: string;
    group_id?: string;
    permissions?: string[];
    welcome_message?: string;
    auto_accept?: boolean;
  };
}

/**
 * Interface magic link
 */
export interface IMagicLinkToken extends Omit<IValidationToken, 'token_type'> {
  token_type: 'MAGIC_LINK_LOGIN' | 'MAGIC_LINK_ACTION';
  magic_link_data: {
    action: string;
    redirect_url?: string;
    expires_after_use: boolean;
    one_time_use: boolean;
    context_data?: Record<string, any>;
  };
}

// ============================================================================
// INTERFACES POUR API ET RESPONSES
// ============================================================================

/**
 * Interface résultat utilisation token
 */
export interface IValidationTokenUsageResult {
  success: boolean;
  token?: IValidationToken;
  user_id?: string;
  email?: string;
  action_data?: Record<string, any>;
  next_steps?: string[];
  errors?: ValidationTokenError[];
}

/**
 * Interface statistiques validation tokens
 */
export interface IValidationTokenStats {
  total: number;
  active: number;
  used: number;
  expired: number;
  blocked: number;
  by_type: Record<validation_token_type, number>;
  success_rate: number;
  average_usage_time: number;         // Temps moyen avant utilisation (minutes)
  recent_activity: {
    last_24h: number;
    last_7d: number;
    last_30d: number;
  };
}

/**
 * Interface filtres recherche tokens
 */
export interface IValidationTokenFilters {
  user_id?: string;
  email?: string;
  token_type?: validation_token_type | validation_token_type[];
  is_used?: boolean;
  is_blocked?: boolean;
  expires_before?: Date;
  expires_after?: Date;
  created_before?: Date;
  created_after?: Date;
  attempt_count_min?: number;
  attempt_count_max?: number;
}

// ============================================================================
// INTERFACE SERVICE VALIDATION TOKENS
// ============================================================================

/**
 * Interface service de gestion des tokens de validation
 */
export interface IValidationTokenService {
  // Création de tokens spécialisés
  createEmailVerificationToken(email: string, userId?: string, type?: 'registration' | 'email_change'): Promise<IValidationTokenGenerated>;
  createPasswordResetToken(email: string): Promise<IValidationTokenGenerated>;
  createInvitationToken(email: string, invitationData: any): Promise<IValidationTokenGenerated>;
  createMagicLinkToken(email: string, action: string, linkData?: any): Promise<IValidationTokenGenerated>;
  createPhoneVerificationToken(phone: string, userId?: string): Promise<IValidationTokenGenerated>;
  
  // Validation et utilisation
  validateToken(token: string): Promise<IValidationTokenValidation>;
  useToken(token: string, clientInfo?: any): Promise<IValidationTokenUsageResult>;
  verifyEmailWithToken(token: string): Promise<IValidationTokenUsageResult>;
  resetPasswordWithToken(token: string, newPassword: string): Promise<IValidationTokenUsageResult>;
  acceptInvitationWithToken(token: string, userData?: any): Promise<IValidationTokenUsageResult>;
  useMagicLink(token: string, clientInfo?: any): Promise<IValidationTokenUsageResult>;
  
  // Gestion des tentatives
  recordAttempt(tokenId: string, success: boolean, clientInfo?: any): Promise<void>;
  blockToken(tokenId: string, reason?: string): Promise<boolean>;
  unblockToken(tokenId: string): Promise<boolean>;
  
  // Récupération et recherche
  getToken(tokenId: string): Promise<IValidationToken | null>;
  getTokenByHash(tokenHash: string): Promise<IValidationToken | null>;
  getUserTokens(userId: string, type?: validation_token_type): Promise<IValidationToken[]>;
  getEmailTokens(email: string, type?: validation_token_type): Promise<IValidationToken[]>;
  
  // Renouvellement et gestion
  resendToken(originalTokenId: string): Promise<IValidationTokenGenerated>;
  extendTokenExpiry(tokenId: string, additionalMinutes: number): Promise<boolean>;
  revokeToken(tokenId: string): Promise<boolean>;
  revokeUserTokens(userId: string, type?: validation_token_type): Promise<number>;
  
  // Statistiques et monitoring
  getTokenStats(userId?: string): Promise<IValidationTokenStats>;
  getTokenUsageHistory(tokenId: string): Promise<any[]>;
  
  // Maintenance
  cleanupExpiredTokens(): Promise<number>;
  cleanupUsedTokens(olderThanDays?: number): Promise<number>;
  cleanupBlockedTokens(olderThanDays?: number): Promise<number>;
  
  // Utilitaires
  generateVerificationUrl(token: string, baseUrl?: string): string;
  generateMagicLinkUrl(token: string, baseUrl?: string): string;
  canResendToken(email: string, type: validation_token_type): Promise<boolean>;
}

// ============================================================================
// TYPES ET CONSTANTES
// ============================================================================

/**
 * Configuration durées par type de token (en minutes)
 */
export const VALIDATION_TOKEN_DURATIONS = {
  EMAIL_VERIFICATION: 24 * 60,       // 24 heures
  EMAIL_CHANGE: 30,                  // 30 minutes
  PASSWORD_RESET: 60,                // 1 heure
  ACCOUNT_ACTIVATION: 72 * 60,       // 72 heures
  INVITATION_USER: 7 * 24 * 60,      // 7 jours
  INVITATION_GROUP: 7 * 24 * 60,     // 7 jours
  MAGIC_LINK_LOGIN: 15,              // 15 minutes
  MAGIC_LINK_ACTION: 60,             // 1 heure
  PHONE_VERIFICATION: 10,            // 10 minutes
  ACCOUNT_DELETION: 24 * 60,         // 24 heures
} as const;

/**
 * Limites de tentatives par type
 */
export const VALIDATION_TOKEN_ATTEMPT_LIMITS = {
  EMAIL_VERIFICATION: 5,
  EMAIL_CHANGE: 3,
  PASSWORD_RESET: 3,
  ACCOUNT_ACTIVATION: 5,
  INVITATION_USER: 10,
  INVITATION_GROUP: 10,
  MAGIC_LINK_LOGIN: 3,
  MAGIC_LINK_ACTION: 5,
  PHONE_VERIFICATION: 5,
  ACCOUNT_DELETION: 3,
} as const;

/**
 * Codes d'erreur validation tokens
 */
export enum ValidationTokenErrorCode {
  TOKEN_NOT_FOUND = 'TOKEN_NOT_FOUND',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_USED = 'TOKEN_USED',
  TOKEN_BLOCKED = 'TOKEN_BLOCKED',
  ATTEMPTS_EXCEEDED = 'ATTEMPTS_EXCEEDED',
  INVALID_TOKEN_FORMAT = 'INVALID_TOKEN_FORMAT',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_MISMATCH = 'EMAIL_MISMATCH',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}