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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const bullmq_service_1 = require("../../../shared/bullmq/bullmq.service");
const access_enums_1 = require("../types/access-enums");
const shield_constants_1 = require("../types/shield-constants");
let RolesService = class RolesService {
    prisma;
    redis;
    bullmq;
    logger;
    constructor(prisma, redis, bullmq, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.bullmq = bullmq;
        this.logger = loggerService.createChildLogger('RolesService');
    }
    async createRole(roleData) {
        const operationId = this.logger.startOperation('createRole', {
            name: roleData.name,
            scope: roleData.scope,
        });
        try {
            this.logger.info('Creating role', JSON.stringify({
                name: roleData.name,
                displayName: roleData.display_name,
                scope: roleData.scope,
                level: roleData.level,
            }));
            await this.validateRoleUniqueness(roleData.name);
            await this.validateRoleCreation(roleData);
            const createData = {
                name: roleData.name,
                display_name: roleData.display_name,
                description: roleData.description || null,
                scope: roleData.scope,
                level: roleData.level,
                is_system: false,
                is_active: true,
                metadata: roleData.metadata || client_1.Prisma.JsonNull,
            };
            const role = await this.prisma.roles.create({
                data: createData,
            });
            await this.cacheRole(role);
            await this.auditRoleEvent(role, access_enums_1.AuditEventType.ROLE_ASSIGNED, { created_by: 'system' });
            this.logger.logBusinessEvent('ROLE_CREATED', {
                roleId: role.id,
                name: role.name,
                scope: role.scope,
                level: role.level,
            }, 'system');
            this.logger.endOperation('createRole', operationId, true);
            return role;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'RolesService.createRole', 'system', {
                roleName: roleData.name,
                errorType: error.constructor.name,
            });
            this.logger.endOperation('createRole', operationId, false);
            throw error;
        }
    }
    async findRoleById(id) {
        const cacheKey = `${shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.ROLE_PERMISSIONS}${id}`;
        const cached = await this.redis.getCache(cacheKey);
        if (cached) {
            this.logger.logCacheEvent('hit', cacheKey);
            return cached;
        }
        this.logger.logCacheEvent('miss', cacheKey);
        const role = await this.prisma.roles.findUnique({
            where: { id },
            include: {
                role_permissions: {
                    include: {
                        permissions: true
                    }
                },
                user_roles_user_roles_assigned_byTousers: {
                    select: { id: true }
                },
                user_roles_user_roles_user_idTousers: {
                    where: { status: access_enums_1.MembershipStatus.ACTIVE },
                    select: {
                        id: true,
                        user_id: true,
                        assigned_at: true,
                        valid_until: true
                    }
                }
            }
        });
        if (!role) {
            throw new common_1.NotFoundException(`Rôle avec l'ID ${id} introuvable`);
        }
        await this.cacheRole(role);
        return role;
    }
    async findRoleByName(name) {
        const role = await this.prisma.roles.findUnique({
            where: { name },
            include: {
                role_permissions: {
                    include: {
                        permissions: true
                    }
                }
            }
        });
        if (!role) {
            throw new common_1.NotFoundException(`Rôle avec le nom ${name} introuvable`);
        }
        return role;
    }
    async findManyRoles(filters) {
        const operationId = this.logger.startOperation('findManyRoles', { filters });
        try {
            const where = {};
            if (filters?.scope)
                where.scope = filters.scope;
            if (filters?.is_active !== undefined)
                where.is_active = filters.is_active;
            if (filters?.is_system !== undefined)
                where.is_system = filters.is_system;
            if (filters?.level_min)
                where.level = { gte: filters.level_min };
            if (filters?.level_max) {
                where.level = {
                    ...where.level,
                    lte: filters.level_max
                };
            }
            const roles = await this.prisma.roles.findMany({
                where,
                include: {
                    role_permissions: {
                        include: {
                            permissions: {
                                select: {
                                    id: true,
                                    name: true,
                                    display_name: true,
                                    resource_type: true,
                                    action: true
                                }
                            }
                        }
                    },
                    user_roles_user_roles_user_idTousers: {
                        where: { status: access_enums_1.MembershipStatus.ACTIVE },
                        select: { id: true }
                    }
                },
                orderBy: [
                    { level: 'asc' },
                    { name: 'asc' }
                ]
            });
            const hierarchy = await this.getRoleHierarchy();
            this.logger.endOperation('findManyRoles', operationId, true);
            return {
                roles: roles,
                hierarchy,
                total: roles.length,
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'RolesService.findManyRoles', 'system');
            this.logger.endOperation('findManyRoles', operationId, false);
            throw error;
        }
    }
    async updateRole(id, updateData) {
        const operationId = this.logger.startOperation('updateRole', { id });
        try {
            const existingRole = await this.findRoleById(id);
            if (existingRole.is_system) {
                throw new common_1.BadRequestException('Les rôles système ne peuvent pas être modifiés');
            }
            const updateInput = {};
            if (updateData.display_name !== undefined)
                updateInput.display_name = updateData.display_name;
            if (updateData.description !== undefined)
                updateInput.description = updateData.description;
            if (updateData.level !== undefined)
                updateInput.level = updateData.level;
            if (updateData.is_active !== undefined)
                updateInput.is_active = updateData.is_active;
            if (updateData.metadata !== undefined) {
                updateInput.metadata = updateData.metadata || client_1.Prisma.JsonNull;
            }
            const updatedRole = await this.prisma.roles.update({
                where: { id },
                data: updateInput,
                include: {
                    role_permissions: {
                        include: {
                            permissions: true
                        }
                    }
                }
            });
            await this.invalidateRoleCache(id);
            await this.auditRoleEvent(updatedRole, access_enums_1.AuditEventType.ROLE_ASSIGNED, {
                updated_fields: Object.keys(updateData),
                previous_values: {
                    display_name: existingRole.display_name,
                    level: existingRole.level,
                    is_active: existingRole.is_active
                }
            });
            this.logger.logBusinessEvent('ROLE_UPDATED', {
                roleId: id,
                updatedFields: Object.keys(updateData),
                previousLevel: existingRole.level,
                newLevel: updatedRole.level,
            }, 'system');
            this.logger.endOperation('updateRole', operationId, true);
            return updatedRole;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'RolesService.updateRole', 'system', { roleId: id });
            this.logger.endOperation('updateRole', operationId, false);
            throw error;
        }
    }
    async assignRole(assignData, assignedBy) {
        const operationId = this.logger.startOperation('assignRole', {
            userId: assignData.user_id,
            roleId: assignData.role_id,
            assignedBy,
        });
        try {
            this.logger.info('Assigning role to user', JSON.stringify({
                userId: assignData.user_id,
                roleId: assignData.role_id,
                assignedBy,
                validUntil: assignData.valid_until,
            }));
            await this.validateRoleAssignment(assignData);
            const existingAssignment = await this.prisma.user_roles.findUnique({
                where: {
                    uk_user_roles_user_role: {
                        user_id: assignData.user_id,
                        role_id: assignData.role_id,
                    }
                }
            });
            if (existingAssignment && existingAssignment.status === access_enums_1.MembershipStatus.ACTIVE) {
                throw new common_1.ConflictException('L\'utilisateur possède déjà ce rôle');
            }
            const createData = {
                users_user_roles_user_idTousers: { connect: { id: assignData.user_id } },
                roles: { connect: { id: assignData.role_id } },
                assigned_at: new Date(),
                valid_until: assignData.valid_until || null,
                status: access_enums_1.MembershipStatus.ACTIVE,
                users_user_roles_assigned_byTousers: assignedBy ? { connect: { id: assignedBy } } : undefined,
                notes: assignData.notes || null,
            };
            const userRole = await this.prisma.$transaction(async (tx) => {
                if (existingAssignment) {
                    await tx.user_roles.update({
                        where: { id: existingAssignment.id },
                        data: {
                            status: access_enums_1.MembershipStatus.CANCELLED,
                            updated_at: new Date()
                        }
                    });
                }
                const newUserRole = await tx.user_roles.create({
                    data: createData,
                    include: {
                        users_user_roles_user_idTousers: {
                            select: { id: true, email: true, first_name: true, last_name: true }
                        },
                        roles: {
                            select: { id: true, name: true, display_name: true, scope: true, level: true }
                        },
                        users_user_roles_assigned_byTousers: {
                            select: { id: true, email: true, first_name: true, last_name: true }
                        }
                    }
                });
                return newUserRole;
            });
            await this.invalidateUserPermissionsCache(assignData.user_id);
            await this.auditRoleEvent(userRole.roles, access_enums_1.AuditEventType.ROLE_ASSIGNED, {
                user_id: assignData.user_id,
                assigned_by: assignedBy,
                valid_until: assignData.valid_until,
                notes: assignData.notes
            });
            this.logger.logBusinessEvent('ROLE_ASSIGNED_TO_USER', {
                userRoleId: userRole.id,
                userId: assignData.user_id,
                roleId: assignData.role_id,
                roleName: userRole.roles.name,
                assignedBy,
                validUntil: assignData.valid_until,
            }, assignData.user_id);
            this.logger.endOperation('assignRole', operationId, true);
            return userRole;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'RolesService.assignRole', assignData.user_id, {
                roleId: assignData.role_id,
                assignedBy,
                errorType: error.constructor.name,
            });
            this.logger.endOperation('assignRole', operationId, false);
            throw error;
        }
    }
    async removeRole(userId, roleId, removedBy) {
        const operationId = this.logger.startOperation('removeRole', {
            userId,
            roleId,
            removedBy,
        });
        try {
            this.logger.info('Removing role from user', JSON.stringify({
                userId,
                roleId,
                removedBy,
            }));
            const userRole = await this.prisma.user_roles.findUnique({
                where: {
                    uk_user_roles_user_role: {
                        user_id: userId,
                        role_id: roleId,
                    }
                },
                include: {
                    roles: true
                }
            });
            if (!userRole || userRole.status !== access_enums_1.MembershipStatus.ACTIVE) {
                throw new common_1.NotFoundException('Assignation de rôle active introuvable');
            }
            if (userRole.roles.is_system && userRole.roles.level <= 2) {
                throw new common_1.BadRequestException('Les rôles système critiques ne peuvent pas être retirés');
            }
            await this.prisma.user_roles.update({
                where: { id: userRole.id },
                data: {
                    status: access_enums_1.MembershipStatus.CANCELLED,
                    updated_at: new Date(),
                    notes: userRole.notes ?
                        `${userRole.notes}\n[${new Date().toISOString()}] Retiré par ${removedBy}` :
                        `Retiré par ${removedBy}`
                }
            });
            await this.invalidateUserPermissionsCache(userId);
            await this.auditRoleEvent(userRole.roles, access_enums_1.AuditEventType.ROLE_REMOVED, {
                user_id: userId,
                removed_by: removedBy,
                user_role_id: userRole.id
            });
            this.logger.logBusinessEvent('ROLE_REMOVED_FROM_USER', {
                userRoleId: userRole.id,
                userId,
                roleId,
                roleName: userRole.roles.name,
                removedBy,
            }, userId);
            this.logger.endOperation('removeRole', operationId, true);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'RolesService.removeRole', userId, {
                roleId,
                removedBy,
                errorType: error.constructor.name,
            });
            this.logger.endOperation('removeRole', operationId, false);
            throw error;
        }
    }
    async getUserRoles(userId) {
        const userRoles = await this.prisma.user_roles.findMany({
            where: {
                user_id: userId,
                status: access_enums_1.MembershipStatus.ACTIVE,
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
                },
                users_user_roles_assigned_byTousers: {
                    select: { id: true, email: true, first_name: true, last_name: true }
                }
            },
            orderBy: [
                { roles: { level: 'asc' } },
                { assigned_at: 'desc' }
            ]
        });
        return userRoles;
    }
    async getRoleHierarchy() {
        return [];
    }
    async validateRoleUniqueness(name) {
        const existingRole = await this.prisma.roles.findUnique({
            where: { name },
            select: { id: true }
        });
        if (existingRole) {
            throw new common_1.ConflictException(`Un rôle avec le nom '${name}' existe déjà`);
        }
    }
    async validateRoleCreation(roleData) {
        const scopeLevelLimits = {
            [access_enums_1.RoleScope.SYSTEM]: { min: 1, max: 5 },
            [access_enums_1.RoleScope.ORGANIZER]: { min: 3, max: 8 },
            [access_enums_1.RoleScope.VENUE]: { min: 4, max: 9 },
            [access_enums_1.RoleScope.GROUP]: { min: 5, max: 10 },
            [access_enums_1.RoleScope.EVENT]: { min: 6, max: 10 },
        };
        const limits = scopeLevelLimits[roleData.scope];
        if (roleData.level < limits.min || roleData.level > limits.max) {
            throw new common_1.BadRequestException(`Le niveau pour la portée ${roleData.scope} doit être entre ${limits.min} et ${limits.max}`);
        }
        const sameLevel = await this.prisma.roles.count({
            where: {
                scope: roleData.scope,
                level: roleData.level,
                is_active: true
            }
        });
        if (sameLevel >= 3) {
            throw new common_1.BadRequestException(`Trop de rôles actifs au niveau ${roleData.level} pour la portée ${roleData.scope}`);
        }
    }
    async validateRoleAssignment(assignData) {
        const user = await this.prisma.users.findUnique({
            where: { id: assignData.user_id },
            select: { id: true, is_active: true }
        });
        if (!user) {
            throw new common_1.NotFoundException(`Utilisateur avec l'ID ${assignData.user_id} introuvable`);
        }
        if (!user.is_active) {
            throw new common_1.BadRequestException('L\'utilisateur doit être actif pour recevoir un rôle');
        }
        const role = await this.prisma.roles.findUnique({
            where: { id: assignData.role_id },
            select: { id: true, is_active: true, name: true }
        });
        if (!role) {
            throw new common_1.NotFoundException(`Rôle avec l'ID ${assignData.role_id} introuvable`);
        }
        if (!role.is_active) {
            throw new common_1.BadRequestException('Le rôle doit être actif pour être assigné');
        }
        const userRolesCount = await this.prisma.user_roles.count({
            where: {
                user_id: assignData.user_id,
                status: access_enums_1.MembershipStatus.ACTIVE
            }
        });
        if (userRolesCount >= shield_constants_1.SHIELD_CONSTANTS.LIMITS.MAX_ROLES_PER_USER) {
            throw new common_1.BadRequestException(`L'utilisateur a atteint la limite de ${shield_constants_1.SHIELD_CONSTANTS.LIMITS.MAX_ROLES_PER_USER} rôles`);
        }
        if (assignData.valid_until && assignData.valid_until <= new Date()) {
            throw new common_1.BadRequestException('La date d\'expiration doit être dans le futur');
        }
    }
    async cacheRole(role) {
        const cacheKey = `${shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.ROLE_PERMISSIONS}${role.id}`;
        await this.redis.setCache(cacheKey, role, shield_constants_1.SHIELD_CONSTANTS.CACHE.ROLES_TTL);
    }
    async invalidateRoleCache(roleId) {
        const cacheKey = `${shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.ROLE_PERMISSIONS}${roleId}`;
        await this.redis.deleteCache(cacheKey);
    }
    async invalidateUserPermissionsCache(userId) {
        const cacheKey = `${shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.USER_PERMISSIONS}${userId}`;
        await this.redis.deleteCache(cacheKey);
        const pattern = `${shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.USER_PERMISSIONS}${userId}:*`;
        await this.redis.deleteByPattern(pattern);
        this.logger.logBusinessEvent('USER_PERMISSIONS_CACHE_INVALIDATED', { userId, reason: 'role_change' }, userId);
    }
    async auditRoleEvent(role, eventType, details) {
        await this.bullmq.addJob(shield_constants_1.SHIELD_CONSTANTS.QUEUES.ACCESS_AUDIT, shield_constants_1.SHIELD_CONSTANTS.JOBS.LOG_ACCESS_EVENT, {
            user_id: details.user_id || null,
            event_type: eventType,
            resource_type: 'ROLE',
            resource_id: role.id,
            action: 'ROLE_OPERATION',
            status: access_enums_1.AccessStatus.SUCCESS,
            details: {
                role_name: role.name,
                role_scope: role.scope,
                role_level: role.level,
                ...details
            },
            timestamp: new Date(),
        }, {
            priority: shield_constants_1.SHIELD_CONSTANTS.JOB_PRIORITIES.HIGH,
        });
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        bullmq_service_1.BullmqService,
        logger_service_1.LoggerService])
], RolesService);
//# sourceMappingURL=roles.service.js.map