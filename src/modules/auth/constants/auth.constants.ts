// src/modules/auth/constants/auth.constants.ts

/**
 * Constantes d'authentification Entrix V3.0 - CORRIGÉES
 * ✅ AJOUT : Section PASSWORD pour validation de force
 * ✅ AJOUT : SecurityEventType pour les événements de sécurité
 * Respecte strictement schema.prisma et api_specs_auth_session.md
 */

export const AUTH_CONSTANTS = {
  // Durées JWT (en secondes)
  JWT: {
    ACCESS_TOKEN_EXPIRY: 15 * 60, // 15 minutes
    REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60, // 7 jours
    REFRESH_TOKEN_EXPIRY_REMEMBER: 30 * 24 * 60 * 60, // 30 jours si remember me
    PASSWORD_RESET_TOKEN_EXPIRY: 60 * 60, // 1 heure
    MFA_CHALLENGE_TOKEN_EXPIRY: 5 * 60, // 5 minutes
  },

  // ✅ NOUVEAU : Section PASSWORD pour validation de force
  PASSWORD: {
    MIN_STRENGTH_SCORE: 60, // Score minimum requis (sur 100)
    WEAK_SCORE_THRESHOLD: 40, // En dessous = faible
    MEDIUM_SCORE_THRESHOLD: 70, // Entre 40-69 = moyen, 70+ = fort
    
    // Scores pour différents critères
    SCORING: {
      LENGTH_BONUS: 4, // Points par caractère au-delà du minimum
      UPPERCASE_BONUS: 10, // Points pour majuscules
      LOWERCASE_BONUS: 5, // Points pour minuscules
      NUMBERS_BONUS: 10, // Points pour chiffres
      SYMBOLS_BONUS: 15, // Points pour symboles
      MIXED_CASE_BONUS: 5, // Bonus pour mélange maj/min
      MIDDLE_NUMBERS_BONUS: 5, // Chiffres au milieu (pas début/fin)
      MIDDLE_SYMBOLS_BONUS: 5, // Symboles au milieu
      
      // Pénalités
      LETTERS_ONLY_PENALTY: -15, // Que des lettres
      NUMBERS_ONLY_PENALTY: -20, // Que des chiffres
      REPEAT_CHARS_PENALTY: -10, // Caractères répétés
      CONSECUTIVE_LETTERS_PENALTY: -5, // Lettres consécutives (abc)
      CONSECUTIVE_NUMBERS_PENALTY: -5, // Chiffres consécutifs (123)
      SEQUENTIAL_LETTERS_PENALTY: -10, // Séquences (abcd)
      SEQUENTIAL_NUMBERS_PENALTY: -10, // Séquences (1234)
      COMMON_PATTERNS_PENALTY: -25, // Patterns communs (password, admin, etc.)
    },
    
    // Mots de passe faibles à détecter
    WEAK_PATTERNS: [
      'password', 'admin', 'user', 'login', 'root', 'guest',
      '123456', '654321', 'qwerty', 'azerty', 'abc123',
      'password123', 'admin123', 'user123', 'test123',
      'motdepasse', 'administrateur', 'utilisateur',
      'entrix', 'tunisia', 'tunis', 'tunisia123'
    ],
    
    // Séquences à pénaliser
    LETTER_SEQUENCES: ['abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi', 'hij', 'ijk', 'jkl', 'klm', 'lmn', 'mno', 'nop', 'opq', 'pqr', 'qrs', 'rst', 'stu', 'tuv', 'uvw', 'vwx', 'wxy', 'xyz'],
    NUMBER_SEQUENCES: ['012', '123', '234', '345', '456', '567', '678', '789', '890'],
    
    // Suggestions d'amélioration
    SUGGESTIONS: {
      TOO_SHORT: 'Utilisez au moins {min} caractères',
      ADD_UPPERCASE: 'Ajoutez des lettres majuscules',
      ADD_LOWERCASE: 'Ajoutez des lettres minuscules',
      ADD_NUMBERS: 'Ajoutez des chiffres',
      ADD_SYMBOLS: 'Ajoutez des symboles (!@#$%^&*)',
      AVOID_PATTERNS: 'Évitez les mots courants et séquences',
      AVOID_REPETITION: 'Évitez la répétition de caractères',
      AVOID_PERSONAL_INFO: 'N\'utilisez pas d\'informations personnelles',
      USE_PASSPHRASE: 'Considérez une phrase de passe longue',
      MIX_CHARACTER_TYPES: 'Mélangez différents types de caractères'
    }
  },

  // Formats de validation
  VALIDATION: {
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    EMAIL_MAX_LENGTH: 255,
    PHONE_REGEX: /^\+216[0-9]{8}$/, // Format tunisien
    PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
    DEVICE_FINGERPRINT_LENGTH: 64,
  },

  // Limites sécurité
  SECURITY: {
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60, // 15 minutes
    MAX_SESSIONS_PER_USER: 10,
    RISK_SCORE_THRESHOLD: 70, // Sur 100
    MFA_CODE_LENGTH: 6,
    BACKUP_CODES_COUNT: 10,
  },

  // Providers MFA
  MFA_PROVIDERS: {
    SMS_OTP: 'SMS_OTP' as const,
    EMAIL_OTP: 'EMAIL_OTP' as const,
    TOTP_APP: 'TOTP_APP' as const,
    BACKUP_CODE: 'BACKUP_CODE' as const,
  },

  // Niveaux de risque
  RISK_LEVELS: {
    LOW: 0,
    MEDIUM: 30,
    HIGH: 60,
    CRITICAL: 80,
  },

  // Durées de cache
  CACHE: {
    USER_PROFILE_TTL: 300, // 5 minutes
    SESSION_INFO_TTL: 600, // 10 minutes
    MFA_SETTINGS_TTL: 1800, // 30 minutes
    RISK_SCORE_TTL: 900, // 15 minutes
  },



  // Messages d'erreur standardisés
  ERRORS: {
    INVALID_CREDENTIALS: 'Email ou mot de passe incorrect',
    ACCOUNT_LOCKED: 'Compte verrouillé pour sécurité',
    EMAIL_NOT_VERIFIED: 'Email non vérifié',
    MFA_REQUIRED: 'Authentification multifacteur requise',
    INVALID_MFA_CODE: 'Code MFA incorrect',
    SESSION_EXPIRED: 'Session expirée',
    INVALID_REFRESH_TOKEN: 'Token de rafraîchissement invalide',
    WEAK_PASSWORD: 'Mot de passe trop faible',
    EMAIL_ALREADY_EXISTS: 'Un compte avec cet email existe déjà',
    INVALID_RESET_TOKEN: 'Token de réinitialisation invalide ou expiré',
    DEVICE_NOT_TRUSTED: 'Appareil non reconnu',
    RATE_LIMITED: 'Trop de tentatives. Réessayez plus tard',
    SUSPICIOUS_ACTIVITY: 'Activité suspecte détectée',
    ACCOUNT_SUSPENDED: 'Compte suspendu',
    VERIFICATION_REQUIRED: 'Vérification requise',
  },

  // Évènements d'audit
  AUDIT_EVENTS: {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILED: 'LOGIN_FAILED',
    LOGOUT: 'LOGOUT',
    REGISTRATION: 'REGISTRATION',
    PASSWORD_CHANGE: 'PASSWORD_CHANGE',
    PASSWORD_RESET: 'PASSWORD_RESET',
    MFA_ENABLED: 'MFA_ENABLED',
    MFA_DISABLED: 'MFA_DISABLED',
    EMAIL_VERIFIED: 'EMAIL_VERIFIED',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
    SUSPICIOUS_LOGIN: 'SUSPICIOUS_LOGIN',
  },

  // ✅ NOUVEAU : Types d'événements de sécurité
  SECURITY_EVENTS: {
    // Événements de connexion
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILED: 'LOGIN_FAILED',
    FAILED_LOGIN: 'FAILED_LOGIN', // Alias pour compatibilité
    LOGOUT: 'LOGOUT',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    
    // Événements de sécurité
    SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
    MULTIPLE_SESSIONS: 'MULTIPLE_SESSIONS',
    UNKNOWN_DEVICE: 'UNKNOWN_DEVICE',
    DEVICE_TRUSTED: 'DEVICE_TRUSTED',
    DEVICE_REVOKED: 'DEVICE_REVOKED',
    
    // Événements MFA
    MFA_SETUP: 'MFA_SETUP',
    MFA_ENABLED: 'MFA_ENABLED',
    MFA_DISABLED: 'MFA_DISABLED',
    MFA_CODE_VERIFIED: 'MFA_CODE_VERIFIED',
    MFA_CODE_FAILED: 'MFA_CODE_FAILED',
    
    // Événements de compte
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
    ACCOUNT_UNLOCKED: 'ACCOUNT_UNLOCKED',
    ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
    PASSWORD_CHANGED: 'PASSWORD_CHANGED',
    PASSWORD_RESET: 'PASSWORD_RESET',
    EMAIL_VERIFIED: 'EMAIL_VERIFIED',
    
    // Événements réseau
    IP_BLOCKED: 'IP_BLOCKED',
    IP_UNBLOCKED: 'IP_UNBLOCKED',
    GEOLOCATION_CHANGE: 'GEOLOCATION_CHANGE',
    
    // Événements système
    RISK_ASSESSMENT: 'RISK_ASSESSMENT',
    SECURITY_ALERT: 'SECURITY_ALERT',
    AUDIT_LOG_ACCESS: 'AUDIT_LOG_ACCESS',
  },

  // Sessions
  SESSION: {
    TYPES: {
      REUSED: 'reused' as const,
      REFRESHED: 'refreshed' as const,
      NEW: 'new' as const,
    },
    CLEANUP_INTERVAL: 24 * 60 * 60, // 24 heures en secondes
    MAX_INACTIVE_TIME: 30 * 60, // 30 minutes d'inactivité
  },
} as const;

