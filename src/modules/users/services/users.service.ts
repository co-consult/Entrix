// src/modules/users/services/users.service.ts

import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException 
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { BullmqService } from '../../../shared/bullmq/bullmq.service';
import { EmailService } from '../../../shared/email/email.service';
import { HashingService } from '../../../shared/hashing/hashing.service'; 

// DTOs
import { CreateUserDto } from '../dto/users/create-user.dto';
import { UpdateUserDto } from '../dto/users/update-user.dto';
import { UserSearchDto } from '../dto/users/user-search.dto';
import { UpdatePrivacyDto } from '../dto/users/update-privacy.dto';
import { UserPreferencesDto } from '../dto/users/user-preferences.dto';

// Note: IUserService n'est PAS importé car il est redéfini localement
// avec les types incluant password
import { 
  UserSearchParams,
  UserFilters,
  PaginationParams,
  UserGroupInfo,
  UserRoleInfo,
  UserStats,
  CountryStats,
  LanguageStats,
  TrendData,
  SortingParams,
  UserInclude
} from '../interfaces/user.interface';

// Import des types
import { UserStatus } from '../types/user.types';
import { GroupRole } from '../types/group.types';

// Constants
import { USER_CONSTANTS } from '../constants/user.constants';
import { QUEUE_NAMES, JOB_TYPES } from '../../../shared/bullmq/bullmq.constants';

// ============================================================================
// INTERFACES LOCALES REDÉFINIES (incluent password)
// Note: Ces interfaces redéfinissent celles de user.interface.ts pour inclure
// le champ password requis par le schema Prisma
// ============================================================================

// Données de création avec password obligatoire
interface CreateUserData {
  email: string;
  password: string;  // Champ obligatoire dans schema.prisma
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  metadata?: Record<string, any>;
}

// Données de mise à jour avec password optionnel
interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  lastLogin?: Date;
  metadata?: Record<string, any>;
  password?: string; // Optionnel pour changement de mot de passe
}

// Type User transformé (après transformation depuis Prisma)
interface User {
  id: string;
  email: string;
  firstName: string;  // camelCase
  lastName: string;   // camelCase
  phone?: string | null;
  avatar?: string | null;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  metadata?: any;
  profile?: any;
  userGroups?: any[];
  userRoles?: any[];
}

// Résultat paginé avec le type User local
interface PaginatedUserResult {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Interface de service redéfinie localement avec les bons types
interface IUserService {
  // CRUD de base
  create(userData: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  update(id: string, updateData: UpdateUserData): Promise<User>;
  delete(id: string): Promise<void>;
  
  // Recherche et listing
  search(params: UserSearchParams): Promise<PaginatedUserResult>;
  findMany(filters: UserFilters): Promise<User[]>;
  count(filters?: UserFilters): Promise<number>;
  
  // Opérations métier
  activate(id: string): Promise<User>;
  deactivate(id: string): Promise<User>;
  suspend(id: string, reason: string): Promise<User>;
  verify(id: string): Promise<User>;
  
  // Relations
  getUserGroups(userId: string): Promise<UserGroupInfo[]>;
  getUserRoles(userId: string): Promise<UserRoleInfo[]>;
  
  // Statistiques
  getStats(filters?: UserFilters): Promise<UserStats>;
  
  // Authentification (méthodes supplémentaires)
  changePassword?(id: string, oldPassword: string, newPassword: string): Promise<User>;
  verifyPassword?(email: string, password: string): Promise<boolean>;
}

/**
 * Service Grade A+ pour la gestion des utilisateurs
 * Respecte strictement le schema.prisma et utilise correctement les services partagés
 */
@Injectable()
export class UsersService implements IUserService {
  private readonly logger: LoggerService;
  private readonly CACHE_PREFIX = 'user:';
  private readonly SEARCH_CACHE_PREFIX = 'users:search:';
  private readonly CACHE_TTL = 3600; // 1 heure
  private readonly SEARCH_CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly bullmq: BullmqService,
    private readonly email: EmailService,
    private readonly hashingService: HashingService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('UsersService');
  }

  // ============================================================================
  // MÉTHODES CRUD DE BASE
  // ============================================================================

