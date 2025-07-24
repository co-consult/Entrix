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
        this.accessTokenSecret = this.configService.get('JWT_SECRET') || 'default-secret-change-in-production';
        this.refreshTokenSecret = this.configService.get('JWT_REFRESH_SECRET') || this.accessTokenSecret;
    }
    async generateAccessToken(payload) {
        const operationId = this.logger.startOperation('generateAccessToken', {
            userId: payload.sub,
            sessionId: payload.sessionId,
        });
        try {
            if (!this.validateAccessTokenPayload(payload)) {
                throw new Error('Payload JWT invalide pour access token');
            }
            const token = this.jwtService.sign(payload, {
                secret: this.accessTokenSecret,
            });
            this.logger.logBusinessEvent('ACCESS_TOKEN_GENERATED', {
                userId: payload.sub,
                sessionId: payload.sessionId,
                expiresIn: auth_constants_1.AUTH_CONSTANTS.JWT.ACCESS_TOKEN_EXPIRY,
            }, payload.sub);
            this.logger.endOperation('generateAccessToken', operationId, true);
            return token;
        }
        catch (error) {
            this.logger.endOperation('generateAccessToken', operationId, false);
            this.logger.error('Failed to generate access token', error.stack, 'TokenService.generateAccessToken', JSON.stringify({
                userId: payload.sub,
                sessionId: payload.sessionId,
            }));
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
            if (!this.validateRefreshTokenPayload(payload)) {
                throw new Error('Payload JWT invalide pour refresh token');
            }
            const token = this.jwtService.sign(payload, {
                secret: this.refreshTokenSecret,
            });
            const tokenMappingKey = `refresh_mapping:${payload.tokenId}`;
            await this.redis.setCache(tokenMappingKey, payload.sub, auth_constants_1.AUTH_CONSTANTS.JWT.REFRESH_TOKEN_EXPIRY_REMEMBER);
            this.logger.logBusinessEvent('REFRESH_TOKEN_GENERATED', {
                userId: payload.sub,
                sessionId: payload.sessionId,
                tokenId: payload.tokenId,
                expiresIn: payload.exp - payload.iat,
            }, payload.sub);
            this.logger.endOperation('generateRefreshToken', operationId, true);
            return token;
        }
        catch (error) {
            this.logger.endOperation('generateRefreshToken', operationId, false);
            this.logger.error('Failed to generate refresh token', error.stack, 'TokenService.generateRefreshToken', JSON.stringify({
                userId: payload.sub,
                sessionId: payload.sessionId,
                tokenId: payload.tokenId,
            }));
            throw new Error(`Erreur génération refresh token: ${error.message}`);
        }
    }
    async verifyAccessToken(token) {
        const operationId = this.logger.startOperation('verifyAccessToken');
        try {
            const payload = this.jwtService.verify(token, {
                secret: this.accessTokenSecret,
                issuer: 'entrix-v3',
                audience: 'entrix-users',
            });
            const isBlacklisted = await this.isTokenBlacklisted(token);
            if (isBlacklisted) {
                throw new Error('Token blacklisté');
            }
            if (!this.validateAccessTokenPayload(payload)) {
                throw new Error('Payload JWT invalide');
            }
            this.logger.endOperation('verifyAccessToken', operationId, true);
            return payload;
        }
        catch (error) {
            this.logger.endOperation('verifyAccessToken', operationId, false);
            this.logger.error('Failed to verify access token', error.stack, 'TokenService.verifyAccessToken', JSON.stringify({ errorMessage: error.message }));
            throw error;
        }
    }
    async verifyRefreshToken(token) {
        const operationId = this.logger.startOperation('verifyRefreshToken');
        try {
            const payload = this.jwtService.verify(token, {
                secret: this.refreshTokenSecret,
                issuer: 'entrix-v3',
                audience: 'entrix-refresh',
            });
            const isUsed = await this.isRefreshTokenUsed(payload.tokenId);
            if (isUsed) {
                throw new Error('Refresh token déjà utilisé');
            }
            if (!this.validateRefreshTokenPayload(payload)) {
                throw new Error('Payload refresh token invalide');
            }
            this.logger.endOperation('verifyRefreshToken', operationId, true);
            return payload;
        }
        catch (error) {
            this.logger.endOperation('verifyRefreshToken', operationId, false);
            this.logger.error('Failed to verify refresh token', error.stack, 'TokenService.verifyRefreshToken', JSON.stringify({ errorMessage: error.message }));
            throw error;
        }
    }
    async blacklistToken(token) {
        const operationId = this.logger.startOperation('blacklistToken');
        try {
            let payload;
            try {
                payload = this.jwtService.decode(token);
            }
            catch {
                payload = this.jwtService.decode(token);
            }
            if (payload && payload.exp && payload.iat) {
                const now = Math.floor(Date.now() / 1000);
                const ttl = Math.max(0, payload.exp - now);
                if (ttl > 0) {
                    const blacklistKey = `blacklist:token:${payload.sessionId || 'unknown'}:${payload.iat}`;
                    await this.redis.setCache(blacklistKey, 'revoked', ttl);
                    this.logger.logBusinessEvent('TOKEN_BLACKLISTED', {
                        userId: payload.sub,
                        sessionId: payload.sessionId || 'unknown',
                        reason: 'manual_revocation',
                        ttl,
                    }, payload.sub);
                }
            }
            this.logger.endOperation('blacklistToken', operationId, true);
        }
        catch (error) {
            this.logger.endOperation('blacklistToken', operationId, false);
            this.logger.error('Failed to blacklist token', error.stack, 'TokenService.blacklistToken', JSON.stringify({ errorMessage: error.message }));
        }
    }
    async isTokenBlacklisted(token) {
        try {
            const payload = this.jwtService.decode(token);
            if (!payload || !payload.sessionId || !payload.iat) {
                return false;
            }
            const blacklistKey = `blacklist:token:${payload.sessionId}:${payload.iat}`;
            const isBlacklisted = await this.redis.exists(blacklistKey);
            return isBlacklisted;
        }
        catch (error) {
            this.logger.error('Error checking token blacklist', error.stack, 'TokenService.isTokenBlacklisted', JSON.stringify({ errorMessage: error.message }));
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
            this.logger.error('Error checking refresh token usage', error.stack, 'TokenService.isRefreshTokenUsed', JSON.stringify({ tokenId, errorMessage: error.message }));
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
            const now = Math.floor(Date.now() / 1000);
            const accessPayload = {
                sub: userId,
                email,
                iat: now,
                exp: now + auth_constants_1.AUTH_CONSTANTS.JWT.ACCESS_TOKEN_EXPIRY,
                aud: 'entrix-users',
                iss: 'entrix-v3',
                sessionId,
                deviceFingerprint,
                roles: roles || [],
                permissions: permissions || [],
            };
            const refreshExpiryDuration = rememberMe
                ? auth_constants_1.AUTH_CONSTANTS.JWT.REFRESH_TOKEN_EXPIRY_REMEMBER
                : auth_constants_1.AUTH_CONSTANTS.JWT.REFRESH_TOKEN_EXPIRY;
            const refreshPayload = {
                sub: userId,
                sessionId,
                tokenId: this.generateTokenId(),
                iat: now,
                exp: now + refreshExpiryDuration,
                aud: 'entrix-refresh',
                iss: 'entrix-v3',
            };
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
            this.logger.logBusinessEvent('TOKEN_PAIR_GENERATED', {
                userId,
                sessionId,
                rememberMe,
                accessExpiresIn: auth_constants_1.AUTH_CONSTANTS.JWT.ACCESS_TOKEN_EXPIRY,
                refreshExpiresIn: refreshExpiryDuration,
            }, userId);
            this.logger.endOperation('generateTokenPair', operationId, true);
            return tokenPair;
        }
        catch (error) {
            this.logger.endOperation('generateTokenPair', operationId, false);
            this.logger.error('Failed to generate token pair', error.stack, 'TokenService.generateTokenPair', JSON.stringify({
                userId,
                sessionId,
                rememberMe,
                errorMessage: error.message,
            }));
            throw error;
        }
    }
    async markRefreshTokenAsUsed(tokenId, token) {
        try {
            const usedKey = `refresh_used:${tokenId}`;
            await this.redis.setCache(usedKey, token, auth_constants_1.AUTH_CONSTANTS.JWT.REFRESH_TOKEN_EXPIRY);
        }
        catch (error) {
            this.logger.error('Failed to mark refresh token as used', error.stack, 'TokenService.markRefreshTokenAsUsed', JSON.stringify({ tokenId, errorMessage: error.message }));
        }
    }
    async cleanupExpiredTokens() {
        const operationId = this.logger.startOperation('cleanupExpiredTokens');
        try {
            let cleanedCount = 0;
            const refreshUsedPattern = 'refresh_used:*';
            this.logger.logBusinessEvent('TOKEN_CLEANUP_COMPLETED', {
                cleanedCount,
            });
            this.logger.endOperation('cleanupExpiredTokens', operationId, true);
            return cleanedCount;
        }
        catch (error) {
            this.logger.endOperation('cleanupExpiredTokens', operationId, false);
            this.logger.error('Failed to cleanup expired tokens', error.stack, 'TokenService.cleanupExpiredTokens', JSON.stringify({ errorMessage: error.message }));
            return 0;
        }
    }
    validateAccessTokenPayload(payload) {
        if (!payload || typeof payload !== 'object')
            return false;
        const requiredFields = ['sub', 'email', 'iat', 'exp', 'aud', 'iss', 'sessionId'];
        return requiredFields.every(field => payload[field] !== undefined && payload[field] !== null);
    }
    validateRefreshTokenPayload(payload) {
        if (!payload || typeof payload !== 'object')
            return false;
        const requiredFields = ['sub', 'sessionId', 'tokenId', 'iat', 'exp', 'aud', 'iss'];
        return requiredFields.every(field => payload[field] !== undefined && payload[field] !== null);
    }
    generateTokenId() {
        return `tkn_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    }
    extractJwtPayload(token) {
        try {
            return this.jwtService.decode(token);
        }
        catch {
            return null;
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