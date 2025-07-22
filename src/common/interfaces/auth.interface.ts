// src/common/interfaces/auth.interface.ts
/**
 * Interfaces pour les services d'authentification Entrix
 * 
 * Définit les contrats pour :
 * - Service d'authentification principal
 * - Service de tokens JWT
 * - Service MFA
 * - Service de sessions
 * - Service de sécurité
 * 
 * Utilisé pour l'injection de dépendances et la testabilité
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { 
  AuthResponse, 
  TokenPair, 
  JwtPayload, 
  RefreshTokenPayload,
  TokenValidationResult,
  MfaConfig,
  MfaToken,
  SessionInfo,
  LoginAttempt,
  SecurityEvent,
  BlacklistEntry,
  SecurityPolicy,
  LoginOptions,
  AuthContext
} from '../types/auth.types';
import { User } from '../types/user.types';
import { mfa_method, severity_level } from '@prisma/client';

/**
 * Interface pour le service d'authentification principal
 */
export interface IAuthService {
  /**
   * Inscription d'un nouvel utilisateur
   */
  register(data: RegisterData): Promise<AuthResponse>;

  /**
   * Connexion utilisateur
   */
  login(email: string, password: string, options: LoginOptions): Promise<AuthResponse>;

  /**
   * Rafraîchissement des tokens
   */
  refreshTokens(refreshToken: string): Promise<TokenPair>;

  /**
   * Déconnexion utilisateur
   */
  logout(userId: string, sessionId?: string): Promise<void>;

  /**
   * Déconnexion de toutes les sessions
   */
  logoutAll(userId: string): Promise<void>;

  /**
   * Mot de passe oublié
   */
  forgotPassword(email: string): Promise<void>;

  /**
   * Réinitialisation mot de passe
   */
  resetPassword(token: string, newPassword: string): Promise<void>;

  /**
   * Changement mot de passe
   */
  changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void>;

  /**
   * Vérification email
   */
  verifyEmail(token: string): Promise<void>;

  /**
   * Renvoi email de vérification
   */
  resendEmailVerification(email: string): Promise<void>;

  /**
   * Vérification téléphone
   */
  verifyPhone(userId: string, code: string): Promise<void>;

  /**
   * Envoi code vérification téléphone
   */
  sendPhoneVerification(userId: string): Promise<void>;

  /**
   * Validation du contexte d'authentification
   */
  validateAuthContext(token: string): Promise<AuthContext>;
}

/**
 * Interface pour le service de tokens JWT
 */
export interface ITokenService {
  /**
   * Génération access token
   */
  generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string>;

  /**
   * Génération refresh token
   */
  generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): Promise<string>;

  /**
   * Génération paire de tokens
   */
  generateTokenPair(user: User, sessionId: string): Promise<TokenPair>;

  /**
   * Validation token
   */
  validateToken(token: string, type: 'access' | 'refresh'): Promise<TokenValidationResult>;

  /**
   * Décodage token sans validation
   */
  decodeToken(token: string): JwtPayload | RefreshTokenPayload | null;

  /**
   * Révocation token
   */
  revokeToken(token: string): Promise<void>;

  /**
   * Révocation tous les tokens d'un utilisateur
   */
  revokeAllTokens(userId: string): Promise<void>;

  /**
   * Vérification si token est révoqué
   */
  isTokenRevoked(token: string): Promise<boolean>;

  /**
   * Génération token temporaire (reset, verify, etc.)
   */
  generateTemporaryToken(userId: string, type: string, expiresIn?: number): Promise<string>;

  /**
   * Validation token temporaire
   */
  validateTemporaryToken(token: string, type: string): Promise<{ userId: string; valid: boolean }>;
}

/**
 * Interface pour le service MFA
 */
export interface IMfaService {
  /**
   * Activation MFA pour un utilisateur
   */
  enableMfa(userId: string, method: mfa_method, config: Partial<MfaConfig>): Promise<MfaConfig>;

  /**
   * Désactivation MFA
   */
  disableMfa(userId: string, method?: mfa_method): Promise<void>;

  /**
   * Génération code MFA
   */
  generateMfaToken(userId: string, method: mfa_method): Promise<MfaToken>;

  /**
   * Vérification code MFA
   */
  verifyMfaToken(userId: string, method: mfa_method, token: string): Promise<boolean>;

  /**
   * Configuration TOTP
   */
  setupTotp(userId: string): Promise<{ secret: string; qrCode: string; backupCodes: string[] }>;

  /**
   * Vérification TOTP
   */
  verifyTotp(userId: string, token: string): Promise<boolean>;

  /**
   * Génération codes de secours
   */
  generateBackupCodes(userId: string): Promise<string[]>;

  /**
   * Utilisation code de secours
   */
  useBackupCode(userId: string, code: string): Promise<boolean>;

  /**
   * Obtention configuration MFA utilisateur
   */
  getUserMfaConfig(userId: string): Promise<MfaConfig | null>;

  /**
   * Vérification si MFA requis
   */
  isMfaRequired(userId: string, context: Partial<AuthContext>): Promise<boolean>;

