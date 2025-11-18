// src/modules/auth/constants/session.constants.ts

/**
 * Constantes de gestion des sessions Entrix V3.0
 * Respecte schema.prisma user_sessions et api_specs_auth_session.md
 */

export const SESSION_CONSTANTS = {
  // Durées de session
  DURATION: {
    DEFAULT_SESSION: 24 * 60 * 60, // 24 heures
    REMEMBER_ME_SESSION: 30 * 24 * 60 * 60, // 30 jours
    IDLE_TIMEOUT: 2 * 60 * 60, // 2 heures d'inactivité
    CLEANUP_INTERVAL: 60 * 60, // Nettoyage toutes les heures
  },

  // Clés Redis pour sessions
  REDIS_KEYS: {
    SESSION_PREFIX: 'session:',
    USER_SESSIONS_PREFIX: 'user_sessions:',
    REFRESH_TOKEN_PREFIX: 'refresh_token:',
    BLACKLISTED_TOKEN_PREFIX: 'blacklisted:',
    ACTIVE_SESSIONS_COUNT: 'active_sessions_count:',
  },

  // Types de session selon schema.prisma
  SESSION_STATUS: {
    ACTIVE: 'ACTIVE',
    EXPIRED: 'EXPIRED',
    REVOKED: 'REVOKED',
    SUSPICIOUS: 'SUSPICIOUS',
  } as const,

  // Métadonnées session
  SESSION_METADATA: {
    CREATED_BY: 'created_by',
    LAST_ACTIVITY: 'last_activity',
    IP_CHANGES: 'ip_changes',
    USER_AGENT_CHANGES: 'user_agent_changes',
    GEOLOCATION_CHANGES: 'geolocation_changes',
    RISK_EVENTS: 'risk_events',
  },

  // Limites sessions
  LIMITS: {
    MAX_CONCURRENT_SESSIONS: 10,
    MAX_SESSIONS_PER_IP: 5,
    MAX_SESSIONS_PER_DEVICE: 3,
    SESSION_TOKEN_LENGTH: 255, // Selon schema.prisma
  },
} as const;

export type SessionStatus = keyof typeof SESSION_CONSTANTS.SESSION_STATUS;