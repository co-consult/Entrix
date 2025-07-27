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
var JwtRefreshStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtRefreshStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("@nestjs/config");
const logger_service_1 = require("../../../shared/logger/logger.service");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const session_exceptions_1 = require("../exceptions/session.exceptions");
let JwtRefreshStrategy = JwtRefreshStrategy_1 = class JwtRefreshStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'jwt-refresh') {
    configService;
    prisma;
    redis;
    logger;
    constructor(configService, prisma, redis, loggerService) {
        super({
            jwtFromRequest: JwtRefreshStrategy_1.createHybridExtractor(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_REFRESH_SECRET', configService.get('JWT_SECRET')),
            issuer: 'entrix-v3',
            audience: 'entrix-refresh',
            passReqToCallback: true,
        });
        this.configService = configService;
        this.prisma = prisma;
        this.redis = redis;
        this.logger = loggerService.createChildLogger('JwtRefreshStrategy');
    }
    static createHybridExtractor() {
        return (request) => {
            if (request.body && request.body.refreshToken) {
                return request.body.refreshToken;
            }
            const authHeader = request.headers?.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                return authHeader.substring(7);
            }
            return null;
        };
    }
    async validate(req, payload) {
        const operationId = this.logger.startOperation('validateRefreshToken', {
            userId: payload.sub,
            sessionId: payload.sessionId,
            tokenId: payload.tokenId
        });
        try {
            const tokenFromBody = req.body?.refreshToken;
            const tokenFromHeader = req.headers?.authorization?.substring(7);
            const tokenUsed = tokenFromBody || tokenFromHeader;
            this.logger.info('Refresh token extraction info', JSON.stringify({
                hasTokenInBody: !!tokenFromBody,
                hasTokenInHeader: !!tokenFromHeader,
                tokenUsedFrom: tokenFromBody ? 'body' : (tokenFromHeader ? 'header' : 'none'),
                tokenLength: tokenUsed?.length || 0,
                tokenPrefix: tokenUsed?.substring(0, 20) + '...' || 'none'
            }));
            if (!this.isValidRefreshPayload(payload)) {
                this.logger.warn('Invalid refresh token payload', JSON.stringify({ payload }));
                throw new session_exceptions_1.InvalidRefreshTokenException();
            }
            const token = tokenUsed;
            if (!token) {
                this.logger.warn('No refresh token found in body or header');
                throw new session_exceptions_1.InvalidRefreshTokenException();
            }
            const isUsed = await this.isRefreshTokenUsed(payload.tokenId);
            if (isUsed) {
                this.logger.warn('Refresh token replay attempt', JSON.stringify({
                    tokenId: payload.tokenId,
                    userId: payload.sub
                }));
                await this.revokeAllUserSessions(payload.sub);
                throw new session_exceptions_1.InvalidRefreshTokenException();
            }
            const session = await this.validateRefreshSession(payload.sessionId, payload.sub);
            if (!session) {
                this.logger.warn('Refresh session invalid', JSON.stringify({
                    sessionId: payload.sessionId
                }));
                throw new session_exceptions_1.InvalidRefreshTokenException();
            }
            await this.markRefreshTokenAsUsed(payload.tokenId, token);
            this.logger.logBusinessEvent('REFRESH_TOKEN_USED', {
                userId: payload.sub,
                sessionId: payload.sessionId,
                tokenId: payload.tokenId,
                extractedFrom: tokenFromBody ? 'body' : 'header'
            }, payload.sub);
            this.logger.endOperation('validateRefreshToken', operationId, true);
            return {
                userId: payload.sub,
                sessionId: payload.sessionId,
                tokenId: payload.tokenId,
            };
        }
        catch (error) {
            this.logger.endOperation('validateRefreshToken', operationId, false, undefined, { error: error.message });
            this.logger.logBusinessEvent('REFRESH_TOKEN_VALIDATION_FAILED', {
                userId: payload.sub,
                sessionId: payload.sessionId,
                tokenId: payload.tokenId,
                error: error.message,
            }, payload.sub);
            throw error;
        }
    }
    isValidRefreshPayload(payload) {
        return payload &&
            typeof payload.sub === 'string' &&
            typeof payload.sessionId === 'string' &&
            typeof payload.tokenId === 'string' &&
            typeof payload.iat === 'number' &&
            typeof payload.exp === 'number' &&
            payload.aud === 'entrix-refresh' &&
            payload.iss === 'entrix-v3';
    }
    async isRefreshTokenUsed(tokenId) {
        try {
            const usedKey = `refresh_used:${tokenId}`;
            const isUsed = await this.redis.exists(usedKey);
            return !!isUsed;
        }
        catch (error) {
            this.logger.error('Error checking refresh token usage', error.stack);
            return false;
        }
    }
    async validateRefreshSession(sessionId, userId) {
        try {
            const session = await this.prisma.user_sessions.findFirst({
                where: {
                    id: sessionId,
                    user_id: userId,
                    is_active: true,
                    expires_at: {
                        gt: new Date(),
                    },
                },
                select: {
                    id: true,
                },
            });
            return !!session;
        }
        catch (error) {
            this.logger.error('Error validating refresh session', error.stack);
            return false;
        }
    }
    async markRefreshTokenAsUsed(tokenId, token) {
        try {
            const usedKey = `refresh_used:${tokenId}`;
            const tokenKey = `refresh_token:${tokenId}`;
            await Promise.all([
                this.redis.set(usedKey, '1', 86400),
                this.redis.set(tokenKey, token, 86400),
            ]);
        }
        catch (error) {
            this.logger.error('Error marking refresh token as used', error.stack);
        }
    }
    async revokeAllUserSessions(userId) {
        try {
            await this.prisma.user_sessions.updateMany({
                where: {
                    user_id: userId,
                    is_active: true,
                },
                data: {
                    is_active: false,
                    updated_at: new Date(),
                },
            });
            this.logger.warn('All user sessions revoked due to token compromise', JSON.stringify({ userId }));
        }
        catch (error) {
            this.logger.error('Error revoking user sessions', error.stack);
        }
    }
};
exports.JwtRefreshStrategy = JwtRefreshStrategy;
exports.JwtRefreshStrategy = JwtRefreshStrategy = JwtRefreshStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        logger_service_1.LoggerService])
], JwtRefreshStrategy);
//# sourceMappingURL=jwt-refresh.strategy.js.map