"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MfaRateLimitedException = exports.PasswordResetRateLimitedException = exports.LoginRateLimitedException = exports.RegistrationRateLimitedException = void 0;
const common_1 = require("@nestjs/common");
class RegistrationRateLimitedException extends common_1.HttpException {
    constructor(retryAfter = 3600) {
        super({
            statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
            timestamp: new Date().toISOString(),
            errorCode: 'REGISTRATION_RATE_LIMITED',
            message: 'Trop de tentatives d\'inscription depuis cette adresse IP',
            details: {
                retryAfter,
                retryAfterReadable: `${Math.ceil(retryAfter / 60)} minutes`,
                reason: 'Limite de sécurité dépassée',
                suggestion: 'Veuillez attendre avant de créer un nouveau compte'
            },
            meta: {
                rateLimit: {
                    type: 'registration',
                    window: '1 heure',
                    maxAttempts: 3,
                    timeToReset: retryAfter
                }
            }
        }, common_1.HttpStatus.TOO_MANY_REQUESTS);
    }
}
exports.RegistrationRateLimitedException = RegistrationRateLimitedException;
class LoginRateLimitedException extends common_1.HttpException {
    constructor(retryAfter = 900) {
        super({
            statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
            timestamp: new Date().toISOString(),
            errorCode: 'LOGIN_RATE_LIMITED',
            message: 'Trop de tentatives de connexion depuis cette adresse IP',
            details: {
                retryAfter,
                retryAfterReadable: `${Math.ceil(retryAfter / 60)} minutes`,
                reason: 'Protection contre les attaques par force brute',
                suggestion: 'Veuillez attendre avant de réessayer'
            },
            meta: {
                rateLimit: {
                    type: 'login',
                    window: '15 minutes',
                    maxAttempts: 5,
                    timeToReset: retryAfter
                }
            }
        }, common_1.HttpStatus.TOO_MANY_REQUESTS);
    }
}
exports.LoginRateLimitedException = LoginRateLimitedException;
class PasswordResetRateLimitedException extends common_1.HttpException {
    constructor(retryAfter = 3600) {
        super({
            statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
            timestamp: new Date().toISOString(),
            errorCode: 'PASSWORD_RESET_RATE_LIMITED',
            message: 'Trop de demandes de réinitialisation de mot de passe',
            details: {
                retryAfter,
                retryAfterReadable: `${Math.ceil(retryAfter / 60)} minutes`,
                reason: 'Limite de sécurité dépassée',
                suggestion: 'Veuillez attendre avant de demander une nouvelle réinitialisation'
            },
            meta: {
                rateLimit: {
                    type: 'password_reset',
                    window: '1 heure',
                    maxAttempts: 3,
                    timeToReset: retryAfter
                }
            }
        }, common_1.HttpStatus.TOO_MANY_REQUESTS);
    }
}
exports.PasswordResetRateLimitedException = PasswordResetRateLimitedException;
class MfaRateLimitedException extends common_1.HttpException {
    constructor(retryAfter = 300) {
        super({
            statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
            timestamp: new Date().toISOString(),
            errorCode: 'MFA_RATE_LIMITED',
            message: 'Trop de tentatives de vérification MFA',
            details: {
                retryAfter,
                retryAfterReadable: `${Math.ceil(retryAfter / 60)} minutes`,
                reason: 'Protection contre les attaques par force brute',
                suggestion: 'Veuillez attendre avant de réessayer votre code MFA'
            },
            meta: {
                rateLimit: {
                    type: 'mfa_verification',
                    window: '5 minutes',
                    maxAttempts: 5,
                    timeToReset: retryAfter
                }
            }
        }, common_1.HttpStatus.TOO_MANY_REQUESTS);
    }
}
exports.MfaRateLimitedException = MfaRateLimitedException;
//# sourceMappingURL=rate-limit.exceptions.js.map