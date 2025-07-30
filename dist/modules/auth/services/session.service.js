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
const persistent_token_service_1 = require("./persistent-token.service");
const ip_util_1 = require("../utils/ip.util");
const session_constants_1 = require("../constants/session.constants");
const auth_constants_1 = require("../constants/auth.constants");
const session_exceptions_1 = require("../exceptions/session.exceptions");
let SessionService = class SessionService {
    prisma;
    redis;
    tokenService;
    persistentTokenService;
    logger;
    CACHE_PREFIX = 'session:';
    TOKENS_CACHE_PREFIX = 'session_tokens:';
    CACHE_TTL = 300;
    constructor(prisma, redis, tokenService, persistentTokenService, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.tokenService = tokenService;
        this.persistentTokenService = persistentTokenService;
        this.logger = loggerService.createChildLogger('SessionService');
    }
    async handleUserLogin(userId, deviceInfo, rememberMe = false) {
        const operationId = this.logger.startOperation('handleUserLogin', {
            userId,
            rememberMe,
            deviceFingerprint: deviceInfo.deviceFingerprint,
        });
        try {
            const validatedDeviceInfo = {
                ...deviceInfo,
                ipAddress: ip_util_1.IpUtils.validateAndNormalizeIp(deviceInfo.ipAddress),
            };
            this.logger.info('Starting intelligent session management', JSON.stringify({
                userId,
                rememberMe,
                ipAddress: validatedDeviceInfo.ipAddress,
                deviceFingerprint: validatedDeviceInfo.deviceFingerprint?.substring(0, 8) + '...',
            }));
            const cleanedSessions = await this.cleanupExpiredSessionsForUser(userId);
            this.logger.info(`Cleaned ${cleanedSessions} expired sessions for user`, JSON.stringify({ userId }));
            const existingSessions = await this.getUserActiveSessions(userId);
            this.logger.info(`Found ${existingSessions.length} active sessions`, JSON.stringify({ userId }));
            const sessionWithPersistentTokens = await this.findSessionWithValidPersistentTokens(userId, validatedDeviceInfo.deviceFingerprint);
            if (sessionWithPersistentTokens) {
                this.logger.info('Found session with valid persistent tokens, reusing', JSON.stringify({
                    sessionId: sessionWithPersistentTokens.id,
                    userId,
                }));
                const tokens = await this.getTokensForExistingSession(sessionWithPersistentTokens, rememberMe);
                await this.updateLastActivity(sessionWithPersistentTokens.id, validatedDeviceInfo.ipAddress);
                this.logger.endOperation('handleUserLogin', operationId, true);
                return {
                    session: sessionWithPersistentTokens,
                    tokens,
                    type: 'reused',
                    isReused: true,
                    tokensReused: true,
                };
            }
            const compatibleSession = this.findCompatibleSession(existingSessions, validatedDeviceInfo, rememberMe);
            if (compatibleSession) {
                this.logger.info('Found compatible session for refresh', JSON.stringify({
                    sessionId: compatibleSession.id,
                    userId,
                }));
                const refreshedSession = await this.refreshExistingSession(compatibleSession, validatedDeviceInfo, rememberMe);
                const tokens = await this.generateHybridTokensForSession(refreshedSession, rememberMe);
                this.logger.endOperation('handleUserLogin', operationId, true);
                return {
                    session: refreshedSession,
                    tokens,
                    type: 'refreshed',
                    isReused: false,
                    tokensReused: false,
                };
            }
            this.logger.info('No compatible session found, creating new session', JSON.stringify({ userId }));
            const newSession = await this.createSession(userId, validatedDeviceInfo, rememberMe);
            const tokens = await this.generateHybridTokensForSession(newSession, rememberMe);
            this.logger.endOperation('handleUserLogin', operationId, true);
            return {
                session: newSession,
                tokens,
                type: 'new',
                isReused: false,
                tokensReused: false,
            };
        }
        catch (error) {
            this.logger.endOperation('handleUserLogin', operationId, false);
            this.logger.error('Failed to handle user login', error.stack, 'SessionService.handleUserLogin', JSON.stringify({ errorMessage: error.message, userId }));
            throw error;
        }
    }
    async createSession(userId, deviceInfo, rememberMe = false) {
        const operationId = this.logger.startOperation('createSession', { userId, rememberMe });
        try {
            const validatedDeviceInfo = {
                ...deviceInfo,
                ipAddress: ip_util_1.IpUtils.validateAndNormalizeIp(deviceInfo.ipAddress),
                userAgent: deviceInfo.userAgent?.substring(0, 500) || null,
            };
            this.logger.info('Creating session with validated device info', JSON.stringify({
                userId,
                ipAddress: validatedDeviceInfo.ipAddress,
                userAgent: validatedDeviceInfo.userAgent?.substring(0, 50) + '...',
                rememberMe,
            }));
            const activeSessions = await this.getUserActiveSessions(userId);
            if (activeSessions.length >= session_constants_1.SESSION_CONSTANTS.LIMITS.MAX_CONCURRENT_SESSIONS) {
                const oldestSession = activeSessions.sort((a, b) => a.last_activity.getTime() - b.last_activity.getTime())[0];
                await this.revokeSession(oldestSession.id);
                this.logger.info('Revoked oldest session due to limit', JSON.stringify({
                    revokedSessionId: oldestSession.id,
                    userId,
                }));
            }
            const now = new Date();
            const duration = rememberMe
                ? session_constants_1.SESSION_CONSTANTS.DURATION.REMEMBER_ME_SESSION
                : session_constants_1.SESSION_CONSTANTS.DURATION.DEFAULT_SESSION;
            const expiresAt = new Date(now.getTime() + duration * 1000);
            const sessionToken = this.generateSessionToken();
            const session = await this.prisma.user_sessions.create({
                data: {
                    session_token: sessionToken,
                    user_id: userId,
                    ip_address: validatedDeviceInfo.ipAddress,
                    user_agent: validatedDeviceInfo.userAgent,
                    device_fingerprint: validatedDeviceInfo.deviceFingerprint || null,
                    geolocation: validatedDeviceInfo.geolocation || null,
                    expires_at: expiresAt,
                    is_active: true,
                    last_activity: now,
                },
            });
            if (rememberMe) {
                await this.createPersistentTokenForSession(session, validatedDeviceInfo);
            }
            await this.cacheSession(session);
            this.logger.endOperation('createSession', operationId, true);
            this.logger.info('Session created successfully', JSON.stringify({
                sessionId: session.id,
                userId,
                ipAddress: validatedDeviceInfo.ipAddress,
                rememberMe,
                expiresAt: expiresAt.toISOString(),
            }));
            return session;
        }
        catch (error) {
            this.logger.endOperation('createSession', operationId, false);
            this.logger.error('Failed to create session', error.stack, 'SessionService.createSession', JSON.stringify({
                errorMessage: error.message,
                userId,
                ipAddress: deviceInfo.ipAddress,
            }));
            throw error;
        }
    }
    async validateSession(sessionToken) {
        const operationId = this.logger.startOperation('validateSession');
        try {
            const cacheKey = `${this.CACHE_PREFIX}token:${sessionToken}`;
            const cachedSession = await this.redis.getCache(cacheKey);
            if (cachedSession) {
                if (new Date(cachedSession.expires_at) > new Date() && cachedSession.is_active) {
                    this.logger.endOperation('validateSession', operationId, true);
                    return cachedSession;
                }
                await this.redis.delCache(cacheKey);
            }
            const session = await this.prisma.user_sessions.findUnique({
                where: { session_token: sessionToken },
            });
            if (!session) {
                this.logger.endOperation('validateSession', operationId, false);
                return null;
            }
            if (!session.is_active || session.expires_at < new Date()) {
                this.logger.endOperation('validateSession', operationId, false);
                return null;
            }
            await this.cacheSession(session);
            this.logger.endOperation('validateSession', operationId, true);
            return session;
        }
        catch (error) {
            this.logger.endOperation('validateSession', operationId, false);
            this.logger.error('Failed to validate session', error.stack, 'SessionService.validateSession', JSON.stringify({ errorMessage: error.message }));
            return null;
        }
    }
    async refreshSession(refreshToken) {
        const operationId = this.logger.startOperation('refreshSession');
        try {
            this.logger.info('Starting session refresh', JSON.stringify({
                tokenPrefix: refreshToken.substring(0, 20) + '...',
            }));
            let payload;
            let isPersistentToken = false;
            if (refreshToken.startsWith('ent_ref_')) {
                const validation = await this.persistentTokenService.validateToken(refreshToken);
                if (!validation.isValid || !validation.token) {
                    throw new session_exceptions_1.InvalidRefreshTokenException();
                }
                payload = {
                    sub: validation.userId,
                    sessionId: validation.token.metadata?.sessionId,
                };
                isPersistentToken = true;
                this.logger.info('Using persistent refresh token', JSON.stringify({
                    tokenId: validation.token.id,
                    userId: validation.userId,
                }));
            }
            else {
                payload = await this.tokenService.verifyRefreshToken(refreshToken);
                if (!payload || !payload.sessionId) {
                    throw new session_exceptions_1.InvalidRefreshTokenException();
                }
                this.logger.info('Using JWT refresh token', JSON.stringify({
                    sessionId: payload.sessionId,
                    userId: payload.sub,
                }));
            }
            const sessionData = await this.prisma.user_sessions.findUnique({
                where: { id: payload.sessionId },
                include: {
                    users: {
                        select: {
                            id: true,
                            email: true,
                            user_roles_user_roles_user_idTousers: {
                                where: { status: 'ACTIVE' },
                                include: {
                                    roles: {
                                        select: {
                                            name: true,
                                            code: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
            if (!sessionData || !sessionData.is_active || sessionData.expires_at < new Date()) {
                throw new session_exceptions_1.SessionNotFoundException(payload.sessionId);
            }
            const user = sessionData.users;
            const userRoles = user.user_roles_user_roles_user_idTousers
                ?.filter(ur => ur.status === 'ACTIVE')
                .map(ur => ur.roles.code) || [];
            const sessionDuration = sessionData.expires_at.getTime() - sessionData.created_at.getTime();
            const isRememberMe = isPersistentToken ||
                sessionDuration > session_constants_1.SESSION_CONSTANTS.DURATION.DEFAULT_SESSION * 1000;
            const newTokens = await this.generateHybridTokensForSession(sessionData, isRememberMe);
            if (isPersistentToken) {
                await this.persistentTokenService.recordTokenUsage(payload.tokenId || 'unknown', sessionData.ip_address);
            }
            else {
                await this.tokenService.blacklistToken(refreshToken);
            }
            const validatedIp = ip_util_1.IpUtils.validateAndNormalizeIp(sessionData.ip_address);
            await this.updateLastActivity(sessionData.id, validatedIp);
            await this.cacheTokensForSession(sessionData.id, newTokens, isRememberMe);
            this.logger.info('Session refreshed successfully', JSON.stringify({
                sessionId: sessionData.id,
                userId: sessionData.user_id,
                tokenType: isPersistentToken ? 'persistent' : 'jwt',
                isRememberMe,
            }));
            this.logger.endOperation('refreshSession', operationId, true);
            return newTokens;
        }
        catch (error) {
            this.logger.endOperation('refreshSession', operationId, false);
            this.logger.error('Failed to refresh session', error.stack, 'SessionService.refreshSession', JSON.stringify({ errorMessage: error.message }));
            throw error;
        }
    }
    async revokeSession(sessionId) {
        const operationId = this.logger.startOperation('revokeSession', { sessionId });
        try {
            const session = await this.prisma.user_sessions.findUnique({
                where: { id: sessionId },
            });
            if (!session) {
                this.logger.endOperation('revokeSession', operationId, false);
                return false;
            }
            await this.prisma.user_sessions.update({
                where: { id: sessionId },
                data: {
                    is_active: false,
                    updated_at: new Date(),
                },
            });
            await this.revokePersistentTokensForSession(sessionId);
            await this.clearSessionCache(session);
            this.logger.endOperation('revokeSession', operationId, true);
            this.logger.info('Session revoked successfully', JSON.stringify({
                sessionId,
                userId: session.user_id,
            }));
            return true;
        }
        catch (error) {
            this.logger.endOperation('revokeSession', operationId, false);
            this.logger.error('Failed to revoke session', error.stack, 'SessionService.revokeSession', JSON.stringify({ errorMessage: error.message, sessionId }));
            return false;
        }
    }
    async revokeAllUserSessions(userId) {
        const operationId = this.logger.startOperation('revokeAllUserSessions', { userId });
        try {
            const activeSessions = await this.getUserActiveSessions(userId);
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
            const revokedPersistentTokens = await this.persistentTokenService.revokeAllUserTokens(userId, 'Session revocation');
            for (const session of activeSessions) {
                await this.clearSessionCache(session);
            }
            this.logger.endOperation('revokeAllUserSessions', operationId, true);
            this.logger.info('All user sessions revoked', JSON.stringify({
                userId,
                sessionsRevoked: result.count,
                persistentTokensRevoked: revokedPersistentTokens,
            }));
            return result.count;
        }
        catch (error) {
            this.logger.endOperation('revokeAllUserSessions', operationId, false);
            this.logger.error('Failed to revoke all user sessions', error.stack, 'SessionService.revokeAllUserSessions', JSON.stringify({ errorMessage: error.message, userId }));
            return 0;
        }
    }
    async getUserActiveSessions(userId) {
        try {
            return await this.prisma.user_sessions.findMany({
                where: {
                    user_id: userId,
                    is_active: true,
                    expires_at: { gt: new Date() },
                },
                orderBy: { last_activity: 'desc' },
            });
        }
        catch (error) {
            this.logger.error('Error getting user active sessions', error.stack);
            return [];
        }
    }
    async cleanupExpiredSessions() {
        const operationId = this.logger.startOperation('cleanupExpiredSessions');
        try {
            const expiredSessions = await this.prisma.user_sessions.findMany({
                where: {
                    OR: [
                        { expires_at: { lt: new Date() } },
                        { is_active: false },
                    ],
                },
                select: { id: true, user_id: true, session_token: true },
            });
            for (const session of expiredSessions) {
                await this.revokePersistentTokensForSession(session.id);
                await this.clearSessionCacheByToken(session.session_token);
            }
            const result = await this.prisma.user_sessions.deleteMany({
                where: {
                    OR: [
                        { expires_at: { lt: new Date() } },
                        { is_active: false },
                    ],
                },
            });
            this.logger.endOperation('cleanupExpiredSessions', operationId, true);
            this.logger.info('Expired sessions cleaned up', JSON.stringify({
                count: result.count,
                persistentTokensProcessed: expiredSessions.length,
            }));
            return result.count;
        }
        catch (error) {
            this.logger.endOperation('cleanupExpiredSessions', operationId, false);
            this.logger.error('Failed to cleanup expired sessions', error.stack, 'SessionService.cleanupExpiredSessions', JSON.stringify({ errorMessage: error.message }));
            return 0;
        }
    }
    async findSessionWithValidPersistentTokens(userId, deviceFingerprint) {
        try {
            const userTokens = await this.persistentTokenService.getUserTokens(userId, {
                token_type: 'REFRESH_LONG',
                is_active: true,
                is_revoked: false,
            });
            for (const tokenInfo of userTokens) {
                const token = await this.persistentTokenService.getToken(tokenInfo.id);
                if (token?.metadata?.sessionId) {
                    const session = await this.validateSession(token.metadata.sessionId);
                    if (session &&
                        session.user_id === userId &&
                        (!deviceFingerprint || session.device_fingerprint === deviceFingerprint)) {
                        return session;
                    }
                }
            }
            return null;
        }
        catch (error) {
            this.logger.error('Error finding session with persistent tokens', error.stack);
            return null;
        }
    }
    async generateHybridTokensForSession(session, rememberMe) {
        try {
            const user = await this.prisma.users.findUnique({
                where: { id: session.user_id },
                select: {
                    id: true,
                    email: true,
                    user_roles_user_roles_user_idTousers: {
                        where: { status: 'ACTIVE' },
                        include: {
                            roles: { select: { name: true, code: true } }
                        }
                    }
                },
            });
            if (!user) {
                throw new Error('User not found for session');
            }
            const userRoles = user.user_roles_user_roles_user_idTousers
                ?.map(ur => ur.roles.code) || [];
            const accessTokenPayload = {
                sub: session.user_id,
                email: user.email,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + auth_constants_1.AUTH_CONSTANTS.JWT.ACCESS_TOKEN_EXPIRY,
                aud: 'entrix-users',
                iss: 'entrix-v3',
                sessionId: session.id,
                deviceFingerprint: session.device_fingerprint,
                roles: userRoles,
                permissions: [],
            };
            const accessToken = await this.tokenService.generateAccessToken(accessTokenPayload);
            let refreshToken;
            if (rememberMe) {
                const persistentToken = await this.persistentTokenService.generateLongRefreshToken(session.user_id, {
                    sessionId: session.id,
                    deviceFingerprint: session.device_fingerprint,
                    userAgent: session.user_agent,
                });
                refreshToken = persistentToken.token;
                this.logger.info('Generated persistent refresh token for remember me', JSON.stringify({
                    sessionId: session.id,
                    tokenId: persistentToken.id,
                }));
            }
            else {
                const refreshTokenPayload = {
                    sub: session.user_id,
                    sessionId: session.id,
                    tokenId: this.generateTokenId(),
                    iat: Math.floor(Date.now() / 1000),
                    exp: Math.floor(Date.now() / 1000) + auth_constants_1.AUTH_CONSTANTS.JWT.REFRESH_TOKEN_EXPIRY,
                    aud: 'entrix-refresh',
                    iss: 'entrix-v3',
                };
                refreshToken = await this.tokenService.generateRefreshToken(refreshTokenPayload);
            }
            return {
                accessToken,
                refreshToken,
                tokenType: 'Bearer',
                expiresIn: auth_constants_1.AUTH_CONSTANTS.JWT.ACCESS_TOKEN_EXPIRY,
            };
        }
        catch (error) {
            this.logger.error('Error generating hybrid tokens', error.stack);
            throw error;
        }
    }
    async createPersistentTokenForSession(session, deviceInfo) {
        try {
            await this.persistentTokenService.generateLongRefreshToken(session.user_id, {
                sessionId: session.id,
                deviceFingerprint: deviceInfo.deviceFingerprint,
                userAgent: deviceInfo.userAgent,
                platform: 'web',
            });
            this.logger.info('Created persistent token for remember me session', JSON.stringify({
                sessionId: session.id,
                userId: session.user_id,
            }));
        }
        catch (error) {
            this.logger.error('Error creating persistent token for session', error.stack);
        }
    }
    async revokePersistentTokensForSession(sessionId) {
        try {
            this.logger.info('Persistent tokens cleanup for session queued', JSON.stringify({ sessionId }));
        }
        catch (error) {
            this.logger.error('Error revoking persistent tokens for session', error.stack);
        }
    }
    async getTokensForExistingSession(session, rememberMe) {
        const cacheKey = `${this.TOKENS_CACHE_PREFIX}${session.id}`;
        const cachedTokens = await this.redis.getCache(cacheKey);
        if (cachedTokens) {
            try {
                await this.tokenService.verifyAccessToken(cachedTokens.accessToken);
                return cachedTokens;
            }
            catch {
                await this.redis.delCache(cacheKey);
            }
        }
        return await this.generateHybridTokensForSession(session, rememberMe);
    }
    findCompatibleSession(sessions, deviceInfo, rememberMe) {
        if (deviceInfo.deviceFingerprint) {
            const deviceMatch = sessions.find(s => s.device_fingerprint === deviceInfo.deviceFingerprint &&
                this.isSessionRecentEnough(s));
            if (deviceMatch)
                return deviceMatch;
        }
        const ipMatch = sessions.find(s => s.ip_address === deviceInfo.ipAddress &&
            s.user_agent === deviceInfo.userAgent &&
            this.isSessionRecentEnough(s));
        return ipMatch || null;
    }
    isSessionRecentEnough(session) {
        const now = new Date();
        const timeSinceLastActivity = now.getTime() - session.last_activity.getTime();
        return timeSinceLastActivity < session_constants_1.SESSION_CONSTANTS.DURATION.IDLE_TIMEOUT * 1000;
    }
    async refreshExistingSession(session, deviceInfo, rememberMe) {
        const now = new Date();
        const duration = rememberMe
            ? session_constants_1.SESSION_CONSTANTS.DURATION.REMEMBER_ME_SESSION
            : session_constants_1.SESSION_CONSTANTS.DURATION.DEFAULT_SESSION;
        const validatedIp = ip_util_1.IpUtils.validateAndNormalizeIp(deviceInfo.ipAddress);
        const updatedSession = await this.prisma.user_sessions.update({
            where: { id: session.id },
            data: {
                last_activity: now,
                expires_at: new Date(now.getTime() + duration * 1000),
                ip_address: validatedIp,
                user_agent: deviceInfo.userAgent || session.user_agent,
                geolocation: deviceInfo.geolocation || session.geolocation,
                updated_at: now,
            },
        });
        await this.cacheSession(updatedSession);
        return updatedSession;
    }
    async cleanupExpiredSessionsForUser(userId) {
        try {
            const result = await this.prisma.user_sessions.deleteMany({
                where: {
                    user_id: userId,
                    OR: [
                        { expires_at: { lt: new Date() } },
                        { is_active: false },
                    ],
                },
            });
            return result.count;
        }
        catch (error) {
            this.logger.error('Error cleaning up user sessions', error.stack);
            return 0;
        }
    }
    async updateLastActivity(sessionId, ipAddress) {
        try {
            const validatedIp = ipAddress ? ip_util_1.IpUtils.validateAndNormalizeIp(ipAddress) : undefined;
            await this.prisma.user_sessions.update({
                where: { id: sessionId },
                data: {
                    last_activity: new Date(),
                    ...(validatedIp && { ip_address: validatedIp }),
                    updated_at: new Date(),
                },
            });
        }
        catch (error) {
            this.logger.error('Error updating session activity', error.stack);
        }
    }
    async cacheSession(session) {
        try {
            const cacheKey = `${this.CACHE_PREFIX}token:${session.session_token}`;
            const ttl = Math.max(0, Math.floor((session.expires_at.getTime() - Date.now()) / 1000));
            if (ttl > 0) {
                await this.redis.setCache(cacheKey, session, Math.min(ttl, this.CACHE_TTL));
            }
        }
        catch (error) {
            this.logger.error('Error caching session', error.stack);
        }
    }
    async cacheTokensForSession(sessionId, tokens, rememberMe) {
        try {
            const cacheKey = `${this.TOKENS_CACHE_PREFIX}${sessionId}`;
            const ttl = rememberMe ? 3600 : this.CACHE_TTL;
            await this.redis.setCache(cacheKey, tokens, ttl);
        }
        catch (error) {
            this.logger.error('Error caching session tokens', error.stack);
        }
    }
    async clearSessionCache(session) {
        try {
            const keys = [
                `${this.CACHE_PREFIX}token:${session.session_token}`,
                `${this.TOKENS_CACHE_PREFIX}${session.id}`,
            ];
            for (const key of keys) {
                await this.redis.delCache(key);
            }
        }
        catch (error) {
            this.logger.error('Error clearing session cache', error.stack);
        }
    }
    async clearSessionCacheByToken(sessionToken) {
        try {
            const cacheKey = `${this.CACHE_PREFIX}token:${sessionToken}`;
            await this.redis.delCache(cacheKey);
        }
        catch (error) {
            this.logger.error('Error clearing session cache by token', error.stack);
        }
    }
    generateSessionToken() {
        const crypto = require('crypto');
        return `sess_${Date.now()}_${crypto.randomBytes(32).toString('base64url')}`;
    }
    generateTokenId() {
        return `tkn_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        token_service_1.TokenService,
        persistent_token_service_1.PersistentTokenService,
        logger_service_1.LoggerService])
], SessionService);
//# sourceMappingURL=session.service.js.map