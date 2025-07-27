"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MFA_VALIDATION = exports.MFA_CONSTANTS = void 0;
exports.MFA_CONSTANTS = {
    ENABLED: true,
    REQUIRED_FOR_ORGANIZERS: true,
    MAX_FAILED_ATTEMPTS: 3,
    LOCKOUT_DURATION: 5 * 60,
    CHALLENGE_DURATION: 5 * 60,
    PROVIDERS: {
        SMS_OTP: {
            enabled: true,
            code_length: 6,
            validity_duration: 5 * 60,
            resend_delay: 60,
            max_attempts: 3,
            rate_limit: {
                max_requests: 3,
                window_ms: 10 * 60 * 1000,
            },
        },
        EMAIL_OTP: {
            enabled: true,
            code_length: 6,
            validity_duration: 10 * 60,
            resend_delay: 30,
            max_attempts: 3,
            rate_limit: {
                max_requests: 5,
                window_ms: 10 * 60 * 1000,
            },
        },
        TOTP_APP: {
            enabled: true,
            code_length: 6,
            window: 1,
            step: 30,
            max_attempts: 3,
        },
        BACKUP_CODE: {
            enabled: true,
            code_count: 10,
            code_length: 8,
            max_usage_per_code: 1,
        },
    },
    TOTP: {
        ISSUER: 'Entrix',
        ALGORITHM: 'sha1',
        DIGITS: 6,
        WINDOW: 1,
        SECRET_LENGTH: 20,
        STEP: 30,
        QR_CODE: {
            size: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        },
    },
    BACKUP_CODES: {
        COUNT: 10,
        LENGTH: 8,
        CHARSET: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
        GROUPS: 2,
        SEPARATOR: '-',
    },
    TRUSTED_DEVICES: {
        enabled: true,
        default_duration: 30 * 24 * 60 * 60,
        max_duration: 90 * 24 * 60 * 60,
        max_devices_per_user: 10,
        cleanup_interval: 24 * 60 * 60,
        require_verification: true,
    },
    SESSIONS: {
        mfa_session_duration: 24 * 60 * 60,
        require_mfa_for_sensitive: true,
        remember_device_duration: 30 * 24 * 60 * 60,
        force_mfa_interval: 7 * 24 * 60 * 60,
    },
    RISK_SCORING: {
        new_device_score: 30,
        new_location_score: 25,
        suspicious_activity_score: 40,
        failed_attempts_score: 20,
        time_of_access_score: 10,
        threshold_require_mfa: 50,
        threshold_block_access: 90,
    },
    MESSAGES: {
        SETUP_SUCCESS: 'Authentification multi-facteur configurée avec succès',
        SETUP_FAILED: 'Échec de la configuration MFA',
        VERIFY_SUCCESS: 'Code de vérification valide',
        VERIFY_FAILED: 'Code de vérification invalide',
        DISABLED_SUCCESS: 'Authentification multi-facteur désactivée',
        EXPIRED_CHALLENGE: 'Challenge MFA expiré',
        RATE_LIMITED: 'Trop de tentatives. Veuillez patienter.',
        DEVICE_TRUSTED: 'Appareil marqué comme fiable',
        CODES_REGENERATED: 'Nouveaux codes de récupération générés',
    },
    TEMPLATES: {
        SMS: {
            CODE: 'Votre code Entrix: {code}. Valide {duration} min. Ne partagez jamais ce code.',
            SETUP: 'Activation MFA Entrix réussie. Code: {code}',
        },
        EMAIL: {
            SUBJECT_CODE: 'Code de vérification Entrix',
            SUBJECT_SETUP: 'Configuration MFA Entrix',
            SUBJECT_DISABLED: 'MFA désactivé - Entrix',
        },
    },
    CLEANUP: {
        expired_tokens_interval: 60 * 60,
        expired_devices_interval: 24 * 60 * 60,
        expired_challenges_interval: 5 * 60,
        old_audit_logs_after: 90 * 24 * 60 * 60,
    },
    MONITORING: {
        alert_failed_attempts_threshold: 10,
        alert_setup_failures_threshold: 5,
        metrics_retention_days: 30,
        daily_report_enabled: true,
    },
};
exports.MFA_VALIDATION = {
    isValidSmsCode: (code) => {
        return /^\d{6}$/.test(code);
    },
    isValidEmailCode: (code) => {
        return /^\d{6}$/.test(code);
    },
    isValidTotpCode: (code) => {
        return /^\d{6}$/.test(code);
    },
    isValidBackupCode: (code) => {
        const pattern = new RegExp(`^[${exports.MFA_CONSTANTS.BACKUP_CODES.CHARSET}]{4}-[${exports.MFA_CONSTANTS.BACKUP_CODES.CHARSET}]{4}$`);
        return pattern.test(code.toUpperCase());
    },
    formatBackupCode: (code) => {
        const clean = code.replace(/[^A-Z0-9]/g, '');
        if (clean.length !== 8)
            return code;
        return `${clean.slice(0, 4)}-${clean.slice(4, 8)}`;
    },
    maskPhoneNumber: (phone) => {
        if (phone.length < 8)
            return phone;
        return phone.slice(0, 4) + '*'.repeat(phone.length - 7) + phone.slice(-3);
    },
    maskEmail: (email) => {
        const [local, domain] = email.split('@');
        if (!domain)
            return email;
        const maskedLocal = local.charAt(0) + '*'.repeat(Math.max(0, local.length - 2)) + local.charAt(local.length - 1);
        return `${maskedLocal}@${domain}`;
    },
};
exports.default = exports.MFA_CONSTANTS;
//# sourceMappingURL=mfa.constants.js.map