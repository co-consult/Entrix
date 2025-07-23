"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMfaConfig = void 0;
const mfa_constants_1 = require("../constants/mfa.constants");
const getMfaConfig = (configService) => ({
    enabled: configService.get('MFA_ENABLED', true),
    requiredForOrganizers: configService.get('MFA_REQUIRED_ORGANIZERS', true),
    providers: {
        sms: {
            enabled: configService.get('MFA_SMS_ENABLED', true),
            provider: configService.get('SMS_PROVIDER', 'twilio'),
            validityDuration: mfa_constants_1.MFA_CONSTANTS.PROVIDERS.SMS_OTP.validity_duration,
        },
        email: {
            enabled: configService.get('MFA_EMAIL_ENABLED', true),
            validityDuration: mfa_constants_1.MFA_CONSTANTS.PROVIDERS.EMAIL_OTP.validity_duration,
        },
        totp: {
            enabled: configService.get('MFA_TOTP_ENABLED', true),
            issuer: mfa_constants_1.MFA_CONSTANTS.TOTP.ISSUER,
            algorithm: mfa_constants_1.MFA_CONSTANTS.TOTP.ALGORITHM,
            digits: mfa_constants_1.MFA_CONSTANTS.TOTP.DIGITS,
            window: mfa_constants_1.MFA_CONSTANTS.TOTP.WINDOW,
        },
        backupCodes: {
            enabled: configService.get('MFA_BACKUP_CODES_ENABLED', true),
            count: mfa_constants_1.MFA_CONSTANTS.BACKUP_CODES.COUNT,
            length: mfa_constants_1.MFA_CONSTANTS.BACKUP_CODES.LENGTH,
        },
    },
});
exports.getMfaConfig = getMfaConfig;
//# sourceMappingURL=mfa.config.js.map