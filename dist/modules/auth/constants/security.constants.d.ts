export declare const SECURITY_CONSTANTS: {
    readonly RATE_LIMITS: {
        readonly REGISTRATION: {
            readonly MAX_ATTEMPTS: 3;
            readonly WINDOW_MS: 3600000;
            readonly BLOCK_DURATION_MS: 3600000;
        };
        readonly LOGIN: {
            readonly MAX_ATTEMPTS: 5;
            readonly WINDOW_MS: 900000;
            readonly BLOCK_DURATION_MS: 1800000;
        };
        readonly PASSWORD_RESET: {
            readonly MAX_ATTEMPTS: 3;
            readonly WINDOW_MS: 3600000;
            readonly BLOCK_DURATION_MS: 7200000;
        };
        readonly EMAIL_VERIFICATION: {
            readonly MAX_ATTEMPTS: 5;
            readonly WINDOW_MS: 3600000;
            readonly BLOCK_DURATION_MS: 3600000;
        };
        readonly VALIDATION_TOKENS: {
            readonly MAX_ATTEMPTS: 3;
            readonly WINDOW_MS: 300000;
            readonly BLOCK_DURATION_MS: 1800000;
        };
        readonly API_CALLS: {
            readonly MAX_ATTEMPTS: 100;
            readonly WINDOW_MS: 60000;
            readonly BLOCK_DURATION_MS: 300000;
        };
        readonly MFA_VERIFICATION: {
            readonly MAX_ATTEMPTS: 3;
            readonly WINDOW_MS: 300000;
            readonly BLOCK_DURATION_MS: 900000;
        };
        readonly API_KEY_GENERATION: {
            readonly MAX_ATTEMPTS: 5;
            readonly WINDOW_MS: 3600000;
            readonly BLOCK_DURATION_MS: 3600000;
        };
        readonly MAGIC_LINK: {
            readonly MAX_ATTEMPTS: 3;
            readonly WINDOW_MS: 900000;
            readonly BLOCK_DURATION_MS: 1800000;
        };
    };
    readonly RISK_SCORING: {
        readonly UNKNOWN_DEVICE: 25;
        readonly NEW_LOCATION: 20;
        readonly UNUSUAL_TIME: 10;
        readonly FAILED_ATTEMPTS: 50;
        readonly TOR_IP: 30;
        readonly VPN_IP: 15;
        readonly PROXY_IP: 20;
        readonly MULTIPLE_SESSIONS: 15;
        readonly BRUTE_FORCE_ATTEMPT: 40;
        readonly SUSPICIOUS_USER_AGENT: 10;
        readonly ALLOW_THRESHOLD: 0;
        readonly ALERT_THRESHOLD: 30;
        readonly REQUIRE_MFA_THRESHOLD: 50;
        readonly BLOCK_THRESHOLD: 80;
        readonly MAX_RISK_SCORE: 100;
        readonly DEFAULT_RISK_SCORE: 0;
    };
    readonly SUSPICIOUS_PATTERNS: {
        readonly MAX_FAILED_ATTEMPTS_PER_HOUR: 5;
        readonly MAX_FAILED_ATTEMPTS_PER_DAY: 20;
        readonly MULTIPLE_IP_SESSIONS: 3;
        readonly MULTIPLE_LOCATION_SESSIONS: 2;
        readonly RAPID_LOGIN_ATTEMPTS_SECONDS: 10;
        readonly UNUSUAL_HOURS_START: 2;
        readonly UNUSUAL_HOURS_END: 6;
        readonly IMPOSSIBLE_TRAVEL_KM_HOUR: 1000;
        readonly NEW_COUNTRY_RISK_HOURS: 24;
        readonly AUTOMATED_USER_AGENTS: readonly ["bot", "crawler", "spider", "scraper", "headless", "selenium", "puppeteer", "playwright", "curl", "wget"];
        readonly TOR_EXIT_NODES_CHECK: true;
        readonly VPN_DETECTION: true;
        readonly DATACENTER_IPS_CHECK: true;
        readonly DICTIONARY_ATTACK_PATTERNS: readonly ["admin", "password", "123456", "qwerty", "letmein", "welcome", "monkey", "dragon", "password123", "admin123"];
    };
    readonly ALERTS: {
        readonly CRITICAL_EVENTS_IMMEDIATE: readonly ["ACCOUNT_TAKEOVER_ATTEMPT", "BRUTE_FORCE_ATTACK", "CREDENTIAL_STUFFING", "MULTIPLE_ACCOUNT_LOCKOUTS"];
        readonly HIGH_RISK_EVENTS_1MIN: readonly ["SUSPICIOUS_LOGIN_PATTERN", "GEOLOCATION_ANOMALY", "DEVICE_FINGERPRINT_MISMATCH"];
        readonly MEDIUM_RISK_EVENTS_5MIN: readonly ["FAILED_MFA_ATTEMPTS", "UNUSUAL_TIME_ACCESS", "NEW_DEVICE_LOGIN"];
        readonly EMAIL_ALERTS_ENABLED: true;
        readonly SLACK_ALERTS_ENABLED: false;
        readonly SMS_ALERTS_ENABLED: true;
        readonly MAX_ALERTS_PER_USER_HOUR: 5;
        readonly MAX_ALERTS_PER_TYPE_HOUR: 10;
        readonly ALERT_COOLDOWN_MINUTES: 15;
    };
    readonly BOT_DETECTION: {
        readonly MISSING_HEADERS_SCORE: 10;
        readonly SUSPICIOUS_HEADERS_SCORE: 15;
        readonly BOT_USER_AGENT_SCORE: 25;
        readonly RAPID_REQUESTS_THRESHOLD: 10;
        readonly IDENTICAL_REQUESTS_THRESHOLD: 5;
        readonly NO_JAVASCRIPT_SCORE: 20;
        readonly CAPTCHA_CHALLENGE_THRESHOLD: 40;
        readonly CAPTCHA_REQUIRED_EVENTS: readonly ["MULTIPLE_FAILED_LOGINS", "SUSPICIOUS_REGISTRATION", "RAPID_FORM_SUBMISSIONS"];
    };
    readonly GEOLOCATION: {
        readonly EARTH_RADIUS_KM: 6371;
        readonly MAX_REASONABLE_SPEED_KM_H: 900;
        readonly MAX_DISTANCE_KM: 1000;
        readonly GEOLOCATION_TIMEOUT: 5000;
        readonly HIGH_RISK_COUNTRIES: readonly ["CN", "RU", "IR", "KP"];
        readonly KNOWN_VPN_PROVIDERS: readonly ["nordvpn", "expressvpn", "surfshark", "cyberghost", "privateinternetaccess", "purevpn", "hidemyass"];
        readonly CLOUD_PROVIDER_ASNS: readonly ["AS16509", "AS15169", "AS8075", "AS13335"];
    };
    readonly DEVICE_FINGERPRINT: {
        readonly TRUST_DURATION: number;
        readonly REQUIRED_FIELDS: readonly ["userAgent", "screen", "timezone", "language", "platform", "plugins", "canvas"];
        readonly MIN_ENTROPY: 15;
        readonly MAX_DEVICES_PER_USER: 10;
        readonly FINGERPRINT_CHANGE_THRESHOLD: 3;
    };
    readonly SESSION_SECURITY: {
        readonly MAX_CONCURRENT_SESSIONS: 5;
        readonly MAX_SESSIONS_PER_IP: 3;
        readonly SESSION_HIJACKING_DETECTION: true;
        readonly FORCE_TOKEN_ROTATION_RISK: 60;
        readonly TOKEN_REUSE_DETECTION: true;
        readonly HIGH_RISK_SESSION_TIMEOUT_MINUTES: 15;
        readonly MEDIUM_RISK_SESSION_TIMEOUT_MINUTES: 30;
        readonly LOW_RISK_SESSION_TIMEOUT_MINUTES: 60;
    };
    readonly AUDIT: {
        readonly MANDATORY_LOG_EVENTS: readonly ["LOGIN_SUCCESS", "LOGIN_FAILED", "LOGOUT", "PASSWORD_CHANGE", "MFA_SETUP", "ACCOUNT_LOCKED", "SUSPICIOUS_ACTIVITY"];
        readonly SECURITY_LOGS_RETENTION_DAYS: 90;
        readonly AUDIT_LOGS_RETENTION_DAYS: 365;
        readonly HIGH_RISK_LOGS_RETENTION_DAYS: 1095;
        readonly RETENTION_DAYS: 365;
        readonly HIGH_RISK_RETENTION_DAYS: 1095;
        readonly COMPLIANCE_ALERTS_ENABLED: true;
        readonly GDPR_DELETION_TRACKING: true;
    };
    readonly ML_DETECTION: {
        readonly BEHAVIORAL_ANALYSIS_ENABLED: false;
        readonly ANOMALY_DETECTION_THRESHOLD: 0.8;
        readonly USER_BEHAVIOR_FEATURES: readonly ["typing_speed", "mouse_movements", "time_between_clicks", "navigation_patterns", "form_fill_speed"];
        readonly MODEL_UPDATE_FREQUENCY_HOURS: 24;
        readonly TRAINING_DATA_WINDOW_DAYS: 30;
    };
    readonly INCIDENT_RESPONSE: {
        readonly AUTO_LOCK_ACCOUNT_RISK: 85;
        readonly AUTO_REQUIRE_MFA_RISK: 60;
        readonly AUTO_LOG_ADDITIONAL_INFO_RISK: 40;
        readonly SECURITY_TEAM_ALERT_RISK: 75;
        readonly ADMIN_NOTIFICATION_RISK: 80;
        readonly EMERGENCY_LOCKDOWN_RISK: 95;
        readonly QUARANTINE_SUSPICIOUS_SESSIONS: true;
        readonly QUARANTINE_DURATION_HOURS: 24;
    };
    readonly TOKEN_SECURITY: {
        readonly PERSISTENT_TOKEN_MAX_PER_USER: 10;
        readonly PERSISTENT_TOKEN_DEFAULT_EXPIRY_DAYS: 90;
        readonly API_KEY_MIN_ENTROPY: 128;
        readonly VALIDATION_TOKEN_MIN_ENTROPY: 256;
        readonly VALIDATION_TOKEN_MAX_ATTEMPTS: 3;
        readonly EMAIL_TOKEN_EXPIRY_HOURS: 24;
        readonly RESET_TOKEN_EXPIRY_HOURS: 1;
        readonly MAGIC_LINK_EXPIRY_MINUTES: 15;
        readonly REFRESH_TOKEN_ROTATION_ENABLED: true;
        readonly REFRESH_TOKEN_FAMILY_SIZE: 5;
    };
    readonly MONITORING: {
        readonly MAX_FAILED_LOGINS_PER_MINUTE: 10;
        readonly MAX_REGISTRATION_PER_HOUR: 100;
        readonly MAX_PASSWORD_RESETS_PER_HOUR: 50;
        readonly HIGH_ERROR_RATE_THRESHOLD: 0.05;
        readonly RESPONSE_TIME_THRESHOLD_MS: 2000;
        readonly QUEUE_DEPTH_THRESHOLD: 1000;
        readonly TOKEN_CLEANUP_BATCH_SIZE: 1000;
        readonly CLEANUP_EXECUTION_TIMEOUT_MS: 30000;
    };
};
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SecurityAction = 'ALLOW' | 'ALERT' | 'REQUIRE_MFA' | 'BLOCK' | 'QUARANTINE';
export type AlertSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
export declare const getRiskLevel: (score: number) => RiskLevel;
export declare const getSecurityAction: (score: number) => SecurityAction;
export declare const isValidDeviceFingerprint: (fingerprint: any) => boolean;
export declare const calculateTokenEntropy: (token: string) => number;
export declare const RATE_LIMITS: {
    readonly REGISTRATION: {
        readonly MAX_ATTEMPTS: 3;
        readonly WINDOW_MS: 3600000;
        readonly BLOCK_DURATION_MS: 3600000;
    };
    readonly LOGIN: {
        readonly MAX_ATTEMPTS: 5;
        readonly WINDOW_MS: 900000;
        readonly BLOCK_DURATION_MS: 1800000;
    };
    readonly PASSWORD_RESET: {
        readonly MAX_ATTEMPTS: 3;
        readonly WINDOW_MS: 3600000;
        readonly BLOCK_DURATION_MS: 7200000;
    };
    readonly EMAIL_VERIFICATION: {
        readonly MAX_ATTEMPTS: 5;
        readonly WINDOW_MS: 3600000;
        readonly BLOCK_DURATION_MS: 3600000;
    };
    readonly VALIDATION_TOKENS: {
        readonly MAX_ATTEMPTS: 3;
        readonly WINDOW_MS: 300000;
        readonly BLOCK_DURATION_MS: 1800000;
    };
    readonly API_CALLS: {
        readonly MAX_ATTEMPTS: 100;
        readonly WINDOW_MS: 60000;
        readonly BLOCK_DURATION_MS: 300000;
    };
    readonly MFA_VERIFICATION: {
        readonly MAX_ATTEMPTS: 3;
        readonly WINDOW_MS: 300000;
        readonly BLOCK_DURATION_MS: 900000;
    };
    readonly API_KEY_GENERATION: {
        readonly MAX_ATTEMPTS: 5;
        readonly WINDOW_MS: 3600000;
        readonly BLOCK_DURATION_MS: 3600000;
    };
    readonly MAGIC_LINK: {
        readonly MAX_ATTEMPTS: 3;
        readonly WINDOW_MS: 900000;
        readonly BLOCK_DURATION_MS: 1800000;
    };
}, RISK_SCORING: {
    readonly UNKNOWN_DEVICE: 25;
    readonly NEW_LOCATION: 20;
    readonly UNUSUAL_TIME: 10;
    readonly FAILED_ATTEMPTS: 50;
    readonly TOR_IP: 30;
    readonly VPN_IP: 15;
    readonly PROXY_IP: 20;
    readonly MULTIPLE_SESSIONS: 15;
    readonly BRUTE_FORCE_ATTEMPT: 40;
    readonly SUSPICIOUS_USER_AGENT: 10;
    readonly ALLOW_THRESHOLD: 0;
    readonly ALERT_THRESHOLD: 30;
    readonly REQUIRE_MFA_THRESHOLD: 50;
    readonly BLOCK_THRESHOLD: 80;
    readonly MAX_RISK_SCORE: 100;
    readonly DEFAULT_RISK_SCORE: 0;
}, SUSPICIOUS_PATTERNS: {
    readonly MAX_FAILED_ATTEMPTS_PER_HOUR: 5;
    readonly MAX_FAILED_ATTEMPTS_PER_DAY: 20;
    readonly MULTIPLE_IP_SESSIONS: 3;
    readonly MULTIPLE_LOCATION_SESSIONS: 2;
    readonly RAPID_LOGIN_ATTEMPTS_SECONDS: 10;
    readonly UNUSUAL_HOURS_START: 2;
    readonly UNUSUAL_HOURS_END: 6;
    readonly IMPOSSIBLE_TRAVEL_KM_HOUR: 1000;
    readonly NEW_COUNTRY_RISK_HOURS: 24;
    readonly AUTOMATED_USER_AGENTS: readonly ["bot", "crawler", "spider", "scraper", "headless", "selenium", "puppeteer", "playwright", "curl", "wget"];
    readonly TOR_EXIT_NODES_CHECK: true;
    readonly VPN_DETECTION: true;
    readonly DATACENTER_IPS_CHECK: true;
    readonly DICTIONARY_ATTACK_PATTERNS: readonly ["admin", "password", "123456", "qwerty", "letmein", "welcome", "monkey", "dragon", "password123", "admin123"];
}, ALERTS: {
    readonly CRITICAL_EVENTS_IMMEDIATE: readonly ["ACCOUNT_TAKEOVER_ATTEMPT", "BRUTE_FORCE_ATTACK", "CREDENTIAL_STUFFING", "MULTIPLE_ACCOUNT_LOCKOUTS"];
    readonly HIGH_RISK_EVENTS_1MIN: readonly ["SUSPICIOUS_LOGIN_PATTERN", "GEOLOCATION_ANOMALY", "DEVICE_FINGERPRINT_MISMATCH"];
    readonly MEDIUM_RISK_EVENTS_5MIN: readonly ["FAILED_MFA_ATTEMPTS", "UNUSUAL_TIME_ACCESS", "NEW_DEVICE_LOGIN"];
    readonly EMAIL_ALERTS_ENABLED: true;
    readonly SLACK_ALERTS_ENABLED: false;
    readonly SMS_ALERTS_ENABLED: true;
    readonly MAX_ALERTS_PER_USER_HOUR: 5;
    readonly MAX_ALERTS_PER_TYPE_HOUR: 10;
    readonly ALERT_COOLDOWN_MINUTES: 15;
}, BOT_DETECTION: {
    readonly MISSING_HEADERS_SCORE: 10;
    readonly SUSPICIOUS_HEADERS_SCORE: 15;
    readonly BOT_USER_AGENT_SCORE: 25;
    readonly RAPID_REQUESTS_THRESHOLD: 10;
    readonly IDENTICAL_REQUESTS_THRESHOLD: 5;
    readonly NO_JAVASCRIPT_SCORE: 20;
    readonly CAPTCHA_CHALLENGE_THRESHOLD: 40;
    readonly CAPTCHA_REQUIRED_EVENTS: readonly ["MULTIPLE_FAILED_LOGINS", "SUSPICIOUS_REGISTRATION", "RAPID_FORM_SUBMISSIONS"];
}, GEOLOCATION: {
    readonly EARTH_RADIUS_KM: 6371;
    readonly MAX_REASONABLE_SPEED_KM_H: 900;
    readonly MAX_DISTANCE_KM: 1000;
    readonly GEOLOCATION_TIMEOUT: 5000;
    readonly HIGH_RISK_COUNTRIES: readonly ["CN", "RU", "IR", "KP"];
    readonly KNOWN_VPN_PROVIDERS: readonly ["nordvpn", "expressvpn", "surfshark", "cyberghost", "privateinternetaccess", "purevpn", "hidemyass"];
    readonly CLOUD_PROVIDER_ASNS: readonly ["AS16509", "AS15169", "AS8075", "AS13335"];
}, DEVICE_FINGERPRINT: {
    readonly TRUST_DURATION: number;
    readonly REQUIRED_FIELDS: readonly ["userAgent", "screen", "timezone", "language", "platform", "plugins", "canvas"];
    readonly MIN_ENTROPY: 15;
    readonly MAX_DEVICES_PER_USER: 10;
    readonly FINGERPRINT_CHANGE_THRESHOLD: 3;
}, SESSION_SECURITY: {
    readonly MAX_CONCURRENT_SESSIONS: 5;
    readonly MAX_SESSIONS_PER_IP: 3;
    readonly SESSION_HIJACKING_DETECTION: true;
    readonly FORCE_TOKEN_ROTATION_RISK: 60;
    readonly TOKEN_REUSE_DETECTION: true;
    readonly HIGH_RISK_SESSION_TIMEOUT_MINUTES: 15;
    readonly MEDIUM_RISK_SESSION_TIMEOUT_MINUTES: 30;
    readonly LOW_RISK_SESSION_TIMEOUT_MINUTES: 60;
}, AUDIT: {
    readonly MANDATORY_LOG_EVENTS: readonly ["LOGIN_SUCCESS", "LOGIN_FAILED", "LOGOUT", "PASSWORD_CHANGE", "MFA_SETUP", "ACCOUNT_LOCKED", "SUSPICIOUS_ACTIVITY"];
    readonly SECURITY_LOGS_RETENTION_DAYS: 90;
    readonly AUDIT_LOGS_RETENTION_DAYS: 365;
    readonly HIGH_RISK_LOGS_RETENTION_DAYS: 1095;
    readonly RETENTION_DAYS: 365;
    readonly HIGH_RISK_RETENTION_DAYS: 1095;
    readonly COMPLIANCE_ALERTS_ENABLED: true;
    readonly GDPR_DELETION_TRACKING: true;
}, ML_DETECTION: {
    readonly BEHAVIORAL_ANALYSIS_ENABLED: false;
    readonly ANOMALY_DETECTION_THRESHOLD: 0.8;
    readonly USER_BEHAVIOR_FEATURES: readonly ["typing_speed", "mouse_movements", "time_between_clicks", "navigation_patterns", "form_fill_speed"];
    readonly MODEL_UPDATE_FREQUENCY_HOURS: 24;
    readonly TRAINING_DATA_WINDOW_DAYS: 30;
}, INCIDENT_RESPONSE: {
    readonly AUTO_LOCK_ACCOUNT_RISK: 85;
    readonly AUTO_REQUIRE_MFA_RISK: 60;
    readonly AUTO_LOG_ADDITIONAL_INFO_RISK: 40;
    readonly SECURITY_TEAM_ALERT_RISK: 75;
    readonly ADMIN_NOTIFICATION_RISK: 80;
    readonly EMERGENCY_LOCKDOWN_RISK: 95;
    readonly QUARANTINE_SUSPICIOUS_SESSIONS: true;
    readonly QUARANTINE_DURATION_HOURS: 24;
}, TOKEN_SECURITY: {
    readonly PERSISTENT_TOKEN_MAX_PER_USER: 10;
    readonly PERSISTENT_TOKEN_DEFAULT_EXPIRY_DAYS: 90;
    readonly API_KEY_MIN_ENTROPY: 128;
    readonly VALIDATION_TOKEN_MIN_ENTROPY: 256;
    readonly VALIDATION_TOKEN_MAX_ATTEMPTS: 3;
    readonly EMAIL_TOKEN_EXPIRY_HOURS: 24;
    readonly RESET_TOKEN_EXPIRY_HOURS: 1;
    readonly MAGIC_LINK_EXPIRY_MINUTES: 15;
    readonly REFRESH_TOKEN_ROTATION_ENABLED: true;
    readonly REFRESH_TOKEN_FAMILY_SIZE: 5;
}, MONITORING: {
    readonly MAX_FAILED_LOGINS_PER_MINUTE: 10;
    readonly MAX_REGISTRATION_PER_HOUR: 100;
    readonly MAX_PASSWORD_RESETS_PER_HOUR: 50;
    readonly HIGH_ERROR_RATE_THRESHOLD: 0.05;
    readonly RESPONSE_TIME_THRESHOLD_MS: 2000;
    readonly QUEUE_DEPTH_THRESHOLD: 1000;
    readonly TOKEN_CLEANUP_BATCH_SIZE: 1000;
    readonly CLEANUP_EXECUTION_TIMEOUT_MS: 30000;
};
