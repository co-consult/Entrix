// src/modules/auth/constants/auth.constants.ts

/**
 * Constantes d'authentification Entrix V3.0
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
  },

  // Headers HTTP
  HEADERS: {
    AUTHORIZATION: 'Authorization',
    X_RATE_LIMIT_REMAINING: 'X-RateLimit-Remaining',
    X_RATE_LIMIT_RESET: 'X-RateLimit-Reset',
    X_DEVICE_FINGERPRINT: 'X-Device-Fingerprint',
    X_GEOLOCATION: 'X-Geolocation',
    X_RISK_SCORE: 'X-Risk-Score',
  },

  // Providers MFA
  MFA_PROVIDERS: {
    SMS_OTP: 'SMS_OTP',
    EMAIL_OTP: 'EMAIL_OTP', 
    TOTP_APP: 'TOTP_APP',
    BACKUP_CODE: 'BACKUP_CODE',
  } as const,

  // Types d'appareils (selon schema.prisma user_sessions)
  DEVICE_TYPES: {
    DESKTOP: 'DESKTOP',
    MOBILE: 'MOBILE',
    TABLET: 'TABLET',
    BROWSER: 'BROWSER',
    API: 'API',
  } as const,

  // Événements de sécurité
  SECURITY_EVENTS: {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILED: 'LOGIN_FAILED',
    LOGOUT: 'LOGOUT',
    PASSWORD_CHANGE: 'PASSWORD_CHANGE',
    MFA_SETUP: 'MFA_SETUP',
    MFA_DISABLED: 'MFA_DISABLED',
    SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
    DEVICE_TRUSTED: 'DEVICE_TRUSTED',
    DEVICE_REVOKED: 'DEVICE_REVOKED',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  } as const,

  // Niveaux de risque
  RISK_LEVELS: {
    LOW: { min: 0, max: 30, label: 'Faible' },
    MEDIUM: { min: 31, max: 70, label: 'Moyen' },
    HIGH: { min: 71, max: 100, label: 'Élevé' },
  } as const,
} as const;

// Types extraits des constantes
export type MfaProvider = keyof typeof AUTH_CONSTANTS.MFA_PROVIDERS;
export type DeviceType = keyof typeof AUTH_CONSTANTS.DEVICE_TYPES;
export type SecurityEventType = keyof typeof AUTH_CONSTANTS.SECURITY_EVENTS;
export type RiskLevel = keyof typeof AUTH_CONSTANTS.RISK_LEVELS;