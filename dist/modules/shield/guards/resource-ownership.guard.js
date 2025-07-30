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
exports.RequireOwnership = exports.ResourceOwnershipGuard = exports.OWNERSHIP_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const logger_service_1 = require("../../../shared/logger/logger.service");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const access_enums_1 = require("../types/access-enums");
exports.OWNERSHIP_KEY = 'ownership';
let ResourceOwnershipGuard = class ResourceOwnershipGuard {
    reflector;
    prisma;
    logger;
    constructor(reflector, prisma, loggerService) {
        this.reflector = reflector;
        this.prisma = prisma;
        this.logger = loggerService.createChildLogger('ResourceOwnershipGuard');
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const handler = context.getHandler();
        const classContext = context.getClass();
        const operationId = this.logger.startOperation('ownership_check', {
            path: request.path,
            userId: request.user?.id,
        });
        try {
            const requirement = this.getOwnershipRequirement(handler, classContext);
            if (!requirement) {
                this.logger.endOperation('ownership_check', operationId, true);
                return true;
            }
            this.validateAuthentication(request);
            const resourceId = this.extractResourceId(request, requirement);
            if (!resourceId) {
                throw new common_1.ForbiddenException('ID de ressource manquant');
            }
            const isOwner = await this.checkOwnership(request.user.id, requirement.resource_type, resourceId, requirement);
            if (!isOwner) {
                this.logOwnershipDenied(request, requirement, resourceId);
                throw new common_1.ForbiddenException('Vous n\'êtes pas propriétaire de cette ressource');
            }
            this.logOwnershipGranted(request, requirement, resourceId);
            this.logger.endOperation('ownership_check', operationId, true);
            return true;
        }
        catch (error) {
            this.handleError(error, request, operationId);
            return false;
        }
    }
    getOwnershipRequirement(handler, classContext) {
        return this.reflector.get(exports.OWNERSHIP_KEY, handler) ||
            this.reflector.get(exports.OWNERSHIP_KEY, classContext);
    }
    validateAuthentication(request) {
        if (!request.user || !request.user.id) {
            throw new common_1.UnauthorizedException('Authentification requise');
        }
    }
    extractResourceId(request, requirement) {
        return request.params[requirement.resource_id_param] ||
            request.body?.[requirement.resource_id_param] ||
            request.query?.[requirement.resource_id_param];
    }
    async checkOwnership(userId, resourceType, resourceId, requirement) {
        const ownerField = requirement.owner_field || 'user_id';
        try {
            const tableMap = {
                [access_enums_1.ResourceType.EVENT]: 'events',
                [access_enums_1.ResourceType.ORGANIZER]: 'organizers',
                [access_enums_1.ResourceType.VENUE]: 'venues',
                [access_enums_1.ResourceType.TICKET]: 'tickets',
                [access_enums_1.ResourceType.ORDER]: 'orders',
                [access_enums_1.ResourceType.SUBSCRIPTION]: 'subscriptions',
                [access_enums_1.ResourceType.ACCESS_RIGHT]: 'access_rights',
                [access_enums_1.ResourceType.GROUP]: 'groups',
                [access_enums_1.ResourceType.USER]: 'users',
                [access_enums_1.ResourceType.ROLE]: 'roles',
                [access_enums_1.ResourceType.PERMISSION]: 'permissions',
                [access_enums_1.ResourceType.ZONE]: 'venue_zones',
                [access_enums_1.ResourceType.SEAT]: 'seats',
            };
            const tableName = tableMap[resourceType];
            if (!tableName) {
                return false;
            }
            const resource = await this.prisma[tableName].findUnique({
                where: { id: resourceId },
                select: { [ownerField]: true }
            });
            if (!resource) {
                return false;
            }
            return resource[ownerField] === userId;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'ResourceOwnershipGuard.checkOwnership', userId, { resourceType, resourceId });
            return false;
        }
    }
    logOwnershipGranted(request, requirement, resourceId) {
        this.logger.logBusinessEvent('RESOURCE_OWNERSHIP_GRANTED', {
            userId: request.user.id,
            resourceType: requirement.resource_type,
            resourceId,
            path: request.path,
        }, request.user.id);
    }
    logOwnershipDenied(request, requirement, resourceId) {
        this.logger.logBusinessEvent('RESOURCE_OWNERSHIP_DENIED', {
            userId: request.user.id,
            resourceType: requirement.resource_type,
            resourceId,
            path: request.path,
        }, request.user.id);
    }
    handleError(error, request, operationId) {
        if (error instanceof common_1.ForbiddenException || error instanceof common_1.UnauthorizedException) {
            this.logger.endOperation('ownership_check', operationId, false);
            throw error;
        }
        this.logger.logErrorEvent(error, 'ResourceOwnershipGuard.canActivate', request.user?.id || 'unknown');
        this.logger.endOperation('ownership_check', operationId, false);
        throw new common_1.ForbiddenException('Erreur lors de la vérification de propriété');
    }
};
exports.ResourceOwnershipGuard = ResourceOwnershipGuard;
exports.ResourceOwnershipGuard = ResourceOwnershipGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService,
        logger_service_1.LoggerService])
], ResourceOwnershipGuard);
const RequireOwnership = (requirement) => SetMetadata(exports.OWNERSHIP_KEY, requirement);
exports.RequireOwnership = RequireOwnership;
//# sourceMappingURL=resource-ownership.guard.js.map