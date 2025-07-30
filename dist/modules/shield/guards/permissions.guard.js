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
exports.Permission = exports.RequirePermissions = exports.PermissionsGuard = exports.PERMISSIONS_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const logger_service_1 = require("../../../shared/logger/logger.service");
const rbac_service_1 = require("../services/rbac.service");
exports.PERMISSIONS_KEY = 'permissions';
let PermissionsGuard = class PermissionsGuard {
    reflector;
    rbacService;
    logger;
    constructor(reflector, rbacService, loggerService) {
        this.reflector = reflector;
        this.rbacService = rbacService;
        this.logger = loggerService.createChildLogger('PermissionsGuard');
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const handler = context.getHandler();
        const classContext = context.getClass();
        const operationId = this.logger.startOperation('permissions_check', {
            path: request.path,
            method: request.method,
            userId: request.user?.id,
        });
        try {
            const requiredPermissions = this.getRequiredPermissions(handler, classContext);
            if (!requiredPermissions || requiredPermissions.length === 0) {
                this.logger.endOperation('permissions_check', operationId, true);
                return true;
            }
            this.validateAuthentication(request);
            const permissionResults = await Promise.all(requiredPermissions.map(permission => this.checkSinglePermission(request, permission)));
            const allGranted = permissionResults.every(result => result.granted);
            if (!allGranted) {
                const deniedPermissions = permissionResults
                    .filter(result => !result.granted)
                    .map(result => result.permission);
                this.logPermissionDenied(request, deniedPermissions, permissionResults);
                throw new common_1.ForbiddenException(`Permissions insuffisantes. Permissions requises: ${deniedPermissions.join(', ')}`);
            }
            this.logPermissionGranted(request, requiredPermissions, permissionResults);
            this.logger.endOperation('permissions_check', operationId, true);
            return true;
        }
        catch (error) {
            this.handleError(error, request, operationId);
            return false;
        }
    }
    async checkSinglePermission(request, permissionReq) {
        const user = request.user;
        const resourceId = this.extractResourceId(request, permissionReq);
        const context = this.buildPermissionContext(request, permissionReq);
        if (permissionReq.allow_owner_override && resourceId) {
            const isOwner = await this.checkResourceOwnership(user.id, permissionReq.resource_type, resourceId, context);
            if (isOwner) {
                return {
                    granted: true,
                    permission: permissionReq.permission,
                    reason: 'Propriétaire de la ressource',
                    resource_id: resourceId,
                    owner_override: true,
                };
            }
        }
        const result = await this.rbacService.checkPermission({
            user_id: user.id,
            permission: permissionReq.permission,
            resource_type: permissionReq.resource_type,
            resource_id: resourceId,
            context,
        });
        return {
            granted: result.granted,
            permission: permissionReq.permission,
            reason: result.reason,
            resource_id: resourceId,
            owner_override: false,
        };
    }
    async checkResourceOwnership(userId, resourceType, resourceId, context) {
        return context.owner_id === userId;
    }
    getRequiredPermissions(handler, classContext) {
        const handlerPermissions = this.reflector.get(exports.PERMISSIONS_KEY, handler) || [];
        const classPermissions = this.reflector.get(exports.PERMISSIONS_KEY, classContext) || [];
        return [...classPermissions, ...handlerPermissions];
    }
    extractResourceId(request, permissionReq) {
        if (!permissionReq.resource_id_param) {
            return undefined;
        }
        let resourceId = request.params[permissionReq.resource_id_param];
        if (!resourceId && request.body) {
            resourceId = request.body[permissionReq.resource_id_param];
        }
        if (!resourceId && request.query) {
            resourceId = request.query[permissionReq.resource_id_param];
        }
        return resourceId;
    }
    buildPermissionContext(request, permissionReq) {
        const baseContext = {
            ip_address: request.ip,
            user_agent: request.headers['user-agent'],
            path: request.path,
            method: request.method,
        };
        if (permissionReq.context_builder) {
            const customContext = permissionReq.context_builder(request);
            return { ...baseContext, ...customContext };
        }
        const defaultContext = {
            ...baseContext,
            organizer_id: request.params.organizerId || request.body?.organizer_id,
            venue_id: request.params.venueId || request.body?.venue_id,
            event_id: request.params.eventId || request.body?.event_id,
            group_id: request.params.groupId || request.body?.group_id,
        };
        return defaultContext;
    }
    validateAuthentication(request) {
        if (!request.user || !request.user.id) {
            throw new common_1.UnauthorizedException('Authentification requise');
        }
    }
    logPermissionGranted(request, requiredPermissions, results) {
        this.logger.logBusinessEvent('PERMISSIONS_GRANTED', {
            userId: request.user.id,
            path: request.path,
            method: request.method,
            permissions: requiredPermissions.map(p => p.permission),
            results: results.map(r => ({
                permission: r.permission,
                reason: r.reason
            })),
        }, request.user.id);
    }
    logPermissionDenied(request, deniedPermissions, results) {
        this.logger.logBusinessEvent('PERMISSIONS_DENIED', {
            userId: request.user.id,
            path: request.path,
            method: request.method,
            deniedPermissions,
            denialReasons: results
                .filter(r => !r.granted)
                .map(r => ({ permission: r.permission, reason: r.reason })),
        }, request.user.id);
    }
    handleError(error, request, operationId) {
        if (error instanceof common_1.ForbiddenException ||
            error instanceof common_1.UnauthorizedException) {
            this.logger.endOperation('permissions_check', operationId, false);
            throw error;
        }
        this.logger.logErrorEvent(error, 'PermissionsGuard.canActivate', request.user?.id || 'unknown', {
            path: request.path,
            method: request.method,
            errorType: error.constructor.name,
            errorMessage: error.message,
            stack: error.stack,
        });
        this.logger.endOperation('permissions_check', operationId, false);
        throw new common_1.ForbiddenException('Erreur lors de la vérification des permissions');
    }
};
exports.PermissionsGuard = PermissionsGuard;
exports.PermissionsGuard = PermissionsGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        rbac_service_1.RbacService,
        logger_service_1.LoggerService])
], PermissionsGuard);
const common_2 = require("@nestjs/common");
const RequirePermissions = (...permissions) => (0, common_2.SetMetadata)(exports.PERMISSIONS_KEY, permissions);
exports.RequirePermissions = RequirePermissions;
const Permission = (permission, resourceType, action, options) => ({
    permission,
    resource_type: resourceType,
    action,
    resource_id_param: options?.resource_id_param,
    allow_owner_override: options?.allow_owner_override || false,
    context_builder: options?.context_builder,
});
exports.Permission = Permission;
//# sourceMappingURL=permissions.guard.js.map