"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
let TokenService = class TokenService {
    jwtService;
    prisma;
    redis;
    config;
    logger;
    accessTokenExpiry;
    refreshTokenExpiry;
    issuer;
    audience;
    constructor(jwtService, prisma, redis, config, logger) {
        this.jwtService = jwtService;
        this.prisma = prisma;
        this.redis = redis;
        this.config = config;
        this.logger = logger.createChildLogger('TokenService');
        this.accessTokenExpiry = this.config.get('JWT_ACCESS_EXPIRES_IN', '15m');
        this.refreshTokenExpiry = this.config.get('JWT_REFRESH_EXPIRES_IN', '7d');
        this.issuer = this.config.get('JWT_ISSUER', 'entrix.tn');
        this.audience = this.config.get('JWT_AUDIENCE', 'entrix-app');
    }
    async generateAccessToken(payload) {
        this.logger.log(`Génération access token pour utilisateur: ${payload.sub}`);
        try {
            const jwtPayload = {
                sub: payload.sub,
                email: payload.email,
                roles: payload.roles,
                permissions: payload.permissions,
                type: 'access',
                sessionId: payload.sessionId,
                securityLevel: payload.securityLevel,
                mfaVerified: payload.mfaVerified,
            };
            const token = this.jwtService.sign(jwtPayload, {
                expiresIn: this.accessTokenExpiry,
                issuer: this.issuer,
                audience: this.audience,
            });
            this.logger.log(`Access token généré avec succès pour: ${payload.sub}`);
            return token;
        }
        catch (error) {
            this.logger.error(`Erreur génération access token pour ${payload.sub}:`, error);
            throw new common_1.UnauthorizedException('Impossible de générer le token d\'accès');
        }
    }
    async generateRefreshToken(payload) {
        this.logger.log(`Génération refresh token pour utilisateur: ${payload.sub}`);
        try {
            const jwtPayload = {
                sub: payload.sub,
                type: 'refresh',
                sessionId: payload.sessionId,
                tokenVersion: payload.tokenVersion,
            };
            const token = this.jwtService.sign(jwtPayload, {
                expiresIn: this.refreshTokenExpiry,
                issuer: this.issuer,
                audience: this.audience,
            });
            const ttl = this.parseExpiryToSeconds(this.refreshTokenExpiry);
            await this.redis.set(`refresh_token:${payload.sub}:${payload.sessionId}`, token, ttl);
            this.logger.log(`Refresh token généré avec succès pour: ${payload.sub}`);
            return token;
        }
        catch (error) {
            this.logger.error(`Erreur génération refresh token pour ${payload.sub}:`, error);
            throw new common_1.UnauthorizedException('Impossible de générer le token de rafraîchissement');
        }
    }
    async generateTokenPair(user, sessionId) {
        this.logger.log(`Génération paire de tokens pour: ${user.id}`);
        try {
            const userRoles = await this.prisma.user_roles.findMany({
                where: {
                    user_id: user.id,
                    status: 'ACTIVE'
                },
                include: {
                    roles: {
                        select: {
                            code: true,
                            name: true,
                            level: true,
                            permissions: true,
                        }
                    }
                }
            });
            const userExists = await this.prisma.users.findUnique({
                where: { id: user.id }
            });
            if (!userExists) {
                throw new common_1.UnauthorizedException('Utilisateur non trouvé');
            }
            const roles = userRoles.map(ur => ur.roles.code);
            const permissions = this.extractPermissions(userRoles);
            const accessToken = await this.generateAccessToken({
                sub: user.id,
                email: user.email,
                roles,
                permissions,
                type: 'access',
                sessionId,
                securityLevel: 'INFO',
                mfaVerified: false,
            });
            const refreshToken = await this.generateRefreshToken({
                sub: user.id,
                type: 'refresh',
                sessionId,
                tokenVersion: 1,
            });
            const accessExpiresIn = this.parseExpiryToSeconds(this.accessTokenExpiry);
            const refreshExpiresIn = this.parseExpiryToSeconds(this.refreshTokenExpiry);
            return {
                accessToken,
                refreshToken,
                tokenType: 'Bearer',
                expiresIn: accessExpiresIn,
                refreshExpiresIn,
            };
        }
        catch (error) {
            this.logger.error(`Erreur génération paire de tokens pour ${user.id}:`, error);
            throw error;
        }
    }
    async validateToken(token, type) {
        try {
            const isRevoked = await this.isTokenRevoked(token);
            if (isRevoked) {
                return {
                    valid: false,
                    reason: 'Token révoqué',
                    revoked: true,
                };
            }
            const payload = this.jwtService.verify(token);
            if (payload.type !== type) {
                return {
                    valid: false,
                    reason: `Type de token incorrect. Attendu: ${type}, reçu: ${payload.type}`,
                };
            }
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp <= now) {
                return {
                    valid: false,
                    reason: 'Token expiré',
                    expired: true,
                };
            }
            if (type === 'refresh') {
                const refreshPayload = payload;
                const cachedToken = await this.redis.get(`refresh_token:${refreshPayload.sub}:${refreshPayload.sessionId}`);
                if (!cachedToken || cachedToken !== token) {
                    return {
                        valid: false,
                        reason: 'Refresh token non trouvé ou invalide',
                    };
                }
            }
            return {
                valid: true,
                payload,
            };
        }
        catch (error) {
            this.logger.warn(`Token invalide: ${error.message}`);
            return {
                valid: false,
                reason: error.message,
            };
        }
    }
    decodeToken(token) {
        try {
            return this.jwtService.decode(token);
        }
        catch (error) {
            this.logger.warn(`Erreur décodage token: ${error.message}`);
            return null;
        }
    }
    async revokeToken(token) {
        this.logger.log('Révocation d\'un token');
        try {
            const decoded = this.decodeToken(token);
            if (!decoded) {
                this.logger.warn('Tentative révocation d\'un token invalide');
                return;
            }
            const ttl = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
            if (ttl > 0) {
                await this.redis.set(`revoked_token:${this.hashToken(token)}`, '1', ttl);
            }
            if (decoded.type === 'refresh') {
                const refreshPayload = decoded;
                await this.redis.del(`refresh_token:${refreshPayload.sub}:${refreshPayload.sessionId}`);
            }
            this.logger.log(`Token révoqué avec succès pour utilisateur: ${decoded.sub}`);
        }
        catch (error) {
            this.logger.error('Erreur révocation token:', error);
            throw new common_1.UnauthorizedException('Impossible de révoquer le token');
        }
    }
    async revokeAllTokens(userId) {
        this.logger.log(`Révocation de tous les tokens pour: ${userId}`);
        try {
            const sessions = await this.prisma.user_sessions.findMany({
                where: {
                    user_id: userId,
                    is_active: true
                },
                select: { id: true }
            });
            const deletePromises = sessions.map(session => this.redis.del(`refresh_token:${userId}:${session.id}`));
            await Promise.all(deletePromises);
            await this.redis.set(`user_tokens_revoked:${userId}`, Date.now().toString(), 3600);
            this.logger.log(`Tous les tokens révoqués pour: ${userId}`);
        }
        catch (error) {
            this.logger.error(`Erreur révocation tous tokens pour ${userId}:`, error);
            throw new common_1.UnauthorizedException('Impossible de révoquer tous les tokens');
        }
    }
    async isTokenRevoked(token) {
        try {
            const tokenHash = this.hashToken(token);
            const isBlacklisted = await this.redis.get(`revoked_token:${tokenHash}`);
            if (isBlacklisted) {
                return true;
            }
            const decoded = this.decodeToken(token);
            if (decoded) {
                const userRevoked = await this.redis.get(`user_tokens_revoked:${decoded.sub}`);
                if (userRevoked) {
                    const revokedAt = parseInt(userRevoked);
                    const tokenIssuedAt = decoded.iat * 1000;
                    if (tokenIssuedAt < revokedAt) {
                        return true;
                    }
                }
            }
            return false;
        }
        catch (error) {
            this.logger.error('Erreur vérification révocation token:', error);
            return false;
        }
    }
    async generateTemporaryToken(userId, type, expiresIn = 3600) {
        this.logger.log(`Génération token temporaire ${type} pour: ${userId}`);
        try {
            const payload = {
                sub: userId,
                type: `temp_${type}`,
                purpose: type,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + expiresIn,
            };
            const token = this.jwtService.sign(payload, {
                expiresIn: `${expiresIn}s`,
                issuer: this.issuer,
                audience: this.audience,
            });
            await this.redis.set(`temp_token:${type}:${userId}`, token, expiresIn);
            return token;
        }
        catch (error) {
            this.logger.error(`Erreur génération token temporaire ${type} pour ${userId}:`, error);
            throw new common_1.UnauthorizedException('Impossible de générer le token temporaire');
        }
    }
    async validateTemporaryToken(token, type) {
        try {
            const payload = this.jwtService.verify(token);
            if (payload.type !== `temp_${type}` || payload.purpose !== type) {
                return { userId: '', valid: false };
            }
            const cachedToken = await this.redis.get(`temp_token:${type}:${payload.sub}`);
            if (!cachedToken || cachedToken !== token) {
                return { userId: '', valid: false };
            }
            await this.redis.del(`temp_token:${type}:${payload.sub}`);
            return { userId: payload.sub, valid: true };
        }
        catch (error) {
            this.logger.warn(`Token temporaire invalide: ${error.message}`);
            return { userId: '', valid: false };
        }
    }
    hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
    parseExpiryToSeconds(expiry) {
        const match = expiry.match(/^(\d+)([smhdw])$/);
        if (!match) {
            throw new Error(`Format d'expiration invalide: ${expiry}`);
        }
        const value = parseInt(match[1]);
        const unit = match[2];
        switch (unit) {
            case 's': return value;
            case 'm': return value * 60;
            case 'h': return value * 3600;
            case 'd': return value * 86400;
            case 'w': return value * 604800;
            default: throw new Error(`Unité de temps non supportée: ${unit}`);
        }
    }
    extractPermissions(userRoles) {
        const permissions = new Set();
        for (const userRole of userRoles) {
            const rolePermissions = userRole.roles.permissions;
            if (rolePermissions) {
                if (Array.isArray(rolePermissions)) {
                    rolePermissions.forEach(permission => permissions.add(permission));
                }
                else if (typeof rolePermissions === 'object') {
                    Object.values(rolePermissions).forEach(permission => {
                        if (typeof permission === 'string') {
                            permissions.add(permission);
                        }
                    });
                }
            }
        }
        return Array.from(permissions);
    }
    async cleanupExpiredTokens() {
        this.logger.log('Nettoyage des tokens expirés du cache');
        try {
            this.logger.log('Nettoyage automatique par TTL Redis');
        }
        catch (error) {
            this.logger.error('Erreur nettoyage tokens expirés:', error);
        }
    }
};
exports.TokenService = TokenService;
exports.TokenService = TokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        config_1.ConfigService,
        logger_service_1.LoggerService])
], TokenService);
//# sourceMappingURL=token.service.js.map