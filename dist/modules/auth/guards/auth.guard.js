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
exports.AuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const passport_1 = require("@nestjs/passport");
const logger_service_1 = require("../../../shared/logger/logger.service");
const permissions_decorator_1 = require("../../../common/decorators/permissions.decorator");
let AuthGuard = class AuthGuard extends (0, passport_1.AuthGuard)('jwt') {
    reflector;
    logger;
    constructor(reflector, logger) {
        super();
        this.reflector = reflector;
        this.logger = logger.createChildLogger('AuthGuard');
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        try {
            const permissionsConfig = (0, permissions_decorator_1.getPermissionsConfig)(context.getClass(), context.getHandler().name);
            if (permissionsConfig === 'public') {
                return true;
            }
            const isAuthenticated = await super.canActivate(context);
            if (!isAuthenticated) {
                this.logger.warn(`Authentification échouée pour ${request.url}`);
                return false;
            }
            const user = request.user;
            if (!user) {
                this.logger.warn('Utilisateur non trouvé après authentification JWT');
                throw new common_1.UnauthorizedException('Utilisateur non authentifié');
            }
            if (permissionsConfig && typeof permissionsConfig === 'object') {
                const hasPermission = this.checkPermissions(user, permissionsConfig.permissions);
                if (!hasPermission) {
                    this.logger.warn(`Permissions insuffisantes pour ${user.id} sur ${request.url}. Requis: ${permissionsConfig.permissions.join(', ')}, Disponibles: ${user.permissions.join(', ')}`);
                    throw new common_1.UnauthorizedException('Permissions insuffisantes');
                }
            }
            request.authMeta = {
                authenticatedAt: new Date(),
                guardType: 'AuthGuard',
                userAgent: request.get('User-Agent'),
                ipAddress: request.ip,
            };
            this.logger.log(`Authentification réussie pour ${user.id} sur ${request.method} ${request.url}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Erreur dans AuthGuard pour ${request.url}:`, error);
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.UnauthorizedException('Erreur d\'authentification');
        }
    }
    handleRequest(err, user, info, context) {
        const request = context.switchToHttp().getRequest();
        if (err || !user) {
            this.logger.warn(`Accès refusé pour ${request.url}. Erreur: ${err?.message || 'Utilisateur non trouvé'}, Info: ${info?.message || 'Aucune info'}`);
            if (info?.name === 'TokenExpiredError') {
                throw new common_1.UnauthorizedException('Token expiré');
            }
            else if (info?.name === 'JsonWebTokenError') {
                throw new common_1.UnauthorizedException('Token invalide');
            }
            else if (info?.name === 'NotBeforeError') {
                throw new common_1.UnauthorizedException('Token pas encore valide');
            }
            throw err || new common_1.UnauthorizedException('Token manquant ou invalide');
        }
        return user;
    }
    checkPermissions(user, requiredPermissions) {
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }
        return requiredPermissions.every(permission => user.permissions.includes(permission));
    }
    checkRoles(user, requiredRoles) {
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }
        const userRoleCodes = user.roles.map(role => role.code);
        return requiredRoles.some(role => userRoleCodes.includes(role));
    }
    checkMinimumLevel(user, minimumLevel) {
        if (minimumLevel === undefined || minimumLevel === null) {
            return true;
        }
        const maxUserLevel = Math.max(...user.roles.map(role => role.level));
        return maxUserLevel >= minimumLevel;
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        logger_service_1.LoggerService])
], AuthGuard);
//# sourceMappingURL=auth.guard.js.map