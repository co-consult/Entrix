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
exports.RequireGroupRoles = exports.GroupOwnerGuard = exports.REQUIRED_GROUP_ROLES = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const group_constants_1 = require("../constants/group.constants");
exports.REQUIRED_GROUP_ROLES = 'requiredGroupRoles';
let GroupOwnerGuard = class GroupOwnerGuard {
    prisma;
    redis;
    reflector;
    logger;
    constructor(prisma, redis, reflector, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.reflector = reflector;
        this.logger = loggerService.createChildLogger('GroupOwnerGuard');
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const handler = context.getHandler();
        const operationId = this.logger.startOperation('group_owner_check', {
            path: request.path,
            method: request.method,
        });
        try {
            const requiredRoles = this.reflector.get(exports.REQUIRED_GROUP_ROLES, handler) || ['OWNER'];
            this.validateRequestInputs(request);
            const user = request.user;
            const groupId = this.extractGroupId(request);
            const cacheKey = `group_membership:${user.id}:${groupId}`;
            let cachedData = await this.getCachedMembership(cacheKey);
            if (cachedData) {
                const hasPermission = this.checkPermissionsFromCache(cachedData, requiredRoles, user.id, groupId);
                if (hasPermission) {
                    this.attachMembershipToRequest(request, cachedData);
                    this.logSuccessfulAccess(user.id, groupId, request.path, 'cached');
                    this.logger.endOperation('group_owner_check', operationId, true);
                    return true;
                }
            }
            const membershipData = await this.validateMembershipFromDatabase(user.id, groupId, requiredRoles);
            await this.redis.setCache(cacheKey, membershipData, 300);
            this.logger.logCacheEvent('set', cacheKey, 300);
            this.attachMembershipToRequest(request, membershipData);
            this.logSuccessfulAccess(user.id, groupId, request.path, 'database');
            this.logger.endOperation('group_owner_check', operationId, true);
            return true;
        }
        catch (error) {
            this.handleError(error, request.user?.id, this.extractGroupId(request), request.path, operationId);
            throw error;
        }
    }
    validateRequestInputs(request) {
        const user = request.user;
        if (!user || !user.id) {
            this.logger.logSecurityEvent('UNAUTHENTICATED_GROUP_ACCESS_ATTEMPT', null, request.ip, request.headers['user-agent'], {
                path: request.path,
                method: request.method,
                reason: 'no_authenticated_user',
            });
            throw new common_1.UnauthorizedException('Utilisateur non authentifié');
        }
        if (!user.isActive) {
            this.logger.logSecurityEvent('INACTIVE_USER_GROUP_ACCESS_ATTEMPT', user.id, request.ip, request.headers['user-agent'], {
                path: request.path,
                method: request.method,
                reason: 'inactive_user',
            });
            throw new common_1.ForbiddenException('Compte utilisateur inactif');
        }
    }
    extractGroupId(request) {
        const groupId = request.params.groupId || request.body.groupId;
        if (!groupId) {
            this.logger.logErrorEvent(new Error('Missing groupId parameter'), 'GroupOwnerGuard.extractGroupId', request.user?.id, {
                path: request.path,
                method: request.method,
                params: JSON.stringify(request.params),
                bodyKeys: JSON.stringify(Object.keys(request.body || {})),
            });
            throw new common_1.BadRequestException('ID du groupe requis');
        }
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(groupId)) {
            throw new common_1.BadRequestException('Format d\'ID de groupe invalide');
        }
        return groupId;
    }
    extractRoleFromMetadata(metadata) {
        if (!metadata || typeof metadata !== 'object') {
            return 'MEMBER';
        }
        if (metadata.role && typeof metadata.role === 'string') {
            const validRoles = ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER'];
            if (validRoles.includes(metadata.role)) {
                return metadata.role;
            }
        }
        return 'MEMBER';
    }
    async getCachedMembership(cacheKey) {
        try {
            const cached = await this.redis.getCache(cacheKey);
            if (cached) {
                this.logger.logCacheEvent('hit', cacheKey);
                return cached;
            }
            this.logger.logCacheEvent('miss', cacheKey);
            return null;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'GroupOwnerGuard.getCachedMembership', undefined, { cacheKey });
            return null;
        }
    }
    checkPermissionsFromCache(cachedData, requiredRoles, userId, groupId) {
        if (!cachedData.membership || !cachedData.group) {
            return false;
        }
        const membership = cachedData.membership;
        const group = cachedData.group;
        if (!group.is_active) {
            return false;
        }
        if (membership.status !== group_constants_1.GROUP_CONSTANTS.MEMBER_STATUS.ACTIVE) {
            return false;
        }
        if (membership.valid_until && new Date(membership.valid_until) < new Date()) {
            return false;
        }
        const memberRole = membership.role || this.extractRoleFromMetadata(membership.metadata);
        return requiredRoles.includes(memberRole);
    }
    async validateMembershipFromDatabase(userId, groupId, requiredRoles) {
        const group = await this.prisma.groups.findUnique({
            where: { id: groupId },
            select: {
                id: true,
                name: true,
                type: true,
                is_active: true,
                max_members: true,
            },
        });
        if (!group) {
            throw new common_1.ForbiddenException('Groupe introuvable');
        }
        if (!group.is_active) {
            throw new common_1.ForbiddenException('Groupe inactif');
        }
        const membership = await this.prisma.user_groups.findFirst({
            where: {
                user_id: userId,
                group_id: groupId,
                status: group_constants_1.GROUP_CONSTANTS.MEMBER_STATUS.ACTIVE,
            },
            select: {
                id: true,
                joined_at: true,
                valid_until: true,
                metadata: true,
                status: true,
                added_by: true,
            },
        });
        if (!membership) {
            this.logger.logBusinessEvent('GROUP_ACCESS_DENIED_NOT_MEMBER', {
                userId,
                groupId,
                groupName: group.name,
                requiredRoles: JSON.stringify(requiredRoles),
            }, userId);
            throw new common_1.ForbiddenException('Vous n\'êtes pas membre de ce groupe');
        }
        const memberRole = this.extractRoleFromMetadata(membership.metadata);
        if (!memberRole) {
            throw new common_1.ForbiddenException('Rôle utilisateur introuvable dans ce groupe');
        }
        if (membership.valid_until && membership.valid_until < new Date()) {
            this.logger.logBusinessEvent('GROUP_ACCESS_DENIED_MEMBERSHIP_EXPIRED', {
                userId,
                groupId,
                expiredAt: membership.valid_until.toISOString(),
            }, userId);
            throw new common_1.ForbiddenException('Votre appartenance à ce groupe a expiré');
        }
        if (!requiredRoles.includes(memberRole)) {
            this.logger.logBusinessEvent('GROUP_ACCESS_DENIED_INSUFFICIENT_ROLE', {
                userId,
                groupId,
                groupName: group.name,
                userRole: memberRole,
                requiredRoles: JSON.stringify(requiredRoles),
            }, userId);
            const roleNames = {
                OWNER: 'propriétaire',
                ADMIN: 'administrateur',
                MANAGER: 'gestionnaire',
                MEMBER: 'membre',
            };
            const requiredRoleNames = requiredRoles
                .map(role => roleNames[role] || role)
                .join(' ou ');
            throw new common_1.ForbiddenException(`Cette action nécessite d'être ${requiredRoleNames} du groupe`);
        }
        return {
            membership: {
                ...membership,
                role: memberRole,
            },
            group,
        };
    }
    attachMembershipToRequest(request, data) {
        const { membership, group } = data;
        request.groupMembership = {
            id: membership.id,
            role: membership.role,
            joinedAt: membership.joined_at,
            validUntil: membership.valid_until,
            metadata: membership.metadata,
            isOwner: membership.role === 'OWNER',
            isAdmin: ['OWNER', 'ADMIN'].includes(membership.role),
            isManager: ['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role),
        };
        request.group = {
            id: group.id,
            name: group.name,
            type: group.type,
            isActive: group.is_active,
            maxMembers: group.max_members,
        };
    }
    logSuccessfulAccess(userId, groupId, path, source) {
        this.logger.logBusinessEvent('GROUP_ACCESS_GRANTED', {
            userId,
            groupId,
            path,
            source,
            timestamp: new Date().toISOString(),
        }, userId);
    }
    handleError(error, userId, groupId, path, operationId) {
        if (error instanceof common_1.ForbiddenException ||
            error instanceof common_1.BadRequestException ||
            error instanceof common_1.UnauthorizedException) {
            this.logger.endOperation('group_owner_check', operationId, false);
            return;
        }
        this.logger.logErrorEvent(error, 'GroupOwnerGuard.canActivate', userId, {
            groupId,
            path,
            errorType: error.constructor.name,
            errorMessage: error.message,
            stack: error.stack,
        });
        this.logger.endOperation('group_owner_check', operationId, false);
        throw new common_1.ForbiddenException('Erreur lors de la vérification des permissions de groupe');
    }
};
exports.GroupOwnerGuard = GroupOwnerGuard;
exports.GroupOwnerGuard = GroupOwnerGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        core_1.Reflector,
        logger_service_1.LoggerService])
], GroupOwnerGuard);
const RequireGroupRoles = (...roles) => (0, common_1.SetMetadata)(exports.REQUIRED_GROUP_ROLES, roles);
exports.RequireGroupRoles = RequireGroupRoles;
//# sourceMappingURL=group-owner.guard.js.map