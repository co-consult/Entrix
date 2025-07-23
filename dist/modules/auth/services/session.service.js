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
exports.SessionService = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../../shared/logger/logger.service");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const token_service_1 = require("./token.service");
const device_util_1 = require("../utils/device.util");
const token_util_1 = require("../utils/token.util");
const session_constants_1 = require("../constants/session.constants");
const auth_constants_1 = require("../constants/auth.constants");
const session_exceptions_1 = require("../exceptions/session.exceptions");
let SessionService = class SessionService {
    prisma;
    redis;
    tokenService;
    logger;
    constructor(prisma, redis, tokenService, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.tokenService = tokenService;
        this.logger = loggerService.createChildLogger('SessionService');
    }
    async createSession(userId, deviceInfo, rememberMe = false) {
        const operationId = this.logger.startOperation('createSession', {
            userId,
            rememberMe,
            ipAddress: deviceInfo.ipAddress,
        });
        try {
            await this.enforceSessionLimits(userId);
            const sessionId = token_util_1.TokenUtil.generateSessionId();
            const sessionDuration = rememberMe
                ? session_constants_1.SESSION_CONSTANTS.DURATION.REMEMBER_ME_SESSION
                : session_constants_1.SESSION_CONSTANTS.DURATION.DEFAULT_SESSION;
            const expiresAt = new Date(Date.now() + sessionDuration * 1000);
            const deviceFingerprint = deviceInfo.deviceFingerprint ||
                device_util_1.DeviceUtil.generateDeviceFingerprint(deviceInfo);
            const session = await this.prisma.user_sessions.create({
                data: {
                    id: sessionId,
                    session_token: token_util_1.TokenUtil.generateSecureToken(128),
                    user_id: userId,
                    ip_address: deviceInfo.ipAddress,
                    user_agent: deviceInfo.userAgent || null,
                    device_fingerprint: deviceFingerprint,
                    geolocation: deviceInfo.geolocation || null,
                    is_active: true,
                    last_activity: new Date(),
                    expires_at: expiresAt,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
            await this.cacheSession(session);
            this.cleanupExpiredSessionsAsync(userId);
            this.logger.logBusinessEvent('SESSION_CREATED', {
                userId,
                sessionId: session.id,
                deviceFingerprint,
                ipAddress: deviceInfo.ipAddress,
                userAgent: deviceInfo.userAgent,
                rememberMe,
                expiresAt: expiresAt.toISOString(),
            }, userId);
            this.logger.endOperation(operationId, 'success');
            return session;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            if (error instanceof session_exceptions_1.TooManySessionsException) {
                throw error;
            }
            this.logger.error('Failed to create session', error.stack, {
                userId,
                ipAddress: deviceInfo.ipAddress,
            });
            throw new Error(`Erreur création session: ${error.message}`);
        }
    }
    async validateSession(sessionToken) {
        const operationId = this.logger.startOperation('validateSession');
        try {
            const cachedSession = await this.getSessionFromCache(sessionToken);
            if (cachedSession && this.isSessionValid(cachedSession)) {
                this.logger.endOperation(operationId, 'cache_hit');
                return cachedSession;
            }
            const session = await this.prisma.user_sessions.findFirst({
                where: {
                    session_token: sessionToken,
                    is_active: true,
                    expires_at: {
                        gt: new Date(),
                    },
                },
            });
            if (!session) {
                this.logger.endOperation(operationId, 'session_not_found');
                return null;
            }
            if (!this.isSessionValid(session)) {
                await this.expireSession(session.id);
                this.logger.endOperation(operationId, 'session_expired');
                return null;
            }
            await this.cacheSession(session);
            this.logger.endOperation(operationId, 'db_hit');
            return session;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.error('Session validation failed', error.stack);
            return null;
        }
    }
    async refreshSession(refreshToken) {
        const operationId = this.logger.startOperation('refreshSession');
        try {
            const refreshPayload = await this.tokenService.verifyRefreshToken(refreshToken);
            const session = await this.validateSession(refreshPayload.sessionId);
            if (!session) {
                throw new session_exceptions_1.InvalidRefreshTokenException();
            }
            const user = await this.prisma.users.findUnique({
                where: { id: refreshPayload.sub },
                select: {
                    id: true,
                    email: true,
                    is_active: true,
                },
            });
            if (!user || !user.is_active) {
                throw new session_exceptions_1.InvalidRefreshTokenException();
            }
            await this.markRefreshTokenAsUsed(refreshPayload.tokenId, refreshToken);
            const newTokens = await this.tokenService.generateTokenPair(user.id, user.email, session.id, this.isRememberMeSession(session), session.device_fingerprint);
            const sessionExtended = await this.extendSession(session.id);
            this.logger.logBusinessEvent('SESSION_REFRESHED', {
                userId: user.id,
                sessionId: session.id,
                oldTokenId: refreshPayload.tokenId,
                sessionExtended,
            }, user.id);
            this.logger.endOperation(operationId, 'success');
            return newTokens;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            if (error instanceof session_exceptions_1.InvalidRefreshTokenException) {
                throw error;
            }
            this.logger.error('Session refresh failed', error.stack);
            throw new session_exceptions_1.InvalidRefreshTokenException();
        }
    }
    async revokeSession(sessionId) {
        const operationId = this.logger.startOperation('revokeSession', { sessionId });
        try {
            const updatedSession = await this.prisma.user_sessions.updateMany({
                where: {
                    id: sessionId,
                    is_active: true,
                },
                data: {
                    is_active: false,
                    updated_at: new Date(),
                },
            });
            await this.removeSessionFromCache(sessionId);
            await this.blacklistSessionTokens(sessionId);
            const revoked = updatedSession.count > 0;
            if (revoked) {
                this.logger.logBusinessEvent('SESSION_REVOKED', {
                    sessionId,
                    reason: 'manual_logout',
                });
            }
            this.logger.endOperation(operationId, revoked ? 'success' : 'not_found');
            return revoked;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.error('Failed to revoke session', error.stack, { sessionId });
            return false;
        }
    }
    async revokeAllUserSessions(userId) {
        const operationId = this.logger.startOperation('revokeAllUserSessions', { userId });
        try {
            const result = await this.prisma.user_sessions.updateMany({
                where: {
                    user_id: userId,
                    is_active: true,
                },
                data: {
                    is_active: false,
                    updated_at: new Date(),
                },
            });
            await this.clearUserSessionsFromCache(userId);
            this.logger.logBusinessEvent('ALL_SESSIONS_REVOKED', {
                userId,
                sessionsRevoked: result.count,
                reason: 'logout_all_devices',
            }, userId);
            this.logger.endOperation(operationId, 'success');
            return result.count;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.error('Failed to revoke all user sessions', error.stack, { userId });
            return 0;
        }
    }
    async getUserActiveSessions(userId) {
        const operationId = this.logger.startOperation('getUserActiveSessions', { userId });
        try {
            const sessions = await this.prisma.user_sessions.findMany({
                where: {
                    user_id: userId,
                    is_active: true,
                    expires_at: {
                        gt: new Date(),
                    },
                },
                orderBy: {
                    last_activity: 'desc',
                },
            });
            this.logger.endOperation(operationId, 'success');
            return sessions;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.error('Failed to get user active sessions', error.stack, { userId });
            return [];
        }
    }
    async cleanupExpiredSessions() {
        const operationId = this.logger.startOperation('cleanupExpiredSessions');
        try {
            const result = await this.prisma.user_sessions.deleteMany({
                where: {
                    OR: [
                        { expires_at: { lt: new Date() } },
                        {
                            is_active: false,
                            updated_at: {
                                lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                            }
                        }
                    ],
                },
            });
            await this.cleanupExpiredSessionsFromCache();
            this.logger.logBusinessEvent('SESSIONS_CLEANUP', {
                sessionsDeleted: result.count,
                timestamp: new Date().toISOString(),
            });
            this.logger.endOperation(operationId, 'success');
            return result.count;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.error('Failed to cleanup expired sessions', error.stack);
            return 0;
        }
    }
    async enforceSessionLimits(userId) {
        const activeSessions = await this.getUserActiveSessions(userId);
        if (activeSessions.length >= session_constants_1.SESSION_CONSTANTS.LIMITS.MAX_CONCURRENT_SESSIONS) {
            const oldestSession = activeSessions[activeSessions.length - 1];
            await this.revokeSession(oldestSession.id);
            this.logger.warn('Session limit reached, revoked oldest session', JSON.stringify({
                userId,
                revokedSessionId: oldestSession.id,
                activeSessionsCount: activeSessions.length,
            }));
        }
    }
    isSessionValid(session) {
        const now = new Date();
        return session.is_active &&
            session.expires_at > now &&
            (now.getTime() - session.last_activity.getTime()) < session_constants_1.SESSION_CONSTANTS.DURATION.IDLE_TIMEOUT * 1000;
    }
    async cacheSession(session) {
        try {
            const cacheKey = `${session_constants_1.SESSION_CONSTANTS.REDIS_KEYS.SESSION_PREFIX}${session.session_token}`;
            const ttl = Math.floor((session.expires_at.getTime() - Date.now()) / 1000);
            if (ttl > 0) {
                await this.redis.setCache(cacheKey, session, ttl);
            }
        }
        catch (error) {
            this.logger.warn('Failed to cache session', JSON.stringify({
                sessionId: session.id,
                error: error.message
            }));
        }
    }
    async getSessionFromCache(sessionToken) {
        try {
            const cacheKey = `${session_constants_1.SESSION_CONSTANTS.REDIS_KEYS.SESSION_PREFIX}${sessionToken}`;
            const cached = await this.redis.getCache(cacheKey);
            return cached;
        }
        catch (error) {
            this.logger.warn('Failed to get session from cache', JSON.stringify({ error: error.message }));
            return null;
        }
    }
    async expireSession(sessionId) {
        try {
            await this.prisma.user_sessions.update({
                where: { id: sessionId },
                data: {
                    is_active: false,
                    updated_at: new Date(),
                },
            });
        }
        catch (error) {
            this.logger.error('Failed to expire session', error.stack, { sessionId });
        }
    }
    isRememberMeSession(session) {
        const sessionDuration = session.expires_at.getTime() - session.created_at.getTime();
        return sessionDuration > session_constants_1.SESSION_CONSTANTS.DURATION.DEFAULT_SESSION * 1000;
    }
    async extendSession(sessionId) {
        try {
            const extensionDuration = session_constants_1.SESSION_CONSTANTS.DURATION.DEFAULT_SESSION;
            const newExpiresAt = new Date(Date.now() + extensionDuration * 1000);
            await this.prisma.user_sessions.update({
                where: { id: sessionId },
                data: {
                    expires_at: newExpiresAt,
                    last_activity: new Date(),
                    updated_at: new Date(),
                },
            });
            return true;
        }
        catch (error) {
            this.logger.error('Failed to extend session', error.stack, { sessionId });
            return false;
        }
    }
    async markRefreshTokenAsUsed(tokenId, token) {
        try {
            const usedKey = `refresh_used:${tokenId}`;
            await this.redis.setCache(usedKey, token, auth_constants_1.AUTH_CONSTANTS.JWT.REFRESH_TOKEN_EXPIRY);
        }
        catch (error) {
            this.logger.error('Failed to mark refresh token as used', error.stack);
        }
    }
    async removeSessionFromCache(sessionId) {
        try {
            const pattern = `${session_constants_1.SESSION_CONSTANTS.REDIS_KEYS.SESSION_PREFIX}*`;
        }
        catch (error) {
            this.logger.warn('Failed to remove session from cache', JSON.stringify({ error: error.message }));
        }
    }
    async blacklistSessionTokens(sessionId) {
    }
    async clearUserSessionsFromCache(userId) {
        try {
            const pattern = `${session_constants_1.SESSION_CONSTANTS.REDIS_KEYS.USER_SESSIONS_PREFIX}${userId}:*`;
        }
        catch (error) {
            this.logger.warn('Failed to clear user sessions from cache', JSON.stringify({ error: error.message }));
        }
    }
    async cleanupExpiredSessionsFromCache() {
    }
    cleanupExpiredSessionsAsync(userId) {
        setImmediate(() => {
            this.cleanupExpiredSessions().catch(error => {
                this.logger.error('Async cleanup failed', error.stack, { userId });
            });
        });
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        token_service_1.TokenService,
        logger_service_1.LoggerService])
], SessionService);
//# sourceMappingURL=session.service.js.map