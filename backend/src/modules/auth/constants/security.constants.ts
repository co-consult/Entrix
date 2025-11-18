// src/modules/auth/constants/security.constants.ts

/**
 * Constantes de sécurité Entrix V3.0 - COMPLÈTES
 * ✅ MISE À JOUR : Ajout des constantes manquantes pour compatibilité
 * Risk scoring, seuils d'alerte et patterns de sécurité
 */

export const SECURITY_CONSTANTS = {
  // ✅ Rate limiting pour différents endpoints
  RATE_LIMITS: {
    // Inscription
    REGISTRATION: {
      MAX_ATTEMPTS: 3,
      WINDOW_MS: 3600000, // 1 heure
      BLOCK_DURATION_MS: 3600000, // 1 heure de blocage
    },
    
    // Connexion
    LOGIN: {
      MAX_ATTEMPTS: 5,
      WINDOW_MS: 900000, // 15 minutes
      BLOCK_DURATION_MS: 1800000, // 30 minutes de blocage
    },
    
    // Reset password
    PASSWORD_RESET: {
      MAX_ATTEMPTS: 3,
      WINDOW_MS: 3600000, // 1 heure
      BLOCK_DURATION_MS: 7200000, // 2 heures de blocage
    },
    
    // Vérification email
    EMAIL_VERIFICATION: {
      MAX_ATTEMPTS: 5,
      WINDOW_MS: 3600000, // 1 heure
      BLOCK_DURATION_MS: 3600000, // 1 heure de blocage
    },
    
    // Tokens de validation
    VALIDATION_TOKENS: {
      MAX_ATTEMPTS: 3,
      WINDOW_MS: 300000, // 5 minutes
      BLOCK_DURATION_MS: 1800000, // 30 minutes de blocage
    },
    
    // API calls génériques
    API_CALLS: {
      MAX_ATTEMPTS: 100,
      WINDOW_MS: 60000, // 1 minute
      BLOCK_DURATION_MS: 300000, // 5 minutes de blocage
    },
    
    // MFA
    MFA_VERIFICATION: {
      MAX_ATTEMPTS: 3,
      WINDOW_MS: 300000, // 5 minutes
      BLOCK_DURATION_MS: 900000, // 15 minutes de blocage
    },
    
    // API Keys generation
    API_KEY_GENERATION: {
      MAX_ATTEMPTS: 5,
      WINDOW_MS: 3600000, // 1 heure
      BLOCK_DURATION_MS: 3600000, // 1 heure de blocage
    },
    
    // Magic links
    MAGIC_LINK: {
      MAX_ATTEMPTS: 3,
      WINDOW_MS: 900000, // 15 minutes
      BLOCK_DURATION_MS: 1800000, // 30 minutes de blocage
    },
  },

  // Scoring de risque (sur 100 points)
  RISK_SCORING: {
    // Scores par facteur de risque
    UNKNOWN_DEVICE: 25,
    NEW_LOCATION: 20,
    UNUSUAL_TIME: 10,
    FAILED_ATTEMPTS: 50, // Pour 5 tentatives échouées
    TOR_IP: 30,
    VPN_IP: 15,
    PROXY_IP: 20,
    MULTIPLE_SESSIONS: 15,
    BRUTE_FORCE_ATTEMPT: 40,
    SUSPICIOUS_USER_AGENT: 10,
    
    // Seuils de décision
    ALLOW_THRESHOLD: 0,
    ALERT_THRESHOLD: 30,
    REQUIRE_MFA_THRESHOLD: 50,
    BLOCK_THRESHOLD: 80,
    
    // Limites pour évaluation
    MAX_RISK_SCORE: 100,
    DEFAULT_RISK_SCORE: 0,
  },

  // Patterns suspects
  SUSPICIOUS_PATTERNS: {
    // Tentatives de connexion
    MAX_FAILED_ATTEMPTS_PER_HOUR: 5,
    MAX_FAILED_ATTEMPTS_PER_DAY: 20,
    
    // Sessions multiples
    MULTIPLE_IP_SESSIONS: 3, // Plus de 3 IPs différentes = suspect
    MULTIPLE_LOCATION_SESSIONS: 2, // Plus de 2 pays différents = suspect
    
    // Timing
    RAPID_LOGIN_ATTEMPTS_SECONDS: 10, // Moins de 10s entre tentatives = suspect
    UNUSUAL_HOURS_START: 2, // 2h du matin
    UNUSUAL_HOURS_END: 6, // 6h du matin
    
    // Géolocalisation
    IMPOSSIBLE_TRAVEL_KM_HOUR: 1000, // Plus de 1000 km/h = impossible
    NEW_COUNTRY_RISK_HOURS: 24, // Nouvelle connexion pays dans les 24h = risque
    
    // User agents
    AUTOMATED_USER_AGENTS: [
      'bot', 'crawler', 'spider', 'scraper', 'headless',
      'selenium', 'puppeteer', 'playwright', 'curl', 'wget'
    ],
    
    // IPs suspects
    TOR_EXIT_NODES_CHECK: true,
    VPN_DETECTION: true,
    DATACENTER_IPS_CHECK: true,
    
    // Patterns de mots de passe
    DICTIONARY_ATTACK_PATTERNS: [
      'admin', 'password', '123456', 'qwerty', 'letmein',
      'welcome', 'monkey', 'dragon', 'password123', 'admin123'
    ],
  },

  // Configuration des alertes
  ALERTS: {
    // Seuils pour notifications
    CRITICAL_EVENTS_IMMEDIATE: [
      'ACCOUNT_TAKEOVER_ATTEMPT',
      'BRUTE_FORCE_ATTACK',
      'CREDENTIAL_STUFFING',
      'MULTIPLE_ACCOUNT_LOCKOUTS'
    ],
    
    HIGH_RISK_EVENTS_1MIN: [
      'SUSPICIOUS_LOGIN_PATTERN',
      'GEOLOCATION_ANOMALY',
      'DEVICE_FINGERPRINT_MISMATCH'
    ],
    
    MEDIUM_RISK_EVENTS_5MIN: [
      'FAILED_MFA_ATTEMPTS',
      'UNUSUAL_TIME_ACCESS',
      'NEW_DEVICE_LOGIN'
    ],
    
    // Destinations des alertes
    EMAIL_ALERTS_ENABLED: true,
    SLACK_ALERTS_ENABLED: false,
    SMS_ALERTS_ENABLED: true, // Pour événements critiques
    
    // Rate limiting des alertes
    MAX_ALERTS_PER_USER_HOUR: 5,
    MAX_ALERTS_PER_TYPE_HOUR: 10,
    ALERT_COOLDOWN_MINUTES: 15,
  },

  // Détection de bots et automatisation
  BOT_DETECTION: {
    // Headers suspects
    MISSING_HEADERS_SCORE: 10,
    SUSPICIOUS_HEADERS_SCORE: 15,
    BOT_USER_AGENT_SCORE: 25,
    
    // Comportements
    RAPID_REQUESTS_THRESHOLD: 10, // Plus de 10 requêtes/seconde
    IDENTICAL_REQUESTS_THRESHOLD: 5, // 5 requêtes identiques = bot
    NO_JAVASCRIPT_SCORE: 20, // Pas d'exécution JS
    
    // Captcha
    CAPTCHA_CHALLENGE_THRESHOLD: 40, // Score pour déclencher captcha
    CAPTCHA_REQUIRED_EVENTS: [
      'MULTIPLE_FAILED_LOGINS',
      'SUSPICIOUS_REGISTRATION',
      'RAPID_FORM_SUBMISSIONS'
    ],
  },

  // Géolocalisation et voyage
  GEOLOCATION: {
    // Détection de voyage impossible
    EARTH_RADIUS_KM: 6371,
    MAX_REASONABLE_SPEED_KM_H: 900, // Vitesse d'avion de ligne
    
    // ✅ AJOUTÉ : Constantes manquantes pour compatibilité
    MAX_DISTANCE_KM: 1000, // Distance max autorisée entre connexions
    GEOLOCATION_TIMEOUT: 5000, // Timeout pour géolocalisation en ms
    
    // Pays à risque élevé (ajuster selon contexte)
    HIGH_RISK_COUNTRIES: ['CN', 'RU', 'IR', 'KP'], // ISO codes
    
    // VPN/Proxy detection
    KNOWN_VPN_PROVIDERS: [
      'nordvpn', 'expressvpn', 'surfshark', 'cyberghost',
      'privateinternetaccess', 'purevpn', 'hidemyass'
    ],
    
    // Données center detection
    CLOUD_PROVIDER_ASNS: [
      'AS16509', // Amazon
      'AS15169', // Google
      'AS8075',  // Microsoft
      'AS13335', // Cloudflare
    ],
  },

  // ✅ AJOUTÉ : Device Fingerprinting (constantes manquantes)
  DEVICE_FINGERPRINT: {
    TRUST_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 jours en ms
    REQUIRED_FIELDS: [
      'userAgent',
      'screen',
      'timezone',
      'language',
      'platform',
      'plugins',
      'canvas'
    ],
    MIN_ENTROPY: 15, // Minimum d'entropie pour un fingerprint valide
    MAX_DEVICES_PER_USER: 10, // Nombre max d'appareils de confiance par utilisateur
    FINGERPRINT_CHANGE_THRESHOLD: 3, // Nombre de champs changés = nouveau device
  },

  // Session et token security
  SESSION_SECURITY: {
    // Limites de sessions
    MAX_CONCURRENT_SESSIONS: 5,
    MAX_SESSIONS_PER_IP: 3,
    SESSION_HIJACKING_DETECTION: true,
    
    // Token rotation
    FORCE_TOKEN_ROTATION_RISK: 60,
    TOKEN_REUSE_DETECTION: true,
    
    // Timeout adaptatif
    HIGH_RISK_SESSION_TIMEOUT_MINUTES: 15,
    MEDIUM_RISK_SESSION_TIMEOUT_MINUTES: 30,
    LOW_RISK_SESSION_TIMEOUT_MINUTES: 60,
  },

  // Audit et logging
  AUDIT: {
    // Événements à logger obligatoirement
    MANDATORY_LOG_EVENTS: [
      'LOGIN_SUCCESS',
      'LOGIN_FAILED',
      'LOGOUT',
      'PASSWORD_CHANGE',
      'MFA_SETUP',
      'ACCOUNT_LOCKED',
      'SUSPICIOUS_ACTIVITY'
    ],
    
    // Rétention des logs
    SECURITY_LOGS_RETENTION_DAYS: 90,
    AUDIT_LOGS_RETENTION_DAYS: 365,
    HIGH_RISK_LOGS_RETENTION_DAYS: 1095, // 3 ans
    
    // ✅ AJOUTÉ : Constantes pour compatibilité
    RETENTION_DAYS: 365, // Rétention générale
    HIGH_RISK_RETENTION_DAYS: 1095, // Rétention événements à haut risque
    
    // Alertes compliance
    COMPLIANCE_ALERTS_ENABLED: true,
    GDPR_DELETION_TRACKING: true,
  },

  // Machine Learning et patterns
  ML_DETECTION: {
    // Modèles de détection (si disponibles)
    BEHAVIORAL_ANALYSIS_ENABLED: false,
    ANOMALY_DETECTION_THRESHOLD: 0.8,
    
    // Features pour ML
    USER_BEHAVIOR_FEATURES: [
      'typing_speed',
      'mouse_movements',
      'time_between_clicks',
      'navigation_patterns',
      'form_fill_speed'
    ],
    
    // Apprentissage
    MODEL_UPDATE_FREQUENCY_HOURS: 24,
    TRAINING_DATA_WINDOW_DAYS: 30,
  },

  // Response et mitigation
  INCIDENT_RESPONSE: {
    // Actions automatiques
    AUTO_LOCK_ACCOUNT_RISK: 85,
    AUTO_REQUIRE_MFA_RISK: 60,
    AUTO_LOG_ADDITIONAL_INFO_RISK: 40,
    
    // Escalation
    SECURITY_TEAM_ALERT_RISK: 75,
    ADMIN_NOTIFICATION_RISK: 80,
    EMERGENCY_LOCKDOWN_RISK: 95,
    
    // Quarantine
    QUARANTINE_SUSPICIOUS_SESSIONS: true,
    QUARANTINE_DURATION_HOURS: 24,
  },

  // ✅ AJOUTÉ : Constantes pour les nouveaux tokens
  TOKEN_SECURITY: {
    // Persistent tokens
    PERSISTENT_TOKEN_MAX_PER_USER: 10,
    PERSISTENT_TOKEN_DEFAULT_EXPIRY_DAYS: 90,
    API_KEY_MIN_ENTROPY: 128, // bits
    
    // Validation tokens
    VALIDATION_TOKEN_MIN_ENTROPY: 256, // bits
    VALIDATION_TOKEN_MAX_ATTEMPTS: 3,
    EMAIL_TOKEN_EXPIRY_HOURS: 24,
    RESET_TOKEN_EXPIRY_HOURS: 1,
    MAGIC_LINK_EXPIRY_MINUTES: 15,
    
    // Token rotation
    REFRESH_TOKEN_ROTATION_ENABLED: true,
    REFRESH_TOKEN_FAMILY_SIZE: 5, // Nombre de tokens dans une famille
  },

  // ✅ AJOUTÉ : Constantes pour le monitoring
  MONITORING: {
    // Métriques de santé
    MAX_FAILED_LOGINS_PER_MINUTE: 10,
    MAX_REGISTRATION_PER_HOUR: 100,
    MAX_PASSWORD_RESETS_PER_HOUR: 50,
    
    // Alertes système
    HIGH_ERROR_RATE_THRESHOLD: 0.05, // 5%
    RESPONSE_TIME_THRESHOLD_MS: 2000,
    QUEUE_DEPTH_THRESHOLD: 1000,
    
    // Cleanup
    TOKEN_CLEANUP_BATCH_SIZE: 1000,
    CLEANUP_EXECUTION_TIMEOUT_MS: 30000,
  },
} as const;

