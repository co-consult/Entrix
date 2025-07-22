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
exports.RefreshStrategy = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const token_service_1 = require("../services/token.service");
const session_service_1 = require("../services/session.service");
let RefreshStrategy = class RefreshStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'refresh') {
    prisma;
    redis;
    tokenService;
    sessionService;
    config;
    logger;
    constructor(prisma, redis, tokenService, sessionService, config, logger) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromBodyField('refreshToken'),
            ignoreExpiration: false,
            secretOrKey: config.get('JWT_SECRET'),
            issuer: config.get('JWT_ISSUER', 'entrix.tn'),
            audience: config.get('JWT_AUDIENCE', 'entrix-app'),
            passReqToCallback: true,
        });
        this.prisma = prisma;
        this.redis = redis;
        this.tokenService = tokenService;
        this.sessionService = sessionService;
        this.config = config;
        this.logger = logger;
    }
    async validate(req, payload) {
        this.logger.log(`Validation refresh token pour utilisateur: ${payload.sub}`);
        try {
            if (payload.type !== 'refresh') {
                this.logger.warn(`Type de token incorrect: ${payload.type} pour ${payload.sub}`);
                throw new common_1.UnauthorizedException('Type de token invalide');
            }
            const refreshToken = req.body?.refreshToken;
            if (!refreshToken) {
                throw new common_1.UnauthorizedException('Refresh token manquant');
            }
            const isRevoked = await this.tokenService.isTokenRevoked(refreshToken);
            if (isRevoked) {
                this.logger.warn(`Refresh token révoqué utilisé par: ${payload.sub}`);
                throw new common_1.UnauthorizedException('Refresh token révoqué');
            }
            const cachedToken = await this.redis.get(`refresh_token:${payload.sub}:${payload.sessionId}`);
            if (!cachedToken || cachedToken !== refreshToken) {
                this.logger.warn(`Refresh token non trouvé en cache pour: ${payload.sub}`);
                throw new common_1.UnauthorizedException('Refresh token invalide ou expiré');
            }
            const user = await this.prisma.users.findFirst({
                where: {
                    id: payload.sub,
                    is_active: true,
                },
            });
            if (!user) {
                this.logger.warn(`Utilisateur introuvable ou inactif: ${payload.sub}`);
                throw new common_1.UnauthorizedException('Utilisateur introuvable ou inactif');
            }
            const session = await this.sessionService.getSession(payload.sessionId);
            if (!session || new Date(session.expiresAt) <= new Date()) {
                this.logger.warn(`Session invalide ou expirée: ${payload.sessionId}`);
                throw new common_1.UnauthorizedException('Session expirée ou invalide');
            }
            const userRoles = await this.prisma.user_roles.findMany({
                where: {
                    user_id: payload.sub,
                    status: 'ACTIVE',
                },
                include: {
                    roles: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                            level: true,
                            permissions: true,
                        }
                    }
                }
            });
            const authUser = {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                avatar: user.avatar,
                isActive: user.is_active,
                emailVerified: user.email_verified,
                phoneVerified: user.phone_verified,
                roles: userRoles.map(ur => ({
                    id: ur.roles.id,
                    code: ur.roles.code,
                    name: ur.roles.name,
                    level: ur.roles.level,
                    assignedAt: ur.assigned_at,
                    validUntil: ur.valid_until,
                    status: ur.status,
                })),
                permissions: this.extractPermissions(userRoles),
                lastLogin: user.last_login,
            };
            req.refreshContext = {
                sessionId: payload.sessionId,
                tokenVersion: payload.tokenVersion,
                originalToken: refreshToken,
            };
            this.logger.log(`Refresh token validé avec succès pour: ${payload.sub}`);
            return authUser;
        }
        catch (error) {
            this.logger.error(`Erreur validation refresh token pour ${payload.sub}:`, error);
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.UnauthorizedException('Refresh token invalide');
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
                    this.flattenPermissions(rolePermissions, permissions);
                }
            }
        }
        return Array.from(permissions);
    }
    flattenPermissions(obj, permissionsSet) {
        for (const value of Object.values(obj)) {
            if (Array.isArray(value)) {
                value.forEach(permission => {
                    if (typeof permission === 'string') {
                        permissionsSet.add(permission);
                    }
                });
            }
            else if (typeof value === 'string') {
                permissionsSet.add(value);
            }
            else if (typeof value === 'object' && value !== null) {
                this.flattenPermissions(value, permissionsSet);
            }
        }
    }
};
exports.RefreshStrategy = RefreshStrategy;
exports.RefreshStrategy = RefreshStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        token_service_1.TokenService,
        session_service_1.SessionsService,
        config_1.ConfigService,
        logger_service_1.LoggerService])
], RefreshStrategy);
//# sourceMappingURL=refresh.strategy.js.map