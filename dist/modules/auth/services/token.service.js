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
const persistent_token_service_1 = require("./persistent-token.service");
const validation_token_service_1 = require("./validation-token.service");
const auth_constants_1 = require("../constants/auth.constants");
let TokenService = class TokenService {
    jwtService;
    configService;
    redis;
    persistentTokenService;
    validationTokenService;
    logger;
    accessTokenSecret;
    refreshTokenSecret;
    constructor(jwtService, configService, redis, persistentTokenService, validationTokenService, loggerService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.redis = redis;
        this.persistentTokenService = persistentTokenService;
        this.validationTokenService = validationTokenService;
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
            this.logger.endOperation('generateAccessToken', operationId, true);
            return token;
        }
        catch (error) {
            this.logger.endOperation('generateAccessToken', operationId, false);
            this.logger.error('Failed to generate access token', error.stack, 'TokenService.generateAccessToken', JSON.stringify({ errorMessage: error.message }));
            throw error;
        }
    }
    async generateRefreshToken(payload) {
        const operationId = this.logger.startOperation('generateRefreshToken', {
            userId: payload.sub,
            sessionId: payload.sessionId,
        });
        try {
            if (!this.validateRefreshTokenPayload(payload)) {
                throw new Error('Payload JWT invalide pour refresh token');
            }
            const token = this.jwtService.sign(payload, {
                secret: this.refreshTokenSecret,
            });
            this.logger.endOperation('generateRefreshToken', operationId, true);
            return token;
        }
        catch (error) {
            this.logger.endOperation('generateRefreshToken', operationId, false);
            this.logger.error('Failed to generate refresh token', error.stack, 'TokenService.generateRefreshToken', JSON.stringify({ errorMessage: error.message }));
            throw error;
        }
    }
    async generateTokenPair(userId, sessionId, deviceFingerprint, roles, permissions) {
        const operationId = this.logger.startOperation('generateTokenPair', { userId, sessionId });
        try {
            const now = Math.floor(Date.now() / 1000);
            const accessTokenExpiry = now + auth_constants_1.AUTH_CONSTANTS.JWT.ACCESS_TOKEN_EXPIRY;
            const refreshTokenExpiry = now + auth_constants_1.AUTH_CONSTANTS.JWT.REFRESH_TOKEN_EXPIRY;
            const accessPayload = {
                sub: userId,
                email: '',
                iat: now,
                exp: accessTokenExpiry,
                aud: 'entrix-users',
                iss: 'entrix-v3',
                sessionId,
                deviceFingerprint,
                roles: roles || [],
                permissions: permissions || [],
            };
            const refreshPayload = {
                sub: userId,
                sessionId,
                tokenId: this.generateTokenId(),
                iat: now,
                exp: refreshTokenExpiry,
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
            this.logger.endOperation('generateTokenPair', operationId, true);
            return tokenPair;
        }
        catch (error) {
            this.logger.endOperation('generateTokenPair', operationId, false);
            throw error;
        }
    }
    async verifyAccessToken(token) {
        const operationId = this.logger.startOperation('verifyAccessToken');
        try {
            const cacheKey = `token_payload:access:${this.getTokenHash(token)}`;
            const cachedPayload = await this.redis.getCache(cacheKey);
            if (cachedPayload) {
                this.logger.endOperation('verifyAccessToken', operationId, true);
                return cachedPayload;
            }
            const isBlacklisted = await this.isTokenBlacklisted(token);
            if (isBlacklisted) {
                throw new Error('Token is blacklisted');
            }
            const payload = this.jwtService.verify(token, {
                secret: this.accessTokenSecret,
                issuer: 'entrix-v3',
                audience: 'entrix-users',
            });
            if (!this.validateAccessTokenPayload(payload)) {
                throw new Error('Payload JWT invalide');
            }
            const ttl = Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
            if (ttl > 0) {
                await this.redis.setCache(cacheKey, payload, Math.min(ttl, 300));
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
            const cacheKey = `token_payload:refresh:${this.getTokenHash(token)}`;
            const cachedPayload = await this.redis.getCache(cacheKey);
            if (cachedPayload) {
                const isUsed = await this.isRefreshTokenUsed(cachedPayload.tokenId);
                if (isUsed) {
                    throw new Error('Refresh token déjà utilisé');
                }
                this.logger.endOperation('verifyRefreshToken', operationId, true);
                return cachedPayload;
            }
            const payload = this.jwtService.verify(token, {
                secret: this.refreshTokenSecret,
                issuer: 'entrix-v3',
                audience: 'entrix-refresh',
            });
            if (!this.validateRefreshTokenPayload(payload)) {
                throw new Error('Payload refresh token invalide');
            }
            const isUsed = await this.isRefreshTokenUsed(payload.tokenId);
            if (isUsed) {
                this.logger.warn('Refresh token replay detected', JSON.stringify({
                    tokenId: payload.tokenId,
                    userId: payload.sub,
                    sessionId: payload.sessionId
                }));
                throw new Error('Refresh token déjà utilisé');
            }
            const ttl = Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
            if (ttl > 60) {
                await this.redis.setCache(cacheKey, payload, Math.min(ttl, 300));
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
    async rotateRefreshToken(oldToken, payload) {
        const operationId = this.logger.startOperation('rotateRefreshToken', {
            tokenId: payload.tokenId,
            userId: payload.sub
        });
        try {
            const newTokenId = this.generateTokenId();
            const now = Math.floor(Date.now() / 1000);
            const newAccessPayload = {
                sub: payload.sub,
                email: '',
                iat: now,
                exp: now + auth_constants_1.AUTH_CONSTANTS.JWT.ACCESS_TOKEN_EXPIRY,
                aud: 'entrix-users',
                iss: 'entrix-v3',
                sessionId: payload.sessionId,
            };
            const newRefreshPayload = {
                sub: payload.sub,
                sessionId: payload.sessionId,
                tokenId: newTokenId,
                iat: now,
                exp: now + auth_constants_1.AUTH_CONSTANTS.JWT.REFRESH_TOKEN_EXPIRY,
                aud: 'entrix-refresh',
                iss: 'entrix-v3',
            };
            const [newAccessToken, newRefreshToken] = await Promise.all([
                this.generateAccessToken(newAccessPayload),
                this.generateRefreshToken(newRefreshPayload),
            ]);
            await this.markRefreshTokenAsUsed(payload.tokenId, oldToken);
            const oldCacheKey = `token_payload:refresh:${this.getTokenHash(oldToken)}`;
            await this.redis.delCache(oldCacheKey);
            this.logger.endOperation('rotateRefreshToken', operationId, true);
            this.logger.info('Refresh token rotated successfully', JSON.stringify({
                oldTokenId: payload.tokenId,
                newTokenId,
                userId: payload.sub
            }));
            return {
                newAccessToken,
                newRefreshToken,
                expiresIn: auth_constants_1.AUTH_CONSTANTS.JWT.ACCESS_TOKEN_EXPIRY,
            };
        }
        catch (error) {
            this.logger.endOperation('rotateRefreshToken', operationId, false);
            this.logger.error('Failed to rotate refresh token', error.stack, 'TokenService.rotateRefreshToken', JSON.stringify({
                errorMessage: error.message,
                tokenId: payload.tokenId,
                userId: payload.sub
            }));
            throw error;
        }
    }
    async cleanupUsedRefreshTokens() {
        const operationId = this.logger.startOperation('cleanupUsedRefreshTokens');
        try {
            let cleanedCount = 0;
            this.logger.info('Used refresh tokens cleanup completed', JSON.stringify({
                cleanedCount
            }));
            this.logger.endOperation('cleanupUsedRefreshTokens', operationId, true);
            return cleanedCount;
        }
        catch (error) {
            this.logger.endOperation('cleanupUsedRefreshTokens', operationId, false);
            this.logger.error('Failed to cleanup used refresh tokens', error.stack, 'TokenService.cleanupUsedRefreshTokens', JSON.stringify({ errorMessage: error.message }));
            return 0;
        }
    }
    async blacklistToken(token) {
        const operationId = this.logger.startOperation('blacklistToken');
        try {
            const payload = this.extractJwtPayload(token);
            if (!payload || !payload.exp) {
                throw new Error('Token invalide pour blacklisting');
            }
            const tokenHash = this.getTokenHash(token);
            const ttl = Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
            if (ttl > 0) {
                const blacklistKey = `blacklist:${tokenHash}`;
                await this.redis.setCache(blacklistKey, true, ttl);
            }
            this.logger.endOperation('blacklistToken', operationId, true);
        }
        catch (error) {
            this.logger.endOperation('blacklistToken', operationId, false);
            this.logger.error('Failed to blacklist token', error.stack, 'TokenService.blacklistToken', JSON.stringify({ errorMessage: error.message }));
            throw error;
        }
    }
    async isTokenBlacklisted(token) {
        try {
            const blacklistKey = `blacklist:${this.getTokenHash(token)}`;
            const result = await this.redis.getCache(blacklistKey);
            return !!result;
        }
        catch (error) {
            this.logger.warn('Failed to check token blacklist', error.message);
            return false;
        }
    }
    async debugRefreshTokenState(token) {
        const errors = [];
        let payload = null;
        let isValid = false;
        let isUsed = false;
        let isBlacklisted = false;
        try {
            payload = this.jwtService.decode(token);
            if (!payload) {
                errors.push('Token cannot be decoded');
            }
            try {
                const verifiedPayload = this.jwtService.verify(token, {
                    secret: this.refreshTokenSecret,
                    issuer: 'entrix-v3',
                    audience: 'entrix-refresh',
                });
                isValid = true;
                payload = verifiedPayload;
            }
            catch (verifyError) {
                errors.push(`Verification failed: ${verifyError.message}`);
            }
            if (payload?.tokenId) {
                isUsed = await this.isRefreshTokenUsed(payload.tokenId);
            }
            isBlacklisted = await this.isTokenBlacklisted(token);
        }
        catch (error) {
            errors.push(`Debug error: ${error.message}`);
        }
        return {
            isValid,
            isUsed,
            isBlacklisted,
            payload,
            errors
        };
    }
    async forceCleanupRefreshToken(tokenId) {
        try {
            const usedKey = `refresh_used:${tokenId}`;
            await this.redis.delCache(usedKey);
            this.logger.info('Refresh token forcefully cleaned', JSON.stringify({
                tokenId
            }));
            return true;
        }
        catch (error) {
            this.logger.error('Failed to force cleanup refresh token', error.stack);
            return false;
        }
    }
    async generateApiKey(userId, name, scopes) {
        const operationId = this.logger.startOperation('generateApiKey', { userId });
        try {
            const apiKey = await this.persistentTokenService.generateApiKey(userId, name, scopes);
            this.logger.endOperation('generateApiKey', operationId, true);
            return {
                token: apiKey.token,
                prefix: apiKey.token_prefix,
                id: apiKey.id,
            };
        }
        catch (error) {
            this.logger.endOperation('generateApiKey', operationId, false);
            throw error;
        }
    }
    async validateApiKey(token) {
        const operationId = this.logger.startOperation('validateApiKey');
        try {
            const validation = await this.persistentTokenService.validateApiKey(token);
            this.logger.endOperation('validateApiKey', operationId, true);
            return {
                isValid: validation.isValid,
                userId: validation.userId,
                scopes: validation.scopes,
            };
        }
        catch (error) {
            this.logger.endOperation('validateApiKey', operationId, false);
            throw error;
        }
    }
    async generateEmailVerificationToken(email, userId) {
        const operationId = this.logger.startOperation('generateEmailVerificationToken', { email });
        try {
            const token = await this.validationTokenService.createEmailVerificationToken(email, userId);
            this.logger.warn('token de validation email : ' + token);
            this.logger.endOperation('generateEmailVerificationToken', operationId, true);
            return {
                token: token.token,
                id: token.id,
                expires_at: token.expires_at,
            };
        }
        catch (error) {
            this.logger.endOperation('generateEmailVerificationToken', operationId, false);
            throw error;
        }
    }
    async generatePasswordResetToken(email) {
        const operationId = this.logger.startOperation('generatePasswordResetToken', { email });
        try {
            const token = await this.validationTokenService.createPasswordResetToken(email);
            this.logger.endOperation('generatePasswordResetToken', operationId, true);
            return {
                token: token.token,
                id: token.id,
                expires_at: token.expires_at,
            };
        }
        catch (error) {
            this.logger.endOperation('generatePasswordResetToken', operationId, false);
            throw error;
        }
    }
    async validateAnyToken(token) {
        const operationId = this.logger.startOperation('validateAnyToken');
        try {
            if (token.startsWith('ent_')) {
                const validation = await this.persistentTokenService.validateToken(token);
                this.logger.endOperation('validateAnyToken', operationId, true);
                return {
                    isValid: validation.isValid,
                    type: 'persistent',
                    payload: validation.token,
                    userId: validation.userId,
                };
            }
            try {
                const payload = await this.verifyAccessToken(token);
                this.logger.endOperation('validateAnyToken', operationId, true);
                return {
                    isValid: true,
                    type: 'jwt_access',
                    payload,
                    userId: payload.sub,
                };
            }
            catch (accessError) {
                try {
                    const payload = await this.verifyRefreshToken(token);
                    this.logger.endOperation('validateAnyToken', operationId, true);
                    return {
                        isValid: true,
                        type: 'jwt_refresh',
                        payload,
                        userId: payload.sub,
                    };
                }
                catch (refreshError) {
                    const validation = await this.validationTokenService.validateToken(token);
                    this.logger.endOperation('validateAnyToken', operationId, true);
                    return {
                        isValid: validation.isValid,
                        type: 'validation',
                        payload: validation.token,
                        userId: validation.token?.user_id,
                    };
                }
            }
        }
        catch (error) {
            this.logger.endOperation('validateAnyToken', operationId, false);
            return {
                isValid: false,
                type: 'jwt_access',
            };
        }
    }
    async cleanupExpiredTokens() {
        const operationId = this.logger.startOperation('cleanupExpiredTokens');
        try {
            const [persistentCleaned, validationCleaned, blacklistCleaned] = await Promise.all([
                this.persistentTokenService.cleanupExpiredTokens(),
                this.validationTokenService.cleanupExpiredTokens(),
                this.cleanupExpiredBlacklistKeys(),
            ]);
            this.logger.endOperation('cleanupExpiredTokens', operationId, true);
            this.logger.info('Token cleanup completed', JSON.stringify({
                persistent_tokens: persistentCleaned,
                validation_tokens: validationCleaned,
                blacklisted_keys: blacklistCleaned,
            }));
            return {
                persistent_tokens: persistentCleaned,
                validation_tokens: validationCleaned,
                blacklisted_keys: blacklistCleaned,
            };
        }
        catch (error) {
            this.logger.endOperation('cleanupExpiredTokens', operationId, false);
            this.logger.error('Failed to cleanup expired tokens', error.stack, 'TokenService.cleanupExpiredTokens', JSON.stringify({ errorMessage: error.message }));
            return {
                persistent_tokens: 0,
                validation_tokens: 0,
                blacklisted_keys: 0,
            };
        }
    }
    async getGlobalTokenStats() {
        try {
            const [persistentStats, validationStats, jwtStats] = await Promise.all([
                this.persistentTokenService.getTokenStats(),
                this.validationTokenService.getTokenStats(),
                this.getJwtTokenStats(),
            ]);
            return {
                persistent_tokens: persistentStats,
                validation_tokens: validationStats,
                jwt_tokens: jwtStats,
            };
        }
        catch (error) {
            this.logger.error('Error getting global token stats', error.stack);
            return {
                persistent_tokens: {},
                validation_tokens: {},
                jwt_tokens: { blacklisted_count: 0, cache_size: 0 },
            };
        }
    }
    getTokenHash(token) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(token).digest('hex').substring(0, 16);
    }
    validateAccessTokenPayload(payload) {
        if (!payload || typeof payload !== 'object')
            return false;
        const requiredFields = ['sub', 'iat', 'exp', 'aud', 'iss', 'sessionId'];
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
    async isRefreshTokenUsed(tokenId) {
        try {
            const usedKey = `refresh_used:${tokenId}`;
            const result = await this.redis.getCache(usedKey);
            if (result) {
                this.logger.debug('Refresh token usage check', JSON.stringify({
                    tokenId,
                    usedKey,
                    result: !!result
                }));
            }
            return !!result;
        }
        catch (error) {
            this.logger.error('Error checking refresh token usage', error.stack, 'TokenService.isRefreshTokenUsed', JSON.stringify({ tokenId, errorMessage: error.message }));
            return false;
        }
    }
    async markRefreshTokenAsUsed(tokenId, token) {
        try {
            const usedKey = `refresh_used:${tokenId}`;
            const payload = this.jwtService.decode(token);
            let ttl = 3600;
            if (payload?.exp) {
                ttl = Math.max(60, payload.exp - Math.floor(Date.now() / 1000));
            }
            const usageData = {
                usedAt: new Date().toISOString(),
                tokenId,
                userId: payload?.sub
            };
            await this.redis.setCache(usedKey, usageData, ttl);
            this.logger.debug('Refresh token marked as used', JSON.stringify({
                tokenId,
                ttl,
                usedAt: usageData.usedAt
            }));
        }
        catch (error) {
            this.logger.error('Error marking refresh token as used', error.stack, 'TokenService.markRefreshTokenAsUsed', JSON.stringify({ tokenId, errorMessage: error.message }));
        }
    }
    async cleanupExpiredBlacklistKeys() {
        try {
            return 0;
        }
        catch (error) {
            this.logger.error('Error cleaning up blacklist keys', error.stack);
            return 0;
        }
    }
    async getJwtTokenStats() {
        try {
            return {
                blacklisted_count: 0,
                cache_size: 0,
            };
        }
        catch (error) {
            this.logger.error('Error getting JWT stats', error.stack);
            return {
                blacklisted_count: 0,
                cache_size: 0,
            };
        }
    }
};
exports.TokenService = TokenService;
exports.TokenService = TokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        redis_service_1.RedisService,
        persistent_token_service_1.PersistentTokenService,
        validation_token_service_1.ValidationTokenService,
        logger_service_1.LoggerService])
], TokenService);
//# sourceMappingURL=token.service.js.map