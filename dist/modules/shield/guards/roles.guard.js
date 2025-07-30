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
exports.RequireRoles = exports.RolesGuard = exports.ROLES_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const logger_service_1 = require("../../../shared/logger/logger.service");
const roles_service_1 = require("../services/roles.service");
exports.ROLES_KEY = 'roles';
let RolesGuard = class RolesGuard {
    reflector;
    rolesService;
    logger;
    constructor(reflector, rolesService, loggerService) {
        this.reflector = reflector;
        this.rolesService = rolesService;
        this.logger = loggerService.createChildLogger('RolesGuard');
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const handler = context.getHandler();
        const classContext = context.getClass();
        const operationId = this.logger.startOperation('roles_check', {
            path: request.path,
            method: request.method,
            userId: request.user?.id,
        });
        try {
            const roleRequirement = this.getRoleRequirement(handler, classContext);
            if (!roleRequirement) {
                this.logger.endOperation('roles_check', operationId, true);
                return true;
            }
            this.validateAuthentication(request);
            const userRoles = await this.rolesService.getUserRoles(request.user.id);
            const hasRequiredRoles = this.checkRoles(userRoles, roleRequirement);
            if (!hasRequiredRoles) {
                this.logRoleDenied(request, roleRequirement, userRoles);
                throw new common_1.ForbiddenException(`Rôles insuffisants. Rôles requis: ${roleRequirement.roles.join(', ')}`);
            }
            this.logRoleGranted(request, roleRequirement, userRoles);
            this.logger.endOperation('roles_check', operationId, true);
            return true;
        }
        catch (error) {
            this.handleError(error, request, operationId);
            return false;
        }
    }
    getRoleRequirement(handler, classContext) {
        return this.reflector.get(exports.ROLES_KEY, handler) ||
            this.reflector.get(exports.ROLES_KEY, classContext);
    }
    validateAuthentication(request) {
        if (!request.user || !request.user.id) {
            throw new common_1.UnauthorizedException('Authentification requise');
        }
    }
    checkRoles(userRoles, requirement) {
        if (!userRoles || userRoles.length === 0) {
            return false;
        }
        const activeRoles = userRoles.filter(ur => ur.status === 'ACTIVE' &&
            (!ur.valid_until || ur.valid_until > new Date()));
        const relevantRoles = requirement.scope
            ? activeRoles.filter(ur => ur.roles.scope === requirement.scope)
            : activeRoles;
        const levelFilteredRoles = requirement.min_level
            ? relevantRoles.filter(ur => ur.roles.level <= requirement.min_level)
            : relevantRoles;
        const userRoleNames = levelFilteredRoles.map(ur => ur.roles.name);
        if (requirement.require_all) {
            return requirement.roles.every(role => userRoleNames.includes(role));
        }
        else {
            return requirement.roles.some(role => userRoleNames.includes(role));
        }
    }
    logRoleGranted(request, requirement, userRoles) {
        this.logger.logBusinessEvent('ROLES_ACCESS_GRANTED', {
            userId: request.user.id,
            path: request.path,
            method: request.method,
            requiredRoles: requirement.roles,
            userRoles: userRoles.map(ur => ur.roles.name),
            scope: requirement.scope,
        }, request.user.id);
    }
    logRoleDenied(request, requirement, userRoles) {
        this.logger.logBusinessEvent('ROLES_ACCESS_DENIED', {
            userId: request.user.id,
            path: request.path,
            method: request.method,
            requiredRoles: requirement.roles,
            userRoles: userRoles.map(ur => ur.roles.name),
            scope: requirement.scope,
        }, request.user.id);
    }
    handleError(error, request, operationId) {
        if (error instanceof common_1.ForbiddenException || error instanceof common_1.UnauthorizedException) {
            this.logger.endOperation('roles_check', operationId, false);
            throw error;
        }
        this.logger.logErrorEvent(error, 'RolesGuard.canActivate', request.user?.id || 'unknown', {
            path: request.path,
            method: request.method,
            errorType: error.constructor.name,
        });
        this.logger.endOperation('roles_check', operationId, false);
        throw new common_1.ForbiddenException('Erreur lors de la vérification des rôles');
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        roles_service_1.RolesService,
        logger_service_1.LoggerService])
], RolesGuard);
const common_2 = require("@nestjs/common");
const RequireRoles = (roles, options) => (0, common_2.SetMetadata)(exports.ROLES_KEY, {
    roles,
    scope: options?.scope,
    require_all: options?.require_all || false,
    min_level: options?.min_level,
});
exports.RequireRoles = RequireRoles;
//# sourceMappingURL=roles.guard.js.map