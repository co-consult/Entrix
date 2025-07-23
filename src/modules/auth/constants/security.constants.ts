// src/modules/auth/constants/security.constants.ts

/**
 * Constantes de sécurité Entrix V3.0
 * Respecte processus_authentification.md et détection comportements suspects
 */

export const SECURITY_CONSTANTS = {
  // Seuils de détection de risque
  RISK_SCORING: {
    // Facteurs de risque (poids sur 100)
    UNKNOWN_DEVICE: 25,
    NEW_LOCATION: 20,
    UNUSUAL_TIME: 15,
    FAILED_ATTEMPTS: 30,
    TOR_IP: 40,
    VPN_IP: 20,
    DATACENTER_IP: 15,
    MULTIPLE_SESSIONS: 10,
    
    // Seuils d'action
    REQUIRE_MFA_THRESHOLD: 40,
    BLOCK_THRESHOLD: 80,
    ALERT_THRESHOLD: 60,
  },

  // Géolocalisation
  GEOLOCATION: {
    MAX_DISTANCE_KM: 1000, // Distance suspecte en km
    TRUSTED_COUNTRIES: ['TN', 'FR', 'DE', 'US', 'CA'], // Codes ISO
    HIGH_RISK_COUNTRIES: ['CN', 'RU', 'KP'], // Codes ISO pays à risque
    GEOLOCATION_TIMEOUT: 5000, // 5 secondes
  },

  // Rate limiting
  RATE_LIMITS: {
    LOGIN_ATTEMPTS: {
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      MAX_ATTEMPTS: 5,
      BLOCK_DURATION: 15 * 60, // 15 minutes
    },
    PASSWORD_RESET: {
      WINDOW_MS: 60 * 60 * 1000, // 1 heure  
      MAX_ATTEMPTS: 3,
      BLOCK_DURATION: 60 * 60, // 1 heure
    },
    MFA_VERIFY: {
      WINDOW_MS: 5 * 60 * 1000, // 5 minutes
      MAX_ATTEMPTS: 5,
      BLOCK_DURATION: 5 * 60, // 5 minutes
    },
    REGISTRATION: {
      WINDOW_MS: 60 * 60 * 1000, // 1 heure
      MAX_ATTEMPTS: 3,
      BLOCK_DURATION: 60 * 60, // 1 heure
    },
  },

  // Device fingerprinting
  DEVICE_FINGERPRINT: {
    TRUST_DURATION: 30 * 24 * 60 * 60, // 30 jours
    REQUIRED_FIELDS: ['userAgent', 'screen', 'timezone', 'language'],
    HASH_ALGORITHM: 'sha256',
    MIN_ENTROPY: 12, // Bits d'entropie minimum
  },

  // Audit et logs
  AUDIT: {
    RETENTION_DAYS: 90,
    HIGH_RISK_RETENTION_DAYS: 365,
    LOG_LEVELS: {
      INFO: 'info',
      WARN: 'warn', 
      ERROR: 'error',
      CRITICAL: 'critical',
    },
  },

  // Patterns suspects
  SUSPICIOUS_PATTERNS: {
    RAPID_LOGIN_ATTEMPTS: 10, // Par minute
    MULTIPLE_IP_SESSIONS: 5, // Sessions simultanées depuis IPs différentes
    UNUSUAL_USER_AGENT: /bot|crawler|spider|scraper/i,
    AUTOMATION_DETECTED: /selenium|phantomjs|headless/i,
  },
} as const;