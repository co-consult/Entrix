export declare const AUTH_CONSTANTS: {
    readonly JWT: {
        readonly ACCESS_TOKEN_EXPIRY: number;
        readonly REFRESH_TOKEN_EXPIRY: number;
        readonly REFRESH_TOKEN_EXPIRY_REMEMBER: number;
        readonly PASSWORD_RESET_TOKEN_EXPIRY: number;
        readonly MFA_CHALLENGE_TOKEN_EXPIRY: number;
    };
    readonly VALIDATION: {
        readonly PASSWORD_MIN_LENGTH: 8;
        readonly PASSWORD_MAX_LENGTH: 128;
        readonly EMAIL_MAX_LENGTH: 255;
        readonly PHONE_REGEX: RegExp;
        readonly PASSWORD_REGEX: RegExp;
        readonly DEVICE_FINGERPRINT_LENGTH: 64;
    };
    readonly SECURITY: {
        readonly MAX_LOGIN_ATTEMPTS: 5;
        readonly LOCKOUT_DURATION: number;
        readonly MAX_SESSIONS_PER_USER: 10;
        readonly RISK_SCORE_THRESHOLD: 70;
        readonly MFA_CODE_LENGTH: 6;
        readonly BACKUP_CODES_COUNT: 10;
    };
    readonly ERRORS: {
        readonly INVALID_CREDENTIALS: "Email ou mot de passe incorrect";
        readonly ACCOUNT_LOCKED: "Compte verrouillé pour sécurité";
        readonly EMAIL_NOT_VERIFIED: "Email non vérifié";
        readonly MFA_REQUIRED: "Authentification multifacteur requise";
        readonly INVALID_MFA_CODE: "Code MFA incorrect";
        readonly SESSION_EXPIRED: "Session expirée";
        readonly INVALID_REFRESH_TOKEN: "Token de rafraîchissement invalide";
        readonly WEAK_PASSWORD: "Mot de passe trop faible";
        readonly EMAIL_ALREADY_EXISTS: "Un compte avec cet email existe déjà";
        readonly INVALID_RESET_TOKEN: "Token de réinitialisation invalide ou expiré";
        readonly DEVICE_NOT_TRUSTED: "Appareil non reconnu";
        readonly RATE_LIMITED: "Trop de tentatives. Réessayez plus tard";
        readonly SUSPICIOUS_ACTIVITY: "Activité suspecte détectée";
    };
    readonly HEADERS: {
        readonly AUTHORIZATION: "Authorization";
        readonly X_RATE_LIMIT_REMAINING: "X-RateLimit-Remaining";
        readonly X_RATE_LIMIT_RESET: "X-RateLimit-Reset";
        readonly X_DEVICE_FINGERPRINT: "X-Device-Fingerprint";
        readonly X_GEOLOCATION: "X-Geolocation";
        readonly X_RISK_SCORE: "X-Risk-Score";
    };
    readonly MFA_PROVIDERS: {
        readonly SMS_OTP: "SMS_OTP";
        readonly EMAIL_OTP: "EMAIL_OTP";
        readonly TOTP_APP: "TOTP_APP";
        readonly BACKUP_CODE: "BACKUP_CODE";
    };
    readonly DEVICE_TYPES: {
        readonly DESKTOP: "DESKTOP";
        readonly MOBILE: "MOBILE";
        readonly TABLET: "TABLET";
        readonly BROWSER: "BROWSER";
        readonly API: "API";
    };
    readonly SECURITY_EVENTS: {
        readonly LOGIN_SUCCESS: "LOGIN_SUCCESS";
        readonly LOGIN_FAILED: "LOGIN_FAILED";
        readonly LOGOUT: "LOGOUT";
        readonly PASSWORD_CHANGE: "PASSWORD_CHANGE";
        readonly MFA_SETUP: "MFA_SETUP";
        readonly MFA_DISABLED: "MFA_DISABLED";
        readonly SUSPICIOUS_ACTIVITY: "SUSPICIOUS_ACTIVITY";
        readonly DEVICE_TRUSTED: "DEVICE_TRUSTED";
        readonly DEVICE_REVOKED: "DEVICE_REVOKED";
        readonly SESSION_EXPIRED: "SESSION_EXPIRED";
        readonly ACCOUNT_LOCKED: "ACCOUNT_LOCKED";
    };
    readonly RISK_LEVELS: {
        readonly LOW: {
            readonly min: 0;
            readonly max: 30;
            readonly label: "Faible";
        };
        readonly MEDIUM: {
            readonly min: 31;
            readonly max: 70;
            readonly label: "Moyen";
        };
        readonly HIGH: {
            readonly min: 71;
            readonly max: 100;
            readonly label: "Élevé";
        };
    };
};
export type MfaProvider = keyof typeof AUTH_CONSTANTS.MFA_PROVIDERS;
export type DeviceType = keyof typeof AUTH_CONSTANTS.DEVICE_TYPES;
export type SecurityEventType = keyof typeof AUTH_CONSTANTS.SECURITY_EVENTS;
export type RiskLevel = keyof typeof AUTH_CONSTANTS.RISK_LEVELS;
