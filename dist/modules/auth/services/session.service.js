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
const session_constants_1 = require("../constants/session.constants");
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
            const sessionToken = this.generateSessionToken();
            const sessionDuration = rememberMe
                ? session_constants_1.SESSION_CONSTANTS.DURATION.REMEMBER_ME_SESSION
                : session_constants_1.SESSION_CONSTANTS.DURATION.DEFAULT_SESSION;
            const expiresAt = new Date(Date.now() + sessionDuration * 1000);
            const deviceFingerprint = deviceInfo.deviceFingerprint ||
                this.generateDeviceFingerprint(deviceInfo);
            const session = await this.prisma.user_sessions.create({
                data: {
                    session_token: sessionToken,
                    user_id: userId,
                    ip_address: deviceInfo.ipAddress,
                    user_agent: deviceInfo.userAgent || null,
                    device_fingerprint: deviceFingerprint,
                    geolocation: deviceInfo.geolocation || null,
                    expires_at: expiresAt,
                    is_active: true,
                    last_activity: new Date(),
                },
            });
            await this.cacheSession(session);
            this.logger.logBusinessEvent('SESSION_CREATED', {
                sessionId: session.id,
                userId,
                deviceFingerprint,
                expiresAt: expiresAt.toISOString(),
                rememberMe,
            }, userId);
            this.logger.endOperation('createSession', operationId, true);
            return session;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'SessionService.createSession', userId, JSON.stringify({
                userId,
                deviceInfo: {
                    ipAddress: deviceInfo.ipAddress,
                    userAgent: deviceInfo.userAgent,
                },
                rememberMe,
            }));
            this.logger.endOperation('createSession', operationId, false);
            throw error;
        }
    }
    async validateSession(sessionToken) {
        const operationId = this.logger.startOperation('validateSession');
        try {
            const cachedSession = await this.getCachedSession(sessionToken);
            if (cachedSession) {
                this.logger.endOperation('validateSession', operationId, true);
                return cachedSession;
            }
            const session = await this.prisma.user_sessions.findUnique({
                where: { session_token: sessionToken },
            });
            if (!session) {
                this.logger.endOperation('validateSession', operationId, true);
                return null;
            }
            if (session.expires_at < new Date() || !session.is_active) {
                this.logger.warn('Session expired or inactive', JSON.stringify({
                    sessionId: session.id,
                    expiresAt: session.expires_at.toISOString(),
                    isActive: session.is_active,
                }));
                await this.invalidateSession(session.id);
                this.logger.endOperation('validateSession', operationId, true);
                return null;
            }
            const updatedSession = await this.updateLastActivity(session.id);
            await this.cacheSession(updatedSession);
            this.logger.endOperation('validateSession', operationId, true);
            return updatedSession;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'SessionService.validateSession', undefined, JSON.stringify({ sessionToken: sessionToken.substring(0, 10) + '...' }));
            this.logger.endOperation('validateSession', operationId, false);
            return null;
        }
    }
    async refreshSession(refreshToken) {
        const operationId = this.logger.startOperation('refreshSession');
        try {
            const payload = await this.tokenService.verifyRefreshToken(refreshToken);
            const session = await this.prisma.user_sessions.findUnique({
                where: { id: payload.sessionId },
            });
            if (!session || !session.is_active || session.expires_at < new Date()) {
                this.logger.warn('Invalid session for refresh', JSON.stringify({
                    sessionId: payload.sessionId,
                }));
                throw new session_exceptions_1.InvalidRefreshTokenException();
            }
            const user = await this.prisma.users.findUnique({
                where: { id: session.user_id },
                select: { email: true },
            });
            if (!user) {
                throw new session_exceptions_1.InvalidRefreshTokenException();
            }
            const tokenPair = await this.tokenService.generateTokenPair(session.user_id, user.email, session.id);
            await this.tokenService.blacklistToken(refreshToken);
            await this.extendSessionIfNeeded(session);
            this.logger.logBusinessEvent('SESSION_REFRESHED', {
                sessionId: session.id,
                userId: session.user_id,
            }, session.user_id);
            this.logger.endOperation('refreshSession', operationId, true);
            return tokenPair;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'SessionService.refreshSession', undefined, JSON.stringify({ refreshToken: refreshToken.substring(0, 10) + '...' }));
            this.logger.endOperation('refreshSession', operationId, false);
            throw error;
        }
    }
    async revokeSession(sessionId) {
        const operationId = this.logger.startOperation('revokeSession', { sessionId });
        try {
            const updatedSession = await this.prisma.user_sessions.update({
                where: { id: sessionId },
                data: {
                    is_active: false,
                    updated_at: new Date(),
                },
            });
            await this.removeCachedSession(updatedSession.session_token);
            await this.blacklistSessionTokens(sessionId);
            this.logger.logBusinessEvent('SESSION_REVOKED', {
                sessionId,
                userId: updatedSession.user_id,
            }, updatedSession.user_id);
            this.logger.endOperation('revokeSession', operationId, true);
            return true;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'SessionService.revokeSession', undefined, JSON.stringify({ sessionId }));
            this.logger.endOperation('revokeSession', operationId, false);
            return false;
        }
    }
    async revokeAllUserSessions(userId) {
        const operationId = this.logger.startOperation('revokeAllUserSessions', { userId });
        try {
            const { count } = await this.prisma.user_sessions.updateMany({
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
                sessionsRevoked: count,
            }, userId);
            this.logger.endOperation('revokeAllUserSessions', operationId, true);
            return count;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'SessionService.revokeAllUserSessions', userId, JSON.stringify({ userId }));
            this.logger.endOperation('revokeAllUserSessions', operationId, false);
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
            this.logger.endOperation('getUserActiveSessions', operationId, true);
            return sessions;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'SessionService.getUserActiveSessions', userId, JSON.stringify({ userId }));
            this.logger.endOperation('getUserActiveSessions', operationId, false);
            throw error;
        }
    }
    async cleanupExpiredSessions() {
        const operationId = this.logger.startOperation('cleanupExpiredSessions');
        try {
            const { count } = await this.prisma.user_sessions.deleteMany({
                where: {
                    OR: [
                        { expires_at: { lt: new Date() } },
                        { is_active: false },
                    ],
                },
            });
            await this.cleanupExpiredSessionsFromCache();
            this.logger.logBusinessEvent('SESSIONS_CLEANUP', {
                sessionsDeleted: count,
            });
            this.logger.endOperation('cleanupExpiredSessions', operationId, true);
            return count;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'SessionService.cleanupExpiredSessions');
            this.logger.endOperation('cleanupExpiredSessions', operationId, false);
            return 0;
        }
    }
    async enforceSessionLimits(userId) {
        const activeSessions = await this.getUserActiveSessions(userId);
        if (activeSessions.length >= session_constants_1.SESSION_CONSTANTS.LIMITS.MAX_CONCURRENT_SESSIONS) {
            const oldestSession = activeSessions[activeSessions.length - 1];
            await this.revokeSession(oldestSession.id);
        }
    }
    generateSessionToken() {
        const crypto = require('crypto');
        return crypto.randomBytes(128).toString('hex');
    }
    generateDeviceFingerprint(deviceInfo) {
        const crypto = require('crypto');
        const fingerprint = `${deviceInfo.userAgent}-${deviceInfo.ipAddress}`;
        return crypto.createHash('sha256').update(fingerprint).digest('hex');
    }
    async cacheSession(session) {
        try {
            const sessionKey = `${session_constants_1.SESSION_CONSTANTS.REDIS_KEYS.SESSION_PREFIX}${session.session_token}`;
            await this.redis.setCache(sessionKey, session, session_constants_1.SESSION_CONSTANTS.DURATION.DEFAULT_SESSION);
        }
        catch (error) {
            this.logger.warn('Failed to cache session', JSON.stringify({
                sessionId: session.id,
                error: error.message,
            }));
        }
    }
    async getCachedSession(sessionToken) {
        try {
            const sessionKey = `${session_constants_1.SESSION_CONSTANTS.REDIS_KEYS.SESSION_PREFIX}${sessionToken}`;
            return await this.redis.getCache(sessionKey);
        }
        catch (error) {
            return null;
        }
    }
    async removeCachedSession(sessionToken) {
        try {
            const sessionKey = `${session_constants_1.SESSION_CONSTANTS.REDIS_KEYS.SESSION_PREFIX}${sessionToken}`;
            await this.redis.delCache(sessionKey);
        }
        catch (error) {
            this.logger.warn('Failed to remove cached session', JSON.stringify({
                error: error.message,
            }));
        }
    }
    async updateLastActivity(sessionId) {
        return await this.prisma.user_sessions.update({
            where: { id: sessionId },
            data: {
                last_activity: new Date(),
                updated_at: new Date(),
            },
        });
    }
    async invalidateSession(sessionId) {
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
            this.logger.logErrorEvent(error, 'SessionService.invalidateSession', undefined, JSON.stringify({ sessionId }));
        }
    }
    async extendSessionIfNeeded(session) {
        const now = new Date();
        const timeUntilExpiry = session.expires_at.getTime() - now.getTime();
        const oneHour = 60 * 60 * 1000;
        if (timeUntilExpiry < oneHour) {
            const newExpiresAt = new Date(now.getTime() + session_constants_1.SESSION_CONSTANTS.DURATION.DEFAULT_SESSION * 1000);
            await this.prisma.user_sessions.update({
                where: { id: session.id },
                data: {
                    expires_at: newExpiresAt,
                    updated_at: new Date(),
                },
            });
        }
    }
    async blacklistSessionTokens(sessionId) {
        this.logger.info('Session tokens blacklisted', JSON.stringify({ sessionId }));
    }
    async clearUserSessionsFromCache(userId) {
        try {
            const userSessions = await this.prisma.user_sessions.findMany({
                where: { user_id: userId },
                select: { session_token: true },
            });
            for (const session of userSessions) {
                await this.removeCachedSession(session.session_token);
            }
        }
        catch (error) {
            this.logger.warn('Failed to clear user sessions from cache', JSON.stringify({
                userId,
                error: error.message,
            }));
        }
    }
    async cleanupExpiredSessionsFromCache() {
        setImmediate(async () => {
            try {
                const expiredSessions = await this.prisma.user_sessions.findMany({
                    where: {
                        OR: [
                            { expires_at: { lt: new Date() } },
                            { is_active: false },
                        ],
                    },
                    select: { session_token: true },
                });
                for (const session of expiredSessions) {
                    await this.removeCachedSession(session.session_token);
                }
                this.logger.info('Cache cleanup completed', JSON.stringify({
                    sessionsRemoved: expiredSessions.length,
                }));
            }
            catch (error) {
                this.logger.logErrorEvent(error, 'SessionService.cleanupExpiredSessionsFromCache');
            }
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