// src/modules/auth/dto/auth.types.ts
/**
 * Types communs pour les DTOs d'authentification
 * 
 * Contient :
 * - Types d'union pour validation
 * - Interfaces communes
 * - Enums spécifiques aux DTOs
 * - Types de réponse standardisés
 * 
 * Note: Évite les conflits avec ../../../common/types/auth.types
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

/**
 * Types de vérification supportés (DTOs)
 */
export enum DtoVerificationTypeEnum {
  EMAIL = 'email',
  PHONE = 'phone',
  IDENTITY = 'identity',
  ADDRESS = 'address',
}

/**
 * Méthodes d'envoi de codes (DTOs)
 */
export enum DtoDeliveryMethodEnum {
  EMAIL = 'email',
  SMS = 'sms',
  CALL = 'call',
  PUSH = 'push',
}

/**
 * Niveaux de sécurité (DTOs)
 */
export enum DtoSecurityLevelEnum {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Types d'authentification (DTOs)
 */
export enum DtoAuthenticationTypeEnum {
  PASSWORD = 'password',
  MFA = 'mfa',
  BIOMETRIC = 'biometric',
  TOKEN = 'token',
  SOCIAL = 'social',
}

/**
 * Statuts de session (DTOs)
 */
export enum DtoSessionStatusEnum {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  SUSPENDED = 'suspended',
}

/**
 * Types d'événements de sécurité (DTOs)
 */
export enum DtoSecurityEventTypeEnum {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  PASSWORD_CHANGED = 'password_changed',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  ACCOUNT_LOCKED = 'account_locked',
  SESSION_TERMINATED = 'session_terminated',
}

/**
 * Interface de base pour les réponses d'API
 */
export interface DtoBaseResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

/**
 * Interface pour les réponses avec données
 */
export interface DtoDataResponse<T> extends DtoBaseResponse {
  data: T;
}

/**
 * Interface pour les réponses d'erreur
 */
export interface DtoErrorResponse extends DtoBaseResponse {
  error: {
    code: string;
    details?: any;
    field?: string;
  };
}

/**
 * Interface pour les réponses paginées
 */
export interface DtoPaginatedResponse<T> extends DtoBaseResponse {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Métadonnées de requête (DTOs)
 */
export interface DtoRequestMetadata {
  ipAddress: string;
  userAgent?: string;
  deviceFingerprint?: string;
  geolocation?: {
    country?: string;
    region?: string;
    city?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  timestamp: Date;
}

/**
 * Informations de sécurité (DTOs)
 */
export interface DtoSecurityInfo {
  riskScore: number;
  threatLevel: DtoSecurityLevelEnum;
  isSuspicious: boolean;
  requiresAdditionalVerification: boolean;
  restrictions?: {
    type: string;
    reason: string;
    expiresAt?: Date;
  }[];
}

/**
 * Configuration de politique de sécurité (DTOs)
 */
export interface DtoSecurityPolicyConfig {
  minPasswordLength: number;
  requireSpecialChars: boolean;
  requireUppercase: boolean;
  requireNumbers: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number;
  sessionTimeout: number;
  requireMFA: boolean;
  allowedCountries?: string[];
}

/**
 * Options de validation (DTOs)
 */
export interface DtoValidationOptions {
  skipEmailValidation?: boolean;
  skipPhoneValidation?: boolean;
  allowWeakPasswords?: boolean;
  bypassRateLimit?: boolean;
}

/**
 * Contexte d'authentification pour DTOs
 */
export interface DtoAuthContext {
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent?: string;
  timestamp: Date;
  securityLevel: DtoSecurityLevelEnum;
}

/**
 * Types d'union utiles (préfixés pour éviter conflits)
 */
export type DtoVerificationType = keyof typeof DtoVerificationTypeEnum;
export type DtoDeliveryMethod = keyof typeof DtoDeliveryMethodEnum;
export type DtoSecurityLevel = keyof typeof DtoSecurityLevelEnum;
export type DtoAuthenticationType = keyof typeof DtoAuthenticationTypeEnum;
export type DtoSessionStatus = keyof typeof DtoSessionStatusEnum;
export type DtoSecurityEventType = keyof typeof DtoSecurityEventTypeEnum;

/**
 * Types pour les transformations de données
 */
export type DtoTransformToLowercase<T> = T extends string ? Lowercase<T> : T;
export type DtoTransformToUppercase<T> = T extends string ? Uppercase<T> : T;

/**
 * Types pour les champs optionnels conditionnels
 */
export type DtoConditionalRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DtoConditionalOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Utilitaires de type pour les DTOs
 */
export type DtoCreateType<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type DtoUpdateType<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;
export type DtoResponseType<T> = T & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Configuration par défaut pour les DTOs
 */
export const DTO_DEFAULT_CONFIG = {
  pagination: {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100,
  },
  validation: {
    minPasswordLength: 8,
    maxPasswordLength: 128,
    emailMaxLength: 255,
    phoneMaxLength: 20,
  },
  security: {
    maxLoginAttempts: 5,
    lockoutDuration: 900, // 15 minutes
    tokenExpiry: 900, // 15 minutes
    refreshTokenExpiry: 604800, // 7 days
  },
} as const;

/**
 * Messages d'erreur standardisés
 */
export const DTO_ERROR_MESSAGES = {
  INVALID_EMAIL: 'Adresse email invalide',
  INVALID_PHONE: 'Numéro de téléphone invalide',
  WEAK_PASSWORD: 'Mot de passe trop faible',
  PASSWORDS_DONT_MATCH: 'Les mots de passe ne correspondent pas',
  REQUIRED_FIELD: 'Ce champ est requis',
  INVALID_TOKEN: 'Token invalide ou expiré',
  RATE_LIMIT_EXCEEDED: 'Trop de tentatives, réessayez plus tard',
  UNAUTHORIZED: 'Accès non autorisé',
  FORBIDDEN: 'Accès interdit',
  NOT_FOUND: 'Ressource non trouvée',
  INTERNAL_ERROR: 'Erreur interne du serveur',
} as const;

/**
 * Codes de statut HTTP personnalisés
 */
export const DTO_CUSTOM_STATUS_CODES = {
  MFA_REQUIRED: 240,
  EMAIL_VERIFICATION_REQUIRED: 241,
  PHONE_VERIFICATION_REQUIRED: 242,
  PASSWORD_CHANGE_REQUIRED: 243,
  ACCOUNT_SUSPENDED: 244,
} as const;