// ✅ TYPES DÉRIVÉS POUR TYPESCRIPT
export type MfaProvider = typeof AUTH_CONSTANTS.MFA_PROVIDERS[keyof typeof AUTH_CONSTANTS.MFA_PROVIDERS];
export type SessionType = typeof AUTH_CONSTANTS.SESSION.TYPES[keyof typeof AUTH_CONSTANTS.SESSION.TYPES];
export type AuditEvent = typeof AUTH_CONSTANTS.AUDIT_EVENTS[keyof typeof AUTH_CONSTANTS.AUDIT_EVENTS];

// ✅ NOUVEAU : Type pour les événements de sécurité
export type SecurityEventType = typeof AUTH_CONSTANTS.SECURITY_EVENTS[keyof typeof AUTH_CONSTANTS.SECURITY_EVENTS];

// ✅ MAPPINGS MFA POUR PRISMA
export const MFA_PROVIDER_TO_METHOD_MAPPING = {
  [AUTH_CONSTANTS.MFA_PROVIDERS.SMS_OTP]: 'SMS',
  [AUTH_CONSTANTS.MFA_PROVIDERS.EMAIL_OTP]: 'EMAIL', 
  [AUTH_CONSTANTS.MFA_PROVIDERS.TOTP_APP]: 'TOTP',
  [AUTH_CONSTANTS.MFA_PROVIDERS.BACKUP_CODE]: 'BACKUP_CODES',
} as const;

export const MFA_METHOD_TO_PROVIDER_MAPPING = {
  'SMS': AUTH_CONSTANTS.MFA_PROVIDERS.SMS_OTP,
  'EMAIL': AUTH_CONSTANTS.MFA_PROVIDERS.EMAIL_OTP,
  'TOTP': AUTH_CONSTANTS.MFA_PROVIDERS.TOTP_APP,
  'BACKUP_CODES': AUTH_CONSTANTS.MFA_PROVIDERS.BACKUP_CODE,
} as const;

// ✅ EXPORT DES CONSTANTES PRINCIPALES POUR COMPATIBILITÉ
export const {
  JWT,
  PASSWORD, // ✅ NOUVEAU
  VALIDATION,
  SECURITY,
  MFA_PROVIDERS,
  RISK_LEVELS,
  CACHE,
  ERRORS,
  AUDIT_EVENTS,
  SECURITY_EVENTS, // ✅ NOUVEAU
  SESSION
} = AUTH_CONSTANTS;