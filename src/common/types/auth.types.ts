// src/common/types/auth.types.ts
/**
 * Types et interfaces pour l'authentification Entrix
 * 
 * Contient :
 * - Types pour JWT et tokens
 * - Types pour MFA et sécurité
 * - Types pour les sessions
 * - Types pour les tentatives de connexion
 * - Types pour les politiques de sécurité
 * 
 * Basé sur le schema Prisma et les enums de la base de données
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { 
  mfa_method, 
  audit_action, 
  blacklist_scope, 
  blacklist_type,
  severity_level 
} from '@prisma/client';

/**
 * Payload JWT pour l'access token
 */
export interface JwtPayload {
  /** ID utilisateur */
  sub: string;
  /** Email utilisateur */
  email: string;
  /** Rôles utilisateur */
  roles: string[];
  /** Permissions utilisateur */
  permissions: string[];
  /** Type de token */
  type: 'access';
  /** Timestamp émission */
  iat: number;
  /** Timestamp expiration */
  exp: number;
  /** ID session */
  sessionId: string;
  /** Niveau de sécurité requis */
  securityLevel?: severity_level;
  /** MFA validé */
  mfaVerified?: boolean;
}

/**
 * Payload JWT pour le refresh token
 */
export interface RefreshTokenPayload {
  /** ID utilisateur */
  sub: string;
  /** Type de token */
  type: 'refresh';
  /** Timestamp émission */
  iat: number;
  /** Timestamp expiration */
  exp: number;
  /** ID session */
  sessionId: string;
  /** Version du token (pour invalidation) */
  tokenVersion: number;
}

/**
 * Réponse d'authentification complète
 */
export interface AuthResponse {
  /** Informations utilisateur */
  user: AuthUser;
  /** Tokens d'authentification */
  tokens: TokenPair;
  /** Informations de session */
  session: SessionInfo;
  /** Statut MFA */
  mfaRequired?: boolean;
  /** Méthodes MFA disponibles */
  mfaMethods?: mfa_method[];
}

/**
 * Informations utilisateur pour l'authentification
 */
export interface AuthUser {
  /** ID utilisateur */
  id: string;
  /** Email */
  email: string;
  /** Prénom */
  firstName: string;
  /** Nom */
  lastName: string;
  /** Avatar */
  avatar?: string;
  /** Compte actif */
  isActive: boolean;
  /** Email vérifié */
  emailVerified: Date | null;
  /** Téléphone vérifié */
  phoneVerified: Date | null;
  /** Rôles */
  roles: UserRole[];
  /** Permissions agrégées */
  permissions: string[];
  /** Dernière connexion */
  lastLogin?: Date;
}

/**
 * Rôle utilisateur simplifié
 */
export interface UserRole {
  /** ID du rôle */
  id: string;
  /** Code du rôle */
  code: string;
  /** Nom du rôle */
  name: string;
  /** Niveau hiérarchique */
  level: number;
  /** Date d'assignation */
  assignedAt: Date;
  /** Date d'expiration */
  validUntil?: Date;
  /** Statut */
  status: string;
}

/**
 * Paire de tokens
 */
export interface TokenPair {
  /** Access token */
  accessToken: string;
  /** Refresh token */
  refreshToken: string;
  /** Type de token */
  tokenType: 'Bearer';
  /** Durée de vie access token (secondes) */
  expiresIn: number;
  /** Durée de vie refresh token (secondes) */
  refreshExpiresIn: number;
}

/**
 * Informations de session
 */
export interface SessionInfo {
  /** ID session */
  id: string;
  /** Adresse IP */
  ipAddress: string;
  /** User agent */
  userAgent?: string;
  /** Empreinte device */
  deviceFingerprint?: string;
  /** Géolocalisation */
  geolocation?: Geolocation;
  /** Date création */
  createdAt: Date;
  /** Dernière activité */
  lastActivity: Date;
  /** Expiration */
  expiresAt: Date;
}

/**
 * Géolocalisation
 */
export interface Geolocation {
  /** Pays */
  country?: string;
  /** Région */
  region?: string;
  /** Ville */
  city?: string;
  /** Coordonnées */
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  /** Fournisseur de géolocalisation */
  provider?: string;
}

