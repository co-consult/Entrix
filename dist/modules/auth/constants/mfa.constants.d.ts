export declare const MFA_CONSTANTS: {
    readonly PROVIDERS: {
        readonly SMS_OTP: {
            readonly id: "SMS_OTP";
            readonly name: "SMS OTP";
            readonly description: "Code à 6 chiffres par SMS";
            readonly setup_time: 2;
            readonly validity_duration: number;
        };
        readonly EMAIL_OTP: {
            readonly id: "EMAIL_OTP";
            readonly name: "Email OTP";
            readonly description: "Code à 6 chiffres par email";
            readonly setup_time: 1;
            readonly validity_duration: number;
        };
        readonly TOTP_APP: {
            readonly id: "TOTP_APP";
            readonly name: "Authenticator App";
            readonly description: "Google Authenticator, Authy, etc.";
            readonly setup_time: 5;
            readonly validity_duration: 30;
        };
        readonly BACKUP_CODE: {
            readonly id: "BACKUP_CODE";
            readonly name: "Code de récupération";
            readonly description: "Codes à usage unique";
            readonly setup_time: 0;
            readonly validity_duration: number;
        };
    };
    readonly TOTP: {
        readonly SECRET_LENGTH: 32;
        readonly WINDOW: 1;
        readonly STEP: 30;
        readonly DIGITS: 6;
        readonly ALGORITHM: "sha1";
        readonly ISSUER: "Entrix";
    };
    readonly OTP: {
        readonly LENGTH: 6;
        readonly ALPHABET: "0123456789";
        readonly MAX_ATTEMPTS: 3;
        readonly RATE_LIMIT_WINDOW: number;
        readonly MAX_CODES_PER_WINDOW: 3;
    };
    readonly BACKUP_CODES: {
        readonly COUNT: 10;
        readonly LENGTH: 8;
        readonly ALPHABET: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        readonly USAGE_LIMIT: 1;
    };
};
