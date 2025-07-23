"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRateLimitConfig = void 0;
const security_constants_1 = require("../constants/security.constants");
const getRateLimitConfig = (configService) => ({
    login: {
        windowMs: configService.get('RATE_LIMIT_LOGIN_WINDOW', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.LOGIN_ATTEMPTS.WINDOW_MS),
        maxAttempts: configService.get('RATE_LIMIT_LOGIN_MAX', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.LOGIN_ATTEMPTS.MAX_ATTEMPTS),
        blockDuration: configService.get('RATE_LIMIT_LOGIN_BLOCK', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.LOGIN_ATTEMPTS.BLOCK_DURATION),
    },
    passwordReset: {
        windowMs: configService.get('RATE_LIMIT_RESET_WINDOW', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.PASSWORD_RESET.WINDOW_MS),
        maxAttempts: configService.get('RATE_LIMIT_RESET_MAX', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.PASSWORD_RESET.MAX_ATTEMPTS),
        blockDuration: configService.get('RATE_LIMIT_RESET_BLOCK', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.PASSWORD_RESET.BLOCK_DURATION),
    },
    mfaVerify: {
        windowMs: configService.get('RATE_LIMIT_MFA_WINDOW', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.MFA_VERIFY.WINDOW_MS),
        maxAttempts: configService.get('RATE_LIMIT_MFA_MAX', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.MFA_VERIFY.MAX_ATTEMPTS),
        blockDuration: configService.get('RATE_LIMIT_MFA_BLOCK', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.MFA_VERIFY.BLOCK_DURATION),
    },
    registration: {
        windowMs: configService.get('RATE_LIMIT_REGISTER_WINDOW', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.REGISTRATION.WINDOW_MS),
        maxAttempts: configService.get('RATE_LIMIT_REGISTER_MAX', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.REGISTRATION.MAX_ATTEMPTS),
        blockDuration: configService.get('RATE_LIMIT_REGISTER_BLOCK', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.REGISTRATION.BLOCK_DURATION),
    },
});
exports.getRateLimitConfig = getRateLimitConfig;
//# sourceMappingURL=rate-limit.config.js.map