  /**
   * Crée un nouvel utilisateur selon schema.prisma exact
   */
  async create(userData: CreateUserData): Promise<User> {
    const operationId = this.logger.startOperation('createUser', { email: userData.email });

    try {
      this.logger.info('Creating new user', JSON.stringify({ 
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName
      }));

      // Vérifier l'unicité de l'email selon schema.prisma
      const existingUser = await this.prisma.users.findUnique({
        where: { email: userData.email },
        select: { id: true }
      });

      if (existingUser) {
        this.logger.warn('Email already exists', JSON.stringify({ email: userData.email }));
        throw new ConflictException('Un utilisateur avec cet email existe déjà');
      }

      // Valider les données
      this.validateCreateData(userData);

      // Hasher le mot de passe (password existe maintenant dans CreateUserData)
      const hashedPassword = await this.hashingService.hashPassword(userData.password);

      // Créer l'utilisateur avec les champs EXACTS du schema.prisma
      const newUser = await this.prisma.users.create({
        data: {
          email: userData.email,
          password: hashedPassword,                       // Champ obligatoire hashé
          first_name: userData.firstName,                 // Champ exact du schema
          last_name: userData.lastName,                   // Champ exact du schema
          phone: userData.phone || null,
          avatar: userData.avatar || null,
          is_active: userData.isActive ?? true,           // Champ exact du schema
          email_verified: userData.emailVerified ? new Date() : null, // DateTime? dans schema
          phone_verified: userData.phoneVerified ? new Date() : null, // DateTime? dans schema
          metadata: userData.metadata || null,
        },
        include: {
          user_profiles: true, // Relation 1:1 correcte (au singulier)
          user_groups_user_groups_user_idTousers: {  // Nom exact du schema
            include: {
              groups: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  is_active: true
                }
              }
            }
          },
          user_roles_user_roles_user_idTousers: {    // Nom exact du schema
            include: {
              roles: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  level: true,
                  is_active: true
                }
              }
            }
          }
        }
      });

      // Log événement business avec signature exacte
      this.logger.logBusinessEvent('USER_CREATED', {
        userId: newUser.id,
        email: newUser.email,
        isActive: newUser.is_active,
        hasProfile: !!newUser.user_profiles
      }, newUser.id);

      // Créer un job pour envoyer l'email de bienvenue
      await this.bullmq.addJob(
        QUEUE_NAMES.EMAIL,
        JOB_TYPES.EMAIL.SEND_WELCOME,
        {
          userId: newUser.id,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          registrationSource: 'web',
          metadata: userData.metadata
        }
      );

      // Mettre en cache
      const cacheKey = `${this.CACHE_PREFIX}${newUser.id}`;
      await this.redis.setCache(cacheKey, newUser, this.CACHE_TTL);

      // Signature correcte de endOperation: (operationName, operationId, success, duration?, metadata?)
      this.logger.endOperation('createUser', operationId, true);
      
      return this.transformUserFromPrisma(newUser);

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error, 
        'UsersService.create',
        undefined,
        JSON.stringify({ email: userData.email })
      );
      this.logger.endOperation('createUser', operationId, false);
      throw error;
    }
  }

  /**
   * Trouve un utilisateur par ID
   */
  async findById(id: string): Promise<User | null> {
    const operationId = this.logger.startOperation('findUserById', { userId: id });

    try {
      // Vérifier le cache
      const cacheKey = `${this.CACHE_PREFIX}${id}`;
      const cached = await this.redis.getCache<any>(cacheKey);
      
      if (cached) {
        this.logger.logCacheEvent('hit', cacheKey);
        this.logger.endOperation('findUserById', operationId, true);
        return this.transformUserFromPrisma(cached);
      }

      this.logger.logCacheEvent('miss', cacheKey);

      // Récupérer depuis la BD avec relations selon schema exact
      const user = await this.prisma.users.findUnique({
        where: { id },
        include: {
          user_profiles: true,
          user_groups_user_groups_user_idTousers: {
            where: { status: 'ACTIVE' },
            include: {
              groups: true
            }
          },
          user_roles_user_roles_user_idTousers: {
            where: { status: 'ACTIVE' },
            include: {
              roles: true
            }
          }
        }
      });

      if (user) {
        await this.redis.setCache(cacheKey, user, this.CACHE_TTL);
        this.logger.logCacheEvent('set', cacheKey, this.CACHE_TTL);
      }

      this.logger.endOperation('findUserById', operationId, true);
      return user ? this.transformUserFromPrisma(user) : null;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error, 
        'UsersService.findById', 
        id
      );
      this.logger.endOperation('findUserById', operationId, false);
      throw new InternalServerErrorException('Erreur lors de la récupération de l\'utilisateur');
    }
  }

  /**
   * Trouve un utilisateur par email
   */
  async findByEmail(email: string): Promise<User | null> {
    const operationId = this.logger.startOperation('findUserByEmail', { email });

    try {
      const cacheKey = `${this.CACHE_PREFIX}email:${email}`;
      const cached = await this.redis.getCache<any>(cacheKey);
      
      if (cached) {
        this.logger.logCacheEvent('hit', cacheKey);
        this.logger.endOperation('findUserByEmail', operationId, true);
        return this.transformUserFromPrisma(cached);
      }

      const user = await this.prisma.users.findUnique({
        where: { email },
        include: {
          user_profiles: true
        }
      });

      if (user) {
        await this.redis.setCache(cacheKey, user, this.CACHE_TTL);
      }

      this.logger.endOperation('findUserByEmail', operationId, true);
      return user ? this.transformUserFromPrisma(user) : null;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error, 
        'UsersService.findByEmail', 
        undefined,
        JSON.stringify({ email })
      );
      this.logger.endOperation('findUserByEmail', operationId, false);
      throw new InternalServerErrorException('Erreur lors de la recherche par email');
    }
  }

  /**
   * Trouve un utilisateur par téléphone
   */
  async findByPhone(phone: string): Promise<User | null> {
    const operationId = this.logger.startOperation('findUserByPhone', { phone });

    try {
      const cacheKey = `${this.CACHE_PREFIX}phone:${phone}`;
      const cached = await this.redis.getCache<any>(cacheKey);
      
      if (cached) {
        this.logger.logCacheEvent('hit', cacheKey);
        this.logger.endOperation('findUserByPhone', operationId, true);
        return this.transformUserFromPrisma(cached);
      }

      const user = await this.prisma.users.findFirst({
        where: { phone },
        include: {
          user_profiles: true
        }
      });

      if (user) {
        await this.redis.setCache(cacheKey, user, this.CACHE_TTL);
      }

      this.logger.endOperation('findUserByPhone', operationId, true);
      return user ? this.transformUserFromPrisma(user) : null;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error, 
        'UsersService.findByPhone',
        undefined,
        JSON.stringify({ phone })
      );
      this.logger.endOperation('findUserByPhone', operationId, false);
      throw new InternalServerErrorException('Erreur lors de la recherche par téléphone');
    }
  }

  /**
   * Met à jour un utilisateur
   */
  async update(id: string, updateData: UpdateUserData): Promise<User> {
    const operationId = this.logger.startOperation('updateUser', { userId: id });

    try {
      const existingUser = await this.findById(id);
      if (!existingUser) {
        throw new NotFoundException('Utilisateur introuvable');
      }

      // Préparer les données selon schema exact
      const prismaUpdateData: Prisma.usersUpdateInput = {
        first_name: updateData.firstName,
        last_name: updateData.lastName,
        phone: updateData.phone,
        avatar: updateData.avatar,
        is_active: updateData.isActive,
        email_verified: updateData.emailVerified ? new Date() : undefined,
        phone_verified: updateData.phoneVerified ? new Date() : undefined,
        last_login: updateData.lastLogin,
        metadata: updateData.metadata as any
      };

      // Si un nouveau mot de passe est fourni, le hasher (password existe dans UpdateUserData)
      if (updateData.password) {
        prismaUpdateData.password = await this.hashingService.hashPassword(updateData.password);
      }

      const updatedUser = await this.prisma.users.update({
        where: { id },
        data: prismaUpdateData,
        include: {
          user_profiles: true,
          user_groups_user_groups_user_idTousers: {
            where: { status: 'ACTIVE' },
            include: {
              groups: true
            }
          },
          user_roles_user_roles_user_idTousers: {
            where: { status: 'ACTIVE' },
            include: {
              roles: true
            }
          }
        }
      });

      // Invalider le cache
      await this.invalidateUserCache(id);
      
      // Log événement
      this.logger.logBusinessEvent('USER_UPDATED', {
        userId: id,
        changes: Object.keys(updateData).filter(key => updateData[key] !== undefined)
      }, id);

      this.logger.endOperation('updateUser', operationId, true);
      return this.transformUserFromPrisma(updatedUser);

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error, 
        'UsersService.update', 
        id,
        JSON.stringify({ updateData })
      );
      this.logger.endOperation('updateUser', operationId, false);
      throw error;
    }
  }

  /**
   * Supprime un utilisateur (soft delete)
   */
  async delete(id: string): Promise<void> {
    const operationId = this.logger.startOperation('deleteUser', { userId: id });

    try {
      const user = await this.findById(id);
      if (!user) {
        throw new NotFoundException('Utilisateur introuvable');
      }

      // Soft delete : désactiver l'utilisateur
      await this.prisma.users.update({
        where: { id },
        data: { 
          is_active: false,
          metadata: {
            ...(user.metadata as any || {}),
            deletedAt: new Date().toISOString(),
            deletedReason: 'USER_DELETION_REQUEST'
          }
        }
      });

      // Invalider le cache
      await this.invalidateUserCache(id);

      // Log événement
      this.logger.logBusinessEvent('USER_DELETED', {
        userId: id,
        deletedAt: new Date().toISOString()
      }, id);

      this.logger.endOperation('deleteUser', operationId, true);

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error, 
        'UsersService.delete', 
        id
      );
      this.logger.endOperation('deleteUser', operationId, false);
      throw error;
    }
  }

  // ============================================================================
  // MÉTHODES DE RECHERCHE ET LISTING
  // ============================================================================

  /**
   * Recherche d'utilisateurs avec pagination
   */
  async search(params: UserSearchParams): Promise<PaginatedUserResult> {
    const operationId = this.logger.startOperation('searchUsers', params);

    try {
      const { query, filters, pagination, sorting, include } = params;
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const offset = (page - 1) * limit;

      // Construire les conditions where
      const whereConditions = this.buildWhereConditions(filters, query);

      // Construire l'objet include
      const includeConditions = this.buildIncludeConditions(include);

      // Compter le total
      const total = await this.prisma.users.count({ where: whereConditions });

      // Récupérer les données
      const users = await this.prisma.users.findMany({
        where: whereConditions,
        include: includeConditions,
        orderBy: sorting ? { [sorting.field]: sorting.order } : { created_at: 'desc' },
        skip: offset,
        take: limit
      });

      const result: PaginatedUserResult = {
        data: users.map(u => this.transformUserFromPrisma(u)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      };

      this.logger.endOperation('searchUsers', operationId, true);
      return result;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error, 
        'UsersService.search',
        undefined,
        JSON.stringify(params)
      );
      this.logger.endOperation('searchUsers', operationId, false);
      throw new InternalServerErrorException('Erreur lors de la recherche');
    }
  }

  /**
   * Trouve plusieurs utilisateurs avec filtres
   */
  async findMany(filters: UserFilters): Promise<User[]> {
    const operationId = this.logger.startOperation('findManyUsers', filters);

    try {
      const whereConditions = this.buildWhereConditions(filters);

      const users = await this.prisma.users.findMany({
        where: whereConditions,
        include: {
          user_profiles: true
        },
        orderBy: { created_at: 'desc' }
      });

      this.logger.endOperation('findManyUsers', operationId, true);
      return users.map(u => this.transformUserFromPrisma(u));

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error, 
        'UsersService.findMany',
        undefined,
        JSON.stringify(filters)
      );
      this.logger.endOperation('findManyUsers', operationId, false);
      throw new InternalServerErrorException('Erreur lors de la récupération des utilisateurs');
    }
  }

  /**
   * Compte les utilisateurs avec filtres
   */
  async count(filters?: UserFilters): Promise<number> {
    const operationId = this.logger.startOperation('countUsers', filters);

    try {
      const whereConditions = filters ? this.buildWhereConditions(filters) : {};
      const count = await this.prisma.users.count({ where: whereConditions });

      this.logger.endOperation('countUsers', operationId, true);
      return count;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error, 
        'UsersService.count',
        undefined,
        JSON.stringify({ filters })
      );
      this.logger.endOperation('countUsers', operationId, false);
      throw new InternalServerErrorException('Erreur lors du comptage');
    }
  }

  // ============================================================================
  // MÉTHODES MÉTIER
  // ============================================================================

  /**
   * Active un utilisateur
   */
  async activate(id: string): Promise<User> {
    const operationId = this.logger.startOperation('activateUser', { userId: id });

    try {
      const user = await this.update(id, { isActive: true });
      
      this.logger.logBusinessEvent('USER_ACTIVATED', {
        userId: id,
        activatedAt: new Date().toISOString()
      }, id);

      this.logger.endOperation('activateUser', operationId, true);
      return user;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error, 
        'UsersService.activate', 
        id
      );
      this.logger.endOperation('activateUser', operationId, false);
      throw error;
    }
  }

  /**
   * Désactive un utilisateur
   */
  async deactivate(id: string): Promise<User> {
    const operationId = this.logger.startOperation('deactivateUser', { userId: id });

    try {
      const user = await this.update(id, { isActive: false });
      
      this.logger.logBusinessEvent('USER_DEACTIVATED', {
        userId: id,
        deactivatedAt: new Date().toISOString()
      }, id);

      this.logger.endOperation('deactivateUser', operationId, true);
      return user;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error, 
        'UsersService.deactivate', 
        id
      );
      this.logger.endOperation('deactivateUser', operationId, false);
      throw error;
    }
  }

  /**
   * Suspend un utilisateur avec raison
   */
  async suspend(id: string, reason: string): Promise<User> {
    const operationId = this.logger.startOperation('suspendUser', { userId: id, reason });

    try {
      const user = await this.update(id, { 
        isActive: false,
        metadata: {
          suspension: {
            reason,
            suspendedAt: new Date().toISOString(),
            status: 'SUSPENDED'
          }
        }
      });
      
      this.logger.logBusinessEvent('USER_SUSPENDED', {
        userId: id,
        reason,
        suspendedAt: new Date().toISOString()
      }, id);

      this.logger.endOperation('suspendUser', operationId, true);
      return user;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error, 
        'UsersService.suspend', 
        id,
        JSON.stringify({ reason })
      );
      this.logger.endOperation('suspendUser', operationId, false);
      throw error;
    }
  }

  /**
   * Vérifie un utilisateur (email et/ou téléphone)
   */
  async verify(id: string): Promise<User> {
    const operationId = this.logger.startOperation('verifyUser', { userId: id });

    try {
      const updateData: UpdateUserData = {
        emailVerified: true,
        phoneVerified: true
      };

      const user = await this.update(id, updateData);
      
      this.logger.logBusinessEvent('USER_VERIFIED', {
        userId: id,
        verificationType: 'both',
        verifiedAt: new Date().toISOString()
      }, id);

      this.logger.endOperation('verifyUser', operationId, true);
      return user;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error, 
        'UsersService.verify', 
        id
      );
      this.logger.endOperation('verifyUser', operationId, false);
      throw error;
    }
  }

  // ============================================================================
  // MÉTHODES DE RELATIONS
  // ============================================================================

  /**
   * Récupère les groupes d'un utilisateur
   */
  async getUserGroups(userId: string): Promise<UserGroupInfo[]> {
    const operationId = this.logger.startOperation('getUserGroups', { userId });

    try {
      const userGroups = await this.prisma.user_groups.findMany({
        where: {
          user_id: userId,
          status: 'ACTIVE',
          OR: [
            { valid_until: null },
            { valid_until: { gte: new Date() } }
          ]
        },
        include: {
          groups: {
            select: {
              id: true,
              name: true,
              type: true,
              is_active: true
            }
          }
        },
        orderBy: {
          joined_at: 'desc'
        }
      });

      const result: UserGroupInfo[] = userGroups.map(ug => ({
        groupId: ug.group_id,
        groupName: ug.groups.name,
        groupType: ug.groups.type,
        role: 'MEMBER' as GroupRole, // Par défaut MEMBER, peut être stocké dans metadata
        joinedAt: ug.joined_at,
        isActive: ug.groups.is_active
      }));

      this.logger.endOperation('getUserGroups', operationId, true);
      return result;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error, 
        'UsersService.getUserGroups', 
        userId
      );
      this.logger.endOperation('getUserGroups', operationId, false);
      throw new InternalServerErrorException('Erreur lors de la récupération des groupes');
    }
  }

  /**
   * Récupère les rôles d'un utilisateur
   */
  async getUserRoles(userId: string): Promise<UserRoleInfo[]> {
    const operationId = this.logger.startOperation('getUserRoles', { userId });

    try {
      const userRoles = await this.prisma.user_roles.findMany({
        where: {
          user_id: userId,
          status: 'ACTIVE',
          OR: [
            { valid_until: null },
            { valid_until: { gte: new Date() } }
          ]
        },
        include: {
          roles: {
            select: {
              id: true,
              name: true,
              code: true,
              level: true,
              is_active: true
            }
          }
        },
        orderBy: {
          assigned_at: 'desc'
        }
      });

      const result: UserRoleInfo[] = userRoles.map(ur => ({
        roleId: ur.role_id,
        roleName: ur.roles.name,
        roleCode: ur.roles.code,
        assignedAt: ur.assigned_at,
        validUntil: ur.valid_until || undefined,
        isActive: ur.roles.is_active
      }));

      this.logger.endOperation('getUserRoles', operationId, true);
      return result;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error, 
        'UsersService.getUserRoles', 
        userId
      );
      this.logger.endOperation('getUserRoles', operationId, false);
      throw new InternalServerErrorException('Erreur lors de la récupération des rôles');
    }
  }

  // ============================================================================
  // MÉTHODES DE STATISTIQUES
  // ============================================================================

  /**
   * Génère des statistiques utilisateurs
   */
  async getStats(filters?: UserFilters): Promise<UserStats> {
    const operationId = this.logger.startOperation('getUserStats', { hasFilters: !!filters });

    try {
      const whereConditions = filters ? this.buildWhereConditions(filters) : {};

      // Calculs en parallèle pour performance
      const [
        totalUsers,
        activeUsers,
        verifiedUsers,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth
      ] = await Promise.all([
        this.prisma.users.count({ where: whereConditions }),
        this.prisma.users.count({ 
          where: { ...whereConditions, is_active: true } 
        }),
        this.prisma.users.count({ 
          where: { 
            ...whereConditions, 
            email_verified: { not: null }
          } 
        }),
        this.prisma.users.count({ 
          where: { 
            ...whereConditions, 
            created_at: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } 
          } 
        }),
        this.prisma.users.count({ 
          where: { 
            ...whereConditions, 
            created_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
          } 
        }),
        this.prisma.users.count({ 
          where: { 
            ...whereConditions, 
            created_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
          } 
        })
      ]);

      // Statistiques par pays via les profils
      const usersByCountry = await this.prisma.user_profiles.groupBy({
        by: ['country'],
        _count: { user_id: true },
        where: {
          country: { not: null }
        },
        orderBy: { _count: { user_id: 'desc' } },
        take: 10
      });

      const countryStats: CountryStats[] = usersByCountry.map(stat => ({
        country: stat.country || 'Unknown',
        count: stat._count.user_id,
        percentage: totalUsers > 0 ? (stat._count.user_id / totalUsers) * 100 : 0
      }));

      // Statistiques par langue via les profils
      const usersByLanguage = await this.prisma.user_profiles.groupBy({
        by: ['language'],
        _count: { user_id: true },
        where: {
          language: { not: null }
        },
        orderBy: { _count: { user_id: 'desc' } },
        take: 10
      });

      const languageStats: LanguageStats[] = usersByLanguage.map(stat => ({
        language: stat.language || 'Unknown',
        count: stat._count.user_id,
        percentage: totalUsers > 0 ? (stat._count.user_id / totalUsers) * 100 : 0
      }));

      // Tendances d'inscription (30 derniers jours)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const registrationTrend: TrendData[] = [];
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const count = await this.prisma.users.count({
          where: {
            ...whereConditions,
            created_at: {
              gte: date,
              lt: nextDate
            }
          }
        });
        
        registrationTrend.push({
          date: date.toISOString().split('T')[0],
          count
        });
      }

      const stats: UserStats = {
        totalUsers,
        activeUsers,
        verifiedUsers,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
        usersByCountry: countryStats,
        usersByLanguage: languageStats,
        registrationTrend
      };

      this.logger.endOperation('getUserStats', operationId, true);
      return stats;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error, 
        'UsersService.getStats', 
        undefined,
        JSON.stringify({ filters })
      );
      this.logger.endOperation('getUserStats', operationId, false);
      throw new InternalServerErrorException('Erreur lors du calcul des statistiques');
    }
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  /**
   * Transforme un utilisateur Prisma en User du domaine
   */
  private transformUserFromPrisma(prismaUser: any): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      firstName: prismaUser.first_name,     // Transformation des noms
      lastName: prismaUser.last_name,       
      phone: prismaUser.phone,
      avatar: prismaUser.avatar,
      isActive: prismaUser.is_active,       // Transformation des noms
      emailVerified: !!prismaUser.email_verified,  // DateTime? -> boolean
      phoneVerified: !!prismaUser.phone_verified,  // DateTime? -> boolean
      lastLogin: prismaUser.last_login,
      createdAt: prismaUser.created_at,
      updatedAt: prismaUser.updated_at,
      metadata: prismaUser.metadata,
      
      // Relations transformées si présentes
      profile: prismaUser.user_profiles ? {
        id: prismaUser.user_profiles.id,
        dateOfBirth: prismaUser.user_profiles.date_of_birth,
        gender: prismaUser.user_profiles.gender,
        city: prismaUser.user_profiles.city,
        country: prismaUser.user_profiles.country,
        language: prismaUser.user_profiles.language,
        supporterSince: prismaUser.user_profiles.supporter_since,
        preferences: prismaUser.user_profiles.preferences,
        createdAt: prismaUser.user_profiles.created_at,
        updatedAt: prismaUser.user_profiles.updated_at
      } : undefined,
      
      userGroups: prismaUser.user_groups_user_groups_user_idTousers?.map((ug: any) => ({
        groupId: ug.group_id,
        groupName: ug.groups?.name,
        groupType: ug.groups?.type,
        role: ug.role,
        joinedAt: ug.joined_at,
        status: ug.status
      })),
      
      userRoles: prismaUser.user_roles_user_roles_user_idTousers?.map((ur: any) => ({
        roleId: ur.role_id,
        roleName: ur.roles?.name,
        roleCode: ur.roles?.code,
        assignedAt: ur.assigned_at,
        validUntil: ur.valid_until
      }))
    };
  }

  /**
   * Construit les conditions where pour Prisma
   */
  private buildWhereConditions(filters?: UserFilters, query?: string): Prisma.usersWhereInput {
    const where: Prisma.usersWhereInput = {};

    if (query) {
      where.OR = [
        { email: { contains: query, mode: 'insensitive' } },
        { first_name: { contains: query, mode: 'insensitive' } },
        { last_name: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } }
      ];
    }

    if (filters) {
      if (filters.isActive !== undefined) {
        where.is_active = filters.isActive;
      }
      
      if (filters.emailVerified !== undefined) {
        where.email_verified = filters.emailVerified ? { not: null } : null;
      }
      
      if (filters.phoneVerified !== undefined) {
        where.phone_verified = filters.phoneVerified ? { not: null } : null;
      }
      
      // Filtres sur les profils
      if (filters.country || filters.city || filters.language) {
        where.user_profiles = {
          ...(filters.country && { country: filters.country }),
          ...(filters.city && { city: filters.city }),
          ...(filters.language && { language: filters.language })
        };
      }
      
      // Filtres de dates
      if (filters.createdAfter || filters.createdBefore) {
        where.created_at = {
          ...(filters.createdAfter && { gte: filters.createdAfter }),
          ...(filters.createdBefore && { lte: filters.createdBefore })
        };
      }
      
      if (filters.lastLoginAfter || filters.lastLoginBefore) {
        where.last_login = {
          ...(filters.lastLoginAfter && { gte: filters.lastLoginAfter }),
          ...(filters.lastLoginBefore && { lte: filters.lastLoginBefore })
        };
      }
    }

    return where;
  }

  /**
   * Construit les conditions include pour Prisma
   */
  private buildIncludeConditions(include?: any): any {
    const includeConditions: any = {};

    if (include?.profile) {
      includeConditions.user_profiles = true;
    }

    if (include?.userGroups) {
      includeConditions.user_groups_user_groups_user_idTousers = {
        where: { status: 'ACTIVE' },
        include: {
          groups: {
            select: {
              id: true,
              name: true,
              type: true,
              is_active: true
            }
          }
        }
      };
    }

    if (include?.userRoles) {
      includeConditions.user_roles_user_roles_user_idTousers = {
        where: { status: 'ACTIVE' },
        include: {
          roles: {
            select: {
              id: true,
              name: true,
              code: true,
              level: true,
              is_active: true
            }
          }
        }
      };
    }

    if (include?.sessions) {
      includeConditions.user_sessions = {
        where: { is_active: true },
        orderBy: { last_activity: 'desc' },
        take: 5
      };
    }

    return includeConditions;
  }

  /**
   * Invalide le cache d'un utilisateur
   */
  private async invalidateUserCache(userId: string): Promise<void> {
    try {
      const patterns = [
        `${this.CACHE_PREFIX}${userId}`,
        `${this.CACHE_PREFIX}email:*`,
        `${this.CACHE_PREFIX}phone:*`,
        `${this.SEARCH_CACHE_PREFIX}*`
      ];

      for (const pattern of patterns) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          // Utiliser delCache au lieu de deleteCache
          await Promise.all(keys.map(key => this.redis.delCache(key)));
          this.logger.logCacheEvent('del', pattern, undefined, { keysDeleted: keys.length });
        }
      }
    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'UsersService.invalidateUserCache',
        userId
      );
    }
  }

  /**
   * Valide les données de création d'utilisateur
   */
  private validateCreateData(data: CreateUserData): void {
    if (!data.email || !this.isValidEmail(data.email)) {
      throw new BadRequestException('Email invalide');
    }

    // Validation du password (existe maintenant dans CreateUserData)
    if (!data.password || data.password.length < 8) {
      throw new BadRequestException('Le mot de passe doit contenir au moins 8 caractères');
    }

    if (!data.firstName || data.firstName.trim().length < 2) {
      throw new BadRequestException('Prénom invalide');
    }

    if (!data.lastName || data.lastName.trim().length < 2) {
      throw new BadRequestException('Nom invalide');
    }

    if (data.phone && !this.isValidPhone(data.phone)) {
      throw new BadRequestException('Numéro de téléphone invalide');
    }
  }

  /**
   * Valide un email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valide un numéro de téléphone
   */
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
 * Vérifie le mot de passe d'un utilisateur
 * @param userId ID de l'utilisateur
 * @param password Mot de passe en clair à vérifier
 * @returns true si le mot de passe est correct
 */
