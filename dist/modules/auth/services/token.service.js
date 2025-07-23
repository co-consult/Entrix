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
exports.TokenService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const logger_service_1 = require("../../../shared/logger/logger.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const auth_constants_1 = require("../constants/auth.constants");
const token_util_1 = require("../utils/token.util");
let TokenService = class TokenService {
    jwtService;
    configService;
    redis;
    logger;
    accessTokenSecret;
    refreshTokenSecret;
    constructor(jwtService, configService, redis, loggerService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.redis = redis;
        this.logger = loggerService.createChildLogger('TokenService');
        this.accessTokenSecret = this.configService.get('JWT_SECRET');
        this.refreshTokenSecret = this.configService.get('JWT_REFRESH_SECRET', this.accessTokenSecret);
    }
    async generateAccessToken(payload) {
        const operationId = this.logger.startOperation('generateAccessToken', {
            userId: payload.sub,
            sessionId: payload.sessionId,
        });
        try {
            if (!token_util_1.TokenUtil.validateJwtPayload(payload, 'access')) {
                throw new Error('Payload JWT invalide pour access token');
            }
            const token = this.jwtService.sign(payload, {
                secret: this.accessTokenSecret,
                expiresIn: auth_constants_1.AUTH_CONSTANTS.JWT.ACCESS_TOKEN_EXPIRY,
                issuer: 'entrix-v3',
                audience: 'entrix-users',
            });
            this.logger.logBusinessEvent('ACCESS_TOKEN_GENERATED', {
                userId: payload.sub,
                sessionId: payload.sessionId,
                expiresIn: auth_constants_1.AUTH_CONSTANTS.JWT.ACCESS_TOKEN_EXPIRY,
            }, payload.sub);
            this.logger.endOperation(operationId, 'success');
            return token;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.error('Failed to generate access token', error.stack, {
                userId: payload.sub,
                sessionId: payload.sessionId,
            });
            throw new Error(`Erreur génération access token: ${error.message}`);
        }
    }
    async generateRefreshToken(payload) {
        const operationId = this.logger.startOperation('generateRefreshToken', {
            userId: payload.sub,
            sessionId: payload.sessionId,
            tokenId: payload.tokenId,
        });
        try {
            if (!token_util_1.TokenUtil.validateJwtPayload(payload, 'refresh')) {
                throw new Error('Payload JWT invalide pour refresh token');
            }
            const token = this.jwtService.sign(payload, {
                secret: this.refreshTokenSecret,
                expiresIn: payload.exp - payload.iat,
                issuer: 'entrix-v3',
                audience: 'entrix-refresh',
            });
            const tokenMappingKey = `refresh_mapping:${payload.tokenId}`;
            await this.redis.setCache(tokenMappingKey, payload.sub, auth_constants_1.AUTH_CONSTANTS.JWT.REFRESH_TOKEN_EXPIRY_REMEMBER);
            this.logger.logBusinessEvent('REFRESH_TOKEN_GENERATED', {
                userId: payload.sub,
                sessionId: payload.sessionId,
                tokenId: payload.tokenId,
                expiresIn: payload.exp - payload.iat,
            }, payload.sub);
            this.logger.endOperation(operationId, 'success');
            return token;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.error('Failed to generate refresh token', error.stack, {
                userId: payload.sub,
                sessionId: payload.sessionId,
                tokenId: payload.tokenId,
            });
            throw new Error(`Erreur génération refresh token: ${error.message}`);
        }
    }
    async verifyAccessToken(token) {
        const operationId = this.logger.startOperation('verifyAccessToken');
        try {
            if (!token || typeof token !== 'string') {
                throw new Error('Token format invalide');
            }
            const isBlacklisted = await this.isTokenBlacklisted(token);
            if (isBlacklisted) {
                throw new Error('Token révoqué');
            }
            const payload = this.jwtService.verify(token, {
                secret: this.accessTokenSecret,
                issuer: 'entrix-v3',
                audience: 'entrix-users',
            });
            if (!token_util_1.TokenUtil.validateJwtPayload(payload, 'access')) {
                throw new Error('Payload token invalide');
            }
            this.logger.endOperation(operationId, 'success');
            return payload;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.logBusinessEvent('INVALID_TOKEN_USED', {
                error: error.message,
                tokenPrefix: token?.substring(0, 20) + '...',
            });
            throw new Error(`Token invalide: ${error.message}`);
        }
    }
    async verifyRefreshToken(token) {
        const operationId = this.logger.startOperation('verifyRefreshToken');
        try {
            if (!token || typeof token !== 'string') {
                throw new Error('Refresh token format invalide');
            }
            const payload = this.jwtService.verify(token, {
                secret: this.refreshTokenSecret,
                issuer: 'entrix-v3',
                audience: 'entrix-refresh',
            });
            if (!token_util_1.TokenUtil.validateJwtPayload(payload, 'refresh')) {
                throw new Error('Payload refresh token invalide');
            }
            const isUsed = await this.isRefreshTokenUsed(payload.tokenId);
            if (isUsed) {
                throw new Error('Refresh token déjà utilisé');
            }
            this.logger.endOperation(operationId, 'success');
            return payload;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.logBusinessEvent('INVALID_REFRESH_TOKEN_USED', {
                error: error.message,
            });
            throw new Error(`Refresh token invalide: ${error.message}`);
        }
    }
    async blacklistToken(token) {
        const operationId = this.logger.startOperation('blacklistToken');
        try {
            const payload = token_util_1.TokenUtil.extractJwtPayload(token);
            if (!payload) {
                throw new Error('Token non décodable pour blacklisting');
            }
            const now = Math.floor(Date.now() / 1000);
            const ttl = Math.max(0, payload.exp - now);
            if (ttl > 0) {
                const blacklistKey = `blacklist:token:${payload.sessionId || 'unknown'}:${payload.iat}`;
                await this.redis.setCache(blacklistKey, 'revoked', ttl);
                this.logger.logBusinessEvent('TOKEN_BLACKLISTED', {
                    userId: payload.sub,
                    sessionId: payload.sessionId,
                    reason: 'manual_revocation',
                    ttl,
                }, payload.sub);
            }
            this.logger.endOperation(operationId, 'success');
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.error('Failed to blacklist token', error.stack);
        }
    }
    async isTokenBlacklisted(token) {
        try {
            const payload = token_util_1.TokenUtil.extractJwtPayload(token);
            if (!payload || !payload.sessionId || !payload.iat) {
                return false;
            }
            const blacklistKey = `blacklist:token:${payload.sessionId}:${payload.iat}`;
            const isBlacklisted = await this.redis.exists(blacklistKey);
            return isBlacklisted;
        }
        catch (error) {
            this.logger.error('Error checking token blacklist', error.stack);
            return false;
        }
    }
    async isRefreshTokenUsed(tokenId) {
        try {
            const usedKey = `refresh_used:${tokenId}`;
            const isUsed = await this.redis.exists(usedKey);
            return isUsed;
        }
        catch (error) {
            this.logger.error('Error checking refresh token usage', error.stack);
            return false;
        }
    }
    async generateTokenPair(userId, email, sessionId, rememberMe = false, deviceFingerprint, roles, permissions) {
        const operationId = this.logger.startOperation('generateTokenPair', {
            userId,
            sessionId,
            rememberMe,
        });
        try {
            const accessPayload = token_util_1.TokenUtil.createAccessTokenPayload(userId, email, sessionId, deviceFingerprint, roles, permissions);
            const refreshPayload = token_util_1.TokenUtil.createRefreshTokenPayload(userId, sessionId, rememberMe);
            const [accessToken, refreshToken] = await Promise.all([
                this.generateAccessToken(accessPayload),
                this.generateRefreshToken(refreshPayload),
            ]);
            const tokenPair = {
                accessToken,
                refreshToken,
                tokenType: 'Bearer',
                expiresIn: auth_constants_1.AUTH_CONSTANTS.JWT.ACCESS_TOKEN_EXPIRY,
            };
            this.logger.endOperation(operationId, 'success', true);
            return tokenPair;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.error('Failed to generate token pair', error.stack, JSON.stringify({
                userId,
                sessionId,
            }));
            throw new Error(`Erreur génération paire tokens: ${error.message}`);
        }
    }
};
exports.TokenService = TokenService;
exports.TokenService = TokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        redis_service_1.RedisService,
        logger_service_1.LoggerService])
], TokenService);
//# sourceMappingURL=token.service.js.map