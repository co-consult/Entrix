// src/modules/auth/constants/mfa.constants.ts

/**
 * Constantes Multi-Factor Authentication Entrix V3.0
 * Respecte api_specs_auth_session.md et processus_authentification.md
 */

export const MFA_CONSTANTS = {
  // Types de providers MFA
  PROVIDERS: {
    SMS_OTP: {
      id: 'SMS_OTP',
      name: 'SMS OTP',
      description: 'Code à 6 chiffres par SMS',
      setup_time: 2, // minutes
      validity_duration: 5 * 60, // 5 minutes
    },
    EMAIL_OTP: {
      id: 'EMAIL_OTP', 
      name: 'Email OTP',
      description: 'Code à 6 chiffres par email',
      setup_time: 1,
      validity_duration: 10 * 60, // 10 minutes
    },
    TOTP_APP: {
      id: 'TOTP_APP',
      name: 'Authenticator App',
      description: 'Google Authenticator, Authy, etc.',
      setup_time: 5,
      validity_duration: 30, // 30 secondes (standard TOTP)
    },
    BACKUP_CODE: {
      id: 'BACKUP_CODE',
      name: 'Code de récupération',
      description: 'Codes à usage unique',
      setup_time: 0,
      validity_duration: Infinity, // Pas d'expiration
    },
  } as const,

  // Configuration TOTP
  TOTP: {
    SECRET_LENGTH: 32,
    WINDOW: 1, // Fenêtre de tolérance
    STEP: 30, // Secondes
    DIGITS: 6,
    ALGORITHM: 'sha1',
    ISSUER: 'Entrix',
  },

  // Configuration OTP
  OTP: {
    LENGTH: 6,
    ALPHABET: '0123456789',
    MAX_ATTEMPTS: 3,
    RATE_LIMIT_WINDOW: 5 * 60, // 5 minutes
    MAX_CODES_PER_WINDOW: 3,
  },

  // Codes de récupération
  BACKUP_CODES: {
    COUNT: 10,
    LENGTH: 8,
    ALPHABET: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    USAGE_LIMIT: 1, // Une seule utilisation par code
  },
} as const;