async verifyPassword(userId: string, password: string): Promise<boolean> {
  this.logger.log(`Verifying password for user: ${userId}`);
  
  try {
    // Récupérer l'utilisateur avec le password depuis Prisma
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        password: true, 
        is_active: true 
      }
    });

    if (!user) {
      this.logger.warn(`User not found for password verification: ${userId}`);
      return false;
    }

    if (!user.is_active) {
      this.logger.warn(`Inactive user attempted password verification: ${userId}`);
      return false;
    }

    // 🔍 DEBUG temporaire
    console.log('🔍 DEBUG - UserId :', userId);
    console.log('🔍 DEBUG - Password input:', password);
    console.log('🔍 DEBUG - Hash from DB:', user.password);
    console.log('🔍 DEBUG - Password length:', password.length);
    console.log('🔍 DEBUG - Hash length:', user.password.length);
    
    const isValid = await this.hashingService.compare(password, user.password);
    
    console.log('🔍 DEBUG - bcrypt.compare result:', isValid);
  
    
    this.logger.log(`Password verification for user ${userId}: ${isValid ? 'SUCCESS' : 'FAILED'}`);
    
    return isValid;

  } catch (error) {
    this.logger.error(`Error verifying password for user ${userId}:`, error);
    return false;
  }
}

/**
 * Vérifie le mot de passe d'un utilisateur par email
 * @param email Email de l'utilisateur
 * @param password Mot de passe en clair à vérifier
 * @returns true si le mot de passe est correct
 */
