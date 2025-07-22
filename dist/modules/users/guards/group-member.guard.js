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
exports.GroupMemberGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
let GroupMemberGuard = class GroupMemberGuard {
    prisma;
    reflector;
    redis;
    logger;
    constructor(prisma, reflector, redis, loggerService) {
        this.prisma = prisma;
        this.reflector = reflector;
        this.redis = redis;
        this.logger = loggerService.createChildLogger('GroupMemberGuard');
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const groupId = this.extractGroupId(request);
        this.validateRequest(user, groupId, request);
        const operationId = this.logger.startOperation('group_member_check', {
            userId: user.id,
            groupId,
            path: request.path,
            method: request.method,
        });
        try {
            const cachedMembership = await this.getCachedMembership(user.id, groupId);
            if (cachedMembership) {
                this.attachMembershipToRequest(request, cachedMembership);
                this.logSuccessfulAccess(user.id, groupId, request.path, 'cached');
                this.logger.endOperation('group_member_check', operationId, true);
                return true;
            }
            const group = await this.validateGroup(groupId);
            const membership = await this.validateMembership(user.id, groupId);
            const membershipData = {
                id: membership.id,
                joinedAt: membership.joined_at,
                status: membership.status,
                metadata: membership.metadata || {},
                addedBy: membership.added_by,
            };
            const groupData = {
                id: group.id,
                name: group.name,
                type: group.type,
                isActive: group.is_active,
            };
            await this.cacheMembership(user.id, groupId, { membership: membershipData, group: groupData });
            this.attachMembershipToRequest(request, { membership: membershipData, group: groupData });
            this.logSuccessfulAccess(user.id, groupId, request.path, 'database');
            this.logger.endOperation('group_member_check', operationId, true);
            return true;
        }
        catch (error) {
            this.handleError(error, user.id, groupId, request.path, operationId);
            throw error;
        }
    }
    extractGroupId(request) {
        return request.params?.groupId ||
            request.params?.group_id ||
            request.body?.groupId ||
            request.body?.group_id ||
            request.query?.groupId ||
            request.query?.group_id;
    }
    validateRequest(user, groupId, request) {
        if (!user || !user.id) {
            this.logger.logSecurityEvent('UNAUTHORIZED_GROUP_ACCESS_ATTEMPT', undefined, request.ip, request.headers['user-agent'], {
                path: request.path,
                method: request.method,
                hasUser: !!user,
                reason: 'no_authenticated_user'
            });
            throw new common_1.UnauthorizedException('Utilisateur non authentifié');
        }
        if (!user.isActive) {
            this.logger.logSecurityEvent('INACTIVE_USER_GROUP_ACCESS_ATTEMPT', user.id, request.ip, request.headers['user-agent'], {
                path: request.path,
                method: request.method,
                reason: 'inactive_user'
            });
            throw new common_1.ForbiddenException('Compte utilisateur inactif');
        }
        if (!groupId) {
            this.logger.warn('GroupMemberGuard: No groupId found in request', JSON.stringify({
                userId: user.id,
                path: request.path,
                method: request.method,
                params: JSON.stringify(request.params),
                body: JSON.stringify(Object.keys(request.body || {})),
                query: JSON.stringify(request.query),
            }));
            throw new common_1.BadRequestException('ID du groupe requis');
        }
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(groupId)) {
            throw new common_1.BadRequestException('Format d\'ID de groupe invalide');
        }
    }
    async getCachedMembership(userId, groupId) {
        try {
            const cacheKey = `group_membership:${userId}:${groupId}`;
            const cached = await this.redis.getCache(cacheKey);
            if (cached) {
                this.logger.logCacheEvent('hit', cacheKey);
                return cached;
            }
            this.logger.logCacheEvent('miss', cacheKey);
            return null;
        }
        catch (error) {
            this.logger.warn('Redis cache error in GroupMemberGuard', JSON.stringify({
                error: error.message,
                userId,
                groupId,
            }));
            return null;
        }
    }
    async cacheMembership(userId, groupId, data) {
        try {
            const cacheKey = `group_membership:${userId}:${groupId}`;
            const ttl = 300;
            await this.redis.setCache(cacheKey, data, ttl);
            this.logger.logCacheEvent('set', cacheKey, ttl);
        }
        catch (error) {
            this.logger.warn('Redis cache set error in GroupMemberGuard', JSON.stringify({
                error: error.message,
                userId,
                groupId,
            }));
        }
    }
    async validateGroup(groupId) {
        const group = await this.prisma.groups.findUnique({
            where: { id: groupId },
            select: {
                id: true,
                name: true,
                type: true,
                is_active: true,
                valid_from: true,
                valid_until: true,
            },
        });
        if (!group) {
            this.logger.logBusinessEvent('GROUP_ACCESS_DENIED', {
                groupId,
                reason: 'group_not_found',
            });
            throw new common_1.ForbiddenException('Groupe introuvable');
        }
        if (!group.is_active) {
            this.logger.logBusinessEvent('GROUP_ACCESS_DENIED', {
                groupId,
                groupName: group.name,
                reason: 'group_inactive',
            });
            throw new common_1.ForbiddenException('Groupe inactif');
        }
        const now = new Date();
        if (group.valid_until && group.valid_until < now) {
            this.logger.logBusinessEvent('GROUP_ACCESS_DENIED', {
                groupId,
                groupName: group.name,
                reason: 'group_expired',
                expiredAt: group.valid_until,
            });
            throw new common_1.ForbiddenException('Groupe expiré');
        }
        return group;
    }
    async validateMembership(userId, groupId) {
        const membership = await this.prisma.user_groups.findFirst({
            where: {
                user_id: userId,
                group_id: groupId,
                status: 'ACTIVE',
            },
            select: {
                id: true,
                joined_at: true,
                valid_until: true,
                status: true,
                added_by: true,
                metadata: true,
            },
        });
        if (!membership) {
            this.logger.logSecurityEvent('UNAUTHORIZED_GROUP_ACCESS', userId, undefined, undefined, {
                groupId,
                reason: 'not_a_member',
            });
            throw new common_1.ForbiddenException('Vous n\'êtes pas membre de ce groupe');
        }
        const now = new Date();
        if (membership.valid_until && membership.valid_until < now) {
            this.logger.logBusinessEvent('GROUP_ACCESS_DENIED', {
                userId,
                groupId,
                reason: 'membership_expired',
                expiredAt: membership.valid_until,
            });
            throw new common_1.ForbiddenException('Votre appartenance à ce groupe a expiré');
        }
        return membership;
    }
    attachMembershipToRequest(request, data) {
        request.groupMembership = data.membership;
        request.group = data.group;
    }
    logSuccessfulAccess(userId, groupId, path, source) {
        this.logger.logBusinessEvent('GROUP_ACCESS_GRANTED', {
            userId,
            groupId,
            path,
            source,
            timestamp: new Date().toISOString(),
        });
    }
    handleError(error, userId, groupId, path, operationId) {
        if (error instanceof common_1.ForbiddenException ||
            error instanceof common_1.BadRequestException ||
            error instanceof common_1.UnauthorizedException) {
            this.logger.endOperation('group_member_check', operationId, false);
            return;
        }
        this.logger.logErrorEvent(error, 'GroupMemberGuard.canActivate', userId, {
            groupId,
            path,
            errorType: error.constructor.name,
            errorMessage: error.message,
        });
        this.logger.endOperation('group_member_check', operationId, false);
        throw new common_1.ForbiddenException('Erreur lors de la vérification des permissions de groupe');
    }
};
exports.GroupMemberGuard = GroupMemberGuard;
exports.GroupMemberGuard = GroupMemberGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        core_1.Reflector,
        redis_service_1.RedisService,
        logger_service_1.LoggerService])
], GroupMemberGuard);
//# sourceMappingURL=group-member.guard.js.map