// src/modules/users/services/groups.service.ts

import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  ForbiddenException,
  BadRequestException 
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { BullmqService } from '../../../shared/bullmq/bullmq.service';
import { 
  CreateGroupDto, 
  UpdateGroupDto, 
  InviteMemberDto,
  UpdateMemberDto 
} from '../dto';
import { 
  Group, 
  GroupWithMembers, 
  GroupMember, 
  GroupSearchParams,
  GroupType,
  GroupRole,
  MemberStatus 
} from '../types';
import { IGroupService } from '../interfaces';
import { GROUP_CONSTANTS } from '../constants';
import { QUEUE_NAMES, JOB_TYPES } from '../../../shared/bullmq/bullmq.constants';

@Injectable()
export class GroupsService implements IGroupService {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly bullmq: BullmqService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('GroupsService');
  }

  // ============================================================================
  // MÉTHODES CRUD DE BASE
  // ============================================================================

  async create(groupData: any, ownerId: string): Promise<Group> {
    const startTime = Date.now();
    this.logger.info('Creating new group', JSON.stringify({ 
      name: groupData.name, 
      type: groupData.type, 
      ownerId 
    }));

    try {
      // Générer un code unique pour le groupe
      const groupCode = await this.generateUniqueGroupCode(groupData.name);

      // Créer le groupe dans une transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Créer le groupe (utilisation du nom exact de la table du schema)
        const group = await tx.groups.create({
          data: {
            name: groupData.name,
            description: groupData.description,
            type: 'MIXED', // Valeur enum valide pour group_type
            code: groupCode,
            max_members: groupData.settings?.maxMembers || null,
            metadata: JSON.parse(JSON.stringify({
              settings: groupData.settings,
              groupType: groupData.type, // Stocker le vrai type dans metadata
              ...(groupData.metadata || {})
            })),
            is_active: true,
          },
        });

        // Ajouter le créateur comme propriétaire (utilisation du nom exact de la table)
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

        // Envoyer les invitations initiales si spécifiées
        if (groupData.initialInvites && groupData.initialInvites.length > 0) {
          for (const invite of groupData.initialInvites) {
            await this.bullmq.addJob(
              QUEUE_NAMES.EMAIL,
              'send-group-invitation', // Job type simple
              {
                groupId: group.id,
                invitedBy: ownerId,
                ...invite
              }
            );
          }
        }

        return group;
      });

      // Log événement business
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

      // Invalider caches pour la recherche publique de groupes
      await this.invalidateGroupCaches();

      return result;

    } catch (error) {
      this.logger.logErrorEvent(
        error, 
        'GroupsService.create', 
        ownerId,
        JSON.stringify({
          groupName: groupData.name,
          groupType: groupData.type
        })
      );
      throw error;
    }
  }

  async findById(id: string): Promise<GroupWithMembers | null> {
    const cacheKey = `group:${id}`;
    
    try {
      // Vérifier le cache Redis
      const cached = await this.redis.getCache<GroupWithMembers>(cacheKey);
      if (cached) {
        this.logger.logCacheEvent('hit', cacheKey);
        return cached;
      }

      // Récupérer depuis la base de données avec relations
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

      // Transformer les données pour correspondre à l'interface GroupWithMembers
      const result: GroupWithMembers = {
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
          role: (ug.metadata as any)?.role || 'MEMBER',
          status: ug.status as MemberStatus,
          permissions: (ug.metadata as any)?.permissions || {},
          joinedAt: ug.joined_at,
          lastActivity: ug.updated_at,
          notes: (ug.metadata as any)?.notes || null,
        })),
        memberCount: group.user_groups.length,
      };

      // Mettre en cache pour 5 minutes
      await this.redis.setCache(cacheKey, result, 300);
      this.logger.logCacheEvent('set', cacheKey, 300);

      return result;

    } catch (error) {
      this.logger.logErrorEvent(error, 'GroupsService.findById', undefined, JSON.stringify({ id }));
      throw error;
    }
  }

  async findByCode(code: string): Promise<Group | null> {
    try {
      return await this.prisma.groups.findUnique({
        where: { code },
      });
    } catch (error) {
      this.logger.logErrorEvent(error, 'GroupsService.findByCode', undefined, JSON.stringify({ code }));
      throw error;
    }
  }

  async update(id: string, updateData: UpdateGroupDto, userId: string): Promise<Group> {
    const startTime = Date.now();
    this.logger.info('Updating group', JSON.stringify({ groupId: id, userId }));

    try {
      // Vérifier que le groupe existe et que l'utilisateur a les permissions
      const group = await this.findById(id);
      if (!group) {
        throw new NotFoundException('Groupe non trouvé');
      }

      await this.checkGroupPermission(id, userId, 'canEditGroup');

      // Préparer les données de mise à jour
      const updatePayload: Prisma.groupsUpdateInput = {
        name: updateData.name,
        description: updateData.description,
        updated_at: new Date(),
      };

      // Mettre à jour les settings dans metadata si fournis
      if (updateData.settings) {
        const currentMetadata = (group.metadata as any) || {};
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

      // Invalider les caches
      await this.invalidateGroupCaches(id);

      // Log événement business
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

    } catch (error) {
      this.logger.logErrorEvent(
        error, 
        'GroupsService.update', 
        userId,
        JSON.stringify({ groupId: id })
      );
      throw error;
    }
  }

  async delete(id: string, userId: string): Promise<void> {
    this.logger.info('Deleting group', JSON.stringify({ groupId: id, userId }));

    try {
      // Vérifier que le groupe existe et que l'utilisateur est propriétaire
      const group = await this.findById(id);
      if (!group) {
        throw new NotFoundException('Groupe non trouvé');
      }

      await this.checkGroupPermission(id, userId, 'canDeleteGroup');

      // Supprimer le groupe (les user_groups seront supprimées par CASCADE)
      await this.prisma.groups.delete({
        where: { id },
      });

      // Invalider les caches
      await this.invalidateGroupCaches(id);

      // Log événement business
      this.logger.logBusinessEvent('GROUP_DELETED', {
        groupId: id,
        groupName: group.name,
        memberCount: group.memberCount || 0,
        deletedBy: userId,
      }, userId);

      this.logger.info('Group deleted successfully', JSON.stringify({ groupId: id, userId }));

    } catch (error) {
      this.logger.logErrorEvent(
        error, 
        'GroupsService.delete', 
        userId,
        JSON.stringify({ groupId: id })
      );
      throw error;
    }
  }

  // ============================================================================
  // MÉTHODES DE RECHERCHE ET LISTING
  // ============================================================================

  async search(params: GroupSearchParams): Promise<any> {
    const {
      query,
      type,
      isPrivate,
      hasSpace,
      userId,
      limit = 20,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = params;

    const cacheKey = `groups:search:${JSON.stringify(params)}`;

    try {
      // Vérifier le cache Redis
      const cached = await this.redis.getCache<any>(cacheKey);
      if (cached) {
        this.logger.logCacheEvent('hit', cacheKey);
        return cached;
      }

      // Construire le where clause
      const whereClause: Prisma.groupsWhereInput = {
        is_active: true,
      };

      if (query) {
        whereClause.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ];
      }

      if (type) {
        // Rechercher dans metadata au lieu de type direct
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
        // Groupes qui ont encore de la place
        whereClause.OR = [
          { max_members: null }, // Pas de limite
          // Note: Logique complexe pour compter les membres, 
          // nous la simplifierons en récupérant tous et filtrant en post-traitement
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

      // Exécuter la requête
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

      // Filtrer par disponibilité si nécessaire
      let filteredGroups = groups;
      if (hasSpace !== undefined && hasSpace) {
        filteredGroups = groups.filter(group => 
          !group.max_members || group._count.user_groups < group.max_members
        );
      }

      const result = {
        groups: filteredGroups.map(group => ({
          ...group,
          memberCount: group._count.user_groups
        })) as Group[],
        total
      };

      // Cache pour 2 minutes
      await this.redis.setCache(cacheKey, result, 120);
      this.logger.logCacheEvent('set', cacheKey, 120);

      return result;

    } catch (error) {
      this.logger.logErrorEvent(
        error, 
        'GroupsService.search', 
        userId,
        JSON.stringify(params)
      );
      throw error;
    }
  }

  async findUserGroups(userId: string, filters: any = {}): Promise<Group[]> {
    const cacheKey = `user:${userId}:groups:${JSON.stringify(filters)}`;

    try {
      // Vérifier le cache
      const cached = await this.redis.getCache<Group[]>(cacheKey);
      if (cached) {
        this.logger.logCacheEvent('hit', cacheKey);
        return cached;
      }

      const whereClause: Prisma.user_groupsWhereInput = {
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
      })) as Group[];

      // Cache pour 5 minutes
      await this.redis.setCache(cacheKey, result, 300);
      this.logger.logCacheEvent('set', cacheKey, 300);

      return result;

    } catch (error) {
      this.logger.logErrorEvent(
        error, 
        'GroupsService.findUserGroups', 
        userId,
        JSON.stringify(filters)
      );
      throw error;
    }
  }

  async findPublicGroups(filters: any = {}): Promise<Group[]> {
    const cacheKey = `groups:public:${JSON.stringify(filters)}`;

    try {
      // Vérifier le cache
      const cached = await this.redis.getCache<Group[]>(cacheKey);
      if (cached) {
        this.logger.logCacheEvent('hit', cacheKey);
        return cached;
      }

      const whereClause: Prisma.groupsWhereInput = {
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
        take: 50 // Limite pour les groupes publics
      });

      // Filtrer par disponibilité si nécessaire
      let result = groups;
      if (filters.hasSpace) {
        result = groups.filter(group => 
          !group.max_members || group._count.user_groups < group.max_members
        );
      }

      const finalResult = result.map(group => ({
        ...group,
        memberCount: group._count.user_groups
      })) as Group[];

      // Cache pour 10 minutes (les groupes publics changent moins souvent)
      await this.redis.setCache(cacheKey, finalResult, 600);
      this.logger.logCacheEvent('set', cacheKey, 600);

      return finalResult;

    } catch (error) {
      this.logger.logErrorEvent(
        error, 
        'GroupsService.findPublicGroups', 
        undefined,
        JSON.stringify(filters)
      );
      throw error;
    }
  }

  // ============================================================================
  // MÉTHODES DE GESTION DES MEMBRES
  // ============================================================================

  async addMember(groupId: string, userId: string, role: GroupRole, addedBy: string): Promise<GroupMember> {
    this.logger.info('Adding member to group', JSON.stringify({ groupId, userId, role, addedBy }));

    try {
      // Vérifier que le groupe existe et a de la place
      const group = await this.findById(groupId);
      if (!group) {
        throw new NotFoundException('Groupe non trouvé');
      }

      // Vérifier les permissions de celui qui ajoute
      await this.checkGroupPermission(groupId, addedBy, 'canInvite');

      // Vérifier que l'utilisateur n'est pas déjà membre
      const existingMember = await this.prisma.user_groups.findFirst({
        where: {
          user_id: userId,
          group_id: groupId,
          status: 'ACTIVE'
        }
      });

      if (existingMember) {
        throw new ConflictException('L\'utilisateur est déjà membre de ce groupe');
      }

      // Vérifier la limite de membres
      if (group.max_members && group.memberCount >= group.max_members) {
        throw new ConflictException('Le groupe a atteint sa limite de membres');
      }

      // Ajouter le membre
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

      // Invalider les caches
      await this.invalidateGroupCaches(groupId);

      // Log événement business
      this.logger.logBusinessEvent('GROUP_MEMBER_ADDED', {
        groupId,
        newMemberId: userId,
        role,
        addedBy,
      }, addedBy);

      // Envoyer notification de bienvenue
      await this.bullmq.addJob(
        QUEUE_NAMES.EMAIL,
        'send-group-welcome', // Job type simple
        {
          groupId,
          userId,
          groupName: group.name,
          role,
        }
      );

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
        status: membership.status as MemberStatus,
        permissions: (membership.metadata as any)?.permissions || {},
        joinedAt: membership.joined_at,
        notes: (membership.metadata as any)?.notes || null,
      };

    } catch (error) {
      this.logger.logErrorEvent(
        error, 
        'GroupsService.addMember', 
        addedBy,
        JSON.stringify({ groupId, userId, role })
      );
      throw error;
    }
  }

  async removeMember(groupId: string, userId: string, removedBy: string): Promise<void> {
    this.logger.info('Removing member from group', JSON.stringify({ groupId, userId, removedBy }));

    try {
      const group = await this.findById(groupId);
      if (!group) {
        throw new NotFoundException('Groupe non trouvé');
      }

      // Vérifier les permissions (soit l'utilisateur se retire lui-même, soit admin+)
      if (userId !== removedBy) {
        await this.checkGroupPermission(groupId, removedBy, 'canManageMembers');
      }

      // Vérifier que l'utilisateur est membre
      const membership = await this.prisma.user_groups.findFirst({
        where: {
          user_id: userId,
          group_id: groupId,
          status: 'ACTIVE'
        }
      });

      if (!membership) {
        throw new NotFoundException('L\'utilisateur n\'est pas membre de ce groupe');
      }

      // Empêcher le propriétaire de quitter son groupe
      const memberRole = (membership.metadata as any)?.role;
      if (memberRole === 'OWNER' && userId === removedBy) {
        throw new ForbiddenException('Le propriétaire ne peut pas quitter le groupe. Transférez d\'abord la propriété.');
      }

      // Supprimer le membre (mise à jour du statut au lieu de suppression pour l'historique)
      await this.prisma.user_groups.update({
        where: { id: membership.id },
        data: {
          status: 'TERMINATED',
          updated_at: new Date(),
          metadata: {
            ...(membership.metadata as any),
            leftAt: new Date(),
            leftBy: removedBy,
          }
        }
      });

      // Invalider les caches
      await this.invalidateGroupCaches(groupId);

      // Log événement business
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

    } catch (error) {
      this.logger.logErrorEvent(
        error, 
        'GroupsService.removeMember', 
        removedBy,
        JSON.stringify({ groupId, userId })
      );
      throw error;
    }
  }

  async updateMemberRole(groupId: string, userId: string, newRole: GroupRole, updatedBy: string): Promise<GroupMember> {
    this.logger.info('Updating member role', JSON.stringify({ 
      groupId, 
      userId, 
      newRole, 
      updatedBy 
    }));

    try {
      const group = await this.findById(groupId);
      if (!group) {
        throw new NotFoundException('Groupe non trouvé');
      }

      // Vérifier les permissions
      await this.checkGroupPermission(groupId, updatedBy, 'canManageMembers');

      // Récupérer le membre
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
        throw new NotFoundException('Membre non trouvé dans ce groupe');
      }

      const currentRole = (membership.metadata as any)?.role;

      // Empêcher de modifier le rôle du propriétaire
      if (currentRole === 'OWNER') {
        throw new ForbiddenException('Impossible de modifier le rôle du propriétaire');
      }

      // Empêcher de créer un autre propriétaire
      if (newRole === 'OWNER') {
        throw new ForbiddenException('Utilisez la méthode de transfert de propriété');
      }

      // Mettre à jour le rôle et les permissions
      const updatedMembership = await this.prisma.user_groups.update({
        where: { id: membership.id },
        data: {
          metadata: {
            ...(membership.metadata as any),
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

      // Invalider les caches
      await this.invalidateGroupCaches(groupId);

      // Log événement business
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
        status: updatedMembership.status as MemberStatus,
        permissions: (updatedMembership.metadata as any)?.permissions || {},
        joinedAt: updatedMembership.joined_at,
        lastActivity: updatedMembership.updated_at,
        notes: (updatedMembership.metadata as any)?.notes || null,
      };

    } catch (error) {
      this.logger.logErrorEvent(
        error, 
        'GroupsService.updateMemberRole', 
        updatedBy,
        JSON.stringify({ groupId, userId, newRole })
      );
      throw error;
    }
  }

  async updateMemberPermissions(
    groupId: string, 
    userId: string, 
    permissions: Partial<any>, 
    updatedBy: string
  ): Promise<GroupMember> {
    try {
      // Vérifier les permissions
      await this.checkGroupPermission(groupId, updatedBy, 'canManageMembers');

      // Récupérer le membre
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
        throw new NotFoundException('Membre non trouvé dans ce groupe');
      }

      const currentMetadata = membership.metadata as any;
      const updatedPermissions = {
        ...currentMetadata?.permissions,
        ...permissions
      };

      // Mettre à jour les permissions
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

      // Invalider les caches
      await this.invalidateGroupCaches(groupId);

      // Log événement business
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
        status: updatedMembership.status as MemberStatus,
        permissions: updatedPermissions,
        joinedAt: updatedMembership.joined_at,
        lastActivity: updatedMembership.updated_at,
        notes: currentMetadata?.notes || null,
      };

    } catch (error) {
      this.logger.logErrorEvent(
        error, 
        'GroupsService.updateMemberPermissions', 
        updatedBy,
        JSON.stringify({ groupId, userId, permissions })
      );
      throw error;
    }
  }

  // ============================================================================
  // MÉTHODES D'INVITATIONS (SIMPLIFIÉES)
  // ============================================================================

  async inviteUser(groupId: string, inviteData: InviteMemberDto, invitedBy: string): Promise<any> {
    try {
      const group = await this.findById(groupId);
      if (!group) {
        throw new NotFoundException('Groupe non trouvé');
      }

      await this.checkGroupPermission(groupId, invitedBy, 'canInvite');

      // Ajouter job d'invitation à la queue
      const job = await this.bullmq.addPriorityJob(
        QUEUE_NAMES.EMAIL,
        'send-group-invitation', // Job type simple
        {
          groupId,
          invitedBy,
          ...inviteData,
          groupName: group.name,
        },
        'HIGH'
      );

      // Log événement business
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
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      };

    } catch (error) {
      this.logger.logErrorEvent(
        error, 
        'GroupsService.inviteUser', 
        invitedBy,
        JSON.stringify({ groupId, inviteData })
      );
      throw error;
    }
  }

  async acceptInvitation(invitationId: string, userId: string): Promise<GroupMember> {
    // Pour simplifier, nous supposons que l'invitation est valide
    // En production, il faudrait vérifier l'invitation dans une table dédiée
    throw new Error('Method not implemented - requires invitation table');
  }

  async declineInvitation(invitationId: string, userId: string): Promise<void> {
    // Pour simplifier, nous supposons que l'invitation est valide
    // En production, il faudrait vérifier l'invitation dans une table dédiée
    throw new Error('Method not implemented - requires invitation table');
  }

  // ============================================================================
  // MÉTHODES DE PERMISSIONS ET VÉRIFICATIONS
  // ============================================================================

  async hasPermission(groupId: string, userId: string, permission: string): Promise<boolean> {
    try {
      const membership = await this.prisma.user_groups.findFirst({
        where: {
          user_id: userId,
          group_id: groupId,
          status: 'ACTIVE'
        }
      });

      if (!membership) return false;

      const permissions = (membership.metadata as any)?.permissions || {};
      return permissions[permission] === true;

    } catch (error) {
      this.logger.logErrorEvent(
        error, 
        'GroupsService.hasPermission', 
        userId,
        JSON.stringify({ groupId, permission })
      );
      return false;
    }
  }

  async getUserRole(groupId: string, userId: string): Promise<GroupRole | null> {
    try {
      const membership = await this.prisma.user_groups.findFirst({
        where: {
          user_id: userId,
          group_id: groupId,
          status: 'ACTIVE'
        }
      });

      return membership ? (membership.metadata as any)?.role || 'MEMBER' : null;

    } catch (error) {
      this.logger.logErrorEvent(
        error, 
        'GroupsService.getUserRole', 
        userId,
        JSON.stringify({ groupId })
      );
      return null;
    }
  }

  async canPerformAction(groupId: string, userId: string, action: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const role = await this.getUserRole(groupId, userId);
      if (!role) {
        return { allowed: false, reason: 'Utilisateur non membre du groupe' };
      }

      // Logique de vérification d'action basée sur le rôle
      const actionPermissions = {
        'VIEW': ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER'],
        'JOIN': ['OWNER', 'ADMIN', 'MANAGER'],
        'LEAVE': ['ADMIN', 'MANAGER', 'MEMBER'], // Owner ne peut pas partir
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

    } catch (error) {
      this.logger.logErrorEvent(
        error, 
        'GroupsService.canPerformAction', 
        userId,
        JSON.stringify({ groupId, action })
      );
      return { allowed: false, reason: 'Erreur lors de la vérification des permissions' };
    }
  }

  // ============================================================================
  // MÉTHODES STATISTIQUES (SIMPLIFIÉES)
  // ============================================================================

  async getGroupStats(groupId: string): Promise<any> {
    try {
      const group = await this.findById(groupId);
      if (!group) {
        throw new NotFoundException('Groupe non trouvé');
      }

      // Statistiques de base
      return {
        memberCount: group.memberCount || 0,
        activeMemberCount: group.memberCount || 0,
        pendingInvitations: 0, // Nécessiterait une table d'invitations
        totalSpent: 0, // Nécessiterait intégration avec module commandes
        averageSpentPerMember: 0,
        eventsAttended: 0, // Nécessiterait intégration avec module événements
        createdAt: group.created_at,
        lastActivity: group.updated_at,
      };

    } catch (error) {
      this.logger.logErrorEvent(error, 'GroupsService.getGroupStats', undefined, JSON.stringify({ groupId }));
      throw error;
    }
  }

  async getOverallStats(filters: any = {}): Promise<any> {
    try {
      const [totalGroups, activeGroups] = await Promise.all([
        this.prisma.groups.count(),
        this.prisma.groups.count({ where: { is_active: true } })
      ]);

      return {
        totalGroups,
        activeGroups,
        totalMembers: 0, // Calcul complexe
        averageMembersPerGroup: 0,
        groupsByType: [],
        membershipTrend: [],
        activityTrend: [],
      };

    } catch (error) {
      this.logger.logErrorEvent(error, 'GroupsService.getOverallStats', undefined, JSON.stringify(filters));
      throw error;
    }
  }

  // ============================================================================
  // MÉTHODES PRIVÉES UTILITAIRES
  // ============================================================================

  private async generateUniqueGroupCode(name: string): Promise<string> {
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

  private async checkGroupPermission(groupId: string, userId: string, permission: string): Promise<void> {
    const hasPermission = await this.hasPermission(groupId, userId, permission);
    if (!hasPermission) {
      throw new ForbiddenException(`Permission insuffisante: ${permission}`);
    }
  }

  private getDefaultPermissionsForRole(role: GroupRole, group: GroupWithMembers): any {
    const defaultPermissions = (group.metadata as any)?.settings?.defaultPermissions || {};
    
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

  private async invalidateGroupCaches(groupId?: string): Promise<void> {
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

    } catch (error) {
      this.logger.logErrorEvent(error, 'GroupsService.invalidateGroupCaches', undefined, JSON.stringify({ groupId }));
    }
  }
}