async verifyPasswordByEmail(email: string, password: string): Promise<boolean> {
  this.logger.log(`Verifying password for email: ${email}`);
  
  try {
    // Récupérer l'utilisateur avec le password depuis Prisma
    const user = await this.prisma.users.findUnique({
      where: { email: email.toLowerCase() },
      select: { 
        id: true, 
        email: true,
        password: true, 
        is_active: true 
      }
    });

    if (!user) {
      this.logger.warn(`User not found for password verification: ${email}`);
      return false;
    }

    if (!user.is_active) {
      this.logger.warn(`Inactive user attempted password verification: ${email}`);
      return false;
    }
    const hashedPassword = await this.hashingService.hashPassword(password);
    console.log('🔍 DEBUG - Email:', email);
    console.log('🔍 DEBUG - Password input:', password);
    console.log('🔍 DEBUG - hashedPassword:', hashedPassword);
    console.log('🔍 DEBUG - Hash from DB:', user.password); 
    console.log('🔍 DEBUG - Password length:', password.length);
    console.log('🔍 DEBUG - Hash length:', user.password.length);
    
    const isValid = await this.hashingService.compare(password, user.password);
    
    console.log('🔍 DEBUG - bcrypt.compare result:', isValid);
    
    this.logger.log(`Password verification for user ${user.id} (${email}): ${isValid ? 'SUCCESS' : 'FAILED'}`);
    
    return isValid;

  } catch (error) {
    this.logger.error(`Error verifying password for email ${email}:`, error);
    return false;
  }
}

/**
 * Change le mot de passe d'un utilisateur
 * @param userId ID de l'utilisateur
 * @param currentPassword Mot de passe actuel
 * @param newPassword Nouveau mot de passe
 * @returns L'utilisateur mis à jour
 */
async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<User> {
  this.logger.log(`Changing password for user: ${userId}`);

  // Vérifier le mot de passe actuel
  const isCurrentPasswordValid = await this.verifyPassword(userId, currentPassword);
  if (!isCurrentPasswordValid) {
    throw new BadRequestException('Current password is incorrect');
  }

  // Hasher le nouveau mot de passe
  const hashedNewPassword = await this.hashingService.hashPassword(newPassword);

  // Mettre à jour en base
  const updatedUser = await this.update(userId, {
    password: hashedNewPassword
  });

  this.logger.log(`Password changed successfully for user: ${userId}`);
  
  return updatedUser;
}

}