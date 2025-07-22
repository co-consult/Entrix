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
exports.OptionalAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const passport_1 = require("@nestjs/passport");
const logger_service_1 = require("../../../shared/logger/logger.service");
const permissions_decorator_1 = require("../../../common/decorators/permissions.decorator");
let OptionalAuthGuard = class OptionalAuthGuard extends (0, passport_1.AuthGuard)('jwt') {
    reflector;
    logger;
    constructor(reflector, logger) {
        super();
        this.reflector = reflector;
        this.logger = logger.createChildLogger('OptionalAuthGuard');
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        try {
            const permissionsConfig = (0, permissions_decorator_1.getPermissionsConfig)(context.getClass(), context.getHandler().name);
            const authHeader = request.headers.authorization;
            const hasToken = authHeader && authHeader.startsWith('Bearer ');
            if (!hasToken) {
                this.logger.log(`Accès anonyme autorisé pour ${request.method} ${request.url}`);
                request.user = null;
                request.isAuthenticated = false;
                request.authMeta = {
                    guardType: 'OptionalAuthGuard',
                    isAnonymous: true,
                    accessedAt: new Date(),
                };
                return true;
            }
            try {
                const isAuthenticated = await super.canActivate(context);
                if (isAuthenticated) {
                    const user = request.user;
                    this.logger.log(`Authentification optionnelle réussie pour ${user.id} sur ${request.method} ${request.url}`);
                    if (permissionsConfig && typeof permissionsConfig === 'object') {
                        const hasPermission = this.checkPermissions(user, permissionsConfig.permissions || []);
                        request.hasPremiumAccess = hasPermission;
                    }
                    request.isAuthenticated = true;
                    request.authMeta = {
                        guardType: 'OptionalAuthGuard',
                        isAnonymous: false,
                        authenticatedAt: new Date(),
                        userAgent: request.get('User-Agent'),
                        ipAddress: request.ip,
                    };
                }
                else {
                    this.logger.warn(`Authentification optionnelle échouée pour ${request.url}, continuation en mode anonyme`);
                    request.user = null;
                    request.isAuthenticated = false;
                    request.authMeta = {
                        guardType: 'OptionalAuthGuard',
                        isAnonymous: true,
                        authFailed: true,
                    };
                }
            }
            catch (authError) {
                this.logger.warn(`Erreur authentification optionnelle pour ${request.url}:`, authError);
                request.user = null;
                request.isAuthenticated = false;
                request.authMeta = {
                    guardType: 'OptionalAuthGuard',
                    isAnonymous: true,
                    authError: authError.message,
                };
            }
            return true;
        }
        catch (error) {
            this.logger.error(`Erreur inattendue dans OptionalAuthGuard pour ${request.url}:`, error);
            request.user = null;
            request.isAuthenticated = false;
            request.authMeta = {
                guardType: 'OptionalAuthGuard',
                isAnonymous: true,
                systemError: true,
            };
            return true;
        }
    }
    handleRequest(err, user, info, context) {
        const request = context.switchToHttp().getRequest();
        if (err || !user) {
            this.logger.debug(`Auth optionnelle non réussie pour ${request.url}. Erreur: ${err?.message || 'Utilisateur non trouvé'}`);
            return null;
        }
        return user;
    }
    checkPermissions(user, requiredPermissions) {
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }
        if (!user || !user.permissions) {
            return false;
        }
        return requiredPermissions.every(permission => user.permissions.includes(permission));
    }
    static hasUserPremiumAccess(request) {
        return Boolean(request.hasPremiumAccess);
    }
    static isUserAuthenticated(request) {
        return Boolean(request.isAuthenticated);
    }
    static getOptionalUser(request) {
        return request.user || null;
    }
};
exports.OptionalAuthGuard = OptionalAuthGuard;
exports.OptionalAuthGuard = OptionalAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        logger_service_1.LoggerService])
], OptionalAuthGuard);
//# sourceMappingURL=optional-auth.guard.js.map