/**
 * Configuration MFA
 */
export interface MfaConfig {
  /** Méthode MFA */
  method: mfa_method;
  /** Activé */
  enabled: boolean;
  /** Secret (pour TOTP) */
  secret?: string;
  /** Numéro de téléphone (pour SMS) */
  phoneNumber?: string;
  /** Email de backup */
  backupEmail?: string;
  /** Codes de secours */
  backupCodes?: string[];
  /** QR code URL (pour TOTP) */
  qrCodeUrl?: string;
}

/**
 * Token MFA
 */
export interface MfaToken {
  /** ID du token */
  id: string;
  /** ID utilisateur */
  userId: string;
  /** Méthode */
  method: mfa_method;
  /** Hash du token */
  tokenHash: string;
  /** Secret (chiffré) */
  secret?: string;
  /** Expiration */
  expiresAt: Date;
  /** Utilisé */
  isUsed: boolean;
  /** Métadonnées */
  metadata?: Record<string, any>;
}

/**
 * Tentative de connexion
 */
export interface LoginAttempt {
  /** ID tentative */
  id: string;
  /** Email utilisé */
  email: string;
  /** ID utilisateur (si trouvé) */
  userId?: string;
  /** Adresse IP */
  ipAddress: string;
  /** User agent */
  userAgent?: string;
  /** Succès */
  success: boolean;
  /** Raison d'échec */
  failureReason?: string;
  /** Tentative suspecte */
  isSuspicious: boolean;
  /** Géolocalisation */
  geolocation?: Geolocation;
  /** Métadonnées */
  metadata?: Record<string, any>;
  /** Date */
  createdAt: Date;
}

/**
 * Événement de sécurité
 */
export interface SecurityEvent {
  /** ID événement */
  id: string;
  /** Type d'événement */
  eventType: string;
  /** Niveau de sévérité */
  severity: severity_level;
  /** Utilisateur cible */
  targetUserId?: string;
  /** Adresse IP */
  ipAddress?: string;
  /** Description */
  description: string;
  /** Données de l'événement */
  eventData?: Record<string, any>;
  /** Statut */
  status: string;
  /** Date résolution */
  resolvedAt?: Date;
  /** Métadonnées */
  metadata?: Record<string, any>;
  /** Date création */
  createdAt: Date;
}

/**
 * Entrée blacklist
 */
export interface BlacklistEntry {
  /** ID entrée */
  id: string;
  /** Type d'entrée */
  type: blacklist_type;
  /** Valeur blacklistée */
  value: string;
  /** Portée */
  scope: blacklist_scope;
  /** Raison */
  reason: string;
  /** Actif */
  isActive: boolean;
  /** Permanent */
  isPermanent: boolean;
  /** Expiration */
  expiresAt?: Date;
  /** Ajouté par */
  addedBy: string;
  /** Métadonnées */
  metadata?: Record<string, any>;
  /** Date création */
  createdAt: Date;
}

/**
 * Politique de sécurité
 */
export interface SecurityPolicy {
  /** ID politique */
  id: string;
  /** Code */
  code: string;
  /** Nom */
  name: string;
  /** Description */
  description?: string;
  /** Type de politique */
  policyType: string;
  /** Règles */
  rules: SecurityPolicyRules;
  /** Début validité */
  validFrom: Date;
  /** Fin validité */
  validUntil?: Date;
  /** Actif */
  isActive: boolean;
  /** Appliqué */
  isEnforced: boolean;
  /** Métadonnées */
  metadata?: Record<string, any>;
}

/**
 * Règles de politique de sécurité
 */
export interface SecurityPolicyRules {
  /** Politique mot de passe */
  passwordPolicy?: PasswordPolicy;
  /** Politique session */
  sessionPolicy?: SessionPolicy;
  /** Politique accès */
  accessPolicy?: AccessPolicy;
  /** Politique MFA */
  mfaPolicy?: MfaPolicy;
}

/**
 * Politique mot de passe
 */
