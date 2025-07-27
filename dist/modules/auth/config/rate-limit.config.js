"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RATE_LIMIT_PRESETS = exports.getRateLimitForEndpoint = exports.getRateLimitConfig = void 0;
const security_constants_1 = require("../constants/security.constants");
const getRateLimitConfig = (configService) => ({
    login: {
        windowMs: configService.get('RATE_LIMIT_LOGIN_WINDOW', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.LOGIN.WINDOW_MS),
        maxAttempts: configService.get('RATE_LIMIT_LOGIN_MAX', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.LOGIN.MAX_ATTEMPTS),
        blockDuration: configService.get('RATE_LIMIT_LOGIN_BLOCK', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.LOGIN.BLOCK_DURATION_MS),
    },
    passwordReset: {
        windowMs: configService.get('RATE_LIMIT_RESET_WINDOW', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.PASSWORD_RESET.WINDOW_MS),
        maxAttempts: configService.get('RATE_LIMIT_RESET_MAX', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.PASSWORD_RESET.MAX_ATTEMPTS),
        blockDuration: configService.get('RATE_LIMIT_RESET_BLOCK', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.PASSWORD_RESET.BLOCK_DURATION_MS),
    },
    mfaVerify: {
        windowMs: configService.get('RATE_LIMIT_MFA_WINDOW', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.MFA_VERIFICATION.WINDOW_MS),
        maxAttempts: configService.get('RATE_LIMIT_MFA_MAX', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.MFA_VERIFICATION.MAX_ATTEMPTS),
        blockDuration: configService.get('RATE_LIMIT_MFA_BLOCK', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.MFA_VERIFICATION.BLOCK_DURATION_MS),
    },
    registration: {
        windowMs: configService.get('RATE_LIMIT_REGISTER_WINDOW', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.REGISTRATION.WINDOW_MS),
        maxAttempts: configService.get('RATE_LIMIT_REGISTER_MAX', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.REGISTRATION.MAX_ATTEMPTS),
        blockDuration: configService.get('RATE_LIMIT_REGISTER_BLOCK', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.REGISTRATION.BLOCK_DURATION_MS),
    },
    emailVerification: {
        windowMs: configService.get('RATE_LIMIT_EMAIL_VERIFY_WINDOW', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.EMAIL_VERIFICATION.WINDOW_MS),
        maxAttempts: configService.get('RATE_LIMIT_EMAIL_VERIFY_MAX', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.EMAIL_VERIFICATION.MAX_ATTEMPTS),
        blockDuration: configService.get('RATE_LIMIT_EMAIL_VERIFY_BLOCK', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.EMAIL_VERIFICATION.BLOCK_DURATION_MS),
    },
    validationTokens: {
        windowMs: configService.get('RATE_LIMIT_VALIDATION_WINDOW', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.VALIDATION_TOKENS.WINDOW_MS),
        maxAttempts: configService.get('RATE_LIMIT_VALIDATION_MAX', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.VALIDATION_TOKENS.MAX_ATTEMPTS),
        blockDuration: configService.get('RATE_LIMIT_VALIDATION_BLOCK', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.VALIDATION_TOKENS.BLOCK_DURATION_MS),
    },
    apiCalls: {
        windowMs: configService.get('RATE_LIMIT_API_WINDOW', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.API_CALLS.WINDOW_MS),
        maxAttempts: configService.get('RATE_LIMIT_API_MAX', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.API_CALLS.MAX_ATTEMPTS),
        blockDuration: configService.get('RATE_LIMIT_API_BLOCK', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.API_CALLS.BLOCK_DURATION_MS),
    },
    apiKeyGeneration: {
        windowMs: configService.get('RATE_LIMIT_API_KEY_GEN_WINDOW', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.API_KEY_GENERATION.WINDOW_MS),
        maxAttempts: configService.get('RATE_LIMIT_API_KEY_GEN_MAX', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.API_KEY_GENERATION.MAX_ATTEMPTS),
        blockDuration: configService.get('RATE_LIMIT_API_KEY_GEN_BLOCK', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.API_KEY_GENERATION.BLOCK_DURATION_MS),
    },
    magicLink: {
        windowMs: configService.get('RATE_LIMIT_MAGIC_LINK_WINDOW', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.MAGIC_LINK.WINDOW_MS),
        maxAttempts: configService.get('RATE_LIMIT_MAGIC_LINK_MAX', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.MAGIC_LINK.MAX_ATTEMPTS),
        blockDuration: configService.get('RATE_LIMIT_MAGIC_LINK_BLOCK', security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.MAGIC_LINK.BLOCK_DURATION_MS),
    },
});
exports.getRateLimitConfig = getRateLimitConfig;
const getRateLimitForEndpoint = (endpoint, configService) => {
    const config = (0, exports.getRateLimitConfig)(configService);
    return config[endpoint];
};
exports.getRateLimitForEndpoint = getRateLimitForEndpoint;
exports.RATE_LIMIT_PRESETS = {
    CRITICAL_AUTH: {
        limit: security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.LOGIN.MAX_ATTEMPTS,
        windowMs: security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.LOGIN.WINDOW_MS,
    },
    SENSITIVE_ACTION: {
        limit: security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.PASSWORD_RESET.MAX_ATTEMPTS,
        windowMs: security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.PASSWORD_RESET.WINDOW_MS,
    },
    NORMAL_API: {
        limit: security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.API_CALLS.MAX_ATTEMPTS,
        windowMs: security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.API_CALLS.WINDOW_MS,
    },
    TOKEN_VALIDATION: {
        limit: security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.VALIDATION_TOKENS.MAX_ATTEMPTS,
        windowMs: security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.VALIDATION_TOKENS.WINDOW_MS,
    },
    API_KEY_CREATION: {
        limit: security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.API_KEY_GENERATION.MAX_ATTEMPTS,
        windowMs: security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.API_KEY_GENERATION.WINDOW_MS,
    },
};
//# sourceMappingURL=rate-limit.config.js.map