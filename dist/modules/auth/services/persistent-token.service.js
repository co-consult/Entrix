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
exports.PersistentTokenService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const hashing_service_1 = require("../../../shared/hashing/hashing.service");
let PersistentTokenService = class PersistentTokenService {
    prisma;
    redis;
    configService;
    hashingService;
    logger;
    CACHE_PREFIX = 'persistent_token:';
    CACHE_TTL = 300;
    constructor(prisma, redis, configService, hashingService, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.configService = configService;
        this.hashingService = hashingService;
        this.logger = loggerService.createChildLogger('PersistentTokenService');
    }
    async createToken(data) {
        const operationId = this.logger.startOperation('createToken', {
            userId: data.user_id,
            tokenType: data.token_type,
        });
        try {
            const { token, tokenHash, tokenPrefix } = await this.generateTokenData(data.token_type);
            const expiresAt = data.expires_at || this.calculateDefaultExpiry(data.token_type);
            const persistentToken = await this.prisma.persistent_tokens.create({
                data: {
                    user_id: data.user_id,
                    token_type: data.token_type,
                    token_hash: tokenHash,
                    token_prefix: tokenPrefix,
                    name: data.name || null,
                    description: data.description || null,
                    scopes: data.scopes || [],
                    expires_at: expiresAt,
                    device_info: data.device_info || null,
                    metadata: data.metadata || null,
                },
            });
            await this.invalidateUserCache(data.user_id);
            const generated = {
                id: persistentToken.id,
                token: token,
                token_prefix: tokenPrefix,
                token_type: data.token_type,
                user_id: data.user_id,
                scopes: persistentToken.scopes,
                expires_at: expiresAt,
                created_at: persistentToken.created_at,
            };
            this.logger.endOperation('createToken', operationId, true);
            this.logger.info('Persistent token created', JSON.stringify({
                tokenId: persistentToken.id,
                userId: data.user_id,
                type: data.token_type,
            }));
            return generated;
        }
        catch (error) {
            this.logger.endOperation('createToken', operationId, false);
            this.logger.error('Failed to create persistent token', error.stack, 'PersistentTokenService.createToken', JSON.stringify({ errorMessage: error.message, userId: data.user_id }));
            throw error;
        }
    }
    async generateApiKey(userId, name, scopes) {
        const operationId = this.logger.startOperation('generateApiKey', { userId });
        try {
            await this.checkUserTokenLimits(userId, 'API_KEY');
            const tokenData = {
                user_id: userId,
                token_type: 'API_KEY',
                name: name || 'API Key',
                description: 'Generated API key for external integrations',
                scopes: scopes || ['read:profile', 'read:events'],
                expires_at: null,
            };
            const result = await this.createToken(tokenData);
            this.logger.endOperation('generateApiKey', operationId, true);
            return result;
        }
        catch (error) {
            this.logger.endOperation('generateApiKey', operationId, false);
            throw error;
        }
    }
    async generateLongRefreshToken(userId, deviceInfo) {
        const operationId = this.logger.startOperation('generateLongRefreshToken', { userId });
        try {
            const tokenData = {
                user_id: userId,
                token_type: 'REFRESH_LONG',
                name: 'Long Refresh Token',
                description: 'Long-lasting refresh token for remember me functionality',
                device_info: deviceInfo,
            };
            const result = await this.createToken(tokenData);
            this.logger.endOperation('generateLongRefreshToken', operationId, true);
            return result;
        }
        catch (error) {
            this.logger.endOperation('generateLongRefreshToken', operationId, false);
            throw error;
        }
    }
    async validateToken(token) {
        const operationId = this.logger.startOperation('validateToken');
        try {
            const tokenPrefix = this.extractTokenPrefix(token);
            const tokenHash = await this.hashingService.hashPassword(token);
            const persistentToken = await this.prisma.persistent_tokens.findUnique({
                where: { token_hash: tokenHash },
                include: { users: { select: { id: true, is_active: true, email: true } } },
            });
            if (!persistentToken) {
                return {
                    isValid: false,
                    errors: ['Token not found'],
                };
            }
            const validationErrors = [];
            if (!persistentToken.is_active) {
                validationErrors.push('Token is inactive');
            }
            if (persistentToken.is_revoked) {
                validationErrors.push('Token has been revoked');
            }
            if (persistentToken.expires_at && persistentToken.expires_at < new Date()) {
                validationErrors.push('Token has expired');
            }
            if (!persistentToken.users?.is_active) {
                validationErrors.push('User account is inactive');
            }
            const isValid = validationErrors.length === 0;
            if (isValid) {
                await this.recordTokenUsage(persistentToken.id);
            }
            const validation = {
                isValid,
                token: isValid ? persistentToken : undefined,
                userId: isValid ? persistentToken.user_id : undefined,
                scopes: isValid ? persistentToken.scopes : undefined,
                errors: validationErrors.length > 0 ? validationErrors : undefined,
                lastUsed: persistentToken.last_used_at || undefined,
                usageCount: persistentToken.usage_count,
            };
            this.logger.endOperation('validateToken', operationId, true);
            return validation;
        }
        catch (error) {
            this.logger.endOperation('validateToken', operationId, false);
            this.logger.error('Failed to validate persistent token', error.stack, 'PersistentTokenService.validateToken', JSON.stringify({ errorMessage: error.message }));
            return {
                isValid: false,
                errors: ['Internal validation error'],
            };
        }
    }
    async validateApiKey(token) {
        const validation = await this.validateToken(token);
        if (validation.isValid && validation.token?.token_type !== 'API_KEY') {
            return {
                isValid: false,
                errors: ['Token is not an API key'],
            };
        }
        return validation;
    }
    async isTokenValid(tokenId) {
        try {
            const token = await this.prisma.persistent_tokens.findUnique({
                where: { id: tokenId },
                select: {
                    is_active: true,
                    is_revoked: true,
                    expires_at: true
                },
            });
            if (!token)
                return false;
            return (token.is_active &&
                !token.is_revoked &&
                (!token.expires_at || token.expires_at > new Date()));
        }
        catch (error) {
            this.logger.error('Error checking token validity', error.stack);
            return false;
        }
    }
    async updateToken(tokenId, data) {
        const operationId = this.logger.startOperation('updateToken', { tokenId });
        try {
            const updatedToken = await this.prisma.persistent_tokens.update({
                where: { id: tokenId },
                data: {
                    name: data.name,
                    description: data.description,
                    scopes: data.scopes,
                    expires_at: data.expires_at,
                    is_active: data.is_active,
                    metadata: data.metadata,
                    updated_at: new Date(),
                },
            });
            await this.invalidateUserCache(updatedToken.user_id);
            this.logger.endOperation('updateToken', operationId, true);
            this.logger.info('Persistent token updated', JSON.stringify({
                tokenId,
                userId: updatedToken.user_id,
            }));
            return updatedToken;
        }
        catch (error) {
            this.logger.endOperation('updateToken', operationId, false);
            this.logger.error('Failed to update persistent token', error.stack, 'PersistentTokenService.updateToken', JSON.stringify({ errorMessage: error.message, tokenId }));
            throw error;
        }
    }
    async revokeToken(tokenId, reason, revokedBy) {
        const operationId = this.logger.startOperation('revokeToken', { tokenId });
        try {
            const revokedToken = await this.prisma.persistent_tokens.update({
                where: { id: tokenId },
                data: {
                    is_revoked: true,
                    revoked_at: new Date(),
                    revoked_by: revokedBy || null,
                    revoked_reason: reason || 'Manual revocation',
                    updated_at: new Date(),
                },
            });
            await this.invalidateUserCache(revokedToken.user_id);
            this.logger.endOperation('revokeToken', operationId, true);
            this.logger.info('Persistent token revoked', JSON.stringify({
                tokenId,
                userId: revokedToken.user_id,
                reason,
            }));
            return true;
        }
        catch (error) {
            this.logger.endOperation('revokeToken', operationId, false);
            this.logger.error('Failed to revoke persistent token', error.stack, 'PersistentTokenService.revokeToken', JSON.stringify({ errorMessage: error.message, tokenId }));
            return false;
        }
    }
    async revokeAllUserTokens(userId, reason) {
        const operationId = this.logger.startOperation('revokeAllUserTokens', { userId });
        try {
            const result = await this.prisma.persistent_tokens.updateMany({
                where: {
                    user_id: userId,
                    is_revoked: false,
                },
                data: {
                    is_revoked: true,
                    revoked_at: new Date(),
                    revoked_reason: reason || 'Bulk revocation',
                    updated_at: new Date(),
                },
            });
            await this.invalidateUserCache(userId);
            this.logger.endOperation('revokeAllUserTokens', operationId, true);
            this.logger.info('All user tokens revoked', JSON.stringify({
                userId,
                count: result.count,
                reason,
            }));
            return result.count;
        }
        catch (error) {
            this.logger.endOperation('revokeAllUserTokens', operationId, false);
            this.logger.error('Failed to revoke all user tokens', error.stack, 'PersistentTokenService.revokeAllUserTokens', JSON.stringify({ errorMessage: error.message, userId }));
            return 0;
        }
    }
    async getToken(tokenId) {
        try {
            return await this.prisma.persistent_tokens.findUnique({
                where: { id: tokenId },
            });
        }
        catch (error) {
            this.logger.error('Error getting token', error.stack);
            return null;
        }
    }
    async getUserTokens(userId, filters) {
        const operationId = this.logger.startOperation('getUserTokens', { userId });
        try {
            const cacheKey = `${this.CACHE_PREFIX}user:${userId}`;
            const cached = await this.redis.getCache(cacheKey);
            if (cached) {
                this.logger.endOperation('getUserTokens', operationId, true);
                return cached;
            }
            const whereClause = {
                user_id: userId,
                ...(filters?.token_type && { token_type: filters.token_type }),
                ...(filters?.is_active !== undefined && { is_active: filters.is_active }),
                ...(filters?.is_revoked !== undefined && { is_revoked: filters.is_revoked }),
                ...(filters?.expires_before && { expires_at: { lt: filters.expires_before } }),
                ...(filters?.expires_after && { expires_at: { gt: filters.expires_after } }),
            };
            const tokens = await this.prisma.persistent_tokens.findMany({
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    description: true,
                    token_type: true,
                    token_prefix: true,
                    scopes: true,
                    expires_at: true,
                    last_used_at: true,
                    usage_count: true,
                    is_active: true,
                    created_at: true,
                },
                orderBy: { created_at: 'desc' },
            });
            const tokenList = tokens.map(token => ({
                id: token.id,
                name: token.name,
                description: token.description,
                token_type: token.token_type,
                token_prefix: token.token_prefix,
                scopes: token.scopes,
                expires_at: token.expires_at?.toISOString() || null,
                last_used_at: token.last_used_at?.toISOString() || null,
                usage_count: token.usage_count,
                is_active: token.is_active,
                created_at: token.created_at.toISOString(),
            }));
            await this.redis.setCache(cacheKey, tokenList, this.CACHE_TTL);
            this.logger.endOperation('getUserTokens', operationId, true);
            return tokenList;
        }
        catch (error) {
            this.logger.endOperation('getUserTokens', operationId, false);
            this.logger.error('Failed to get user tokens', error.stack, 'PersistentTokenService.getUserTokens', JSON.stringify({ errorMessage: error.message, userId }));
            return [];
        }
    }
    async getTokensByType(type, filters) {
        try {
            const whereClause = {
                token_type: type,
                ...(filters?.user_id && { user_id: filters.user_id }),
                ...(filters?.is_active !== undefined && { is_active: filters.is_active }),
                ...(filters?.is_revoked !== undefined && { is_revoked: filters.is_revoked }),
            };
            return await this.prisma.persistent_tokens.findMany({
                where: whereClause,
                orderBy: { created_at: 'desc' },
            });
        }
        catch (error) {
            this.logger.error('Error getting tokens by type', error.stack);
            return [];
        }
    }
    async recordTokenUsage(tokenId, ipAddress) {
        try {
            await this.prisma.persistent_tokens.update({
                where: { id: tokenId },
                data: {
                    last_used_at: new Date(),
                    last_used_ip: ipAddress || null,
                    usage_count: {
                        increment: 1,
                    },
                    updated_at: new Date(),
                },
            });
        }
        catch (error) {
            this.logger.error('Error recording token usage', error.stack);
        }
    }
    async getTokenStats(userId) {
        try {
            const whereClause = userId ? { user_id: userId } : {};
            const [total, active, expired, revoked, byType] = await Promise.all([
                this.prisma.persistent_tokens.count({ where: whereClause }),
                this.prisma.persistent_tokens.count({
                    where: { ...whereClause, is_active: true, is_revoked: false }
                }),
                this.prisma.persistent_tokens.count({
                    where: {
                        ...whereClause,
                        expires_at: { lt: new Date() }
                    }
                }),
                this.prisma.persistent_tokens.count({
                    where: { ...whereClause, is_revoked: true }
                }),
                this.getTokenCountByType(userId),
            ]);
            const recentUsage = await this.getRecentUsageStats(userId);
            return {
                total,
                active,
                expired,
                revoked,
                by_type: byType,
                recent_usage: recentUsage,
            };
        }
        catch (error) {
            this.logger.error('Error getting token stats', error.stack);
            return {
                total: 0,
                active: 0,
                expired: 0,
                revoked: 0,
                by_type: {},
                recent_usage: { last_24h: 0, last_7d: 0, last_30d: 0 },
            };
        }
    }
    async getTokenUsageHistory(tokenId, days = 30) {
        const operationId = this.logger.startOperation('getTokenUsageHistory', { tokenId, days });
        try {
            const token = await this.prisma.persistent_tokens.findUnique({
                where: { id: tokenId },
                select: {
                    id: true,
                    usage_count: true,
                    last_used_at: true,
                    last_used_ip: true,
                    created_at: true,
                },
            });
            if (!token) {
                this.logger.endOperation('getTokenUsageHistory', operationId, false);
                return [];
            }
            const history = [];
            if (token.last_used_at) {
                history.push({
                    timestamp: token.last_used_at.toISOString(),
                    action: 'token_used',
                    ip_address: token.last_used_ip,
                    usage_count: token.usage_count,
                });
            }
            history.push({
                timestamp: token.created_at.toISOString(),
                action: 'token_created',
                ip_address: null,
                usage_count: 0,
            });
            this.logger.endOperation('getTokenUsageHistory', operationId, true);
            return history.reverse();
        }
        catch (error) {
            this.logger.endOperation('getTokenUsageHistory', operationId, false);
            this.logger.error('Failed to get token usage history', error.stack, 'PersistentTokenService.getTokenUsageHistory', JSON.stringify({ errorMessage: error.message, tokenId }));
            return [];
        }
    }
    async cleanupExpiredTokens() {
        const operationId = this.logger.startOperation('cleanupExpiredTokens');
        try {
            const result = await this.prisma.persistent_tokens.deleteMany({
                where: {
                    expires_at: { lt: new Date() },
                    is_revoked: true,
                },
            });
            this.logger.endOperation('cleanupExpiredTokens', operationId, true);
            this.logger.info('Expired tokens cleaned up', JSON.stringify({
                count: result.count,
            }));
            return result.count;
        }
        catch (error) {
            this.logger.endOperation('cleanupExpiredTokens', operationId, false);
            this.logger.error('Failed to cleanup expired tokens', error.stack, 'PersistentTokenService.cleanupExpiredTokens', JSON.stringify({ errorMessage: error.message }));
            return 0;
        }
    }
    async cleanupRevokedTokens(olderThanDays = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
            const result = await this.prisma.persistent_tokens.deleteMany({
                where: {
                    is_revoked: true,
                    revoked_at: { lt: cutoffDate },
                },
            });
            this.logger.info('Revoked tokens cleaned up', JSON.stringify({
                count: result.count,
                olderThanDays,
            }));
            return result.count;
        }
        catch (error) {
            this.logger.error('Error cleaning up revoked tokens', error.stack);
            return 0;
        }
    }
    async refreshToken(tokenId) {
        const operationId = this.logger.startOperation('refreshToken', { tokenId });
        try {
            const existingToken = await this.prisma.persistent_tokens.findUnique({
                where: { id: tokenId },
            });
            if (!existingToken) {
                throw new Error('Token not found');
            }
            const { token, tokenHash } = await this.generateTokenData(existingToken.token_type);
            const updatedToken = await this.prisma.persistent_tokens.update({
                where: { id: tokenId },
                data: {
                    token_hash: tokenHash,
                    usage_count: 0,
                    last_used_at: null,
                    updated_at: new Date(),
                },
            });
            await this.invalidateUserCache(updatedToken.user_id);
            const refreshed = {
                id: updatedToken.id,
                token: token,
                token_prefix: updatedToken.token_prefix,
                token_type: updatedToken.token_type,
                user_id: updatedToken.user_id,
                scopes: updatedToken.scopes,
                expires_at: updatedToken.expires_at,
                created_at: updatedToken.created_at,
            };
            this.logger.endOperation('refreshToken', operationId, true);
            return refreshed;
        }
        catch (error) {
            this.logger.endOperation('refreshToken', operationId, false);
            throw error;
        }
    }
    async generateTokenData(type) {
        const tokenPrefix = this.getTokenPrefix(type);
        const randomPart = this.generateSecureToken(32);
        const token = `${tokenPrefix}${randomPart}`;
        const tokenHash = await this.hashingService.hashPassword(token);
        return { token, tokenHash, tokenPrefix };
    }
    getTokenPrefix(type) {
        const prefixes = {
            'API_KEY': 'ent_api_',
            'REFRESH_LONG': 'ent_ref_',
            'ACCESS_LONG': 'ent_acc_',
            'MOBILE_SESSION': 'ent_mob_',
            'INTEGRATION': 'ent_int_',
        };
        return prefixes[type] || 'ent_tkn_';
    }
    extractTokenPrefix(token) {
        const match = token.match(/^(ent_[a-z]+_)/);
        return match ? match[1] : '';
    }
    generateSecureToken(length) {
        const crypto = require('crypto');
        return crypto.randomBytes(length).toString('base64url');
    }
    calculateDefaultExpiry(type) {
        const now = new Date();
        switch (type) {
            case 'API_KEY':
                return null;
            case 'REFRESH_LONG':
                now.setDate(now.getDate() + 90);
                return now;
            case 'ACCESS_LONG':
                now.setDate(now.getDate() + 30);
                return now;
            case 'MOBILE_SESSION':
                now.setDate(now.getDate() + 365);
                return now;
            case 'INTEGRATION':
                return null;
            default:
                now.setDate(now.getDate() + 30);
                return now;
        }
    }
    async checkUserTokenLimits(userId, type) {
        const limits = {
            'API_KEY': 10,
            'REFRESH_LONG': 5,
            'ACCESS_LONG': 5,
            'MOBILE_SESSION': 3,
            'INTEGRATION': 5,
        };
        const count = await this.prisma.persistent_tokens.count({
            where: {
                user_id: userId,
                token_type: type,
                is_active: true,
                is_revoked: false,
            },
        });
        if (count >= limits[type]) {
            throw new Error(`User has reached the limit of ${limits[type]} ${type} tokens`);
        }
    }
    async getTokenCountByType(userId) {
        const whereClause = userId ? { user_id: userId } : {};
        const counts = await this.prisma.persistent_tokens.groupBy({
            by: ['token_type'],
            where: whereClause,
            _count: { id: true },
        });
        const result = {};
        counts.forEach(count => {
            result[count.token_type] = count._count.id;
        });
        return result;
    }
    async getRecentUsageStats(userId) {
        const now = new Date();
        const whereClause = userId ? { user_id: userId } : {};
        const [last24h, last7d, last30d] = await Promise.all([
            this.prisma.persistent_tokens.count({
                where: {
                    ...whereClause,
                    last_used_at: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
                },
            }),
            this.prisma.persistent_tokens.count({
                where: {
                    ...whereClause,
                    last_used_at: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
                },
            }),
            this.prisma.persistent_tokens.count({
                where: {
                    ...whereClause,
                    last_used_at: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
                },
            }),
        ]);
        return {
            last_24h: last24h,
            last_7d: last7d,
            last_30d: last30d,
        };
    }
    async invalidateUserCache(userId) {
        try {
            const cacheKey = `${this.CACHE_PREFIX}user:${userId}`;
            await this.redis.delCache(cacheKey);
        }
        catch (error) {
            this.logger.error('Error invalidating user cache', error.stack);
        }
    }
};
exports.PersistentTokenService = PersistentTokenService;
exports.PersistentTokenService = PersistentTokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        config_1.ConfigService,
        hashing_service_1.HashingService,
        logger_service_1.LoggerService])
], PersistentTokenService);
//# sourceMappingURL=persistent-token.service.js.map