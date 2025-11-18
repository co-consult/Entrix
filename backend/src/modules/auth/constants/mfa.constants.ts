// src/modules/auth/constants/mfa.constants.ts

/**
 * Constantes Multi-Factor Authentication Entrix V3.0
 * Respecte schema.prisma et api_specs_auth_session.md
 */

export const MFA_CONSTANTS = {
  // Configuration générale MFA
  ENABLED: true,
  REQUIRED_FOR_ORGANIZERS: true,
  MAX_FAILED_ATTEMPTS: 3,
  LOCKOUT_DURATION: 5 * 60, // 5 minutes
  CHALLENGE_DURATION: 5 * 60, // 5 minutes
  
  // Configuration par provider
  PROVIDERS: {
    SMS_OTP: {
      enabled: true,
      code_length: 6,
      validity_duration: 5 * 60, // 5 minutes
      resend_delay: 60, // 1 minute
      max_attempts: 3,
      rate_limit: {
        max_requests: 3,
        window_ms: 10 * 60 * 1000, // 10 minutes
      },
    },
    EMAIL_OTP: {
      enabled: true,
      code_length: 6,
      validity_duration: 10 * 60, // 10 minutes
      resend_delay: 30, // 30 secondes
      max_attempts: 3,
      rate_limit: {
        max_requests: 5,
        window_ms: 10 * 60 * 1000, // 10 minutes
      },
    },
    TOTP_APP: {
      enabled: true,
      code_length: 6,
      window: 1, // ±30 secondes
      step: 30, // secondes
      max_attempts: 3,
    },
    BACKUP_CODE: {
      enabled: true,
      code_count: 10,
      code_length: 8,
      max_usage_per_code: 1,
    },
  },

  // Configuration TOTP spécifique
  TOTP: {
    ISSUER: 'Entrix',
    ALGORITHM: 'sha1',
    DIGITS: 6,
    WINDOW: 1, // ±1 step = ±30 secondes
    SECRET_LENGTH: 20,
    STEP: 30, // 30 secondes
    QR_CODE: {
      size: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    },
  },

  // Configuration codes de récupération
  BACKUP_CODES: {
    COUNT: 10,
    LENGTH: 8,
    CHARSET: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', // Sans caractères ambigus
    GROUPS: 2, // Format: XXXX-XXXX
    SEPARATOR: '-',
  },

  // Configuration appareils de confiance
  TRUSTED_DEVICES: {
    enabled: true,
    default_duration: 30 * 24 * 60 * 60, // 30 jours
    max_duration: 90 * 24 * 60 * 60, // 90 jours max
    max_devices_per_user: 10,
    cleanup_interval: 24 * 60 * 60, // 1 jour
    require_verification: true,
  },

  // Configuration sessions post-MFA
  SESSIONS: {
    mfa_session_duration: 24 * 60 * 60, // 24h après MFA réussi
    require_mfa_for_sensitive: true,
    remember_device_duration: 30 * 24 * 60 * 60, // 30 jours
    force_mfa_interval: 7 * 24 * 60 * 60, // 7 jours max sans MFA
  },

  // Configuration de risk scoring
  RISK_SCORING: {
    new_device_score: 30,
    new_location_score: 25,
    suspicious_activity_score: 40,
    failed_attempts_score: 20,
    time_of_access_score: 10,
    threshold_require_mfa: 50,
    threshold_block_access: 90,
  },

  // Messages utilisateur
  MESSAGES: {
    SETUP_SUCCESS: 'Authentification multi-facteur configurée avec succès',
    SETUP_FAILED: 'Échec de la configuration MFA',
    VERIFY_SUCCESS: 'Code de vérification valide',
    VERIFY_FAILED: 'Code de vérification invalide',
    DISABLED_SUCCESS: 'Authentification multi-facteur désactivée',
    EXPIRED_CHALLENGE: 'Challenge MFA expiré',
    RATE_LIMITED: 'Trop de tentatives. Veuillez patienter.',
    DEVICE_TRUSTED: 'Appareil marqué comme fiable',
    CODES_REGENERATED: 'Nouveaux codes de récupération générés',
  },

  // Templates pour SMS/Email
  TEMPLATES: {
    SMS: {
      CODE: 'Votre code Entrix: {code}. Valide {duration} min. Ne partagez jamais ce code.',
      SETUP: 'Activation MFA Entrix réussie. Code: {code}',
    },
    EMAIL: {
      SUBJECT_CODE: 'Code de vérification Entrix',
      SUBJECT_SETUP: 'Configuration MFA Entrix',
      SUBJECT_DISABLED: 'MFA désactivé - Entrix',
    },
  },

  // Configuration cleanup automatique
  CLEANUP: {
    expired_tokens_interval: 60 * 60, // 1 heure
    expired_devices_interval: 24 * 60 * 60, // 1 jour
    expired_challenges_interval: 5 * 60, // 5 minutes
    old_audit_logs_after: 90 * 24 * 60 * 60, // 90 jours
  },

  // Métriques et monitoring
  MONITORING: {
    alert_failed_attempts_threshold: 10,
    alert_setup_failures_threshold: 5,
    metrics_retention_days: 30,
    daily_report_enabled: true,
  },
} as const;

// Types utiles extraits des constantes
export type MfaProviderConfig = typeof MFA_CONSTANTS.PROVIDERS[keyof typeof MFA_CONSTANTS.PROVIDERS];
export type TotpConfig = typeof MFA_CONSTANTS.TOTP;
export type BackupCodesConfig = typeof MFA_CONSTANTS.BACKUP_CODES;
export type TrustedDevicesConfig = typeof MFA_CONSTANTS.TRUSTED_DEVICES;

// Helpers pour validation
export const MFA_VALIDATION = {
  isValidSmsCode: (code: string): boolean => {
    return /^\d{6}$/.test(code);
  },
  
  isValidEmailCode: (code: string): boolean => {
    return /^\d{6}$/.test(code);
  },
  
  isValidTotpCode: (code: string): boolean => {
    return /^\d{6}$/.test(code);
  },
  
  isValidBackupCode: (code: string): boolean => {
    const pattern = new RegExp(`^[${MFA_CONSTANTS.BACKUP_CODES.CHARSET}]{4}-[${MFA_CONSTANTS.BACKUP_CODES.CHARSET}]{4}$`);
    return pattern.test(code.toUpperCase());
  },
  
  formatBackupCode: (code: string): string => {
    const clean = code.replace(/[^A-Z0-9]/g, '');
    if (clean.length !== 8) return code;
    return `${clean.slice(0, 4)}-${clean.slice(4, 8)}`;
  },
  
  maskPhoneNumber: (phone: string): string => {
    if (phone.length < 8) return phone;
    return phone.slice(0, 4) + '*'.repeat(phone.length - 7) + phone.slice(-3);
  },
  
  maskEmail: (email: string): string => {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const maskedLocal = local.charAt(0) + '*'.repeat(Math.max(0, local.length - 2)) + local.charAt(local.length - 1);
    return `${maskedLocal}@${domain}`;
  },
} as const;

// Export par défaut
export default MFA_CONSTANTS;