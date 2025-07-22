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
exports.GroupsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const bullmq_service_1 = require("../../../shared/bullmq/bullmq.service");
const bullmq_constants_1 = require("../../../shared/bullmq/bullmq.constants");
let GroupsService = class GroupsService {
    prisma;
    redis;
    bullmq;
    logger;
    constructor(prisma, redis, bullmq, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.bullmq = bullmq;
        this.logger = loggerService.createChildLogger('GroupsService');
    }
    async create(groupData, ownerId) {
        const startTime = Date.now();
        this.logger.info('Creating new group', JSON.stringify({
            name: groupData.name,
            type: groupData.type,
            ownerId
        }));
        try {
            const groupCode = await this.generateUniqueGroupCode(groupData.name);
            const result = await this.prisma.$transaction(async (tx) => {
                const group = await tx.groups.create({
                    data: {
                        name: groupData.name,
                        description: groupData.description,
                        type: 'MIXED',
                        code: groupCode,
                        max_members: groupData.settings?.maxMembers || null,
                        metadata: JSON.parse(JSON.stringify({
                            settings: groupData.settings,
                            groupType: groupData.type,
                            ...(groupData.metadata || {})
                        })),
                        is_active: true,
                    },
                });
                await tx.user_groups.create({
                    data: {
                        user_id: ownerId,
                        group_id: group.id,
                        status: 'ACTIVE',
                        added_by: ownerId,
                        metadata: {
                            role: 'OWNER',
                            permissions: {
                                canInvite: true,
                                canPurchase: true,
                                canViewOrders: true,
                                canManageMembers: true,
                                canEditGroup: true,
                                canDeleteGroup: true,
                            }
                        }
                    },
                });
                if (groupData.initialInvites && groupData.initialInvites.length > 0) {
                    for (const invite of groupData.initialInvites) {
                        await this.bullmq.addJob(bullmq_constants_1.QUEUE_NAMES.EMAIL, 'send-group-invitation', {
                            groupId: group.id,
                            invitedBy: ownerId,
                            ...invite
                        });
                    }
                }
                return group;
            });
            this.logger.logBusinessEvent('GROUP_CREATED', {
                groupId: result.id,
                groupName: result.name,
                groupType: result.type,
                ownerId,
                initialInvitesSent: groupData.initialInvites?.length || 0
            }, ownerId);
            const duration = Date.now() - startTime;
            this.logger.info('Group created successfully', JSON.stringify({
                groupId: result.id,
                ownerId,
                duration
            }));
            await this.invalidateGroupCaches();
            return result;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'GroupsService.create', ownerId, JSON.stringify({
                groupName: groupData.name,
                groupType: groupData.type
            }));
            throw error;
        }
    }
    async findById(id) {
        const cacheKey = `group:${id}`;
        try {
            const cached = await this.redis.getCache(cacheKey);
            if (cached) {
                this.logger.logCacheEvent('hit', cacheKey);
                return cached;
            }
            const group = await this.prisma.groups.findUnique({
                where: { id },
                include: {
                    user_groups: {
                        where: { status: 'ACTIVE' },
                        include: {
                            users_user_groups_user_idTousers: {
                                select: {
                                    id: true,
                                    first_name: true,
                                    last_name: true,
                                    email: true,
                                    avatar: true,
                                }
                            }
                        }
                    }
                },
            });
            if (!group) {
                this.logger.logCacheEvent('miss', cacheKey);
                return null;
            }
            const result = {
                ...group,
                members: group.user_groups.map(ug => ({
                    id: ug.id,
                    user: {
                        id: ug.users_user_groups_user_idTousers.id,
                        first_name: ug.users_user_groups_user_idTousers.first_name,
                        last_name: ug.users_user_groups_user_idTousers.last_name,
                        email: ug.users_user_groups_user_idTousers.email,
                        avatar: ug.users_user_groups_user_idTousers.avatar,
                    },
                    role: ug.metadata?.role || 'MEMBER',
                    status: ug.status,
                    permissions: ug.metadata?.permissions || {},
                    joinedAt: ug.joined_at,
                    lastActivity: ug.updated_at,
                    notes: ug.metadata?.notes || null,
                })),
                memberCount: group.user_groups.length,
            };
            await this.redis.setCache(cacheKey, result, 300);
            this.logger.logCacheEvent('set', cacheKey, 300);
            return result;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'GroupsService.findById', undefined, JSON.stringify({ id }));
            throw error;
        }
    }
    async findByCode(code) {
        try {
            return await this.prisma.groups.findUnique({
                where: { code },
            });
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'GroupsService.findByCode', undefined, JSON.stringify({ code }));
            throw error;
        }
    }
    async update(id, updateData, userId) {
        const startTime = Date.now();
        this.logger.info('Updating group', JSON.stringify({ groupId: id, userId }));
        try {
            const group = await this.findById(id);
            if (!group) {
                throw new common_1.NotFoundException('Groupe non trouvé');
            }
            await this.checkGroupPermission(id, userId, 'canEditGroup');
            const updatePayload = {
                name: updateData.name,
                description: updateData.description,
                updated_at: new Date(),
            };
            if (updateData.settings) {
                const currentMetadata = group.metadata || {};
                updatePayload.metadata = {
                    ...currentMetadata,
                    settings: {
                        ...currentMetadata.settings,
                        ...updateData.settings
                    }
                };
            }
            const updatedGroup = await this.prisma.groups.update({
                where: { id },
                data: updatePayload,
            });
            await this.invalidateGroupCaches(id);
            this.logger.logBusinessEvent('GROUP_UPDATED', {
                groupId: id,
                updatedBy: userId,
                fieldsUpdated: Object.keys(updateData),
            }, userId);
            const duration = Date.now() - startTime;
            this.logger.info('Group updated successfully', JSON.stringify({
                groupId: id,
                userId,
                duration
            }));
            return updatedGroup;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'GroupsService.update', userId, JSON.stringify({ groupId: id }));
            throw error;
        }
    }
    async delete(id, userId) {
        this.logger.info('Deleting group', JSON.stringify({ groupId: id, userId }));
        try {
            const group = await this.findById(id);
            if (!group) {
                throw new common_1.NotFoundException('Groupe non trouvé');
            }
            await this.checkGroupPermission(id, userId, 'canDeleteGroup');
            await this.prisma.groups.delete({
                where: { id },
            });
            await this.invalidateGroupCaches(id);
            this.logger.logBusinessEvent('GROUP_DELETED', {
                groupId: id,
                groupName: group.name,
                memberCount: group.memberCount || 0,
                deletedBy: userId,
            }, userId);
            this.logger.info('Group deleted successfully', JSON.stringify({ groupId: id, userId }));
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'GroupsService.delete', userId, JSON.stringify({ groupId: id }));
            throw error;
        }
    }
    async search(params) {
        const { query, type, isPrivate, hasSpace, userId, limit = 20, offset = 0, sortBy = 'created_at', sortOrder = 'desc' } = params;
        const cacheKey = `groups:search:${JSON.stringify(params)}`;
        try {
            const cached = await this.redis.getCache(cacheKey);
            if (cached) {
                this.logger.logCacheEvent('hit', cacheKey);
                return cached;
            }
            const whereClause = {
                is_active: true,
            };
            if (query) {
                whereClause.OR = [
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } }
                ];
            }
            if (type) {
                whereClause.metadata = {
                    path: ['groupType'],
                    equals: type
                };
            }
            if (isPrivate !== undefined) {
                whereClause.metadata = {
                    path: ['settings', 'isPrivate'],
                    equals: isPrivate
                };
            }
            if (hasSpace !== undefined && hasSpace) {
                whereClause.OR = [
                    { max_members: null },
                ];
            }
            if (userId) {
                whereClause.user_groups = {
                    some: {
                        user_id: userId,
                        status: 'ACTIVE'
                    }
                };
            }
            const [groups, total] = await Promise.all([
                this.prisma.groups.findMany({
                    where: whereClause,
                    skip: offset,
                    take: limit,
                    orderBy: { [sortBy]: sortOrder },
                    include: {
                        _count: {
                            select: {
                                user_groups: {
                                    where: { status: 'ACTIVE' }
                                }
                            }
                        }
                    }
                }),
                this.prisma.groups.count({ where: whereClause })
            ]);
            let filteredGroups = groups;
            if (hasSpace !== undefined && hasSpace) {
                filteredGroups = groups.filter(group => !group.max_members || group._count.user_groups < group.max_members);
            }
            const result = {
                groups: filteredGroups.map(group => ({
                    ...group,
                    memberCount: group._count.user_groups
                })),
                total
            };
            await this.redis.setCache(cacheKey, result, 120);
            this.logger.logCacheEvent('set', cacheKey, 120);
            return result;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'GroupsService.search', userId, JSON.stringify(params));
            throw error;
        }
    }
    async findUserGroups(userId, filters = {}) {
        const cacheKey = `user:${userId}:groups:${JSON.stringify(filters)}`;
        try {
            const cached = await this.redis.getCache(cacheKey);
            if (cached) {
                this.logger.logCacheEvent('hit', cacheKey);
                return cached;
            }
            const whereClause = {
                user_id: userId,
                status: filters.status || 'ACTIVE',
            };
            if (filters.role) {
                whereClause.metadata = {
                    path: ['role'],
                    equals: filters.role
                };
            }
            const userGroups = await this.prisma.user_groups.findMany({
                where: whereClause,
                include: {
                    groups: {
                        include: {
                            _count: {
                                select: {
                                    user_groups: {
                                        where: { status: 'ACTIVE' }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: { joined_at: 'desc' }
            });
            const result = userGroups.map(ug => ({
                ...ug.groups,
                memberCount: ug.groups._count.user_groups,
            }));
            await this.redis.setCache(cacheKey, result, 300);
            this.logger.logCacheEvent('set', cacheKey, 300);
            return result;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'GroupsService.findUserGroups', userId, JSON.stringify(filters));
            throw error;
        }
    }
    async findPublicGroups(filters = {}) {
        const cacheKey = `groups:public:${JSON.stringify(filters)}`;
        try {
            const cached = await this.redis.getCache(cacheKey);
            if (cached) {
                this.logger.logCacheEvent('hit', cacheKey);
                return cached;
            }
            const whereClause = {
                is_active: true,
                metadata: {
                    path: ['settings', 'isPrivate'],
                    equals: false
                }
            };
            if (filters.type) {
                whereClause.metadata = {
                    path: ['groupType'],
                    equals: filters.type
                };
            }
            const groups = await this.prisma.groups.findMany({
                where: whereClause,
                include: {
                    _count: {
                        select: {
                            user_groups: {
                                where: { status: 'ACTIVE' }
                            }
                        }
                    }
                },
                orderBy: { created_at: 'desc' },
                take: 50
            });
            let result = groups;
            if (filters.hasSpace) {
                result = groups.filter(group => !group.max_members || group._count.user_groups < group.max_members);
            }
            const finalResult = result.map(group => ({
                ...group,
                memberCount: group._count.user_groups
            }));
            await this.redis.setCache(cacheKey, finalResult, 600);
            this.logger.logCacheEvent('set', cacheKey, 600);
            return finalResult;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'GroupsService.findPublicGroups', undefined, JSON.stringify(filters));
            throw error;
        }
    }
    async addMember(groupId, userId, role, addedBy) {
        this.logger.info('Adding member to group', JSON.stringify({ groupId, userId, role, addedBy }));
        try {
            const group = await this.findById(groupId);
            if (!group) {
                throw new common_1.NotFoundException('Groupe non trouvé');
            }
            await this.checkGroupPermission(groupId, addedBy, 'canInvite');
            const existingMember = await this.prisma.user_groups.findFirst({
                where: {
                    user_id: userId,
                    group_id: groupId,
                    status: 'ACTIVE'
                }
            });
            if (existingMember) {
                throw new common_1.ConflictException('L\'utilisateur est déjà membre de ce groupe');
            }
            if (group.max_members && group.memberCount >= group.max_members) {
                throw new common_1.ConflictException('Le groupe a atteint sa limite de membres');
            }
            const membership = await this.prisma.user_groups.create({
                data: {
                    user_id: userId,
                    group_id: groupId,
                    status: 'ACTIVE',
                    added_by: addedBy,
                    metadata: {
                        role,
                        permissions: this.getDefaultPermissionsForRole(role, group),
                        invitedAt: new Date(),
                    }
                },
                include: {
                    users_user_groups_user_idTousers: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true,
                            avatar: true,
                        }
                    }
                }
            });
            await this.invalidateGroupCaches(groupId);
            this.logger.logBusinessEvent('GROUP_MEMBER_ADDED', {
                groupId,
                newMemberId: userId,
                role,
                addedBy,
            }, addedBy);
            await this.bullmq.addJob(bullmq_constants_1.QUEUE_NAMES.EMAIL, 'send-group-welcome', {
                groupId,
                userId,
                groupName: group.name,
                role,
            });
            this.logger.info('Member added successfully', JSON.stringify({
                groupId,
                userId,
                role
            }));
            return {
                id: membership.id,
                user: {
                    id: membership.users_user_groups_user_idTousers.id,
                    first_name: membership.users_user_groups_user_idTousers.first_name,
                    last_name: membership.users_user_groups_user_idTousers.last_name,
                    email: membership.users_user_groups_user_idTousers.email,
                    avatar: membership.users_user_groups_user_idTousers.avatar,
                },
                role,
                status: membership.status,
                permissions: membership.metadata?.permissions || {},
                joinedAt: membership.joined_at,
                notes: membership.metadata?.notes || null,
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'GroupsService.addMember', addedBy, JSON.stringify({ groupId, userId, role }));
            throw error;
        }
    }
    async removeMember(groupId, userId, removedBy) {
        this.logger.info('Removing member from group', JSON.stringify({ groupId, userId, removedBy }));
        try {
            const group = await this.findById(groupId);
            if (!group) {
                throw new common_1.NotFoundException('Groupe non trouvé');
            }
            if (userId !== removedBy) {
                await this.checkGroupPermission(groupId, removedBy, 'canManageMembers');
            }
            const membership = await this.prisma.user_groups.findFirst({
                where: {
                    user_id: userId,
                    group_id: groupId,
                    status: 'ACTIVE'
                }
            });
            if (!membership) {
                throw new common_1.NotFoundException('L\'utilisateur n\'est pas membre de ce groupe');
            }
            const memberRole = membership.metadata?.role;
            if (memberRole === 'OWNER' && userId === removedBy) {
                throw new common_1.ForbiddenException('Le propriétaire ne peut pas quitter le groupe. Transférez d\'abord la propriété.');
            }
            await this.prisma.user_groups.update({
                where: { id: membership.id },
                data: {
                    status: 'TERMINATED',
                    updated_at: new Date(),
                    metadata: {
                        ...membership.metadata,
                        leftAt: new Date(),
                        leftBy: removedBy,
                    }
                }
            });
            await this.invalidateGroupCaches(groupId);
            this.logger.logBusinessEvent('GROUP_MEMBER_REMOVED', {
                groupId,
                removedMemberId: userId,
                removedBy,
                wasOwner: memberRole === 'OWNER',
            }, removedBy);
            this.logger.info('Member removed successfully', JSON.stringify({
                groupId,
                userId,
                removedBy
            }));
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'GroupsService.removeMember', removedBy, JSON.stringify({ groupId, userId }));
            throw error;
        }
    }
    async updateMemberRole(groupId, userId, newRole, updatedBy) {
        this.logger.info('Updating member role', JSON.stringify({
            groupId,
            userId,
            newRole,
            updatedBy
        }));
        try {
            const group = await this.findById(groupId);
            if (!group) {
                throw new common_1.NotFoundException('Groupe non trouvé');
            }
            await this.checkGroupPermission(groupId, updatedBy, 'canManageMembers');
            const membership = await this.prisma.user_groups.findFirst({
                where: {
                    user_id: userId,
                    group_id: groupId,
                    status: 'ACTIVE'
                },
                include: {
                    users_user_groups_user_idTousers: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true,
                            avatar: true,
                        }
                    }
                }
            });
            if (!membership) {
                throw new common_1.NotFoundException('Membre non trouvé dans ce groupe');
            }
            const currentRole = membership.metadata?.role;
            if (currentRole === 'OWNER') {
                throw new common_1.ForbiddenException('Impossible de modifier le rôle du propriétaire');
            }
            if (newRole === 'OWNER') {
                throw new common_1.ForbiddenException('Utilisez la méthode de transfert de propriété');
            }
            const updatedMembership = await this.prisma.user_groups.update({
                where: { id: membership.id },
                data: {
                    metadata: {
                        ...membership.metadata,
                        role: newRole,
                        permissions: this.getDefaultPermissionsForRole(newRole, group),
                        roleUpdatedAt: new Date(),
                        roleUpdatedBy: updatedBy,
                    },
                    updated_at: new Date(),
                },
                include: {
                    users_user_groups_user_idTousers: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true,
                            avatar: true,
                        }
                    }
                }
            });
            await this.invalidateGroupCaches(groupId);
            this.logger.logBusinessEvent('GROUP_MEMBER_ROLE_UPDATED', {
                groupId,
                memberId: userId,
                oldRole: currentRole,
                newRole,
                updatedBy,
            }, updatedBy);
            this.logger.info('Member role updated successfully', JSON.stringify({
                groupId,
                userId,
                newRole
            }));
            return {
                id: updatedMembership.id,
                user: {
                    id: updatedMembership.users_user_groups_user_idTousers.id,
                    first_name: updatedMembership.users_user_groups_user_idTousers.first_name,
                    last_name: updatedMembership.users_user_groups_user_idTousers.last_name,
                    email: updatedMembership.users_user_groups_user_idTousers.email,
                    avatar: updatedMembership.users_user_groups_user_idTousers.avatar,
                },
                role: newRole,
                status: updatedMembership.status,
                permissions: updatedMembership.metadata?.permissions || {},
                joinedAt: updatedMembership.joined_at,
                lastActivity: updatedMembership.updated_at,
                notes: updatedMembership.metadata?.notes || null,
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'GroupsService.updateMemberRole', updatedBy, JSON.stringify({ groupId, userId, newRole }));
            throw error;
        }
    }
    async updateMemberPermissions(groupId, userId, permissions, updatedBy) {
        try {
            await this.checkGroupPermission(groupId, updatedBy, 'canManageMembers');
            const membership = await this.prisma.user_groups.findFirst({
                where: {
                    user_id: userId,
                    group_id: groupId,
                    status: 'ACTIVE'
                },
                include: {
                    users_user_groups_user_idTousers: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true,
                            avatar: true,
                        }
                    }
                }
            });
            if (!membership) {
                throw new common_1.NotFoundException('Membre non trouvé dans ce groupe');
            }
            const currentMetadata = membership.metadata;
            const updatedPermissions = {
                ...currentMetadata?.permissions,
                ...permissions
            };
            const updatedMembership = await this.prisma.user_groups.update({
                where: { id: membership.id },
                data: {
                    metadata: {
                        ...currentMetadata,
                        permissions: updatedPermissions,
                        permissionsUpdatedAt: new Date(),
                        permissionsUpdatedBy: updatedBy,
                    },
                    updated_at: new Date(),
                },
                include: {
                    users_user_groups_user_idTousers: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true,
                            avatar: true,
                        }
                    }
                }
            });
            await this.invalidateGroupCaches(groupId);
            this.logger.logBusinessEvent('GROUP_MEMBER_PERMISSIONS_UPDATED', {
                groupId,
                memberId: userId,
                updatedPermissions: Object.keys(permissions),
                updatedBy,
            }, updatedBy);
            return {
                id: updatedMembership.id,
                user: {
                    id: updatedMembership.users_user_groups_user_idTousers.id,
                    first_name: updatedMembership.users_user_groups_user_idTousers.first_name,
                    last_name: updatedMembership.users_user_groups_user_idTousers.last_name,
                    email: updatedMembership.users_user_groups_user_idTousers.email,
                    avatar: updatedMembership.users_user_groups_user_idTousers.avatar,
                },
                role: currentMetadata?.role || 'MEMBER',
                status: updatedMembership.status,
                permissions: updatedPermissions,
                joinedAt: updatedMembership.joined_at,
                lastActivity: updatedMembership.updated_at,
                notes: currentMetadata?.notes || null,
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'GroupsService.updateMemberPermissions', updatedBy, JSON.stringify({ groupId, userId, permissions }));
            throw error;
        }
    }
    async inviteUser(groupId, inviteData, invitedBy) {
        try {
            const group = await this.findById(groupId);
            if (!group) {
                throw new common_1.NotFoundException('Groupe non trouvé');
            }
            await this.checkGroupPermission(groupId, invitedBy, 'canInvite');
            const job = await this.bullmq.addPriorityJob(bullmq_constants_1.QUEUE_NAMES.EMAIL, 'send-group-invitation', {
                groupId,
                invitedBy,
                ...inviteData,
                groupName: group.name,
            }, 'HIGH');
            this.logger.logBusinessEvent('GROUP_INVITATION_SENT', {
                groupId,
                invitedBy,
                invitedEmail: inviteData.email,
                invitedUserId: inviteData.userId,
                role: inviteData.role || 'MEMBER',
            }, invitedBy);
            return {
                id: `inv_${job.id}`,
                status: 'SENT',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'GroupsService.inviteUser', invitedBy, JSON.stringify({ groupId, inviteData }));
            throw error;
        }
    }
    async acceptInvitation(invitationId, userId) {
        throw new Error('Method not implemented - requires invitation table');
    }
    async declineInvitation(invitationId, userId) {
        throw new Error('Method not implemented - requires invitation table');
    }
    async hasPermission(groupId, userId, permission) {
        try {
            const membership = await this.prisma.user_groups.findFirst({
                where: {
                    user_id: userId,
                    group_id: groupId,
                    status: 'ACTIVE'
                }
            });
            if (!membership)
                return false;
            const permissions = membership.metadata?.permissions || {};
            return permissions[permission] === true;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'GroupsService.hasPermission', userId, JSON.stringify({ groupId, permission }));
            return false;
        }
    }
    async getUserRole(groupId, userId) {
        try {
            const membership = await this.prisma.user_groups.findFirst({
                where: {
                    user_id: userId,
                    group_id: groupId,
                    status: 'ACTIVE'
                }
            });
            return membership ? membership.metadata?.role || 'MEMBER' : null;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'GroupsService.getUserRole', userId, JSON.stringify({ groupId }));
            return null;
        }
    }
    async canPerformAction(groupId, userId, action) {
        try {
            const role = await this.getUserRole(groupId, userId);
            if (!role) {
                return { allowed: false, reason: 'Utilisateur non membre du groupe' };
            }
            const actionPermissions = {
                'VIEW': ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER'],
                'JOIN': ['OWNER', 'ADMIN', 'MANAGER'],
                'LEAVE': ['ADMIN', 'MANAGER', 'MEMBER'],
                'INVITE': ['OWNER', 'ADMIN', 'MANAGER'],
                'EDIT': ['OWNER', 'ADMIN'],
                'DELETE': ['OWNER'],
                'MANAGE_MEMBERS': ['OWNER', 'ADMIN', 'MANAGER'],
                'PURCHASE': ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER'],
                'VIEW_ORDERS': ['OWNER', 'ADMIN', 'MANAGER'],
            };
            const allowedRoles = actionPermissions[action] || [];
            const allowed = allowedRoles.includes(role);
            return {
                allowed,
                reason: allowed ? undefined : `Rôle ${role} insuffisant pour l'action ${action}`
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'GroupsService.canPerformAction', userId, JSON.stringify({ groupId, action }));
            return { allowed: false, reason: 'Erreur lors de la vérification des permissions' };
        }
    }
    async getGroupStats(groupId) {
        try {
            const group = await this.findById(groupId);
            if (!group) {
                throw new common_1.NotFoundException('Groupe non trouvé');
            }
            return {
                memberCount: group.memberCount || 0,
                activeMemberCount: group.memberCount || 0,
                pendingInvitations: 0,
                totalSpent: 0,
                averageSpentPerMember: 0,
                eventsAttended: 0,
                createdAt: group.created_at,
                lastActivity: group.updated_at,
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'GroupsService.getGroupStats', undefined, JSON.stringify({ groupId }));
            throw error;
        }
    }
    async getOverallStats(filters = {}) {
        try {
            const [totalGroups, activeGroups] = await Promise.all([
                this.prisma.groups.count(),
                this.prisma.groups.count({ where: { is_active: true } })
            ]);
            return {
                totalGroups,
                activeGroups,
                totalMembers: 0,
                averageMembersPerGroup: 0,
                groupsByType: [],
                membershipTrend: [],
                activityTrend: [],
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'GroupsService.getOverallStats', undefined, JSON.stringify(filters));
            throw error;
        }
    }
    async generateUniqueGroupCode(name) {
        const baseCode = name
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '_')
            .substring(0, 20);
        let code = baseCode;
        let counter = 1;
        while (await this.findByCode(code)) {
            code = `${baseCode}_${counter}`;
            counter++;
        }
        return code;
    }
    async checkGroupPermission(groupId, userId, permission) {
        const hasPermission = await this.hasPermission(groupId, userId, permission);
        if (!hasPermission) {
            throw new common_1.ForbiddenException(`Permission insuffisante: ${permission}`);
        }
    }
    getDefaultPermissionsForRole(role, group) {
        const defaultPermissions = group.metadata?.settings?.defaultPermissions || {};
        const rolePermissions = {
            'OWNER': {
                canInvite: true,
                canPurchase: true,
                canViewOrders: true,
                canManageMembers: true,
                canEditGroup: true,
                canDeleteGroup: true,
            },
            'ADMIN': {
                canInvite: true,
                canPurchase: true,
                canViewOrders: true,
                canManageMembers: true,
                canEditGroup: true,
                canDeleteGroup: false,
            },
            'MANAGER': {
                canInvite: true,
                canPurchase: true,
                canViewOrders: true,
                canManageMembers: false,
                canEditGroup: false,
                canDeleteGroup: false,
            },
            'MEMBER': {
                canInvite: defaultPermissions.canInvite || false,
                canPurchase: defaultPermissions.canPurchase || true,
                canViewOrders: defaultPermissions.canViewOrders || false,
                canManageMembers: false,
                canEditGroup: false,
                canDeleteGroup: false,
            }
        };
        return rolePermissions[role] || rolePermissions['MEMBER'];
    }
    async invalidateGroupCaches(groupId) {
        try {
            const patterns = [
                'groups:search:*',
                'groups:public:*',
            ];
            if (groupId) {
                patterns.push(`group:${groupId}*`);
                patterns.push(`user:*:groups:*`);
            }
            for (const pattern of patterns) {
                await this.redis.delCache(pattern);
            }
            this.logger.logCacheEvent('del', `patterns:${patterns.join(',')}`);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'GroupsService.invalidateGroupCaches', undefined, JSON.stringify({ groupId }));
        }
    }
};
exports.GroupsService = GroupsService;
exports.GroupsService = GroupsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        bullmq_service_1.BullmqService,
        logger_service_1.LoggerService])
], GroupsService);
//# sourceMappingURL=groups.service.js.map