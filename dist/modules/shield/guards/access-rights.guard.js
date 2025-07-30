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
exports.RequireAccessRights = exports.AccessRightsGuard = exports.ACCESS_RIGHTS_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const logger_service_1 = require("../../../shared/logger/logger.service");
const access_rights_service_1 = require("../services/access-rights.service");
const access_enums_1 = require("../types/access-enums");
exports.ACCESS_RIGHTS_KEY = 'access_rights';
let AccessRightsGuard = class AccessRightsGuard {
    reflector;
    accessRightsService;
    logger;
    constructor(reflector, accessRightsService, loggerService) {
        this.reflector = reflector;
        this.accessRightsService = accessRightsService;
        this.logger = loggerService.createChildLogger('AccessRightsGuard');
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const handler = context.getHandler();
        const classContext = context.getClass();
        const operationId = this.logger.startOperation('access_rights_check', {
            path: request.path,
            userId: request.user?.id,
        });
        try {
            const requirement = this.getAccessRightRequirement(handler, classContext);
            if (!requirement) {
                this.logger.endOperation('access_rights_check', operationId, true);
                return true;
            }
            this.validateAuthentication(request);
            const userAccessRights = await this.getUserAccessRights(request.user.id, request);
            const hasValidAccessRights = this.checkAccessRights(userAccessRights, requirement, request);
            if (!hasValidAccessRights) {
                this.logAccessRightDenied(request, requirement);
                throw new common_1.ForbiddenException('Droits d\'accès insuffisants');
            }
            this.logAccessRightGranted(request, requirement);
            this.logger.endOperation('access_rights_check', operationId, true);
            return true;
        }
        catch (error) {
            this.handleError(error, request, operationId);
            return false;
        }
    }
    getAccessRightRequirement(handler, classContext) {
        return this.reflector.get(exports.ACCESS_RIGHTS_KEY, handler) ||
            this.reflector.get(exports.ACCESS_RIGHTS_KEY, classContext);
    }
    validateAuthentication(request) {
        if (!request.user || !request.user.id) {
            throw new common_1.UnauthorizedException('Authentification requise');
        }
    }
    async getUserAccessRights(userId, request) {
        return [];
    }
    checkAccessRights(accessRights, requirement, request) {
        if (!accessRights || accessRights.length === 0) {
            return false;
        }
        let filteredRights = accessRights;
        if (requirement.source_types) {
            filteredRights = filteredRights.filter(ar => requirement.source_types.includes(ar.source_type));
        }
        if (requirement.require_valid) {
            filteredRights = filteredRights.filter(ar => ar.status === access_enums_1.AccessRightStatus.VALID &&
                ar.valid_from <= new Date() &&
                ar.valid_until >= new Date());
        }
        if (requirement.require_unused) {
            filteredRights = filteredRights.filter(ar => ar.current_uses < ar.max_uses);
        }
        if (requirement.event_context && request.params.eventId) {
            filteredRights = filteredRights.filter(ar => ar.event_id === request.params.eventId);
        }
        if (requirement.zone_context && request.params.zoneId) {
            filteredRights = filteredRights.filter(ar => ar.zone_id === request.params.zoneId);
        }
        return filteredRights.length > 0;
    }
    logAccessRightGranted(request, requirement) {
        this.logger.logBusinessEvent('ACCESS_RIGHTS_CHECK_GRANTED', {
            userId: request.user.id,
            path: request.path,
            requirement,
        }, request.user.id);
    }
    logAccessRightDenied(request, requirement) {
        this.logger.logBusinessEvent('ACCESS_RIGHTS_CHECK_DENIED', {
            userId: request.user.id,
            path: request.path,
            requirement,
        }, request.user.id);
    }
    handleError(error, request, operationId) {
        if (error instanceof common_1.ForbiddenException || error instanceof common_1.UnauthorizedException) {
            this.logger.endOperation('access_rights_check', operationId, false);
            throw error;
        }
        this.logger.logErrorEvent(error, 'AccessRightsGuard.canActivate', request.user?.id || 'unknown');
        this.logger.endOperation('access_rights_check', operationId, false);
        throw new common_1.ForbiddenException('Erreur lors de la vérification des droits d\'accès');
    }
};
exports.AccessRightsGuard = AccessRightsGuard;
exports.AccessRightsGuard = AccessRightsGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        access_rights_service_1.AccessRightsService,
        logger_service_1.LoggerService])
], AccessRightsGuard);
const RequireAccessRights = (requirement) => SetMetadata(exports.ACCESS_RIGHTS_KEY, requirement);
exports.RequireAccessRights = RequireAccessRights;
//# sourceMappingURL=access-rights.guard.js.map