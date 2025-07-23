"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SESSION_CONSTANTS = void 0;
exports.SESSION_CONSTANTS = {
    DURATION: {
        DEFAULT_SESSION: 24 * 60 * 60,
        REMEMBER_ME_SESSION: 30 * 24 * 60 * 60,
        IDLE_TIMEOUT: 2 * 60 * 60,
        CLEANUP_INTERVAL: 60 * 60,
    },
    REDIS_KEYS: {
        SESSION_PREFIX: 'session:',
        USER_SESSIONS_PREFIX: 'user_sessions:',
        REFRESH_TOKEN_PREFIX: 'refresh_token:',
        BLACKLISTED_TOKEN_PREFIX: 'blacklisted:',
        ACTIVE_SESSIONS_COUNT: 'active_sessions_count:',
    },
    SESSION_STATUS: {
        ACTIVE: 'ACTIVE',
        EXPIRED: 'EXPIRED',
        REVOKED: 'REVOKED',
        SUSPICIOUS: 'SUSPICIOUS',
    },
    SESSION_METADATA: {
        CREATED_BY: 'created_by',
        LAST_ACTIVITY: 'last_activity',
        IP_CHANGES: 'ip_changes',
        USER_AGENT_CHANGES: 'user_agent_changes',
        GEOLOCATION_CHANGES: 'geolocation_changes',
        RISK_EVENTS: 'risk_events',
    },
    LIMITS: {
        MAX_CONCURRENT_SESSIONS: 10,
        MAX_SESSIONS_PER_IP: 5,
        MAX_SESSIONS_PER_DEVICE: 3,
        SESSION_TOKEN_LENGTH: 255,
    },
};
//# sourceMappingURL=session.constants.js.map