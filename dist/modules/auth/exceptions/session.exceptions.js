"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionNotFoundException = exports.TooManySessionsException = exports.InvalidRefreshTokenException = exports.SessionExpiredException = void 0;
const common_1 = require("@nestjs/common");
const error_constants_1 = require("../constants/error.constants");
class SessionExpiredException extends common_1.UnauthorizedException {
    constructor() {
        const errorData = error_constants_1.ERROR_CONSTANTS.AUTH_ERRORS.SESSION_EXPIRED;
        super({
            success: false,
            error: {
                code: errorData.code,
                message: errorData.message,
                details: errorData.details,
                requireLogin: true,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
exports.SessionExpiredException = SessionExpiredException;
class InvalidRefreshTokenException extends common_1.UnauthorizedException {
    constructor() {
        const errorData = error_constants_1.ERROR_CONSTANTS.AUTH_ERRORS.INVALID_REFRESH_TOKEN;
        super({
            success: false,
            error: {
                code: errorData.code,
                message: errorData.message,
                details: errorData.details,
                requireLogin: true,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
exports.InvalidRefreshTokenException = InvalidRefreshTokenException;
class TooManySessionsException extends common_1.BadRequestException {
    constructor(maxSessions) {
        super({
            success: false,
            error: {
                code: 'TOO_MANY_SESSIONS',
                message: 'Trop de sessions actives',
                details: `Maximum ${maxSessions} sessions autorisées`,
                maxSessions,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
exports.TooManySessionsException = TooManySessionsException;
class SessionNotFoundException extends common_1.NotFoundException {
    constructor(sessionId) {
        super({
            success: false,
            error: {
                code: 'SESSION_NOT_FOUND',
                message: 'Session introuvable',
                details: 'La session demandée n\'existe pas ou a été révoquée',
                sessionId,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
exports.SessionNotFoundException = SessionNotFoundException;
//# sourceMappingURL=session.exceptions.js.map