export interface PasswordPolicy {
  /** Longueur minimale */
  minLength: number;
  /** Majuscule requise */
  requireUppercase: boolean;
  /** Minuscule requise */
  requireLowercase: boolean;
  /** Chiffre requis */
  requireNumbers: boolean;
  /** Caractère spécial requis */
  requireSpecial: boolean;
  /** Âge maximum (jours) */
  maxAgeDays: number;
  /** Historique (nb mots de passe) */
  historyCount: number;
  /** Score complexité minimum */
  complexityScore: number;
}

/**
 * Politique session
 */
export interface SessionPolicy {
  /** Durée maximum (heures) */
  maxDurationHours: number;
  /** Timeout inactivité (minutes) */
  idleTimeoutMinutes: number;
  /** Sessions concurrentes max */
  concurrentSessions: number;
  /** MFA requis pour */
  require2faFor: string[];
  /** Restriction géographique */
  geoRestriction?: GeoRestriction;
}

/**
 * Restriction géographique
 */
export interface GeoRestriction {
  /** Activé */
  enabled: boolean;
  /** Pays autorisés */
  allowedCountries: string[];
  /** Régions autorisées */
  allowedRegions?: string[];
  /** Blocage automatique */
  autoBlock: boolean;
}

/**
 * Politique d'accès
 */
export interface AccessPolicy {
  /** Tentatives échouées max */
  maxFailedAttempts: number;
  /** Durée verrouillage (minutes) */
  lockoutDurationMinutes: number;
  /** Délai progressif */
  progressiveDelay: boolean;
  /** Captcha après tentatives */
  captchaAfterAttempts: number;
  /** Restriction IP */
  ipRestriction?: boolean;
  /** Whitelist IP */
  ipWhitelist?: string[];
}

/**
 * Politique MFA
 */
export interface MfaPolicy {
  /** Requis pour tous */
  requiredForAll: boolean;
  /** Requis pour rôles */
  requiredForRoles: string[];
  /** Méthodes autorisées */
  allowedMethods: mfa_method[];
  /** Méthode par défaut */
  defaultMethod: mfa_method;
  /** Codes de secours */
  backupCodesEnabled: boolean;
  /** Fréquence vérification */
  verificationFrequency: number; // heures
}

/**
 * Contexte d'authentification
 */
export interface AuthContext {
  /** Utilisateur */
  user: AuthUser;
  /** Session */
  session: SessionInfo;
  /** Adresse IP */
  ipAddress: string;
  /** User agent */
  userAgent?: string;
  /** Permissions calculées */
  permissions: string[];
  /** MFA validé */
  mfaVerified: boolean;
  /** Niveau de sécurité */
  securityLevel: severity_level;
}

/**
 * Options de login
 */
export interface LoginOptions {
  /** Se souvenir de moi */
  rememberMe?: boolean;
  /** Adresse IP */
  ipAddress: string;
  /** User agent */
  userAgent?: string;
  /** Empreinte device */
  deviceFingerprint?: string;
  /** Géolocalisation */
  geolocation?: Geolocation;
  /** Forcer nouveau session */
  forceNewSession?: boolean;
  /** Code MFA */
  mfaCode?: string;
}

/**
 * Résultat de validation de token
 */
export interface TokenValidationResult {
  /** Valide */
  valid: boolean;
  /** Payload décodé */
  payload?: JwtPayload | RefreshTokenPayload;
  /** Raison si invalide */
  reason?: string;
  /** Expiré */
  expired?: boolean;
  /** Révoqué */
  revoked?: boolean;
}

/**
 * Configuration rate limiting
 */
export interface RateLimitConfig {
  /** Fenêtre de temps (secondes) */
  windowMs: number;
  /** Nombre maximum de requêtes */
  max: number;
  /** Message d'erreur */
  message: string;
  /** Headers standards */
  standardHeaders: boolean;
  /** Headers legacy */
  legacyHeaders: boolean;
  /** Fonction skip */
  skipIf?: (request: any) => boolean;
}

/**
 * Type union pour les types d'authentification
 */
export type AuthenticationType = 'login' | 'refresh' | 'mfa' | 'reset' | 'verify';

/**
 * Type union pour les statuts de session
 */
export type SessionStatus = 'active' | 'expired' | 'terminated' | 'suspicious';

/**
 * Type union pour les niveaux de sécurité
 */
export type SecurityLevel = severity_level;