export declare const AUTH_CONSTANTS: {
    readonly JWT: {
        readonly ACCESS_TOKEN_EXPIRY: number;
        readonly REFRESH_TOKEN_EXPIRY: number;
        readonly REFRESH_TOKEN_EXPIRY_REMEMBER: number;
        readonly PASSWORD_RESET_TOKEN_EXPIRY: number;
        readonly MFA_CHALLENGE_TOKEN_EXPIRY: number;
    };
    readonly PASSWORD: {
        readonly MIN_STRENGTH_SCORE: 60;
        readonly WEAK_SCORE_THRESHOLD: 40;
        readonly MEDIUM_SCORE_THRESHOLD: 70;
        readonly SCORING: {
            readonly LENGTH_BONUS: 4;
            readonly UPPERCASE_BONUS: 10;
            readonly LOWERCASE_BONUS: 5;
            readonly NUMBERS_BONUS: 10;
            readonly SYMBOLS_BONUS: 15;
            readonly MIXED_CASE_BONUS: 5;
            readonly MIDDLE_NUMBERS_BONUS: 5;
            readonly MIDDLE_SYMBOLS_BONUS: 5;
            readonly LETTERS_ONLY_PENALTY: -15;
            readonly NUMBERS_ONLY_PENALTY: -20;
            readonly REPEAT_CHARS_PENALTY: -10;
            readonly CONSECUTIVE_LETTERS_PENALTY: -5;
            readonly CONSECUTIVE_NUMBERS_PENALTY: -5;
            readonly SEQUENTIAL_LETTERS_PENALTY: -10;
            readonly SEQUENTIAL_NUMBERS_PENALTY: -10;
            readonly COMMON_PATTERNS_PENALTY: -25;
        };
        readonly WEAK_PATTERNS: readonly ["password", "admin", "user", "login", "root", "guest", "123456", "654321", "qwerty", "azerty", "abc123", "password123", "admin123", "user123", "test123", "motdepasse", "administrateur", "utilisateur", "entrix", "tunisia", "tunis", "tunisia123"];
        readonly LETTER_SEQUENCES: readonly ["abc", "bcd", "cde", "def", "efg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "mno", "nop", "opq", "pqr", "qrs", "rst", "stu", "tuv", "uvw", "vwx", "wxy", "xyz"];
        readonly NUMBER_SEQUENCES: readonly ["012", "123", "234", "345", "456", "567", "678", "789", "890"];
        readonly SUGGESTIONS: {
            readonly TOO_SHORT: "Utilisez au moins {min} caractères";
            readonly ADD_UPPERCASE: "Ajoutez des lettres majuscules";
            readonly ADD_LOWERCASE: "Ajoutez des lettres minuscules";
            readonly ADD_NUMBERS: "Ajoutez des chiffres";
            readonly ADD_SYMBOLS: "Ajoutez des symboles (!@#$%^&*)";
            readonly AVOID_PATTERNS: "Évitez les mots courants et séquences";
            readonly AVOID_REPETITION: "Évitez la répétition de caractères";
            readonly AVOID_PERSONAL_INFO: "N'utilisez pas d'informations personnelles";
            readonly USE_PASSPHRASE: "Considérez une phrase de passe longue";
            readonly MIX_CHARACTER_TYPES: "Mélangez différents types de caractères";
        };
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
    readonly MFA_PROVIDERS: {
        readonly SMS_OTP: "SMS_OTP";
        readonly EMAIL_OTP: "EMAIL_OTP";
        readonly TOTP_APP: "TOTP_APP";
        readonly BACKUP_CODE: "BACKUP_CODE";
    };
    readonly RISK_LEVELS: {
        readonly LOW: 0;
        readonly MEDIUM: 30;
        readonly HIGH: 60;
        readonly CRITICAL: 80;
    };
    readonly CACHE: {
        readonly USER_PROFILE_TTL: 300;
        readonly SESSION_INFO_TTL: 600;
        readonly MFA_SETTINGS_TTL: 1800;
        readonly RISK_SCORE_TTL: 900;
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
        readonly ACCOUNT_SUSPENDED: "Compte suspendu";
        readonly VERIFICATION_REQUIRED: "Vérification requise";
    };
    readonly AUDIT_EVENTS: {
        readonly LOGIN_SUCCESS: "LOGIN_SUCCESS";
        readonly LOGIN_FAILED: "LOGIN_FAILED";
        readonly LOGOUT: "LOGOUT";
        readonly REGISTRATION: "REGISTRATION";
        readonly PASSWORD_CHANGE: "PASSWORD_CHANGE";
        readonly PASSWORD_RESET: "PASSWORD_RESET";
        readonly MFA_ENABLED: "MFA_ENABLED";
        readonly MFA_DISABLED: "MFA_DISABLED";
        readonly EMAIL_VERIFIED: "EMAIL_VERIFIED";
        readonly ACCOUNT_LOCKED: "ACCOUNT_LOCKED";
        readonly SUSPICIOUS_LOGIN: "SUSPICIOUS_LOGIN";
    };
    readonly SECURITY_EVENTS: {
        readonly LOGIN_SUCCESS: "LOGIN_SUCCESS";
        readonly LOGIN_FAILED: "LOGIN_FAILED";
        readonly FAILED_LOGIN: "FAILED_LOGIN";
        readonly LOGOUT: "LOGOUT";
        readonly SESSION_EXPIRED: "SESSION_EXPIRED";
        readonly SUSPICIOUS_ACTIVITY: "SUSPICIOUS_ACTIVITY";
        readonly MULTIPLE_SESSIONS: "MULTIPLE_SESSIONS";
        readonly UNKNOWN_DEVICE: "UNKNOWN_DEVICE";
        readonly DEVICE_TRUSTED: "DEVICE_TRUSTED";
        readonly DEVICE_REVOKED: "DEVICE_REVOKED";
        readonly MFA_SETUP: "MFA_SETUP";
        readonly MFA_ENABLED: "MFA_ENABLED";
        readonly MFA_DISABLED: "MFA_DISABLED";
        readonly MFA_CODE_VERIFIED: "MFA_CODE_VERIFIED";
        readonly MFA_CODE_FAILED: "MFA_CODE_FAILED";
        readonly ACCOUNT_LOCKED: "ACCOUNT_LOCKED";
        readonly ACCOUNT_UNLOCKED: "ACCOUNT_UNLOCKED";
        readonly ACCOUNT_SUSPENDED: "ACCOUNT_SUSPENDED";
        readonly PASSWORD_CHANGED: "PASSWORD_CHANGED";
        readonly PASSWORD_RESET: "PASSWORD_RESET";
        readonly EMAIL_VERIFIED: "EMAIL_VERIFIED";
        readonly IP_BLOCKED: "IP_BLOCKED";
        readonly IP_UNBLOCKED: "IP_UNBLOCKED";
        readonly GEOLOCATION_CHANGE: "GEOLOCATION_CHANGE";
        readonly RISK_ASSESSMENT: "RISK_ASSESSMENT";
        readonly SECURITY_ALERT: "SECURITY_ALERT";
        readonly AUDIT_LOG_ACCESS: "AUDIT_LOG_ACCESS";
    };
    readonly SESSION: {
        readonly TYPES: {
            readonly REUSED: "reused";
            readonly REFRESHED: "refreshed";
            readonly NEW: "new";
        };
        readonly CLEANUP_INTERVAL: number;
        readonly MAX_INACTIVE_TIME: number;
    };
};
export type MfaProvider = typeof AUTH_CONSTANTS.MFA_PROVIDERS[keyof typeof AUTH_CONSTANTS.MFA_PROVIDERS];
export type SessionType = typeof AUTH_CONSTANTS.SESSION.TYPES[keyof typeof AUTH_CONSTANTS.SESSION.TYPES];
export type AuditEvent = typeof AUTH_CONSTANTS.AUDIT_EVENTS[keyof typeof AUTH_CONSTANTS.AUDIT_EVENTS];
export type SecurityEventType = typeof AUTH_CONSTANTS.SECURITY_EVENTS[keyof typeof AUTH_CONSTANTS.SECURITY_EVENTS];
export declare const MFA_PROVIDER_TO_METHOD_MAPPING: {
    readonly SMS_OTP: "SMS";
    readonly EMAIL_OTP: "EMAIL";
    readonly TOTP_APP: "TOTP";
    readonly BACKUP_CODE: "BACKUP_CODES";
};
export declare const MFA_METHOD_TO_PROVIDER_MAPPING: {
    readonly SMS: "SMS_OTP";
    readonly EMAIL: "EMAIL_OTP";
    readonly TOTP: "TOTP_APP";
    readonly BACKUP_CODES: "BACKUP_CODE";
};
export declare const JWT: {
    readonly ACCESS_TOKEN_EXPIRY: number;
    readonly REFRESH_TOKEN_EXPIRY: number;
    readonly REFRESH_TOKEN_EXPIRY_REMEMBER: number;
    readonly PASSWORD_RESET_TOKEN_EXPIRY: number;
    readonly MFA_CHALLENGE_TOKEN_EXPIRY: number;
}, PASSWORD: {
    readonly MIN_STRENGTH_SCORE: 60;
    readonly WEAK_SCORE_THRESHOLD: 40;
    readonly MEDIUM_SCORE_THRESHOLD: 70;
    readonly SCORING: {
        readonly LENGTH_BONUS: 4;
        readonly UPPERCASE_BONUS: 10;
        readonly LOWERCASE_BONUS: 5;
        readonly NUMBERS_BONUS: 10;
        readonly SYMBOLS_BONUS: 15;
        readonly MIXED_CASE_BONUS: 5;
        readonly MIDDLE_NUMBERS_BONUS: 5;
        readonly MIDDLE_SYMBOLS_BONUS: 5;
        readonly LETTERS_ONLY_PENALTY: -15;
        readonly NUMBERS_ONLY_PENALTY: -20;
        readonly REPEAT_CHARS_PENALTY: -10;
        readonly CONSECUTIVE_LETTERS_PENALTY: -5;
        readonly CONSECUTIVE_NUMBERS_PENALTY: -5;
        readonly SEQUENTIAL_LETTERS_PENALTY: -10;
        readonly SEQUENTIAL_NUMBERS_PENALTY: -10;
        readonly COMMON_PATTERNS_PENALTY: -25;
    };
    readonly WEAK_PATTERNS: readonly ["password", "admin", "user", "login", "root", "guest", "123456", "654321", "qwerty", "azerty", "abc123", "password123", "admin123", "user123", "test123", "motdepasse", "administrateur", "utilisateur", "entrix", "tunisia", "tunis", "tunisia123"];
    readonly LETTER_SEQUENCES: readonly ["abc", "bcd", "cde", "def", "efg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "mno", "nop", "opq", "pqr", "qrs", "rst", "stu", "tuv", "uvw", "vwx", "wxy", "xyz"];
    readonly NUMBER_SEQUENCES: readonly ["012", "123", "234", "345", "456", "567", "678", "789", "890"];
    readonly SUGGESTIONS: {
        readonly TOO_SHORT: "Utilisez au moins {min} caractères";
        readonly ADD_UPPERCASE: "Ajoutez des lettres majuscules";
        readonly ADD_LOWERCASE: "Ajoutez des lettres minuscules";
        readonly ADD_NUMBERS: "Ajoutez des chiffres";
        readonly ADD_SYMBOLS: "Ajoutez des symboles (!@#$%^&*)";
        readonly AVOID_PATTERNS: "Évitez les mots courants et séquences";
        readonly AVOID_REPETITION: "Évitez la répétition de caractères";
        readonly AVOID_PERSONAL_INFO: "N'utilisez pas d'informations personnelles";
        readonly USE_PASSPHRASE: "Considérez une phrase de passe longue";
        readonly MIX_CHARACTER_TYPES: "Mélangez différents types de caractères";
    };
}, VALIDATION: {
    readonly PASSWORD_MIN_LENGTH: 8;
    readonly PASSWORD_MAX_LENGTH: 128;
    readonly EMAIL_MAX_LENGTH: 255;
    readonly PHONE_REGEX: RegExp;
    readonly PASSWORD_REGEX: RegExp;
    readonly DEVICE_FINGERPRINT_LENGTH: 64;
}, SECURITY: {
    readonly MAX_LOGIN_ATTEMPTS: 5;
    readonly LOCKOUT_DURATION: number;
    readonly MAX_SESSIONS_PER_USER: 10;
    readonly RISK_SCORE_THRESHOLD: 70;
    readonly MFA_CODE_LENGTH: 6;
    readonly BACKUP_CODES_COUNT: 10;
}, MFA_PROVIDERS: {
    readonly SMS_OTP: "SMS_OTP";
    readonly EMAIL_OTP: "EMAIL_OTP";
    readonly TOTP_APP: "TOTP_APP";
    readonly BACKUP_CODE: "BACKUP_CODE";
}, RISK_LEVELS: {
    readonly LOW: 0;
    readonly MEDIUM: 30;
    readonly HIGH: 60;
    readonly CRITICAL: 80;
}, CACHE: {
    readonly USER_PROFILE_TTL: 300;
    readonly SESSION_INFO_TTL: 600;
    readonly MFA_SETTINGS_TTL: 1800;
    readonly RISK_SCORE_TTL: 900;
}, ERRORS: {
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
    readonly ACCOUNT_SUSPENDED: "Compte suspendu";
    readonly VERIFICATION_REQUIRED: "Vérification requise";
}, AUDIT_EVENTS: {
    readonly LOGIN_SUCCESS: "LOGIN_SUCCESS";
    readonly LOGIN_FAILED: "LOGIN_FAILED";
    readonly LOGOUT: "LOGOUT";
    readonly REGISTRATION: "REGISTRATION";
    readonly PASSWORD_CHANGE: "PASSWORD_CHANGE";
    readonly PASSWORD_RESET: "PASSWORD_RESET";
    readonly MFA_ENABLED: "MFA_ENABLED";
    readonly MFA_DISABLED: "MFA_DISABLED";
    readonly EMAIL_VERIFIED: "EMAIL_VERIFIED";
    readonly ACCOUNT_LOCKED: "ACCOUNT_LOCKED";
    readonly SUSPICIOUS_LOGIN: "SUSPICIOUS_LOGIN";
}, SECURITY_EVENTS: {
    readonly LOGIN_SUCCESS: "LOGIN_SUCCESS";
    readonly LOGIN_FAILED: "LOGIN_FAILED";
    readonly FAILED_LOGIN: "FAILED_LOGIN";
    readonly LOGOUT: "LOGOUT";
    readonly SESSION_EXPIRED: "SESSION_EXPIRED";
    readonly SUSPICIOUS_ACTIVITY: "SUSPICIOUS_ACTIVITY";
    readonly MULTIPLE_SESSIONS: "MULTIPLE_SESSIONS";
    readonly UNKNOWN_DEVICE: "UNKNOWN_DEVICE";
    readonly DEVICE_TRUSTED: "DEVICE_TRUSTED";
    readonly DEVICE_REVOKED: "DEVICE_REVOKED";
    readonly MFA_SETUP: "MFA_SETUP";
    readonly MFA_ENABLED: "MFA_ENABLED";
    readonly MFA_DISABLED: "MFA_DISABLED";
    readonly MFA_CODE_VERIFIED: "MFA_CODE_VERIFIED";
    readonly MFA_CODE_FAILED: "MFA_CODE_FAILED";
    readonly ACCOUNT_LOCKED: "ACCOUNT_LOCKED";
    readonly ACCOUNT_UNLOCKED: "ACCOUNT_UNLOCKED";
    readonly ACCOUNT_SUSPENDED: "ACCOUNT_SUSPENDED";
    readonly PASSWORD_CHANGED: "PASSWORD_CHANGED";
    readonly PASSWORD_RESET: "PASSWORD_RESET";
    readonly EMAIL_VERIFIED: "EMAIL_VERIFIED";
    readonly IP_BLOCKED: "IP_BLOCKED";
    readonly IP_UNBLOCKED: "IP_UNBLOCKED";
    readonly GEOLOCATION_CHANGE: "GEOLOCATION_CHANGE";
    readonly RISK_ASSESSMENT: "RISK_ASSESSMENT";
    readonly SECURITY_ALERT: "SECURITY_ALERT";
    readonly AUDIT_LOG_ACCESS: "AUDIT_LOG_ACCESS";
}, SESSION: {
    readonly TYPES: {
        readonly REUSED: "reused";
        readonly REFRESHED: "refreshed";
        readonly NEW: "new";
    };
    readonly CLEANUP_INTERVAL: number;
    readonly MAX_INACTIVE_TIME: number;
};
