export declare const SESSION_CONSTANTS: {
    readonly DURATION: {
        readonly DEFAULT_SESSION: number;
        readonly REMEMBER_ME_SESSION: number;
        readonly IDLE_TIMEOUT: number;
        readonly CLEANUP_INTERVAL: number;
    };
    readonly REDIS_KEYS: {
        readonly SESSION_PREFIX: "session:";
        readonly USER_SESSIONS_PREFIX: "user_sessions:";
        readonly REFRESH_TOKEN_PREFIX: "refresh_token:";
        readonly BLACKLISTED_TOKEN_PREFIX: "blacklisted:";
        readonly ACTIVE_SESSIONS_COUNT: "active_sessions_count:";
    };
    readonly SESSION_STATUS: {
        readonly ACTIVE: "ACTIVE";
        readonly EXPIRED: "EXPIRED";
        readonly REVOKED: "REVOKED";
        readonly SUSPICIOUS: "SUSPICIOUS";
    };
    readonly SESSION_METADATA: {
        readonly CREATED_BY: "created_by";
        readonly LAST_ACTIVITY: "last_activity";
        readonly IP_CHANGES: "ip_changes";
        readonly USER_AGENT_CHANGES: "user_agent_changes";
        readonly GEOLOCATION_CHANGES: "geolocation_changes";
        readonly RISK_EVENTS: "risk_events";
    };
    readonly LIMITS: {
        readonly MAX_CONCURRENT_SESSIONS: 10;
        readonly MAX_SESSIONS_PER_IP: 5;
        readonly MAX_SESSIONS_PER_DEVICE: 3;
        readonly SESSION_TOKEN_LENGTH: 255;
    };
};
export type SessionStatus = keyof typeof SESSION_CONSTANTS.SESSION_STATUS;
