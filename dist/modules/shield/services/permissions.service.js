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
exports.PermissionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const bullmq_service_1 = require("../../../shared/bullmq/bullmq.service");
const access_enums_1 = require("../types/access-enums");
const shield_constants_1 = require("../types/shield-constants");
let PermissionsService = class PermissionsService {
    prisma;
    redis;
    bullmq;
    logger;
    constructor(prisma, redis, bullmq, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.bullmq = bullmq;
        this.logger = loggerService.createChildLogger('PermissionsService');
    }
    async createPermission(permissionData) {
        const operationId = this.logger.startOperation('createPermission', {
            name: permissionData.name,
            resourceType: permissionData.resource_type,
            action: permissionData.action,
        });
        try {
            this.logger.info('Creating permission', JSON.stringify({
                name: permissionData.name,
                displayName: permissionData.display_name,
                resourceType: permissionData.resource_type,
                action: permissionData.action,
            }));
            await this.validatePermissionUniqueness(permissionData.name);
            await this.validatePermissionCreation(permissionData);
            const createData = {
                name: permissionData.name,
                display_name: permissionData.display_name,
                description: permissionData.description || null,
                resource_type: permissionData.resource_type,
                action: permissionData.action,
                conditions: permissionData.conditions || client_1.Prisma.JsonNull,
                is_system: false,
                is_active: true,
                metadata: permissionData.metadata || client_1.Prisma.JsonNull,
            };
            const permission = await this.prisma.permissions.create({
                data: createData,
            });
            await this.cachePermission(permission);
            await this.auditPermissionEvent(permission, access_enums_1.AuditEventType.PERMISSION_GRANTED, { created_by: 'system' });
            this.logger.logBusinessEvent('PERMISSION_CREATED', {
                permissionId: permission.id,
                name: permission.name,
                resourceType: permission.resource_type,
                action: permission.action,
            }, 'system');
            this.logger.endOperation('createPermission', operationId, true);
            return permission;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'PermissionsService.createPermission', 'system', {
                permissionName: permissionData.name,
                errorType: error.constructor.name,
            });
            this.logger.endOperation('createPermission', operationId, false);
            throw error;
        }
    }
    async findPermissionById(id) {
        const cacheKey = `${shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.ROLE_PERMISSIONS}permission:${id}`;
        const cached = await this.redis.getCache(cacheKey);
        if (cached) {
            this.logger.logCacheEvent('hit', cacheKey);
            return cached;
        }
        this.logger.logCacheEvent('miss', cacheKey);
        const permission = await this.prisma.permissions.findUnique({
            where: { id },
            include: {
                role_permissions: {
                    include: {
                        roles: {
                            select: { id: true, name: true, display_name: true, scope: true }
                        }
                    }
                }
            }
        });
        if (!permission) {
            throw new common_1.NotFoundException(`Permission avec l'ID ${id} introuvable`);
        }
        await this.cachePermission(permission);
        return permission;
    }
    async findPermissionByName(name) {
        const permission = await this.prisma.permissions.findUnique({
            where: { name },
            include: {
                role_permissions: {
                    include: {
                        roles: true
                    }
                }
            }
        });
        if (!permission) {
            throw new common_1.NotFoundException(`Permission avec le nom ${name} introuvable`);
        }
        return permission;
    }
    async findManyPermissions(filters) {
        const operationId = this.logger.startOperation('findManyPermissions', { filters });
        try {
            const where = {};
            if (filters?.resource_type)
                where.resource_type = filters.resource_type;
            if (filters?.action)
                where.action = filters.action;
            if (filters?.is_active !== undefined)
                where.is_active = filters.is_active;
            if (filters?.is_system !== undefined)
                where.is_system = filters.is_system;
            const permissions = await this.prisma.permissions.findMany({
                where,
                include: {
                    role_permissions: {
                        include: {
                            roles: {
                                select: { id: true, name: true, display_name: true, scope: true }
                            }
                        }
                    }
                },
                orderBy: [
                    { resource_type: 'asc' },
                    { action: 'asc' },
                    { name: 'asc' }
                ]
            });
            const groupedByResource = permissions.reduce((acc, permission) => {
                const resourceType = permission.resource_type;
                if (!acc[resourceType]) {
                    acc[resourceType] = [];
                }
                acc[resourceType].push(permission);
                return acc;
            }, {});
            this.logger.endOperation('findManyPermissions', operationId, true);
            return {
                permissions: permissions,
                grouped_by_resource: groupedByResource,
                total: permissions.length,
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'PermissionsService.findManyPermissions', 'system');
            this.logger.endOperation('findManyPermissions', operationId, false);
            throw error;
        }
    }
    async updatePermission(id, updateData) {
        const operationId = this.logger.startOperation('updatePermission', { id });
        try {
            const existingPermission = await this.findPermissionById(id);
            if (existingPermission.is_system) {
                throw new common_1.BadRequestException('Les permissions système ne peuvent pas être modifiées');
            }
            const updateInput = {};
            if (updateData.display_name !== undefined)
                updateInput.display_name = updateData.display_name;
            if (updateData.description !== undefined)
                updateInput.description = updateData.description;
            if (updateData.conditions !== undefined) {
                updateInput.conditions = updateData.conditions || client_1.Prisma.JsonNull;
            }
            if (updateData.metadata !== undefined) {
                updateInput.metadata = updateData.metadata || client_1.Prisma.JsonNull;
            }
            const updatedPermission = await this.prisma.permissions.update({
                where: { id },
                data: updateInput,
                include: {
                    role_permissions: {
                        include: {
                            roles: true
                        }
                    }
                }
            });
            await this.invalidatePermissionCache(id);
            await this.auditPermissionEvent(updatedPermission, access_enums_1.AuditEventType.PERMISSION_GRANTED, {
                updated_fields: Object.keys(updateData),
                previous_values: {
                    display_name: existingPermission.display_name,
                    description: existingPermission.description
                }
            });
            this.logger.logBusinessEvent('PERMISSION_UPDATED', {
                permissionId: id,
                updatedFields: Object.keys(updateData),
            }, 'system');
            this.logger.endOperation('updatePermission', operationId, true);
            return updatedPermission;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'PermissionsService.updatePermission', 'system', { permissionId: id });
            this.logger.endOperation('updatePermission', operationId, false);
            throw error;
        }
    }
    async assignPermissionToRole(roleId, permissionId) {
        const operationId = this.logger.startOperation('assignPermissionToRole', {
            roleId,
            permissionId,
        });
        try {
            this.logger.info('Assigning permission to role', JSON.stringify({
                roleId,
                permissionId,
            }));
            const [role, permission] = await Promise.all([
                this.prisma.roles.findUnique({ where: { id: roleId } }),
                this.prisma.permissions.findUnique({ where: { id: permissionId } })
            ]);
            if (!role) {
                throw new common_1.NotFoundException(`Rôle avec l'ID ${roleId} introuvable`);
            }
            if (!permission) {
                throw new common_1.NotFoundException(`Permission avec l'ID ${permissionId} introuvable`);
            }
            if (!role.is_active) {
                throw new common_1.BadRequestException('Le rôle doit être actif');
            }
            if (!permission.is_active) {
                throw new common_1.BadRequestException('La permission doit être active');
            }
            const existingAssignment = await this.prisma.role_permissions.findUnique({
                where: {
                    uk_role_permissions_role_permission: {
                        role_id: roleId,
                        permission_id: permissionId
                    }
                }
            });
            if (existingAssignment) {
                throw new common_1.ConflictException('Cette permission est déjà assignée à ce rôle');
            }
            const rolePermissionsCount = await this.prisma.role_permissions.count({
                where: { role_id: roleId }
            });
            if (rolePermissionsCount >= shield_constants_1.SHIELD_CONSTANTS.LIMITS.MAX_PERMISSIONS_PER_ROLE) {
                throw new common_1.BadRequestException(`Le rôle a atteint la limite de ${shield_constants_1.SHIELD_CONSTANTS.LIMITS.MAX_PERMISSIONS_PER_ROLE} permissions`);
            }
            await this.prisma.role_permissions.create({
                data: {
                    roles: { connect: { id: roleId } },
                    permissions: { connect: { id: permissionId } },
                }
            });
            await this.invalidateRolePermissionsCache(roleId);
            await this.auditPermissionEvent(permission, access_enums_1.AuditEventType.PERMISSION_GRANTED, {
                role_id: roleId,
                role_name: role.name,
                action: 'assigned_to_role'
            });
            this.logger.logBusinessEvent('PERMISSION_ASSIGNED_TO_ROLE', {
                roleId,
                permissionId,
                roleName: role.name,
                permissionName: permission.name,
            }, 'system');
            this.logger.endOperation('assignPermissionToRole', operationId, true);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'PermissionsService.assignPermissionToRole', 'system', {
                roleId,
                permissionId,
                errorType: error.constructor.name,
            });
            this.logger.endOperation('assignPermissionToRole', operationId, false);
            throw error;
        }
    }
    async removePermissionFromRole(roleId, permissionId) {
        const operationId = this.logger.startOperation('removePermissionFromRole', {
            roleId,
            permissionId,
        });
        try {
            this.logger.info('Removing permission from role', JSON.stringify({
                roleId,
                permissionId,
            }));
            const assignment = await this.prisma.role_permissions.findUnique({
                where: {
                    uk_role_permissions_role_permission: {
                        role_id: roleId,
                        permission_id: permissionId
                    }
                },
                include: {
                    roles: true,
                    permissions: true
                }
            });
            if (!assignment) {
                throw new common_1.NotFoundException('Assignation de permission introuvable');
            }
            if (assignment.permissions.is_system && assignment.roles.is_system) {
                throw new common_1.BadRequestException('Les permissions système critiques ne peuvent pas être retirées');
            }
            await this.prisma.role_permissions.delete({
                where: { id: assignment.id }
            });
            await this.invalidateRolePermissionsCache(roleId);
            await this.auditPermissionEvent(assignment.permissions, access_enums_1.AuditEventType.PERMISSION_REVOKED, {
                role_id: roleId,
                role_name: assignment.roles.name,
                action: 'removed_from_role'
            });
            this.logger.logBusinessEvent('PERMISSION_REMOVED_FROM_ROLE', {
                roleId,
                permissionId,
                roleName: assignment.roles.name,
                permissionName: assignment.permissions.name,
            }, 'system');
            this.logger.endOperation('removePermissionFromRole', operationId, true);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'PermissionsService.removePermissionFromRole', 'system', {
                roleId,
                permissionId,
                errorType: error.constructor.name,
            });
            this.logger.endOperation('removePermissionFromRole', operationId, false);
            throw error;
        }
    }
    async bulkAssignPermissions(bulkData) {
        const operationId = this.logger.startOperation('bulkAssignPermissions', {
            assignmentCount: bulkData.assignments.length
        });
        try {
            this.logger.info('Bulk assigning permissions', JSON.stringify({
                assignmentCount: bulkData.assignments.length,
                assignments: bulkData.assignments.map(a => ({
                    roleId: a.role_id,
                    permissionCount: a.permission_ids.length
                }))
            }));
            await this.prisma.$transaction(async (tx) => {
                for (const assignment of bulkData.assignments) {
                    const role = await tx.roles.findUnique({
                        where: { id: assignment.role_id }
                    });
                    if (!role || !role.is_active) {
                        throw new common_1.BadRequestException(`Rôle ${assignment.role_id} introuvable ou inactif`);
                    }
                    for (const permissionId of assignment.permission_ids) {
                        const permission = await tx.permissions.findUnique({
                            where: { id: permissionId }
                        });
                        if (!permission || !permission.is_active) {
                            throw new common_1.BadRequestException(`Permission ${permissionId} introuvable ou inactive`);
                        }
                        const existingAssignment = await tx.role_permissions.findUnique({
                            where: {
                                uk_role_permissions_role_permission: {
                                    role_id: assignment.role_id,
                                    permission_id: permissionId
                                }
                            }
                        });
                        if (!existingAssignment) {
                            await tx.role_permissions.create({
                                data: {
                                    roles: { connect: { id: assignment.role_id } },
                                    permissions: { connect: { id: permissionId } },
                                }
                            });
                            await this.auditPermissionEvent(permission, access_enums_1.AuditEventType.PERMISSION_GRANTED, {
                                role_id: assignment.role_id,
                                role_name: role.name,
                                action: 'bulk_assigned_to_role'
                            });
                        }
                    }
                    await this.invalidateRolePermissionsCache(assignment.role_id);
                }
            });
            this.logger.logBusinessEvent('PERMISSIONS_BULK_ASSIGNED', {
                assignmentCount: bulkData.assignments.length,
                totalPermissions: bulkData.assignments.reduce((acc, a) => acc + a.permission_ids.length, 0),
            }, 'system');
            this.logger.endOperation('bulkAssignPermissions', operationId, true);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'PermissionsService.bulkAssignPermissions', 'system', {
                assignmentCount: bulkData.assignments.length,
                errorType: error.constructor.name,
            });
            this.logger.endOperation('bulkAssignPermissions', operationId, false);
            throw error;
        }
    }
    async getRolePermissions(roleId) {
        const rolePermissions = await this.prisma.role_permissions.findMany({
            where: { role_id: roleId },
            include: {
                permissions: true
            },
            orderBy: {
                permissions: {
                    name: 'asc'
                }
            }
        });
        return rolePermissions.map(rp => rp.permissions);
    }
    async initializeSystemPermissions() {
        const operationId = this.logger.startOperation('initializeSystemPermissions');
        try {
            this.logger.info('Initializing system permissions');
            const systemPermissions = this.getSystemPermissionsDefinitions();
            for (const permissionDef of systemPermissions) {
                const existing = await this.prisma.permissions.findUnique({
                    where: { name: permissionDef.name }
                });
                if (!existing) {
                    await this.prisma.permissions.create({
                        data: {
                            ...permissionDef,
                            is_system: true,
                            is_active: true,
                            metadata: client_1.Prisma.JsonNull,
                        }
                    });
                    this.logger.info(`Created system permission: ${permissionDef.name}`);
                }
            }
            this.logger.endOperation('initializeSystemPermissions', operationId, true);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'PermissionsService.initializeSystemPermissions', 'system');
            this.logger.endOperation('initializeSystemPermissions', operationId, false);
            throw error;
        }
    }
    getSystemPermissionsDefinitions() {
        return [
            {
                name: 'users:read',
                display_name: 'Lire les utilisateurs',
                description: 'Permet de consulter les informations des utilisateurs',
                resource_type: access_enums_1.ResourceType.USER,
                action: access_enums_1.PermissionAction.READ,
            },
            {
                name: 'users:create',
                display_name: 'Créer des utilisateurs',
                description: 'Permet de créer de nouveaux utilisateurs',
                resource_type: access_enums_1.ResourceType.USER,
                action: access_enums_1.PermissionAction.CREATE,
            },
            {
                name: 'users:update',
                display_name: 'Modifier les utilisateurs',
                description: 'Permet de modifier les informations des utilisateurs',
                resource_type: access_enums_1.ResourceType.USER,
                action: access_enums_1.PermissionAction.UPDATE,
            },
            {
                name: 'users:delete',
                display_name: 'Supprimer les utilisateurs',
                description: 'Permet de supprimer des utilisateurs',
                resource_type: access_enums_1.ResourceType.USER,
                action: access_enums_1.PermissionAction.DELETE,
            },
            {
                name: 'events:read',
                display_name: 'Lire les événements',
                description: 'Permet de consulter les événements',
                resource_type: access_enums_1.ResourceType.EVENT,
                action: access_enums_1.PermissionAction.READ,
            },
            {
                name: 'events:create',
                display_name: 'Créer des événements',
                description: 'Permet de créer de nouveaux événements',
                resource_type: access_enums_1.ResourceType.EVENT,
                action: access_enums_1.PermissionAction.CREATE,
            },
            {
                name: 'events:update',
                display_name: 'Modifier les événements',
                description: 'Permet de modifier les événements',
                resource_type: access_enums_1.ResourceType.EVENT,
                action: access_enums_1.PermissionAction.UPDATE,
                conditions: {
                    own_resource_only: true,
                    organizer_scope: true
                }
            },
            {
                name: 'events:delete',
                display_name: 'Supprimer les événements',
                description: 'Permet de supprimer des événements',
                resource_type: access_enums_1.ResourceType.EVENT,
                action: access_enums_1.PermissionAction.DELETE,
                conditions: {
                    own_resource_only: true,
                    organizer_scope: true
                }
            },
            {
                name: 'events:manage',
                display_name: 'Gérer les événements',
                description: 'Permet la gestion complète des événements',
                resource_type: access_enums_1.ResourceType.EVENT,
                action: access_enums_1.PermissionAction.MANAGE,
            },
            {
                name: 'organizers:read',
                display_name: 'Lire les organisateurs',
                description: 'Permet de consulter les organisateurs',
                resource_type: access_enums_1.ResourceType.ORGANIZER,
                action: access_enums_1.PermissionAction.READ,
            },
            {
                name: 'organizers:manage',
                display_name: 'Gérer les organisateurs',
                description: 'Permet la gestion complète des organisateurs',
                resource_type: access_enums_1.ResourceType.ORGANIZER,
                action: access_enums_1.PermissionAction.MANAGE,
            },
            {
                name: 'access_rights:read',
                display_name: 'Lire les droits d\'accès',
                description: 'Permet de consulter les droits d\'accès',
                resource_type: access_enums_1.ResourceType.ACCESS_RIGHT,
                action: access_enums_1.PermissionAction.READ,
            },
            {
                name: 'access_rights:create',
                display_name: 'Créer des droits d\'accès',
                description: 'Permet de créer de nouveaux droits d\'accès',
                resource_type: access_enums_1.ResourceType.ACCESS_RIGHT,
                action: access_enums_1.PermissionAction.CREATE,
            },
            {
                name: 'access_rights:validate',
                display_name: 'Valider les droits d\'accès',
                description: 'Permet de valider les droits d\'accès aux points de contrôle',
                resource_type: access_enums_1.ResourceType.ACCESS_RIGHT,
                action: access_enums_1.PermissionAction.APPROVE,
            },
            {
                name: 'roles:read',
                display_name: 'Lire les rôles',
                description: 'Permet de consulter les rôles',
                resource_type: access_enums_1.ResourceType.ROLE,
                action: access_enums_1.PermissionAction.READ,
            },
            {
                name: 'roles:manage',
                display_name: 'Gérer les rôles',
                description: 'Permet la gestion complète des rôles',
                resource_type: access_enums_1.ResourceType.ROLE,
                action: access_enums_1.PermissionAction.MANAGE,
            },
            {
                name: 'permissions:read',
                display_name: 'Lire les permissions',
                description: 'Permet de consulter les permissions',
                resource_type: access_enums_1.ResourceType.PERMISSION,
                action: access_enums_1.PermissionAction.READ,
            },
            {
                name: 'permissions:manage',
                display_name: 'Gérer les permissions',
                description: 'Permet la gestion complète des permissions',
                resource_type: access_enums_1.ResourceType.PERMISSION,
                action: access_enums_1.PermissionAction.MANAGE,
            },
        ];
    }
    async validatePermissionUniqueness(name) {
        const existingPermission = await this.prisma.permissions.findUnique({
            where: { name },
            select: { id: true }
        });
        if (existingPermission) {
            throw new common_1.ConflictException(`Une permission avec le nom '${name}' existe déjà`);
        }
    }
    async validatePermissionCreation(permissionData) {
        const existingCombination = await this.prisma.permissions.findFirst({
            where: {
                resource_type: permissionData.resource_type,
                action: permissionData.action,
                name: { not: permissionData.name }
            },
            select: { id: true, name: true }
        });
        if (existingCombination) {
            throw new common_1.ConflictException(`Une permission pour ${permissionData.resource_type}:${permissionData.action} existe déjà (${existingCombination.name})`);
        }
        if (permissionData.conditions) {
            this.validatePermissionConditions(permissionData.conditions);
        }
    }
    validatePermissionConditions(conditions) {
        if (typeof conditions !== 'object' || conditions === null) {
            throw new common_1.BadRequestException('Les conditions doivent être un objet valide');
        }
        if (conditions.time_restrictions) {
            const timeRestrictions = conditions.time_restrictions;
            if (timeRestrictions.start_time && timeRestrictions.end_time) {
                if (timeRestrictions.start_time >= timeRestrictions.end_time) {
                    throw new common_1.BadRequestException('L\'heure de début doit être antérieure à l\'heure de fin');
                }
            }
            if (timeRestrictions.days_of_week && Array.isArray(timeRestrictions.days_of_week)) {
                const validDays = timeRestrictions.days_of_week.every(day => Number.isInteger(day) && day >= 0 && day <= 6);
                if (!validDays) {
                    throw new common_1.BadRequestException('Les jours de la semaine doivent être des entiers entre 0 et 6');
                }
            }
        }
    }
    async cachePermission(permission) {
        const cacheKey = `${shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.ROLE_PERMISSIONS}permission:${permission.id}`;
        await this.redis.setCache(cacheKey, permission, shield_constants_1.SHIELD_CONSTANTS.CACHE.PERMISSIONS_TTL);
    }
    async invalidatePermissionCache(permissionId) {
        const cacheKey = `${shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.ROLE_PERMISSIONS}permission:${permissionId}`;
        await this.redis.deleteCache(cacheKey);
    }
    async invalidateRolePermissionsCache(roleId) {
        const cacheKey = `${shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.ROLE_PERMISSIONS}${roleId}`;
        await this.redis.deleteCache(cacheKey);
        const userRoles = await this.prisma.user_roles.findMany({
            where: {
                role_id: roleId,
                status: MembershipStatus.ACTIVE
            },
            select: { user_id: true }
        });
        for (const userRole of userRoles) {
            const userCacheKey = `${shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.USER_PERMISSIONS}${userRole.user_id}`;
            await this.redis.deleteCache(userCacheKey);
        }
        this.logger.logBusinessEvent('ROLE_PERMISSIONS_CACHE_INVALIDATED', {
            roleId,
            affectedUsers: userRoles.length,
            reason: 'permission_change'
        }, 'system');
    }
    async auditPermissionEvent(permission, eventType, details) {
        await this.bullmq.addJob(shield_constants_1.SHIELD_CONSTANTS.QUEUES.ACCESS_AUDIT, shield_constants_1.SHIELD_CONSTANTS.JOBS.LOG_ACCESS_EVENT, {
            user_id: details.user_id || null,
            event_type: eventType,
            resource_type: 'PERMISSION',
            resource_id: permission.id,
            action: 'PERMISSION_OPERATION',
            status: access_enums_1.AccessStatus.SUCCESS,
            details: {
                permission_name: permission.name,
                resource_type: permission.resource_type,
                action: permission.action,
                ...details
            },
            timestamp: new Date(),
        }, {
            priority: shield_constants_1.SHIELD_CONSTANTS.JOB_PRIORITIES.HIGH,
        });
    }
};
exports.PermissionsService = PermissionsService;
exports.PermissionsService = PermissionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        bullmq_service_1.BullmqService,
        logger_service_1.LoggerService])
], PermissionsService);
//# sourceMappingURL=permissions.service.js.map