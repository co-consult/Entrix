"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MFA_CONSTANTS = void 0;
exports.MFA_CONSTANTS = {
    PROVIDERS: {
        SMS_OTP: {
            id: 'SMS_OTP',
            name: 'SMS OTP',
            description: 'Code à 6 chiffres par SMS',
            setup_time: 2,
            validity_duration: 5 * 60,
        },
        EMAIL_OTP: {
            id: 'EMAIL_OTP',
            name: 'Email OTP',
            description: 'Code à 6 chiffres par email',
            setup_time: 1,
            validity_duration: 10 * 60,
        },
        TOTP_APP: {
            id: 'TOTP_APP',
            name: 'Authenticator App',
            description: 'Google Authenticator, Authy, etc.',
            setup_time: 5,
            validity_duration: 30,
        },
        BACKUP_CODE: {
            id: 'BACKUP_CODE',
            name: 'Code de récupération',
            description: 'Codes à usage unique',
            setup_time: 0,
            validity_duration: Infinity,
        },
    },
    TOTP: {
        SECRET_LENGTH: 32,
        WINDOW: 1,
        STEP: 30,
        DIGITS: 6,
        ALGORITHM: 'sha1',
        ISSUER: 'Entrix',
    },
    OTP: {
        LENGTH: 6,
        ALPHABET: '0123456789',
        MAX_ATTEMPTS: 3,
        RATE_LIMIT_WINDOW: 5 * 60,
        MAX_CODES_PER_WINDOW: 3,
    },
    BACKUP_CODES: {
        COUNT: 10,
        LENGTH: 8,
        ALPHABET: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        USAGE_LIMIT: 1,
    },
};
//# sourceMappingURL=mfa.constants.js.map