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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const logger_service_1 = require("../../../shared/logger/logger.service");
const session_service_1 = require("../services/session.service");
const session_1 = require("../dto/session");
const guards_1 = require("../guards");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
const audit_log_decorator_1 = require("../decorators/audit-log.decorator");
let SessionController = class SessionController {
    sessionService;
    logger;
    constructor(sessionService, loggerService) {
        this.sessionService = sessionService;
        this.logger = loggerService.createChildLogger('SessionController');
    }
    async getCurrentSession(user, sessionId) {
        const operationId = this.logger.startOperation('GET /auth/session', {
            userId: user.id,
            sessionId,
        });
        try {
            const sessions = await this.sessionService.getUserActiveSessions(user.id);
            const currentSession = sessions.find(s => s.id === sessionId);
            this.logger.endOperation(operationId, 'success');
            return {
                success: true,
                data: {
                    session: currentSession ? {
                        sessionId: currentSession.id,
                        userId: currentSession.user_id,
                        deviceInfo: {
                            userAgent: currentSession.user_agent,
                            ipAddress: currentSession.ip_address,
                            deviceFingerprint: currentSession.device_fingerprint,
                            geolocation: currentSession.geolocation,
                        },
                        createdAt: currentSession.created_at.toISOString(),
                        lastActivity: currentSession.last_activity.toISOString(),
                        expiresAt: currentSession.expires_at.toISOString(),
                        isActive: currentSession.is_active,
                    } : null,
                    user,
                    permissions: user.permissions || [],
                    preferences: user.metadata?.preferences || {},
                },
            };
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
    async refreshTokens(refreshDto) {
        const operationId = this.logger.startOperation('POST /auth/refresh');
        try {
            const tokens = await this.sessionService.refreshSession(refreshDto.refreshToken);
            this.logger.endOperation(operationId, 'success');
            return {
                success: true,
                data: {
                    tokens,
                    sessionExtended: true,
                },
            };
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
    async getUserSessions(userId, currentSessionId) {
        const operationId = this.logger.startOperation('GET /auth/sessions', {
            userId,
        });
        try {
            const sessions = await this.sessionService.getUserActiveSessions(userId);
            const sessionsList = sessions.map(session => ({
                sessionId: session.id,
                deviceInfo: {
                    userAgent: session.user_agent || 'Unknown',
                    browser: this.parseBrowser(session.user_agent),
                    os: this.parseOS(session.user_agent),
                    isMobile: this.isMobile(session.user_agent),
                },
                location: this.formatLocation(session.geolocation),
                createdAt: session.created_at.toISOString(),
                lastActivity: session.last_activity.toISOString(),
                isCurrent: session.id === currentSessionId,
            }));
            this.logger.endOperation(operationId, 'success');
            return {
                success: true,
                data: {
                    sessions: sessionsList,
                    total: sessionsList.length,
                },
            };
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
    async revokeSession(sessionId, userId) {
        const operationId = this.logger.startOperation('DELETE /auth/sessions/:sessionId', {
            sessionId,
            userId,
        });
        try {
            const userSessions = await this.sessionService.getUserActiveSessions(userId);
            const sessionExists = userSessions.some(s => s.id === sessionId);
            if (!sessionExists) {
                this.logger.endOperation(operationId, 'not_found');
                return {
                    success: false,
                    data: {
                        sessionRevoked: false,
                        sessionId,
                    },
                };
            }
            const revoked = await this.sessionService.revokeSession(sessionId);
            this.logger.endOperation(operationId, 'success');
            return {
                success: true,
                data: {
                    sessionRevoked: revoked,
                    sessionId,
                },
            };
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
    parseBrowser(userAgent) {
        if (!userAgent)
            return 'Unknown';
        if (userAgent.includes('Chrome'))
            return 'Chrome';
        if (userAgent.includes('Firefox'))
            return 'Firefox';
        if (userAgent.includes('Safari'))
            return 'Safari';
        if (userAgent.includes('Edge'))
            return 'Edge';
        return 'Unknown';
    }
    parseOS(userAgent) {
        if (!userAgent)
            return 'Unknown';
        if (userAgent.includes('Windows'))
            return 'Windows';
        if (userAgent.includes('Mac OS'))
            return 'macOS';
        if (userAgent.includes('Linux'))
            return 'Linux';
        if (userAgent.includes('Android'))
            return 'Android';
        if (userAgent.includes('iOS'))
            return 'iOS';
        return 'Unknown';
    }
    isMobile(userAgent) {
        if (!userAgent)
            return false;
        return /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent);
    }
    formatLocation(geolocation) {
        if (!geolocation)
            return 'Localisation inconnue';
        const parts = [];
        if (geolocation.city)
            parts.push(geolocation.city);
        if (geolocation.country)
            parts.push(geolocation.country);
        return parts.length > 0 ? parts.join(', ') : 'Localisation inconnue';
    }
};
exports.SessionController = SessionController;
__decorate([
    (0, common_1.Get)('session'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Informations session courante',
        description: 'Récupère détails de la session active'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Informations session récupérées'
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Session invalide'
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, current_user_decorator_1.SessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "getCurrentSession", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.UseGuards)(guards_1.JwtRefreshGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)(),
    (0, audit_log_decorator_1.RateLimit)({ limit: 20, windowMs: 60000 }),
    (0, audit_log_decorator_1.AuditLog)({ action: 'token_refresh', level: 'info' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Renouvellement tokens',
        description: 'Génère nouveaux access/refresh tokens'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Tokens renouvelés',
        type: session_1.RefreshTokenResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Refresh token invalide'
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof session_1.RefreshTokenDto !== "undefined" && session_1.RefreshTokenDto) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "refreshTokens", null);
__decorate([
    (0, common_1.Get)('sessions'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Sessions actives utilisateur',
        description: 'Liste toutes les sessions actives'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Liste sessions récupérée',
        type: session_1.SessionsListResponseDto
    }),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __param(1, (0, current_user_decorator_1.SessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "getUserSessions", null);
__decorate([
    (0, common_1.Delete)('sessions/:sessionId'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)(),
    (0, audit_log_decorator_1.AuditLog)({ action: 'session_revoke', level: 'warn' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Révoquer session',
        description: 'Révoque une session spécifique'
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'ID de la session à révoquer' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Session révoquée',
        type: session_1.RevokeSessionResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Session introuvable'
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "revokeSession", null);
exports.SessionController = SessionController = __decorate([
    (0, swagger_1.ApiTags)('Sessions'),
    (0, common_1.Controller)('auth'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true
    })),
    __metadata("design:paramtypes", [session_service_1.SessionService,
        logger_service_1.LoggerService])
], SessionController);
//# sourceMappingURL=session.controller.js.map