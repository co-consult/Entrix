"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TooManyRequestsException = exports.InvalidDeviceTokenException = exports.InvalidCaptchaException = exports.CaptchaRequiredException = exports.InvalidResetTokenException = exports.RateLimitedException = exports.WeakPasswordException = exports.EmailAlreadyExistsException = exports.DeviceNotTrustedException = exports.InvalidMfaCodeException = exports.MfaRequiredException = exports.EmailNotVerifiedException = exports.AccountLockedException = exports.InvalidCredentialsException = exports.AuthException = void 0;
const common_1 = require("@nestjs/common");
const too_many_requests_exception_1 = require("./too-many-requests.exception");
Object.defineProperty(exports, "TooManyRequestsException", { enumerable: true, get: function () { return too_many_requests_exception_1.TooManyRequestsException; } });
const error_constants_1 = require("../constants/error.constants");
class AuthException extends common_1.HttpException {
    code;
    timestamp;
    details;
    constructor(code, message, httpStatus, details) {
        super({
            success: false,
            error: {
                code,
                message,
                details,
                timestamp: new Date().toISOString(),
                requestId: AuthException.generateRequestId(),
            },
        }, httpStatus);
        this.code = code;
        this.timestamp = new Date().toISOString();
        this.details = details;
    }
    static generateRequestId() {
        return `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.AuthException = AuthException;
class InvalidCredentialsException extends common_1.UnauthorizedException {
    constructor(attemptsRemaining) {
        const errorData = error_constants_1.ERROR_CONSTANTS.AUTH_ERRORS.INVALID_CREDENTIALS;
        super({
            success: false,
            error: {
                code: errorData.code,
                message: errorData.message,
                details: errorData.details,
                attemptsRemaining,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
exports.InvalidCredentialsException = InvalidCredentialsException;
class AccountLockedException extends common_1.HttpException {
    constructor(unlockAt) {
        const errorData = error_constants_1.ERROR_CONSTANTS.AUTH_ERRORS.ACCOUNT_LOCKED;
        super({
            success: false,
            error: {
                code: errorData.code,
                message: errorData.message,
                details: errorData.details,
                unlockAt: unlockAt?.toISOString(),
                contactSupport: true,
                timestamp: new Date().toISOString(),
            },
        }, errorData.httpStatus);
    }
}
exports.AccountLockedException = AccountLockedException;
class EmailNotVerifiedException extends common_1.ForbiddenException {
    constructor() {
        const errorData = error_constants_1.ERROR_CONSTANTS.AUTH_ERRORS.EMAIL_NOT_VERIFIED;
        super({
            success: false,
            error: {
                code: errorData.code,
                message: errorData.message,
                details: errorData.details,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
exports.EmailNotVerifiedException = EmailNotVerifiedException;
class MfaRequiredException extends common_1.HttpException {
    constructor(challengeToken, methods, expiresIn) {
        const errorData = error_constants_1.ERROR_CONSTANTS.AUTH_ERRORS.MFA_REQUIRED;
        super({
            success: false,
            error: {
                code: errorData.code,
                message: errorData.message,
                details: errorData.details,
                mfaChallenge: {
                    challengeToken,
                    methods,
                    expiresIn,
                },
                timestamp: new Date().toISOString(),
            },
        }, errorData.httpStatus);
    }
}
exports.MfaRequiredException = MfaRequiredException;
class InvalidMfaCodeException extends common_1.UnauthorizedException {
    constructor(attemptsRemaining) {
        const errorData = error_constants_1.ERROR_CONSTANTS.AUTH_ERRORS.INVALID_MFA_CODE;
        super({
            success: false,
            error: {
                code: errorData.code,
                message: errorData.message,
                details: errorData.details,
                attemptsRemaining,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
exports.InvalidMfaCodeException = InvalidMfaCodeException;
class DeviceNotTrustedException extends common_1.HttpException {
    constructor(verificationMethod) {
        const errorData = error_constants_1.ERROR_CONSTANTS.AUTH_ERRORS.DEVICE_NOT_TRUSTED;
        super({
            success: false,
            error: {
                code: errorData.code,
                message: errorData.message,
                details: errorData.details,
                verificationMethod,
                timestamp: new Date().toISOString(),
            },
        }, errorData.httpStatus);
    }
}
exports.DeviceNotTrustedException = DeviceNotTrustedException;
class EmailAlreadyExistsException extends common_1.ConflictException {
    constructor() {
        const errorData = error_constants_1.ERROR_CONSTANTS.AUTH_ERRORS.EMAIL_ALREADY_EXISTS;
        super({
            success: false,
            error: {
                code: errorData.code,
                message: errorData.message,
                details: errorData.details,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
exports.EmailAlreadyExistsException = EmailAlreadyExistsException;
class WeakPasswordException extends common_1.BadRequestException {
    constructor(suggestions) {
        const errorData = error_constants_1.ERROR_CONSTANTS.AUTH_ERRORS.WEAK_PASSWORD;
        super({
            success: false,
            error: {
                code: errorData.code,
                message: errorData.message,
                details: errorData.details,
                suggestions,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
exports.WeakPasswordException = WeakPasswordException;
class RateLimitedException extends too_many_requests_exception_1.TooManyRequestsException {
    constructor(retryAfter) {
        const errorData = error_constants_1.ERROR_CONSTANTS.AUTH_ERRORS.RATE_LIMITED;
        super(errorData.message, retryAfter);
    }
}
exports.RateLimitedException = RateLimitedException;
class InvalidResetTokenException extends common_1.BadRequestException {
    constructor() {
        const errorData = error_constants_1.ERROR_CONSTANTS.AUTH_ERRORS.INVALID_RESET_TOKEN;
        super({
            success: false,
            error: {
                code: errorData.code,
                message: errorData.message,
                details: errorData.details,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
exports.InvalidResetTokenException = InvalidResetTokenException;
class CaptchaRequiredException extends common_1.BadRequestException {
    constructor() {
        super({
            success: false,
            error: {
                code: 'CAPTCHA_REQUIRED',
                message: 'Vérification CAPTCHA requise',
                details: 'Veuillez compléter la vérification CAPTCHA',
                timestamp: new Date().toISOString(),
            },
        });
    }
}
exports.CaptchaRequiredException = CaptchaRequiredException;
class InvalidCaptchaException extends common_1.BadRequestException {
    constructor() {
        super({
            success: false,
            error: {
                code: 'INVALID_CAPTCHA',
                message: 'CAPTCHA invalide',
                details: 'La vérification CAPTCHA a échoué',
                timestamp: new Date().toISOString(),
            },
        });
    }
}
exports.InvalidCaptchaException = InvalidCaptchaException;
class InvalidDeviceTokenException extends common_1.UnauthorizedException {
    constructor() {
        super({
            success: false,
            error: {
                code: 'INVALID_DEVICE_TOKEN',
                message: 'Token d\'appareil invalide',
                details: 'Le token de vérification d\'appareil est invalide ou expiré',
                timestamp: new Date().toISOString(),
            },
        });
    }
}
exports.InvalidDeviceTokenException = InvalidDeviceTokenException;
//# sourceMappingURL=auth.exceptions.js.map