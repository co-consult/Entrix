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
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("@nestjs/config");
const logger_service_1 = require("../../../shared/logger/logger.service");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const session_exceptions_1 = require("../exceptions/session.exceptions");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'jwt') {
    configService;
    prisma;
    redis;
    logger;
    constructor(configService, prisma, redis, loggerService) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET'),
            issuer: 'entrix-v3',
            audience: 'entrix-users',
        });
        this.configService = configService;
        this.prisma = prisma;
        this.redis = redis;
        this.logger = loggerService.createChildLogger('JwtStrategy');
    }
    async validate(payload) {
        const operationId = this.logger.startOperation('validateJwtToken', {
            userId: payload.sub,
            sessionId: payload.sessionId
        });
        try {
            if (!this.isValidPayload(payload)) {
                this.logger.warn('Invalid JWT payload structure', JSON.stringify({ payload }));
                throw new common_1.UnauthorizedException('Token payload invalide');
            }
            const isBlacklisted = await this.isTokenBlacklisted(payload);
            if (isBlacklisted) {
                this.logger.warn('Blacklisted token used', JSON.stringify({
                    userId: payload.sub,
                    sessionId: payload.sessionId
                }));
                throw new common_1.UnauthorizedException('Token révoqué');
            }
            const session = await this.validateSession(payload.sessionId);
            if (!session) {
                this.logger.warn('Session not found or expired', JSON.stringify({
                    sessionId: payload.sessionId
                }));
                throw new session_exceptions_1.SessionExpiredException();
            }
            const user = await this.getUserFromDatabase(payload.sub);
            if (!user) {
                this.logger.warn('User not found', JSON.stringify({ userId: payload.sub }));
                throw new common_1.UnauthorizedException('Utilisateur introuvable');
            }
            if (!user.is_active) {
                this.logger.warn('Inactive user attempted access', JSON.stringify({ userId: payload.sub }));
                throw new common_1.UnauthorizedException('Compte désactivé');
            }
            await this.updateSessionActivity(payload.sessionId);
            this.logger.logBusinessEvent('JWT_VALIDATION_SUCCESS', {
                userId: user.id,
                sessionId: payload.sessionId,
                deviceFingerprint: payload.deviceFingerprint,
            }, user.id);
            this.logger.endOperation(operationId, 'success', true);
            return this.normalizeUserProfile(user, payload);
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.logBusinessEvent('JWT_VALIDATION_FAILED', {
                userId: payload.sub,
                sessionId: payload.sessionId,
                error: error.message,
            }, payload.sub);
            throw error;
        }
    }
    isValidPayload(payload) {
        return payload &&
            typeof payload.sub === 'string' &&
            typeof payload.email === 'string' &&
            typeof payload.sessionId === 'string' &&
            typeof payload.iat === 'number' &&
            typeof payload.exp === 'number' &&
            payload.aud === 'entrix-users' &&
            payload.iss === 'entrix-v3';
    }
    async isTokenBlacklisted(payload) {
        try {
            const blacklistKey = `blacklist:token:${payload.sessionId}:${payload.iat}`;
            const isBlacklisted = await this.redis.exists(blacklistKey);
            return isBlacklisted;
        }
        catch (error) {
            this.logger.error('Error checking token blacklist', error.stack);
            return false;
        }
    }
    async validateSession(sessionId) {
        try {
            const session = await this.prisma.user_sessions.findFirst({
                where: {
                    id: sessionId,
                    is_active: true,
                    expires_at: {
                        gt: new Date(),
                    },
                },
                select: {
                    id: true,
                    expires_at: true,
                    is_active: true,
                },
            });
            return !!session;
        }
        catch (error) {
            this.logger.error('Error validating session', error.stack, JSON.stringify({ sessionId }));
            return false;
        }
    }
    async getUserFromDatabase(userId) {
        try {
            const user = await this.prisma.users.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    first_name: true,
                    last_name: true,
                    phone: true,
                    avatar: true,
                    is_active: true,
                    email_verified: true,
                    phone_verified: true,
                    last_login: true,
                    metadata: true,
                    created_at: true,
                    updated_at: true,
                },
            });
            return user;
        }
        catch (error) {
            this.logger.error('Error fetching user from database', error.stack, JSON.stringify({ userId }));
            return null;
        }
    }
    async updateSessionActivity(sessionId) {
        try {
            await this.prisma.user_sessions.update({
                where: { id: sessionId },
                data: {
                    last_activity: new Date(),
                    updated_at: new Date(),
                },
            });
        }
        catch (error) {
            this.logger.warn('Failed to update session activity', JSON.stringify({
                sessionId,
                error: error.message
            }));
        }
    }
    normalizeUserProfile(user, payload) {
        return {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            avatar: user.avatar,
            is_active: user.is_active,
            email_verified: user.email_verified,
            phone_verified: user.phone_verified,
            last_login: user.last_login,
            metadata: user.metadata,
            created_at: user.created_at,
            updated_at: user.updated_at,
            roles: payload.roles || [],
            permissions: payload.permissions || [],
        };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        logger_service_1.LoggerService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map