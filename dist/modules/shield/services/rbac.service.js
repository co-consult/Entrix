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
exports.RbacService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const bullmq_service_1 = require("../../../shared/bullmq/bullmq.service");
const access_enums_1 = require("../types/access-enums");
const shield_constants_1 = require("../types/shield-constants");
let RbacService = class RbacService {
    prisma;
    redis;
    bullmq;
    logger;
    constructor(prisma, redis, bullmq, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.bullmq = bullmq;
        this.logger = loggerService.createChildLogger('RbacService');
    }
    async checkPermission(checkData) {
        const operationId = this.logger.startOperation('checkPermission', {
            userId: checkData.user_id,
            permission: checkData.permission,
            resourceType: checkData.resource_type,
            resourceId: checkData.resource_id,
        });
        try {
            this.logger.info('Checking user permission', JSON.stringify({
                userId: checkData.user_id,
                permission: checkData.permission,
                resourceType: checkData.resource_type,
                resourceId: checkData.resource_id,
            }));
            const cacheKey = this.buildPermissionCacheKey(checkData);
            const cached = await this.getCachedPermissionResult(cacheKey);
            if (cached) {
                this.logger.logCacheEvent('hit', cacheKey);
                this.logger.endOperation('checkPermission', operationId, true);
                return { ...cached, cache_hit: true };
            }
            this.logger.logCacheEvent('miss', cacheKey);
            const effectivePermissions = await this.getEffectivePermissions(checkData.user_id);
            const hasPermission = this.evaluatePermission(checkData, effectivePermissions);
            const result = {
                granted: hasPermission.granted,
                reason: hasPermission.reason,
                computed_permissions: effectivePermissions.effective_permissions.map(p => p.name),
                effective_roles: effectivePermissions.roles.map(r => r.name),
                conditions_met: hasPermission.conditions_met,
                cache_hit: false,
                checked_at: new Date(),
            };
            await this.cachePermissionResult(cacheKey, result);
            await this.auditPermissionCheck(checkData, result);
            this.logger.endOperation('checkPermission', operationId, true);
            return result;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'RbacService.checkPermission', checkData.user_id, {
                permission: checkData.permission,
                resourceType: checkData.resource_type,
                errorType: error.constructor.name,
            });
            this.logger.endOperation('checkPermission', operationId, false);
            return {
                granted: false,
                reason: 'Erreur lors de la vérification des permissions',
                computed_permissions: [],
                effective_roles: [],
                conditions_met: false,
                cache_hit: false,
                checked_at: new Date(),
            };
        }
    }
    async getEffectivePermissions(userId) {
        const cacheKey = `${shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.USER_PERMISSIONS}${userId}`;
        const cached = await this.redis.getCache(cacheKey);
        if (cached && cached.expires_at > new Date()) {
            return cached;
        }
        const now = new Date();
        const userRoles = await this.prisma.user_roles.findMany({
            where: {
                user_id: userId,
                status: 'ACTIVE',
                OR: [
                    { valid_until: null },
                    { valid_until: { gt: now } }
                ]
            },
            include: {
                roles: {
                    include: {
                        role_permissions: {
                            include: {
                                permissions: true
                            }
                        }
                    }
                }
            }
        });
        const directPermissions = [];
        const inheritedPermissions = [];
        const roles = [];
        for (const userRole of userRoles) {
            roles.push(userRole.roles);
            for (const rolePermission of userRole.roles.role_permissions) {
                directPermissions.push(rolePermission.permissions);
            }
            const inheritedRolePermissions = await this.getInheritedRolePermissions(userRole.roles.id);
            inheritedPermissions.push(...inheritedRolePermissions);
        }
        const allPermissions = [...directPermissions, ...inheritedPermissions];
        const uniquePermissions = this.deduplicatePermissions(allPermissions);
        const effectivePermissions = {
            user_id: userId,
            direct_permissions: directPermissions,
            inherited_permissions: inheritedPermissions,
            effective_permissions: uniquePermissions,
            roles: roles,
            computed_at: now,
            expires_at: new Date(now.getTime() + shield_constants_1.SHIELD_CONSTANTS.CACHE.USER_PERMISSIONS_TTL * 1000),
        };
        await this.redis.setCache(cacheKey, effectivePermissions, shield_constants_1.SHIELD_CONSTANTS.CACHE.USER_PERMISSIONS_TTL);
        return effectivePermissions;
    }
    evaluatePermission(checkData, effectivePermissions) {
        const exactPermission = effectivePermissions.effective_permissions.find(p => p.name === checkData.permission && p.resource_type === checkData.resource_type);
        if (!exactPermission) {
            return {
                granted: false,
                reason: 'Permission non trouvée dans les permissions effectives',
                conditions_met: false,
            };
        }
        if (!exactPermission.is_active) {
            return {
                granted: false,
                reason: 'Permission désactivée',
                conditions_met: false,
            };
        }
        const conditionsResult = this.evaluatePermissionConditions(exactPermission, checkData);
        if (!conditionsResult.met) {
            return {
                granted: false,
                reason: `Conditions non remplies: ${conditionsResult.reason}`,
                conditions_met: false,
            };
        }
        return {
            granted: true,
            reason: 'Permission accordée',
            conditions_met: true,
        };
    }
    evaluatePermissionConditions(permission, checkData) {
        if (!permission.conditions) {
            return { met: true, reason: 'Aucune condition spécifiée' };
        }
        const conditions = permission.conditions;
        if (conditions.own_resource_only && checkData.resource_id) {
            if (!checkData.context?.owner_id || checkData.context.owner_id !== checkData.user_id) {
                return { met: false, reason: 'Accès limité aux ressources dont vous êtes propriétaire' };
            }
        }
        if (conditions.organizer_scope && checkData.context?.organizer_id) {
        }
        if (conditions.time_restrictions) {
            const timeResult = this.evaluateTimeRestrictions(conditions.time_restrictions);
            if (!timeResult.met) {
                return timeResult;
            }
        }
        return { met: true, reason: 'Toutes les conditions sont remplies' };
    }
    evaluateTimeRestrictions(timeRestrictions) {
        const now = new Date();
        if (timeRestrictions.start_time && timeRestrictions.end_time) {
            const currentTime = now.toTimeString().substring(0, 5);
            if (currentTime < timeRestrictions.start_time || currentTime > timeRestrictions.end_time) {
                return {
                    met: false,
                    reason: `Accès autorisé uniquement entre ${timeRestrictions.start_time} et ${timeRestrictions.end_time}`
                };
            }
        }
        if (timeRestrictions.days_of_week && Array.isArray(timeRestrictions.days_of_week)) {
            const currentDay = now.getDay();
            if (!timeRestrictions.days_of_week.includes(currentDay)) {
                return {
                    met: false,
                    reason: 'Accès non autorisé ce jour de la semaine'
                };
            }
        }
        return { met: true, reason: 'Restrictions temporelles respectées' };
    }
    async getInheritedRolePermissions(roleId) {
        const parentRoles = await this.prisma.$queryRaw `
      WITH RECURSIVE role_hierarchy AS (
        SELECT parent_role_id as id, 1 as depth
        FROM role_hierarchy 
        WHERE child_role_id = ${roleId}
        
        UNION ALL
        
        SELECT rh.parent_role_id as id, h.depth + 1 as depth
        FROM role_hierarchy rh
        JOIN role_hierarchy h ON h.id = rh.child_role_id
        WHERE h.depth < ${shield_constants_1.SHIELD_CONSTANTS.LIMITS.MAX_HIERARCHY_DEPTH}
      )
      SELECT DISTINCT id FROM role_hierarchy
    `;
        if (parentRoles.length === 0) {
            return [];
        }
        const permissions = await this.prisma.permissions.findMany({
            where: {
                role_permissions: {
                    some: {
                        role_id: {
                            in: parentRoles.map(r => r.id)
                        }
                    }
                },
                is_active: true
            }
        });
        return permissions;
    }
    buildPermissionCacheKey(checkData) {
        const parts = [
            shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.USER_PERMISSIONS,
            checkData.user_id,
            checkData.permission,
            checkData.resource_type,
            checkData.resource_id || 'none',
            checkData.context ? this.hashObject(checkData.context) : 'nocontext'
        ];
        return parts.join(':');
    }
    async getCachedPermissionResult(cacheKey) {
        return this.redis.getCache(cacheKey);
    }
    async cachePermissionResult(cacheKey, result) {
        await this.redis.setCache(cacheKey, result, shield_constants_1.SHIELD_CONSTANTS.CACHE.PERMISSIONS_TTL);
    }
    deduplicatePermissions(permissions) {
        const seen = new Set();
        return permissions.filter(permission => {
            const key = `${permission.name}:${permission.resource_type}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
    hashObject(obj) {
        return Buffer.from(JSON.stringify(obj)).toString('base64').substring(0, 8);
    }
    async auditPermissionCheck(checkData, result) {
        await this.bullmq.addJob(shield_constants_1.SHIELD_CONSTANTS.QUEUES.ACCESS_AUDIT, shield_constants_1.SHIELD_CONSTANTS.JOBS.LOG_ACCESS_EVENT, {
            user_id: checkData.user_id,
            event_type: result.granted ? access_enums_1.AuditEventType.ACCESS_GRANTED : access_enums_1.AuditEventType.ACCESS_DENIED,
            resource_type: checkData.resource_type,
            resource_id: checkData.resource_id,
            action: 'PERMISSION_CHECK',
            status: result.granted ? access_enums_1.AccessStatus.SUCCESS : access_enums_1.AccessStatus.DENIED,
            details: {
                permission: checkData.permission,
                reason: result.reason,
                computed_permissions: result.computed_permissions,
                effective_roles: result.effective_roles,
                conditions_met: result.conditions_met,
                cache_hit: result.cache_hit,
            },
            timestamp: new Date(),
        }, {
            priority: shield_constants_1.SHIELD_CONSTANTS.JOB_PRIORITIES.HIGH,
        });
    }
    async hasPermission(userId, permission, resourceType, resourceId, context) {
        const result = await this.checkPermission({
            user_id: userId,
            permission,
            resource_type: resourceType,
            resource_id: resourceId,
            context,
        });
        return result.granted;
    }
    async getUserPermissions(userId) {
        const effectivePermissions = await this.getEffectivePermissions(userId);
        const accessRights = await this.prisma.access_rights.findMany({
            where: {
                user_id: userId,
                status: 'VALID',
                valid_from: { lte: new Date() },
                valid_until: { gte: new Date() },
            },
        });
        const userRoles = await this.prisma.user_roles.findMany({
            where: {
                user_id: userId,
                status: 'ACTIVE',
            },
            include: {
                roles: true,
            },
        });
        return {
            user_id: userId,
            effective_permissions: effectivePermissions,
            access_rights: accessRights,
            roles: userRoles,
            computed_at: new Date(),
        };
    }
    async invalidateUserPermissionsCache(userId) {
        const cacheKey = `${shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.USER_PERMISSIONS}${userId}`;
        await this.redis.delCache(cacheKey);
        const pattern = `${shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.USER_PERMISSIONS}${userId}:*`;
        await this.redis.deleteByPattern(pattern);
        this.logger.logBusinessEvent('USER_PERMISSIONS_CACHE_INVALIDATED', { userId }, userId);
    }
};
exports.RbacService = RbacService;
exports.RbacService = RbacService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        bullmq_service_1.BullmqService,
        logger_service_1.LoggerService])
], RbacService);
//# sourceMappingURL=rbac.service.js.map