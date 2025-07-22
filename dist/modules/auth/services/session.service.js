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
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const uuid_1 = require("uuid");
let SessionsService = class SessionsService {
    prisma;
    redis;
    logger;
    SESSION_PREFIX = 'session:';
    USER_SESSIONS_PREFIX = 'user_sessions:';
    SESSION_DURATION = 24 * 60 * 60;
    constructor(prisma, redis, logger) {
        this.prisma = prisma;
        this.redis = redis;
        this.logger = logger;
    }
    async createSession(userId, ipAddress, userAgent) {
        const sessionId = (0, uuid_1.v4)();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + this.SESSION_DURATION * 1000);
        const session = {
            id: sessionId,
            userId,
            ipAddress,
            userAgent,
            isActive: true,
            lastActivityAt: now,
            createdAt: now,
            expiresAt,
        };
        try {
            const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
            await this.redis.setCache(sessionKey, session, this.SESSION_DURATION);
            const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
            const userSessions = await this.redis.getCache(userSessionsKey) || [];
            userSessions.push(sessionId);
            await this.redis.setCache(userSessionsKey, userSessions, this.SESSION_DURATION);
            this.logger.log(`Session created for user ${userId}: ${sessionId}`);
            return session;
        }
        catch (error) {
            this.logger.error('Failed to create session:', error);
            throw error;
        }
    }
    async getSession(sessionId) {
        try {
            const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
            const session = await this.redis.getCache(sessionKey);
            if (!session) {
                return null;
            }
            if (new Date() > session.expiresAt) {
                await this.revokeSession(sessionId);
                return null;
            }
            return session;
        }
        catch (error) {
            this.logger.error(`Failed to get session ${sessionId}:`, error);
            return null;
        }
    }
    async updateSessionActivity(sessionId) {
        try {
            const session = await this.getSession(sessionId);
            if (!session) {
                return;
            }
            session.lastActivityAt = new Date();
            const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
            await this.redis.setCache(sessionKey, session, this.SESSION_DURATION);
        }
        catch (error) {
            this.logger.error(`Failed to update session activity ${sessionId}:`, error);
        }
    }
    async revokeSession(sessionId) {
        try {
            const session = await this.getSession(sessionId);
            if (!session) {
                return;
            }
            const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
            await this.redis.del(sessionKey);
            const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${session.userId}`;
            const userSessions = await this.redis.getCache(userSessionsKey) || [];
            const updatedSessions = userSessions.filter(id => id !== sessionId);
            if (updatedSessions.length > 0) {
                await this.redis.setCache(userSessionsKey, updatedSessions, this.SESSION_DURATION);
            }
            else {
                await this.redis.del(userSessionsKey);
            }
            this.logger.log(`Session revoked: ${sessionId}`);
        }
        catch (error) {
            this.logger.error(`Failed to revoke session ${sessionId}:`, error);
            throw error;
        }
    }
    async revokeAllUserSessions(userId) {
        try {
            const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
            const userSessions = await this.redis.getCache(userSessionsKey) || [];
            for (const sessionId of userSessions) {
                const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
                await this.redis.del(sessionKey);
            }
            await this.redis.del(userSessionsKey);
            this.logger.log(`All sessions revoked for user ${userId}`);
        }
        catch (error) {
            this.logger.error(`Failed to revoke all sessions for user ${userId}:`, error);
            throw error;
        }
    }
    async getUserSessions(userId) {
        try {
            const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
            const sessionIds = await this.redis.getCache(userSessionsKey) || [];
            const sessions = [];
            for (const sessionId of sessionIds) {
                const session = await this.getSession(sessionId);
                if (session) {
                    sessions.push(session);
                }
            }
            return sessions;
        }
        catch (error) {
            this.logger.error(`Failed to get user sessions for ${userId}:`, error);
            return [];
        }
    }
    async cleanupExpiredSessions() {
        let cleanedCount = 0;
        try {
            this.logger.log(`Cleanup completed: ${cleanedCount} expired sessions removed`);
            return cleanedCount;
        }
        catch (error) {
            this.logger.error('Failed to cleanup expired sessions:', error);
            return 0;
        }
    }
    async validateAndRefreshSession(sessionId) {
        try {
            const session = await this.getSession(sessionId);
            if (!session) {
                return null;
            }
            await this.updateSessionActivity(sessionId);
            return session;
        }
        catch (error) {
            this.logger.error(`Failed to validate session ${sessionId}:`, error);
            return null;
        }
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        logger_service_1.LoggerService])
], SessionsService);
//# sourceMappingURL=session.service.js.map