export declare const SECURITY_CONSTANTS: {
    readonly RISK_SCORING: {
        readonly UNKNOWN_DEVICE: 25;
        readonly NEW_LOCATION: 20;
        readonly UNUSUAL_TIME: 15;
        readonly FAILED_ATTEMPTS: 30;
        readonly TOR_IP: 40;
        readonly VPN_IP: 20;
        readonly DATACENTER_IP: 15;
        readonly MULTIPLE_SESSIONS: 10;
        readonly REQUIRE_MFA_THRESHOLD: 40;
        readonly BLOCK_THRESHOLD: 80;
        readonly ALERT_THRESHOLD: 60;
    };
    readonly GEOLOCATION: {
        readonly MAX_DISTANCE_KM: 1000;
        readonly TRUSTED_COUNTRIES: readonly ["TN", "FR", "DE", "US", "CA"];
        readonly HIGH_RISK_COUNTRIES: readonly ["CN", "RU", "KP"];
        readonly GEOLOCATION_TIMEOUT: 5000;
    };
    readonly RATE_LIMITS: {
        readonly LOGIN_ATTEMPTS: {
            readonly WINDOW_MS: number;
            readonly MAX_ATTEMPTS: 5;
            readonly BLOCK_DURATION: number;
        };
        readonly PASSWORD_RESET: {
            readonly WINDOW_MS: number;
            readonly MAX_ATTEMPTS: 3;
            readonly BLOCK_DURATION: number;
        };
        readonly MFA_VERIFY: {
            readonly WINDOW_MS: number;
            readonly MAX_ATTEMPTS: 5;
            readonly BLOCK_DURATION: number;
        };
        readonly REGISTRATION: {
            readonly WINDOW_MS: number;
            readonly MAX_ATTEMPTS: 3;
            readonly BLOCK_DURATION: number;
        };
    };
    readonly DEVICE_FINGERPRINT: {
        readonly TRUST_DURATION: number;
        readonly REQUIRED_FIELDS: readonly ["userAgent", "screen", "timezone", "language"];
        readonly HASH_ALGORITHM: "sha256";
        readonly MIN_ENTROPY: 12;
    };
    readonly AUDIT: {
        readonly RETENTION_DAYS: 90;
        readonly HIGH_RISK_RETENTION_DAYS: 365;
        readonly LOG_LEVELS: {
            readonly INFO: "info";
            readonly WARN: "warn";
            readonly ERROR: "error";
            readonly CRITICAL: "critical";
        };
    };
    readonly SUSPICIOUS_PATTERNS: {
        readonly RAPID_LOGIN_ATTEMPTS: 10;
        readonly MULTIPLE_IP_SESSIONS: 5;
        readonly UNUSUAL_USER_AGENT: RegExp;
        readonly AUTOMATION_DETECTED: RegExp;
    };
};
