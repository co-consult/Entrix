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
exports.PermissionSyncProcessor = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const shield_constants_1 = require("../types/shield-constants");
let PermissionSyncProcessor = class PermissionSyncProcessor {
    prisma;
    redis;
    logger;
    constructor(prisma, redis, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.logger = loggerService.createChildLogger('PermissionSyncProcessor');
    }
    async processPermissionSync(job) {
        const { data } = job;
        try {
            this.logger.info('Processing permission sync', JSON.stringify({
                jobId: job.id,
                type: data.type,
                operation: data.operation,
                userId: data.user_id,
                roleId: data.role_id,
            }));
            switch (data.type) {
                case 'USER_PERMISSIONS':
                    await this.syncUserPermissions(data);
                    break;
                case 'ROLE_PERMISSIONS':
                    await this.syncRolePermissions(data);
                    break;
                case 'HIERARCHY_UPDATE':
                    await this.syncRoleHierarchy(data);
                    break;
                default:
                    throw new Error(`Unknown sync type: ${data.type}`);
            }
            this.logger.info('Permission sync processed successfully', JSON.stringify({
                jobId: job.id,
                type: data.type,
            }));
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'PermissionSyncProcessor.processPermissionSync', data.user_id || 'system', {
                jobId: job.id,
                syncType: data.type,
                errorType: error.constructor.name,
            });
            throw error;
        }
    }
    async syncUserPermissions(data) {
        if (!data.user_id) {
            throw new Error('User ID required for user permissions sync');
        }
        try {
            const userPermissionsKey = `${shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.USER_PERMISSIONS}${data.user_id}`;
            await this.redis.deleteCache(userPermissionsKey);
            const permissionPattern = `${shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.USER_PERMISSIONS}${data.user_id}:*`;
            await this.redis.deleteByPattern(permissionPattern);
            await this.recalculateUserPermissions(data.user_id);
            this.logger.logBusinessEvent('USER_PERMISSIONS_SYNCED', {
                userId: data.user_id,
                operation: data.operation,
                timestamp: data.timestamp,
            }, data.user_id);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'PermissionSyncProcessor.syncUserPermissions', data.user_id, { operation: data.operation });
            throw error;
        }
    }
    async syncRolePermissions(data) {
        if (!data.role_id) {
            throw new Error('Role ID required for role permissions sync');
        }
        try {
            const roleKey = `${shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.ROLE_PERMISSIONS}${data.role_id}`;
            await this.redis.deleteCache(roleKey);
            const usersWithRole = await this.prisma.user_roles.findMany({
                where: {
                    role_id: data.role_id,
                    status: 'ACTIVE',
                },
                select: { user_id: true },
            });
            for (const userRole of usersWithRole) {
                const userPermissionsKey = `${shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.USER_PERMISSIONS}${userRole.user_id}`;
                await this.redis.deleteCache(userPermissionsKey);
                const userPermissionPattern = `${shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.USER_PERMISSIONS}${userRole.user_id}:*`;
                await this.redis.deleteByPattern(userPermissionPattern);
            }
            this.logger.logBusinessEvent('ROLE_PERMISSIONS_SYNCED', {
                roleId: data.role_id,
                operation: data.operation,
                affectedUsers: usersWithRole.length,
                timestamp: data.timestamp,
            }, 'system');
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'PermissionSyncProcessor.syncRolePermissions', 'system', { roleId: data.role_id, operation: data.operation });
            throw error;
        }
    }
    async syncRoleHierarchy(data) {
        try {
            const hierarchyKey = `${shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.ROLE_HIERARCHY}*`;
            await this.redis.deleteByPattern(hierarchyKey);
            const userPermissionsPattern = `${shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.USER_PERMISSIONS}*`;
            await this.redis.deleteByPattern(userPermissionsPattern);
            const rolePermissionsPattern = `${shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.ROLE_PERMISSIONS}*`;
            await this.redis.deleteByPattern(rolePermissionsPattern);
            this.logger.logBusinessEvent('ROLE_HIERARCHY_SYNCED', {
                operation: data.operation,
                timestamp: data.timestamp,
            }, 'system');
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'PermissionSyncProcessor.syncRoleHierarchy', 'system', { operation: data.operation });
            throw error;
        }
    }
    async recalculateUserPermissions(userId) {
        try {
            const userRoles = await this.prisma.user_roles.findMany({
                where: {
                    user_id: userId,
                    status: 'ACTIVE',
                    OR: [
                        { valid_until: null },
                        { valid_until: { gt: new Date() } }
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
            const allPermissions = [];
            const roles = [];
            for (const userRole of userRoles) {
                roles.push(userRole.roles);
                for (const rolePermission of userRole.roles.role_permissions) {
                    allPermissions.push(rolePermission.permissions);
                }
            }
            const uniquePermissions = allPermissions.filter((permission, index, self) => index === self.findIndex(p => p.id === permission.id));
            const effectivePermissions = {
                user_id: userId,
                direct_permissions: allPermissions,
                inherited_permissions: [],
                effective_permissions: uniquePermissions,
                roles: roles,
                computed_at: new Date(),
                expires_at: new Date(Date.now() + shield_constants_1.SHIELD_CONSTANTS.CACHE.USER_PERMISSIONS_TTL * 1000),
            };
            const cacheKey = `${shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.USER_PERMISSIONS}${userId}`;
            await this.redis.setCache(cacheKey, effectivePermissions, shield_constants_1.SHIELD_CONSTANTS.CACHE.USER_PERMISSIONS_TTL);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'PermissionSyncProcessor.recalculateUserPermissions', userId);
            throw error;
        }
    }
};
exports.PermissionSyncProcessor = PermissionSyncProcessor;
exports.PermissionSyncProcessor = PermissionSyncProcessor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        logger_service_1.LoggerService])
], PermissionSyncProcessor);
//# sourceMappingURL=permission-sync.processor.js.map