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
            hasAuthHeader: !!request.headers?.authorization,
            hasBodyToken: !!request.body?.refreshToken
        });
        try {
            const authHeader = request.headers?.authorization;
            const bodyToken = request.body?.refreshToken;
            const hasAuthHeader = !!authHeader;
            const isValidHeaderFormat = authHeader?.startsWith('Bearer ');
            const headerTokenPresent = isValidHeaderFormat && authHeader?.length > 7;
            const bodyTokenPresent = !!bodyToken && typeof bodyToken === 'string' && bodyToken.length > 10;
            let tokenSource = 'none';
            let extractedToken = null;
            if (bodyTokenPresent) {
                tokenSource = 'body';
                extractedToken = bodyToken;
            }
            else if (headerTokenPresent) {
                tokenSource = 'header';
                extractedToken = authHeader.substring(7);
            }
            this.logger.info('Refresh token validation attempt (hybrid)', JSON.stringify({
                tokenSource,
                hasAuthHeader,
                isValidHeaderFormat,
                headerTokenPresent,
                bodyTokenPresent,
                extractedTokenLength: extractedToken?.length || 0,
                extractedTokenPreview: extractedToken?.substring(0, 20) + '...' || 'none',
                errorType: err?.name || 'none',
                errorMessage: err?.message || info?.message || 'none',
                userPresent: !!user,
                path: request.url,
            }));
            if (err || !user) {
                let errorMessage = 'Token de rafraîchissement invalide';
                let errorCode = 'INVALID_REFRESH_TOKEN';
                if (!bodyTokenPresent && !headerTokenPresent) {
                    errorMessage = 'Token de rafraîchissement manquant (doit être dans body.refreshToken OU Authorization header)';
                    errorCode = 'MISSING_REFRESH_TOKEN';
                }
                else if (!bodyTokenPresent && hasAuthHeader && !isValidHeaderFormat) {
                    errorMessage = 'Format d\'en-tête Authorization invalide (Bearer token requis)';
                    errorCode = 'INVALID_AUTH_FORMAT';
                }
                else if ((bodyTokenPresent && bodyToken.length < 10) || (headerTokenPresent && authHeader.length < 20)) {
                    errorMessage = 'Token de rafraîchissement trop court ou vide';
                    errorCode = 'EMPTY_REFRESH_TOKEN';
                }
                else if (err?.message?.includes('expired') || info?.message?.includes('expired')) {
                    errorMessage = 'Token de rafraîchissement expiré';
                    errorCode = 'EXPIRED_REFRESH_TOKEN';
                }
                else if (err?.message?.includes('invalid') || info?.message?.includes('invalid') || err?.message?.includes('malformed')) {
                    errorMessage = 'Token de rafraîchissement invalide ou corrompu';
                    errorCode = 'CORRUPTED_REFRESH_TOKEN';
                }
                else if (err?.message?.includes('signature')) {
                    errorMessage = 'Signature du token de rafraîchissement invalide';
                    errorCode = 'INVALID_TOKEN_SIGNATURE';
                }
                else if (err?.message?.includes('audience') || err?.message?.includes('issuer')) {
                    errorMessage = 'Token de rafraîchissement non autorisé pour cette application';
                    errorCode = 'UNAUTHORIZED_TOKEN_AUDIENCE';
                }
                this.logger.warn('JWT refresh authentication failed (hybrid)', JSON.stringify({
                    errorCode,
                    errorMessage,
                    originalError: err?.message || info?.message,
                    tokenSource,
                    diagnostics: {
                        path: request.url,
                        method: request.method,
                        hasAuthHeader,
                        isValidHeaderFormat,
                        headerTokenPresent,
                        bodyTokenPresent,
                        headerTokenLength: authHeader?.length || 0,
                        bodyTokenLength: bodyToken?.length || 0,
                        errorStack: err?.stack?.split('\n')[0] || 'none'
                    },
                    clientInfo: {
                        ipAddress: request.ip,
                        userAgent: request.headers?.['user-agent']?.substring(0, 100) || 'unknown',
                        origin: request.headers?.origin || 'unknown'
                    }
                }));
                this.logger.logBusinessEvent('REFRESH_AUTH_FAILED', {
                    errorCode,
                    error: err?.message || info?.message || errorCode,
                    tokenSource,
                    ipAddress: request.ip,
                    userAgent: request.headers?.['user-agent'],
                    path: request.url,
                    diagnostics: {
                        hasAuthHeader,
                        hasBodyToken: bodyTokenPresent,
                        errorType: err?.name || 'unknown'
                    }
                });
                this.logger.endOperation('jwtRefreshGuard', operationId, false, undefined, {
                    reason: errorCode,
                    error: errorMessage,
                    tokenSource
                });
                throw new common_1.UnauthorizedException(errorMessage);
            }
            this.logger.info('Refresh token validation successful (hybrid)', JSON.stringify({
                userId: user.userId,
                sessionId: user.sessionId,
                tokenId: user.tokenId,
                tokenSource,
                extractedTokenLength: extractedToken?.length
            }));
            this.logger.logBusinessEvent('REFRESH_AUTH_SUCCESS', {
                userId: user.userId,
                sessionId: user.sessionId,
                tokenId: user.tokenId,
                tokenSource,
                ipAddress: request.ip,
                userAgent: request.headers?.['user-agent']?.substring(0, 100)
            }, user.userId);
            this.logger.endOperation('jwtRefreshGuard', operationId, true);
            return user;
        }
        catch (error) {
            this.logger.error('Unexpected error in refresh guard (hybrid)', error.stack, 'JwtRefreshGuard.handleRequest', JSON.stringify({
                errorMessage: error.message,
                path: request.url,
                hasAuthHeader: !!request.headers?.authorization,
                hasBodyToken: !!request.body?.refreshToken,
                tokenDiagnostics: {
                    authHeaderLength: request.headers?.authorization?.length || 0,
                    bodyTokenLength: request.body?.refreshToken?.length || 0,
                    authHeaderFormat: request.headers?.authorization?.startsWith('Bearer ') || false
                }
            }));
            this.logger.endOperation('jwtRefreshGuard', operationId, false, undefined, {
                error: error.message,
                errorType: error.constructor.name
            });
            throw new common_1.UnauthorizedException('Erreur interne lors de la validation du token de rafraîchissement');
        }
    }
};
exports.JwtRefreshGuard = JwtRefreshGuard;
exports.JwtRefreshGuard = JwtRefreshGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_service_1.LoggerService])
], JwtRefreshGuard);
//# sourceMappingURL=jwt-refresh.guard.js.map