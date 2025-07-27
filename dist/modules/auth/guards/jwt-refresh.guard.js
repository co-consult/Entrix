"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtRefreshGuard = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const logger_service_1 = require("../../../shared/logger/logger.service");
let JwtRefreshGuard = class JwtRefreshGuard extends (0, passport_1.AuthGuard)('jwt-refresh') {
    logger;
    constructor(loggerService) {
        super();
        this.logger = loggerService.createChildLogger('JwtRefreshGuard');
    }
    handleRequest(err, user, info, context) {
        const request = context.switchToHttp().getRequest();
        const operationId = this.logger.startOperation('jwtRefreshGuard', {
            path: request.url,
            method: request.method,
        });
        try {
            const authHeader = request.headers?.authorization;
            const hasAuthHeader = !!authHeader;
            const isValidFormat = authHeader?.startsWith('Bearer ');
            const tokenPresent = isValidFormat && authHeader?.length > 7;
            this.logger.info('Refresh token validation attempt', JSON.stringify({
                hasAuthHeader,
                isValidFormat,
                tokenPresent,
                authHeaderLength: authHeader?.length || 0,
                authHeaderPreview: authHeader?.substring(0, 20) + '...' || 'none',
                errorType: err?.name || 'none',
                errorMessage: err?.message || info?.message || 'none',
                userPresent: !!user,
                path: request.url,
            }));
            if (err || !user) {
                let errorMessage = 'Token de rafraîchissement invalide';
                let errorCode = 'INVALID_REFRESH_TOKEN';
                if (!hasAuthHeader) {
                    errorMessage = 'En-tête Authorization manquant pour le refresh token';
                    errorCode = 'MISSING_AUTH_HEADER';
                }
                else if (!isValidFormat) {
                    errorMessage = 'Format d\'en-tête Authorization invalide (Bearer token requis)';
                    errorCode = 'INVALID_AUTH_FORMAT';
                }
                else if (!tokenPresent) {
                    errorMessage = 'Token de rafraîchissement vide';
                    errorCode = 'EMPTY_REFRESH_TOKEN';
                }
                else if (err?.message?.includes('expired') || info?.message?.includes('expired')) {
                    errorMessage = 'Token de rafraîchissement expiré';
                    errorCode = 'EXPIRED_REFRESH_TOKEN';
                }
                else if (err?.message?.includes('invalid') || info?.message?.includes('invalid')) {
                    errorMessage = 'Token de rafraîchissement invalide ou corrompu';
                    errorCode = 'CORRUPTED_REFRESH_TOKEN';
                }
                this.logger.warn('JWT refresh authentication failed', JSON.stringify({
                    errorCode,
                    errorMessage,
                    originalError: err?.message || info?.message,
                    path: request.url,
                    method: request.method,
                    hasAuthHeader,
                    isValidFormat,
                    tokenPresent,
                    ipAddress: request.ip,
                    userAgent: request.headers?.['user-agent'],
                }));
                this.logger.logBusinessEvent('REFRESH_AUTH_FAILED', {
                    errorCode,
                    error: err?.message || info?.message || errorCode,
                    ipAddress: request.ip,
                    userAgent: request.headers?.['user-agent'],
                    path: request.url,
                    hasAuthHeader,
                    isValidFormat,
                });
                this.logger.endOperation('jwtRefreshGuard', operationId, false, undefined, {
                    reason: errorCode,
                    error: errorMessage
                });
                throw new common_1.UnauthorizedException(errorMessage);
            }
            this.logger.info('Refresh token validation successful', JSON.stringify({
                userId: user.userId,
                sessionId: user.sessionId,
                tokenId: user.tokenId,
            }));
            this.logger.logBusinessEvent('REFRESH_AUTH_SUCCESS', {
                userId: user.userId,
                sessionId: user.sessionId,
                tokenId: user.tokenId,
                ipAddress: request.ip,
            }, user.userId);
            this.logger.endOperation('jwtRefreshGuard', operationId, true);
            return user;
        }
        catch (error) {
            this.logger.error('Unexpected error in refresh guard', error.stack, 'JwtRefreshGuard.handleRequest', JSON.stringify({
                errorMessage: error.message,
                path: request.url,
                hasAuthHeader: !!request.headers?.authorization,
            }));
            this.logger.endOperation('jwtRefreshGuard', operationId, false, undefined, {
                error: error.message
            });
            throw error;
        }
    }
};
exports.JwtRefreshGuard = JwtRefreshGuard;
exports.JwtRefreshGuard = JwtRefreshGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_service_1.LoggerService])
], JwtRefreshGuard);
//# sourceMappingURL=jwt-refresh.guard.js.map