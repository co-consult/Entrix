export declare const MFA_CONSTANTS: {
    readonly ENABLED: true;
    readonly REQUIRED_FOR_ORGANIZERS: true;
    readonly MAX_FAILED_ATTEMPTS: 3;
    readonly LOCKOUT_DURATION: number;
    readonly CHALLENGE_DURATION: number;
    readonly PROVIDERS: {
        readonly SMS_OTP: {
            readonly enabled: true;
            readonly code_length: 6;
            readonly validity_duration: number;
            readonly resend_delay: 60;
            readonly max_attempts: 3;
            readonly rate_limit: {
                readonly max_requests: 3;
                readonly window_ms: number;
            };
        };
        readonly EMAIL_OTP: {
            readonly enabled: true;
            readonly code_length: 6;
            readonly validity_duration: number;
            readonly resend_delay: 30;
            readonly max_attempts: 3;
            readonly rate_limit: {
                readonly max_requests: 5;
                readonly window_ms: number;
            };
        };
        readonly TOTP_APP: {
            readonly enabled: true;
            readonly code_length: 6;
            readonly window: 1;
            readonly step: 30;
            readonly max_attempts: 3;
        };
        readonly BACKUP_CODE: {
            readonly enabled: true;
            readonly code_count: 10;
            readonly code_length: 8;
            readonly max_usage_per_code: 1;
        };
    };
    readonly TOTP: {
        readonly ISSUER: "Entrix";
        readonly ALGORITHM: "sha1";
        readonly DIGITS: 6;
        readonly WINDOW: 1;
        readonly SECRET_LENGTH: 20;
        readonly STEP: 30;
        readonly QR_CODE: {
            readonly size: 200;
            readonly margin: 2;
            readonly color: {
                readonly dark: "#000000";
                readonly light: "#FFFFFF";
            };
        };
    };
    readonly BACKUP_CODES: {
        readonly COUNT: 10;
        readonly LENGTH: 8;
        readonly CHARSET: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        readonly GROUPS: 2;
        readonly SEPARATOR: "-";
    };
    readonly TRUSTED_DEVICES: {
        readonly enabled: true;
        readonly default_duration: number;
        readonly max_duration: number;
        readonly max_devices_per_user: 10;
        readonly cleanup_interval: number;
        readonly require_verification: true;
    };
    readonly SESSIONS: {
        readonly mfa_session_duration: number;
        readonly require_mfa_for_sensitive: true;
        readonly remember_device_duration: number;
        readonly force_mfa_interval: number;
    };
    readonly RISK_SCORING: {
        readonly new_device_score: 30;
        readonly new_location_score: 25;
        readonly suspicious_activity_score: 40;
        readonly failed_attempts_score: 20;
        readonly time_of_access_score: 10;
        readonly threshold_require_mfa: 50;
        readonly threshold_block_access: 90;
    };
    readonly MESSAGES: {
        readonly SETUP_SUCCESS: "Authentification multi-facteur configurée avec succès";
        readonly SETUP_FAILED: "Échec de la configuration MFA";
        readonly VERIFY_SUCCESS: "Code de vérification valide";
        readonly VERIFY_FAILED: "Code de vérification invalide";
        readonly DISABLED_SUCCESS: "Authentification multi-facteur désactivée";
        readonly EXPIRED_CHALLENGE: "Challenge MFA expiré";
        readonly RATE_LIMITED: "Trop de tentatives. Veuillez patienter.";
        readonly DEVICE_TRUSTED: "Appareil marqué comme fiable";
        readonly CODES_REGENERATED: "Nouveaux codes de récupération générés";
    };
    readonly TEMPLATES: {
        readonly SMS: {
            readonly CODE: "Votre code Entrix: {code}. Valide {duration} min. Ne partagez jamais ce code.";
            readonly SETUP: "Activation MFA Entrix réussie. Code: {code}";
        };
        readonly EMAIL: {
            readonly SUBJECT_CODE: "Code de vérification Entrix";
            readonly SUBJECT_SETUP: "Configuration MFA Entrix";
            readonly SUBJECT_DISABLED: "MFA désactivé - Entrix";
        };
    };
    readonly CLEANUP: {
        readonly expired_tokens_interval: number;
        readonly expired_devices_interval: number;
        readonly expired_challenges_interval: number;
        readonly old_audit_logs_after: number;
    };
    readonly MONITORING: {
        readonly alert_failed_attempts_threshold: 10;
        readonly alert_setup_failures_threshold: 5;
        readonly metrics_retention_days: 30;
        readonly daily_report_enabled: true;
    };
};
export type MfaProviderConfig = typeof MFA_CONSTANTS.PROVIDERS[keyof typeof MFA_CONSTANTS.PROVIDERS];
export type TotpConfig = typeof MFA_CONSTANTS.TOTP;
export type BackupCodesConfig = typeof MFA_CONSTANTS.BACKUP_CODES;
export type TrustedDevicesConfig = typeof MFA_CONSTANTS.TRUSTED_DEVICES;
export declare const MFA_VALIDATION: {
    readonly isValidSmsCode: (code: string) => boolean;
    readonly isValidEmailCode: (code: string) => boolean;
    readonly isValidTotpCode: (code: string) => boolean;
    readonly isValidBackupCode: (code: string) => boolean;
    readonly formatBackupCode: (code: string) => string;
    readonly maskPhoneNumber: (phone: string) => string;
    readonly maskEmail: (email: string) => string;
};
export default MFA_CONSTANTS;
