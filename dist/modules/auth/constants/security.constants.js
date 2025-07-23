"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECURITY_CONSTANTS = void 0;
exports.SECURITY_CONSTANTS = {
    RISK_SCORING: {
        UNKNOWN_DEVICE: 25,
        NEW_LOCATION: 20,
        UNUSUAL_TIME: 15,
        FAILED_ATTEMPTS: 30,
        TOR_IP: 40,
        VPN_IP: 20,
        DATACENTER_IP: 15,
        MULTIPLE_SESSIONS: 10,
        REQUIRE_MFA_THRESHOLD: 40,
        BLOCK_THRESHOLD: 80,
        ALERT_THRESHOLD: 60,
    },
    GEOLOCATION: {
        MAX_DISTANCE_KM: 1000,
        TRUSTED_COUNTRIES: ['TN', 'FR', 'DE', 'US', 'CA'],
        HIGH_RISK_COUNTRIES: ['CN', 'RU', 'KP'],
        GEOLOCATION_TIMEOUT: 5000,
    },
    RATE_LIMITS: {
        LOGIN_ATTEMPTS: {
            WINDOW_MS: 15 * 60 * 1000,
            MAX_ATTEMPTS: 5,
            BLOCK_DURATION: 15 * 60,
        },
        PASSWORD_RESET: {
            WINDOW_MS: 60 * 60 * 1000,
            MAX_ATTEMPTS: 3,
            BLOCK_DURATION: 60 * 60,
        },
        MFA_VERIFY: {
            WINDOW_MS: 5 * 60 * 1000,
            MAX_ATTEMPTS: 5,
            BLOCK_DURATION: 5 * 60,
        },
        REGISTRATION: {
            WINDOW_MS: 60 * 60 * 1000,
            MAX_ATTEMPTS: 3,
            BLOCK_DURATION: 60 * 60,
        },
    },
    DEVICE_FINGERPRINT: {
        TRUST_DURATION: 30 * 24 * 60 * 60,
        REQUIRED_FIELDS: ['userAgent', 'screen', 'timezone', 'language'],
        HASH_ALGORITHM: 'sha256',
        MIN_ENTROPY: 12,
    },
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
    SUSPICIOUS_PATTERNS: {
        RAPID_LOGIN_ATTEMPTS: 10,
        MULTIPLE_IP_SESSIONS: 5,
        UNUSUAL_USER_AGENT: /bot|crawler|spider|scraper/i,
        AUTOMATION_DETECTED: /selenium|phantomjs|headless/i,
    },
};
//# sourceMappingURL=security.constants.js.map