  /**
   * Envoi code par SMS
   */
  sendSmsCode(userId: string, phoneNumber: string): Promise<void>;

  /**
   * Envoi code par email
   */
  sendEmailCode(userId: string, email: string): Promise<void>;
}

/**
 * Interface pour le service de sessions
 */
export interface ISessionService {
  /**
   * Création session
   */
  createSession(userId: string, options: SessionCreationOptions): Promise<SessionInfo>;

  /**
   * Obtention session
   */
  getSession(sessionId: string): Promise<SessionInfo | null>;

  /**
   * Mise à jour activité session
   */
  updateSessionActivity(sessionId: string): Promise<void>;

  /**
   * Termination session
   */
  terminateSession(sessionId: string): Promise<void>;

  /**
   * Termination toutes les sessions d'un utilisateur
   */
  terminateAllUserSessions(userId: string): Promise<void>;

  /**
   * Obtention sessions utilisateur
   */
  getUserSessions(userId: string): Promise<SessionInfo[]>;

  /**
   * Validation session
   */
  validateSession(sessionId: string): Promise<boolean>;

  /**
   * Nettoyage sessions expirées
   */
  cleanupExpiredSessions(): Promise<number>;

  /**
   * Obtention sessions actives
   */
  getActiveSessions(userId: string): Promise<SessionInfo[]>;

  /**
   * Détection sessions suspectes
   */
  detectSuspiciousSessions(userId: string): Promise<SessionInfo[]>;
}

/**
 * Interface pour le service de sécurité
 */
export interface ISecurityService {
  /**
   * Enregistrement tentative de connexion
   */
  logLoginAttempt(data: LoginAttemptData): Promise<LoginAttempt>;

  /**
   * Enregistrement événement de sécurité
   */
  logSecurityEvent(data: SecurityEventData): Promise<SecurityEvent>;

  /**
   * Vérification blacklist
   */
  checkBlacklist(type: string, value: string, scope?: string): Promise<boolean>;

  /**
   * Ajout à la blacklist
   */
  addToBlacklist(entry: Omit<BlacklistEntry, 'id' | 'createdAt'>): Promise<BlacklistEntry>;

  /**
   * Suppression de la blacklist
   */
  removeFromBlacklist(id: string): Promise<void>;

  /**
   * Obtention entrées blacklist
   */
  getBlacklistEntries(filters?: BlacklistFilters): Promise<BlacklistEntry[]>;

  /**
   * Validation politique de sécurité
   */
  validateSecurityPolicy(userId: string, action: string, context: any): Promise<boolean>;

  /**
   * Obtention politique de sécurité
   */
  getSecurityPolicy(code: string): Promise<SecurityPolicy | null>;

  /**
   * Application politique de sécurité
   */
  enforceSecurityPolicy(policy: SecurityPolicy, context: any): Promise<void>;

  /**
   * Détection activité suspecte
   */
  detectSuspiciousActivity(userId: string, context: any): Promise<boolean>;

  /**
   * Calcul score de risque
   */
  calculateRiskScore(userId: string, context: any): Promise<number>;

  /**
   * Obtention événements de sécurité
   */
  getSecurityEvents(filters?: SecurityEventFilters): Promise<SecurityEvent[]>;
}

/**
 * Interface pour le service de rate limiting
 */
export interface IRateLimitService {
  /**
   * Vérification limite
   */
  checkLimit(key: string, limit: number, window: number): Promise<{ allowed: boolean; remaining: number; resetAt: Date }>;

  /**
   * Incrémentation compteur
   */
  incrementCounter(key: string, window: number): Promise<number>;

  /**
   * Réinitialisation compteur
   */
  resetCounter(key: string): Promise<void>;

  /**
   * Obtention info limite
   */
  getLimitInfo(key: string): Promise<{ count: number; resetAt: Date } | null>;

  /**
   * Blocage temporaire
   */
  blockTemporarily(key: string, duration: number): Promise<void>;

  /**
   * Vérification si bloqué
   */
  isBlocked(key: string): Promise<boolean>;
}

// Types de données pour les interfaces

/**
 * Données d'inscription
 */
export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  acceptTerms: boolean;
  marketingConsent?: boolean;
}

/**
 * Options création session
 */
export interface SessionCreationOptions {
  ipAddress: string;
  userAgent?: string;
  deviceFingerprint?: string;
  geolocation?: any;
  rememberMe?: boolean;
}

/**
 * Données tentative connexion
 */
export interface LoginAttemptData {
  email: string;
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
  isSuspicious?: boolean;
  geolocation?: any;
  metadata?: any;
}

/**
 * Données événement sécurité
 */
export interface SecurityEventData {
  eventType: string;
  severity: severity_level;
  targetUserId?: string;
  ipAddress?: string;
  description: string;
  eventData?: any;
  metadata?: any;
}

/**
 * Filtres blacklist
 */
export interface BlacklistFilters {
  type?: string;
  scope?: string;
  isActive?: boolean;
  addedBy?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

/**
 * Filtres événements sécurité
 */
export interface SecurityEventFilters {
  eventType?: string;
  severity?: severity_level;
  targetUserId?: string;
  status?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}