"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MONITORING = exports.TOKEN_SECURITY = exports.INCIDENT_RESPONSE = exports.ML_DETECTION = exports.AUDIT = exports.SESSION_SECURITY = exports.DEVICE_FINGERPRINT = exports.GEOLOCATION = exports.BOT_DETECTION = exports.ALERTS = exports.SUSPICIOUS_PATTERNS = exports.RISK_SCORING = exports.RATE_LIMITS = exports.calculateTokenEntropy = exports.isValidDeviceFingerprint = exports.getSecurityAction = exports.getRiskLevel = exports.SECURITY_CONSTANTS = void 0;
exports.SECURITY_CONSTANTS = {
    RATE_LIMITS: {
        REGISTRATION: {
            MAX_ATTEMPTS: 3,
            WINDOW_MS: 3600000,
            BLOCK_DURATION_MS: 3600000,
        },
        LOGIN: {
            MAX_ATTEMPTS: 5,
            WINDOW_MS: 900000,
            BLOCK_DURATION_MS: 1800000,
        },
        PASSWORD_RESET: {
            MAX_ATTEMPTS: 3,
            WINDOW_MS: 3600000,
            BLOCK_DURATION_MS: 7200000,
        },
        EMAIL_VERIFICATION: {
            MAX_ATTEMPTS: 5,
            WINDOW_MS: 3600000,
            BLOCK_DURATION_MS: 3600000,
        },
        VALIDATION_TOKENS: {
            MAX_ATTEMPTS: 3,
            WINDOW_MS: 300000,
            BLOCK_DURATION_MS: 1800000,
        },
        API_CALLS: {
            MAX_ATTEMPTS: 100,
            WINDOW_MS: 60000,
            BLOCK_DURATION_MS: 300000,
        },
        MFA_VERIFICATION: {
            MAX_ATTEMPTS: 3,
            WINDOW_MS: 300000,
            BLOCK_DURATION_MS: 900000,
        },
        API_KEY_GENERATION: {
            MAX_ATTEMPTS: 5,
            WINDOW_MS: 3600000,
            BLOCK_DURATION_MS: 3600000,
        },
        MAGIC_LINK: {
            MAX_ATTEMPTS: 3,
            WINDOW_MS: 900000,
            BLOCK_DURATION_MS: 1800000,
        },
    },
    RISK_SCORING: {
        UNKNOWN_DEVICE: 25,
        NEW_LOCATION: 20,
        UNUSUAL_TIME: 10,
        FAILED_ATTEMPTS: 50,
        TOR_IP: 30,
        VPN_IP: 15,
        PROXY_IP: 20,
        MULTIPLE_SESSIONS: 15,
        BRUTE_FORCE_ATTEMPT: 40,
        SUSPICIOUS_USER_AGENT: 10,
        ALLOW_THRESHOLD: 0,
        ALERT_THRESHOLD: 30,
        REQUIRE_MFA_THRESHOLD: 50,
        BLOCK_THRESHOLD: 80,
        MAX_RISK_SCORE: 100,
        DEFAULT_RISK_SCORE: 0,
    },
    SUSPICIOUS_PATTERNS: {
        MAX_FAILED_ATTEMPTS_PER_HOUR: 5,
        MAX_FAILED_ATTEMPTS_PER_DAY: 20,
        MULTIPLE_IP_SESSIONS: 3,
        MULTIPLE_LOCATION_SESSIONS: 2,
        RAPID_LOGIN_ATTEMPTS_SECONDS: 10,
        UNUSUAL_HOURS_START: 2,
        UNUSUAL_HOURS_END: 6,
        IMPOSSIBLE_TRAVEL_KM_HOUR: 1000,
        NEW_COUNTRY_RISK_HOURS: 24,
        AUTOMATED_USER_AGENTS: [
            'bot', 'crawler', 'spider', 'scraper', 'headless',
            'selenium', 'puppeteer', 'playwright', 'curl', 'wget'
        ],
        TOR_EXIT_NODES_CHECK: true,
        VPN_DETECTION: true,
        DATACENTER_IPS_CHECK: true,
        DICTIONARY_ATTACK_PATTERNS: [
            'admin', 'password', '123456', 'qwerty', 'letmein',
            'welcome', 'monkey', 'dragon', 'password123', 'admin123'
        ],
    },
    ALERTS: {
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
        EMAIL_ALERTS_ENABLED: true,
        SLACK_ALERTS_ENABLED: false,
        SMS_ALERTS_ENABLED: true,
        MAX_ALERTS_PER_USER_HOUR: 5,
        MAX_ALERTS_PER_TYPE_HOUR: 10,
        ALERT_COOLDOWN_MINUTES: 15,
    },
    BOT_DETECTION: {
        MISSING_HEADERS_SCORE: 10,
        SUSPICIOUS_HEADERS_SCORE: 15,
        BOT_USER_AGENT_SCORE: 25,
        RAPID_REQUESTS_THRESHOLD: 10,
        IDENTICAL_REQUESTS_THRESHOLD: 5,
        NO_JAVASCRIPT_SCORE: 20,
        CAPTCHA_CHALLENGE_THRESHOLD: 40,
        CAPTCHA_REQUIRED_EVENTS: [
            'MULTIPLE_FAILED_LOGINS',
            'SUSPICIOUS_REGISTRATION',
            'RAPID_FORM_SUBMISSIONS'
        ],
    },
    GEOLOCATION: {
        EARTH_RADIUS_KM: 6371,
        MAX_REASONABLE_SPEED_KM_H: 900,
        MAX_DISTANCE_KM: 1000,
        GEOLOCATION_TIMEOUT: 5000,
        HIGH_RISK_COUNTRIES: ['CN', 'RU', 'IR', 'KP'],
        KNOWN_VPN_PROVIDERS: [
            'nordvpn', 'expressvpn', 'surfshark', 'cyberghost',
            'privateinternetaccess', 'purevpn', 'hidemyass'
        ],
        CLOUD_PROVIDER_ASNS: [
            'AS16509',
            'AS15169',
            'AS8075',
            'AS13335',
        ],
    },
    DEVICE_FINGERPRINT: {
        TRUST_DURATION: 30 * 24 * 60 * 60 * 1000,
        REQUIRED_FIELDS: [
            'userAgent',
            'screen',
            'timezone',
            'language',
            'platform',
            'plugins',
            'canvas'
        ],
        MIN_ENTROPY: 15,
        MAX_DEVICES_PER_USER: 10,
        FINGERPRINT_CHANGE_THRESHOLD: 3,
    },
    SESSION_SECURITY: {
        MAX_CONCURRENT_SESSIONS: 5,
        MAX_SESSIONS_PER_IP: 3,
        SESSION_HIJACKING_DETECTION: true,
        FORCE_TOKEN_ROTATION_RISK: 60,
        TOKEN_REUSE_DETECTION: true,
        HIGH_RISK_SESSION_TIMEOUT_MINUTES: 15,
        MEDIUM_RISK_SESSION_TIMEOUT_MINUTES: 30,
        LOW_RISK_SESSION_TIMEOUT_MINUTES: 60,
    },
    AUDIT: {
        MANDATORY_LOG_EVENTS: [
            'LOGIN_SUCCESS',
            'LOGIN_FAILED',
            'LOGOUT',
            'PASSWORD_CHANGE',
            'MFA_SETUP',
            'ACCOUNT_LOCKED',
            'SUSPICIOUS_ACTIVITY'
        ],
        SECURITY_LOGS_RETENTION_DAYS: 90,
        AUDIT_LOGS_RETENTION_DAYS: 365,
        HIGH_RISK_LOGS_RETENTION_DAYS: 1095,
        RETENTION_DAYS: 365,
        HIGH_RISK_RETENTION_DAYS: 1095,
        COMPLIANCE_ALERTS_ENABLED: true,
        GDPR_DELETION_TRACKING: true,
    },
    ML_DETECTION: {
        BEHAVIORAL_ANALYSIS_ENABLED: false,
        ANOMALY_DETECTION_THRESHOLD: 0.8,
        USER_BEHAVIOR_FEATURES: [
            'typing_speed',
            'mouse_movements',
            'time_between_clicks',
            'navigation_patterns',
            'form_fill_speed'
        ],
        MODEL_UPDATE_FREQUENCY_HOURS: 24,
        TRAINING_DATA_WINDOW_DAYS: 30,
    },
    INCIDENT_RESPONSE: {
        AUTO_LOCK_ACCOUNT_RISK: 85,
        AUTO_REQUIRE_MFA_RISK: 60,
        AUTO_LOG_ADDITIONAL_INFO_RISK: 40,
        SECURITY_TEAM_ALERT_RISK: 75,
        ADMIN_NOTIFICATION_RISK: 80,
        EMERGENCY_LOCKDOWN_RISK: 95,
        QUARANTINE_SUSPICIOUS_SESSIONS: true,
        QUARANTINE_DURATION_HOURS: 24,
    },
    TOKEN_SECURITY: {
        PERSISTENT_TOKEN_MAX_PER_USER: 10,
        PERSISTENT_TOKEN_DEFAULT_EXPIRY_DAYS: 90,
        API_KEY_MIN_ENTROPY: 128,
        VALIDATION_TOKEN_MIN_ENTROPY: 256,
        VALIDATION_TOKEN_MAX_ATTEMPTS: 3,
        EMAIL_TOKEN_EXPIRY_HOURS: 24,
        RESET_TOKEN_EXPIRY_HOURS: 1,
        MAGIC_LINK_EXPIRY_MINUTES: 15,
        REFRESH_TOKEN_ROTATION_ENABLED: true,
        REFRESH_TOKEN_FAMILY_SIZE: 5,
    },
    MONITORING: {
        MAX_FAILED_LOGINS_PER_MINUTE: 10,
        MAX_REGISTRATION_PER_HOUR: 100,
        MAX_PASSWORD_RESETS_PER_HOUR: 50,
        HIGH_ERROR_RATE_THRESHOLD: 0.05,
        RESPONSE_TIME_THRESHOLD_MS: 2000,
        QUEUE_DEPTH_THRESHOLD: 1000,
        TOKEN_CLEANUP_BATCH_SIZE: 1000,
        CLEANUP_EXECUTION_TIMEOUT_MS: 30000,
    },
};
const getRiskLevel = (score) => {
    if (score >= exports.SECURITY_CONSTANTS.RISK_SCORING.BLOCK_THRESHOLD)
        return 'CRITICAL';
    if (score >= exports.SECURITY_CONSTANTS.RISK_SCORING.REQUIRE_MFA_THRESHOLD)
        return 'HIGH';
    if (score >= exports.SECURITY_CONSTANTS.RISK_SCORING.ALERT_THRESHOLD)
        return 'MEDIUM';
    return 'LOW';
};
exports.getRiskLevel = getRiskLevel;
const getSecurityAction = (score) => {
    if (score >= exports.SECURITY_CONSTANTS.RISK_SCORING.BLOCK_THRESHOLD)
        return 'BLOCK';
    if (score >= exports.SECURITY_CONSTANTS.RISK_SCORING.REQUIRE_MFA_THRESHOLD)
        return 'REQUIRE_MFA';
    if (score >= exports.SECURITY_CONSTANTS.RISK_SCORING.ALERT_THRESHOLD)
        return 'ALERT';
    return 'ALLOW';
};
exports.getSecurityAction = getSecurityAction;
const isValidDeviceFingerprint = (fingerprint) => {
    if (!fingerprint || typeof fingerprint !== 'object')
        return false;
    const requiredFields = exports.SECURITY_CONSTANTS.DEVICE_FINGERPRINT.REQUIRED_FIELDS;
    const presentFields = requiredFields.filter(field => fingerprint[field] !== undefined);
    return presentFields.length >= Math.ceil(requiredFields.length * 0.7);
};
exports.isValidDeviceFingerprint = isValidDeviceFingerprint;
const calculateTokenEntropy = (token) => {
    const charset = new Set(token.split('')).size;
    return token.length * Math.log2(charset);
};
exports.calculateTokenEntropy = calculateTokenEntropy;
exports.RATE_LIMITS = exports.SECURITY_CONSTANTS.RATE_LIMITS, exports.RISK_SCORING = exports.SECURITY_CONSTANTS.RISK_SCORING, exports.SUSPICIOUS_PATTERNS = exports.SECURITY_CONSTANTS.SUSPICIOUS_PATTERNS, exports.ALERTS = exports.SECURITY_CONSTANTS.ALERTS, exports.BOT_DETECTION = exports.SECURITY_CONSTANTS.BOT_DETECTION, exports.GEOLOCATION = exports.SECURITY_CONSTANTS.GEOLOCATION, exports.DEVICE_FINGERPRINT = exports.SECURITY_CONSTANTS.DEVICE_FINGERPRINT, exports.SESSION_SECURITY = exports.SECURITY_CONSTANTS.SESSION_SECURITY, exports.AUDIT = exports.SECURITY_CONSTANTS.AUDIT, exports.ML_DETECTION = exports.SECURITY_CONSTANTS.ML_DETECTION, exports.INCIDENT_RESPONSE = exports.SECURITY_CONSTANTS.INCIDENT_RESPONSE, exports.TOKEN_SECURITY = exports.SECURITY_CONSTANTS.TOKEN_SECURITY, exports.MONITORING = exports.SECURITY_CONSTANTS.MONITORING;
//# sourceMappingURL=security.constants.js.map