// ✅ Types dérivés
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SecurityAction = 'ALLOW' | 'ALERT' | 'REQUIRE_MFA' | 'BLOCK' | 'QUARANTINE';
export type AlertSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

// ✅ Helpers pour les calculs de risque
export const getRiskLevel = (score: number): RiskLevel => {
  if (score >= SECURITY_CONSTANTS.RISK_SCORING.BLOCK_THRESHOLD) return 'CRITICAL';
  if (score >= SECURITY_CONSTANTS.RISK_SCORING.REQUIRE_MFA_THRESHOLD) return 'HIGH';
  if (score >= SECURITY_CONSTANTS.RISK_SCORING.ALERT_THRESHOLD) return 'MEDIUM';
  return 'LOW';
};

export const getSecurityAction = (score: number): SecurityAction => {
  if (score >= SECURITY_CONSTANTS.RISK_SCORING.BLOCK_THRESHOLD) return 'BLOCK';
  if (score >= SECURITY_CONSTANTS.RISK_SCORING.REQUIRE_MFA_THRESHOLD) return 'REQUIRE_MFA';
  if (score >= SECURITY_CONSTANTS.RISK_SCORING.ALERT_THRESHOLD) return 'ALERT';
  return 'ALLOW';
};

// ✅ NOUVEAU : Helper pour valider un fingerprint
export const isValidDeviceFingerprint = (fingerprint: any): boolean => {
  if (!fingerprint || typeof fingerprint !== 'object') return false;
  
  const requiredFields = SECURITY_CONSTANTS.DEVICE_FINGERPRINT.REQUIRED_FIELDS;
  const presentFields = requiredFields.filter(field => fingerprint[field] !== undefined);
  
  return presentFields.length >= Math.ceil(requiredFields.length * 0.7); // 70% des champs requis
};

// ✅ NOUVEAU : Helper pour calculer l'entropie d'un token
export const calculateTokenEntropy = (token: string): number => {
  const charset = new Set(token.split('')).size;
  return token.length * Math.log2(charset);
};

// ✅ Export des sections principales
export const {
  RATE_LIMITS,
  RISK_SCORING,
  SUSPICIOUS_PATTERNS,
  ALERTS,
  BOT_DETECTION,
  GEOLOCATION,
  DEVICE_FINGERPRINT, // ✅ AJOUTÉ
  SESSION_SECURITY,
  AUDIT,
  ML_DETECTION,
  INCIDENT_RESPONSE,
  TOKEN_SECURITY, // ✅ AJOUTÉ
  MONITORING, // ✅ AJOUTÉ
} = SECURITY_CONSTANTS;