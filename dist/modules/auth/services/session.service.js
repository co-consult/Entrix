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
    async handleUserLogin(userId, deviceInfo, rememberMe = false) {
        const operationId = this.logger.startOperation('handleUserLogin', {
            userId,
            rememberMe,
            deviceFingerprint: deviceInfo.deviceFingerprint,
        });
        try {
            console.log('🔍 DEBUG handleUserLogin - Début gestion session pour user:', userId);
            const cleanedSessions = await this.cleanupExpiredSessionsForUser(userId);
            console.log(`🔍 DEBUG handleUserLogin - ${cleanedSessions} sessions expirées nettoyées`);
            const existingSessions = await this.getUserActiveSessions(userId);
            console.log('🔍 DEBUG handleUserLogin - Sessions actives trouvées:', existingSessions.length);
            const compatibleSession = await this.findCompatibleSession(existingSessions, deviceInfo, rememberMe);
            if (compatibleSession) {
                console.log('🔍 DEBUG handleUserLogin - Session compatible trouvée:', compatibleSession.id);
                const now = new Date();
                const lastActivity = new Date(compatibleSession.last_activity);
                const inactiveMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
                if (inactiveMinutes <= 60) {
                    console.log('🔍 DEBUG handleUserLogin - Session fraîche, réutilisation avec tokens intelligents');
                    const updatedSession = await this.refreshExistingSession(compatibleSession, deviceInfo, rememberMe);
                    const tokenResult = await this.getOrGenerateTokensForSession(updatedSession, rememberMe, deviceInfo.deviceFingerprint);
                    this.logger.logBusinessEvent('SESSION_REUSED', {
                        sessionId: updatedSession.id,
                        userId,
                        tokensReused: tokenResult.tokensReused,
                        inactiveMinutes,
                    }, userId);
                    this.logger.endOperation('handleUserLogin', operationId, true);
                    return {
                        session: updatedSession,
                        tokens: tokenResult.tokens,
                        type: 'reused',
                        isReused: true,
                        tokensReused: tokenResult.tokensReused,
                    };
                }
                else {
                    console.log('🔍 DEBUG handleUserLogin - Session ancienne, rafraîchissement');
                    const refreshedSession = await this.refreshExistingSession(compatibleSession, deviceInfo, rememberMe);
                    const tokenResult = await this.getOrGenerateTokensForSession(refreshedSession, rememberMe, deviceInfo.deviceFingerprint);
                    this.logger.logBusinessEvent('SESSION_REFRESHED_ON_LOGIN', {
                        sessionId: refreshedSession.id,
                        userId,
                        tokensReused: tokenResult.tokensReused,
                        inactiveMinutes,
                    }, userId);
                    this.logger.endOperation('handleUserLogin', operationId, true);
                    return {
                        session: refreshedSession,
                        tokens: tokenResult.tokens,
                        type: 'refreshed',
                        isReused: false,
                        tokensReused: tokenResult.tokensReused,
                    };
                }
            }
            console.log('🔍 DEBUG handleUserLogin - Aucune session compatible, création nouvelle session');
            const newSession = await this.createSession(userId, deviceInfo, rememberMe);
            const tokenResult = await this.getOrGenerateTokensForSession(newSession, rememberMe, deviceInfo.deviceFingerprint);
            this.logger.logBusinessEvent('NEW_SESSION_CREATED_ON_LOGIN', {
                sessionId: newSession.id,
                userId,
                reason: 'no_compatible_session',
            }, userId);
            this.logger.endOperation('handleUserLogin', operationId, true);
            return {
                session: newSession,
                tokens: tokenResult.tokens,
                type: 'new',
                isReused: false,
                tokensReused: false,
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'SessionService.handleUserLogin', userId, JSON.stringify({ deviceInfo, rememberMe }));
            this.logger.endOperation('handleUserLogin', operationId, false);
            throw error;
        }
    }
    async getOrGenerateTokensForSession(session, rememberMe, deviceFingerprint) {
        const operationId = this.logger.startOperation('getOrGenerateTokensForSession', {
            sessionId: session.id,
            userId: session.user_id,
        });
        try {
            console.log('🔍 DEBUG getOrGenerateTokensForSession - Vérification tokens existants pour session:', session.id);
            const existingTokens = await this.getActiveTokensForSession(session.id);
            if (existingTokens) {
                console.log('🔍 DEBUG - Tokens existants trouvés, vérification validité');
                try {
                    const [accessValid, refreshValid, accessBlacklisted, refreshBlacklisted] = await Promise.all([
                        this.tokenService.verifyAccessToken(existingTokens.accessToken).then(() => true).catch(() => false),
                        this.tokenService.verifyRefreshToken(existingTokens.refreshToken).then(() => true).catch(() => false),
                        this.tokenService.isTokenBlacklisted(existingTokens.accessToken),
                        this.tokenService.isTokenBlacklisted(existingTokens.refreshToken)
                    ]);
                    if (accessValid && refreshValid && !accessBlacklisted && !refreshBlacklisted) {
                        console.log('🔍 DEBUG - Tokens existants valides et non blacklistés, réutilisation');
                        await this.extendTokensCacheTTL(session.id, existingTokens);
                        this.logger.logBusinessEvent('TOKENS_REUSED', {
                            sessionId: session.id,
                            userId: session.user_id,
                            reason: 'valid_cached_tokens',
                        }, session.user_id);
                        this.logger.endOperation('getOrGenerateTokensForSession', operationId, true);
                        return {
                            tokens: existingTokens,
                            tokensReused: true,
                        };
                    }
                    else {
                        console.log('🔍 DEBUG - Tokens existants invalides, blacklistage et régénération');
                        await this.blacklistTokenPair(existingTokens);
                    }
                }
                catch (tokenError) {
                    console.log('🔍 DEBUG - Erreur vérification tokens:', tokenError.message);
                }
            }
            console.log('🔍 DEBUG - Génération nouveaux tokens pour session:', session.id);
            const user = await this.prisma.users.findUnique({
                where: { id: session.user_id },
                select: {
                    id: true,
                    email: true,
                    user_roles_user_roles_user_idTousers: {
                        where: {
                            status: 'ACTIVE',
                            OR: [
                                { valid_until: null },
                                { valid_until: { gt: new Date() } }
                            ]
                        },
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
            });
            if (!user) {
                throw new Error(`User not found: ${session.user_id}`);
            }
            const userRoles = user.user_roles_user_roles_user_idTousers
                ?.filter(ur => ur.status === 'ACTIVE')
                .map(ur => ur.roles.name) || [];
            const newTokens = await this.tokenService.generateTokenPair(session.user_id, user.email, session.id, rememberMe, deviceFingerprint, userRoles, []);
            await this.cacheTokensForSession(session.id, newTokens, rememberMe);
            this.logger.logBusinessEvent('NEW_TOKENS_GENERATED', {
                sessionId: session.id,
                userId: session.user_id,
                reason: 'expired_or_missing',
            }, session.user_id);
            this.logger.endOperation('getOrGenerateTokensForSession', operationId, true);
            return {
                tokens: newTokens,
                tokensReused: false,
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'SessionService.getOrGenerateTokensForSession', session.user_id, JSON.stringify({ sessionId: session.id }));
            this.logger.endOperation('getOrGenerateTokensForSession', operationId, false);
            throw error;
        }
    }
    async createSession(userId, deviceInfo, rememberMe = false) {
        const operationId = this.logger.startOperation('createSession', {
            userId,
            rememberMe,
            ipAddress: deviceInfo.ipAddress,
        });
        try {
            console.log('🔍 DEBUG createSession - Création nouvelle session pour user:', userId);
            await this.cleanupExpiredSessionsForUser(userId);
            await this.enforceSessionLimits(userId);
            const sessionToken = this.generateSessionToken();
            const sessionDuration = rememberMe
                ? session_constants_1.SESSION_CONSTANTS.DURATION.REMEMBER_ME_SESSION
                : session_constants_1.SESSION_CONSTANTS.DURATION.DEFAULT_SESSION;
            const expiresAt = new Date(Date.now() + sessionDuration * 1000);
            const deviceFingerprint = deviceInfo.deviceFingerprint ||
                this.generateDeviceFingerprint(deviceInfo);
            console.log('🔍 DEBUG createSession - Création en base avec token:', sessionToken.substring(0, 10) + '...');
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
            console.log('🔍 DEBUG createSession - Session créée avec ID:', session.id);
            await this.cacheSession(session, rememberMe);
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
            if (!payload || !payload.sessionId) {
                throw new session_exceptions_1.InvalidRefreshTokenException();
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
                .map(ur => ur.roles.name) || [];
            const sessionDuration = sessionData.expires_at.getTime() - sessionData.created_at.getTime();
            const isRememberMe = sessionDuration > session_constants_1.SESSION_CONSTANTS.DURATION.DEFAULT_SESSION * 1000;
            const tokens = await this.tokenService.generateTokenPair(sessionData.user_id, user.email, sessionData.id, isRememberMe, sessionData.device_fingerprint, userRoles, []);
            await this.tokenService.blacklistToken(refreshToken);
            await this.updateLastActivity(sessionData.id);
            await this.cacheTokensForSession(sessionData.id, tokens, isRememberMe);
            this.logger.logBusinessEvent('TOKENS_REFRESHED', {
                sessionId: sessionData.id,
                userId: sessionData.user_id,
            }, sessionData.user_id);
            this.logger.endOperation('refreshSession', operationId, true);
            return tokens;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'SessionService.refreshSession', undefined, JSON.stringify({ refreshToken: '***' }));
            this.logger.endOperation('refreshSession', operationId, false);
            throw error;
        }
    }
    async revokeSession(sessionId) {
        const operationId = this.logger.startOperation('revokeSession', { sessionId });
        try {
            const result = await this.prisma.user_sessions.update({
                where: { id: sessionId },
                data: { is_active: false },
            });
            await this.removeCachedSessionById(sessionId);
            await this.removeTokensFromCache(sessionId);
            this.logger.logBusinessEvent('SESSION_REVOKED', {
                sessionId,
                userId: result.user_id,
            }, result.user_id);
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
            const sessionsToRevoke = await this.getUserActiveSessions(userId);
            const result = await this.prisma.user_sessions.updateMany({
                where: { user_id: userId },
                data: { is_active: false },
            });
            await this.cleanupUserSessionsFromCache(userId);
            for (const session of sessionsToRevoke) {
                await this.removeTokensFromCache(session.id);
            }
            this.logger.logBusinessEvent('ALL_USER_SESSIONS_REVOKED', {
                userId,
                sessionsCount: result.count,
            }, userId);
            this.logger.endOperation('revokeAllUserSessions', operationId, true);
            return result.count;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'SessionService.revokeAllUserSessions', userId, JSON.stringify({ userId }));
            this.logger.endOperation('revokeAllUserSessions', operationId, false);
            return 0;
        }
    }
    async getUserActiveSessions(userId) {
        return await this.prisma.user_sessions.findMany({
            where: {
                user_id: userId,
                is_active: true,
                expires_at: { gt: new Date() },
            },
            orderBy: { last_activity: 'desc' },
        });
    }
    async cleanupExpiredSessions() {
        const operationId = this.logger.startOperation('cleanupExpiredSessions');
        try {
            const result = await this.prisma.user_sessions.deleteMany({
                where: {
                    OR: [
                        { expires_at: { lt: new Date() } },
                        {
                            AND: [
                                { is_active: false },
                                { updated_at: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
                            ]
                        }
                    ]
                }
            });
            const count = result.count;
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
    async findCompatibleSession(sessions, deviceInfo, rememberMe) {
        if (sessions.length === 0)
            return null;
        if (deviceInfo.deviceFingerprint) {
            const fingerprintMatch = sessions.find(s => s.device_fingerprint === deviceInfo.deviceFingerprint);
            if (fingerprintMatch) {
                console.log('🔍 DEBUG findCompatibleSession - Match par fingerprint:', fingerprintMatch.id);
                return fingerprintMatch;
            }
        }
        const recentIpMatch = sessions.find(s => {
            const lastActivity = new Date(s.last_activity);
            const now = new Date();
            const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
            const ipMatch = s.ip_address === deviceInfo.ipAddress ||
                this.isSimilarSubnet(s.ip_address, deviceInfo.ipAddress);
            return ipMatch &&
                this.isSimilarUserAgent(s.user_agent, deviceInfo.userAgent) &&
                hoursSinceActivity <= 2;
        });
        if (recentIpMatch) {
            console.log('🔍 DEBUG findCompatibleSession - Match par IP récente:', recentIpMatch.id);
            return recentIpMatch;
        }
        if (rememberMe) {
            const rememberMeSession = sessions.find(s => {
                const sessionDuration = s.expires_at.getTime() - s.created_at.getTime();
                return sessionDuration > session_constants_1.SESSION_CONSTANTS.DURATION.DEFAULT_SESSION * 1000;
            });
            if (rememberMeSession) {
                console.log('🔍 DEBUG findCompatibleSession - Match remember me:', rememberMeSession.id);
                return rememberMeSession;
            }
        }
        console.log('🔍 DEBUG findCompatibleSession - Aucune session compatible trouvée');
        return null;
    }
    async refreshExistingSession(session, deviceInfo, rememberMe) {
        console.log('🔍 DEBUG refreshExistingSession - Rafraîchissement session:', session.id);
        let newExpiresAt = session.expires_at;
        if (rememberMe) {
            const rememberMeExpiration = new Date(Date.now() + session_constants_1.SESSION_CONSTANTS.DURATION.REMEMBER_ME_SESSION * 1000);
            if (rememberMeExpiration > session.expires_at) {
                newExpiresAt = rememberMeExpiration;
            }
        }
        const updatedSession = await this.prisma.user_sessions.update({
            where: { id: session.id },
            data: {
                last_activity: new Date(),
                expires_at: newExpiresAt,
                ip_address: deviceInfo.ipAddress,
                user_agent: deviceInfo.userAgent || session.user_agent,
                device_fingerprint: deviceInfo.deviceFingerprint || session.device_fingerprint,
                geolocation: deviceInfo.geolocation || session.geolocation,
            },
        });
        await this.cacheSession(updatedSession, rememberMe);
        this.logger.logBusinessEvent('SESSION_REFRESHED', {
            sessionId: session.id,
            userId: session.user_id,
            extended: newExpiresAt > session.expires_at,
        }, session.user_id);
        return updatedSession;
    }
    async cleanupExpiredSessionsForUser(userId) {
        const deletedCount = await this.prisma.user_sessions.deleteMany({
            where: {
                user_id: userId,
                OR: [
                    { expires_at: { lt: new Date() } },
                    { is_active: false }
                ]
            }
        });
        if (deletedCount.count > 0) {
            console.log(`🔍 DEBUG cleanupExpiredSessionsForUser - ${deletedCount.count} sessions expirées supprimées pour user:`, userId);
            await this.cleanupUserSessionsFromCache(userId);
        }
        return deletedCount.count;
    }
    async getActiveTokensForSession(sessionId) {
        try {
            const tokensKey = `${session_constants_1.SESSION_CONSTANTS.REDIS_KEYS.SESSION_PREFIX}tokens:${sessionId}`;
            const cachedTokens = await this.redis.getCache(tokensKey);
            if (cachedTokens && cachedTokens.accessToken && cachedTokens.refreshToken) {
                console.log('🔍 DEBUG getActiveTokensForSession - Tokens trouvés en cache pour session:', sessionId);
                return cachedTokens;
            }
            console.log('🔍 DEBUG getActiveTokensForSession - Aucun token en cache pour session:', sessionId);
            return null;
        }
        catch (error) {
            console.log('🔍 DEBUG getActiveTokensForSession - Erreur cache:', error.message);
            return null;
        }
    }
    async cacheTokensForSession(sessionId, tokens, rememberMe = false) {
        try {
            const tokensKey = `${session_constants_1.SESSION_CONSTANTS.REDIS_KEYS.SESSION_PREFIX}tokens:${sessionId}`;
            const accessTokenTTL = tokens.expiresIn || (rememberMe ? 7200 : 900);
            await this.redis.setCache(tokensKey, tokens, accessTokenTTL);
            console.log('🔍 DEBUG cacheTokensForSession - Tokens mis en cache pour session:', sessionId, 'TTL:', accessTokenTTL);
        }
        catch (error) {
            this.logger.warn('Failed to cache tokens for session', JSON.stringify({
                sessionId,
                error: error.message,
            }));
        }
    }
    async extendTokensCacheTTL(sessionId, tokens) {
        try {
            const tokensKey = `${session_constants_1.SESSION_CONSTANTS.REDIS_KEYS.SESSION_PREFIX}tokens:${sessionId}`;
            const extendedTTL = 1800;
            await this.redis.setCache(tokensKey, tokens, extendedTTL);
            console.log('🔍 DEBUG extendTokensCacheTTL - TTL prolongé pour tokens session:', sessionId);
        }
        catch (error) {
            this.logger.warn('Failed to extend tokens cache TTL', error.message);
        }
    }
    async blacklistTokenPair(tokens) {
        try {
            console.log('🔍 DEBUG blacklistTokenPair - Blacklist anciens tokens');
            await Promise.all([
                this.tokenService.blacklistToken(tokens.accessToken),
                this.tokenService.blacklistToken(tokens.refreshToken)
            ]);
            console.log('🔍 DEBUG blacklistTokenPair - Tokens blacklistés avec succès');
        }
        catch (error) {
            this.logger.warn('Failed to blacklist token pair', error.message);
        }
    }
    async removeTokensFromCache(sessionId) {
        try {
            const tokensKey = `${session_constants_1.SESSION_CONSTANTS.REDIS_KEYS.SESSION_PREFIX}tokens:${sessionId}`;
            await this.redis.delCache(tokensKey);
            console.log('🔍 DEBUG removeTokensFromCache - Tokens supprimés du cache pour session:', sessionId);
        }
        catch (error) {
            this.logger.warn('Failed to remove tokens from cache', error.message);
        }
    }
    isSimilarSubnet(ip1, ip2) {
        try {
            const parts1 = ip1.split('.');
            const parts2 = ip2.split('.');
            if (parts1.length === 4 && parts2.length === 4) {
                return parts1[0] === parts2[0] &&
                    parts1[1] === parts2[1] &&
                    parts1[2] === parts2[2];
            }
            return false;
        }
        catch {
            return false;
        }
    }
    isSimilarUserAgent(ua1, ua2) {
        if (!ua1)
            return false;
        const getBrowserOS = (ua) => {
            const browser = ua.match(/(Chrome|Firefox|Safari|Edge)/)?.[0] || '';
            const os = ua.match(/(Windows|Mac|Linux|Android|iOS)/)?.[0] || '';
            return `${browser}-${os}`;
        };
        return getBrowserOS(ua1) === getBrowserOS(ua2);
    }
    async enforceSessionLimits(userId) {
        const activeSessions = await this.getUserActiveSessions(userId);
        if (activeSessions.length >= session_constants_1.SESSION_CONSTANTS.LIMITS.MAX_CONCURRENT_SESSIONS) {
            const oldestSession = activeSessions[activeSessions.length - 1];
            await this.revokeSession(oldestSession.id);
            console.log('🔍 DEBUG enforceSessionLimits - Session la plus ancienne supprimée:', oldestSession.id);
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
    async cacheSession(session, rememberMe = false) {
        try {
            const sessionKey = `${session_constants_1.SESSION_CONSTANTS.REDIS_KEYS.SESSION_PREFIX}${session.session_token}`;
            const cacheTTL = rememberMe
                ? session_constants_1.SESSION_CONSTANTS.DURATION.REMEMBER_ME_SESSION
                : session_constants_1.SESSION_CONSTANTS.DURATION.DEFAULT_SESSION;
            await this.redis.setCache(sessionKey, session, cacheTTL);
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
    async updateLastActivity(sessionId) {
        return await this.prisma.user_sessions.update({
            where: { id: sessionId },
            data: { last_activity: new Date() },
        });
    }
    async invalidateSession(sessionId) {
        await this.prisma.user_sessions.update({
            where: { id: sessionId },
            data: { is_active: false },
        });
        await this.removeCachedSessionById(sessionId);
        await this.removeTokensFromCache(sessionId);
    }
    async removeCachedSessionById(sessionId) {
        try {
            const session = await this.prisma.user_sessions.findUnique({
                where: { id: sessionId },
                select: { session_token: true }
            });
            if (session) {
                const sessionKey = `${session_constants_1.SESSION_CONSTANTS.REDIS_KEYS.SESSION_PREFIX}${session.session_token}`;
                await this.redis.delCache(sessionKey);
            }
        }
        catch (error) {
            this.logger.warn('Failed to remove cached session', JSON.stringify({
                sessionId,
                error: error.message,
            }));
        }
    }
    async cleanupUserSessionsFromCache(userId) {
        console.log('🔍 DEBUG cleanupUserSessionsFromCache - Nettoyage cache pour user:', userId);
    }
    async cleanupExpiredSessionsFromCache() {
        console.log('🔍 DEBUG cleanupExpiredSessionsFromCache - Nettoyage cache sessions expirées');
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