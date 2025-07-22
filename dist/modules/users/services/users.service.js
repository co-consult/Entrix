"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const bullmq_service_1 = require("../../../shared/bullmq/bullmq.service");
const email_service_1 = require("../../../shared/email/email.service");
const bcrypt = __importStar(require("bcrypt"));
const bullmq_constants_1 = require("../../../shared/bullmq/bullmq.constants");
let UsersService = class UsersService {
    prisma;
    redis;
    bullmq;
    email;
    logger;
    CACHE_PREFIX = 'user:';
    SEARCH_CACHE_PREFIX = 'users:search:';
    CACHE_TTL = 3600;
    SEARCH_CACHE_TTL = 300;
    constructor(prisma, redis, bullmq, email, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.bullmq = bullmq;
        this.email = email;
        this.logger = loggerService.createChildLogger('UsersService');
    }
    async create(userData) {
        const operationId = this.logger.startOperation('createUser', { email: userData.email });
        try {
            this.logger.info('Creating new user', JSON.stringify({
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName
            }));
            const existingUser = await this.prisma.users.findUnique({
                where: { email: userData.email },
                select: { id: true }
            });
            if (existingUser) {
                this.logger.warn('Email already exists', JSON.stringify({ email: userData.email }));
                throw new common_1.ConflictException('Un utilisateur avec cet email existe déjà');
            }
            this.validateCreateData(userData);
            const hashedPassword = await bcrypt.hash(userData.password, 12);
            const newUser = await this.prisma.users.create({
                data: {
                    email: userData.email,
                    password: hashedPassword,
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    phone: userData.phone || null,
                    avatar: userData.avatar || null,
                    is_active: userData.isActive ?? true,
                    email_verified: userData.emailVerified ? new Date() : null,
                    phone_verified: userData.phoneVerified ? new Date() : null,
                    metadata: userData.metadata || null,
                },
                include: {
                    user_profiles: true,
                    user_groups_user_groups_user_idTousers: {
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
                    user_roles_user_roles_user_idTousers: {
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
            this.logger.logBusinessEvent('USER_CREATED', {
                userId: newUser.id,
                email: newUser.email,
                isActive: newUser.is_active,
                hasProfile: !!newUser.user_profiles
            }, newUser.id);
            await this.bullmq.addJob(bullmq_constants_1.QUEUE_NAMES.EMAIL, bullmq_constants_1.JOB_TYPES.EMAIL.SEND_WELCOME, {
                userId: newUser.id,
                email: newUser.email,
                firstName: newUser.first_name,
                lastName: newUser.last_name,
                registrationSource: 'web',
                metadata: userData.metadata
            });
            const cacheKey = `${this.CACHE_PREFIX}${newUser.id}`;
            await this.redis.setCache(cacheKey, newUser, this.CACHE_TTL);
            this.logger.endOperation('createUser', operationId, true);
            return this.transformUserFromPrisma(newUser);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'UsersService.create', undefined, JSON.stringify({ email: userData.email }));
            this.logger.endOperation('createUser', operationId, false);
            throw error;
        }
    }
    async findById(id) {
        const operationId = this.logger.startOperation('findUserById', { userId: id });
        try {
            const cacheKey = `${this.CACHE_PREFIX}${id}`;
            const cached = await this.redis.getCache(cacheKey);
            if (cached) {
                this.logger.logCacheEvent('hit', cacheKey);
                this.logger.endOperation('findUserById', operationId, true);
                return this.transformUserFromPrisma(cached);
            }
            this.logger.logCacheEvent('miss', cacheKey);
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
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'UsersService.findById', id);
            this.logger.endOperation('findUserById', operationId, false);
            throw new common_1.InternalServerErrorException('Erreur lors de la récupération de l\'utilisateur');
        }
    }
    async findByEmail(email) {
        const operationId = this.logger.startOperation('findUserByEmail', { email });
        try {
            const cacheKey = `${this.CACHE_PREFIX}email:${email}`;
            const cached = await this.redis.getCache(cacheKey);
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
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'UsersService.findByEmail', undefined, JSON.stringify({ email }));
            this.logger.endOperation('findUserByEmail', operationId, false);
            throw new common_1.InternalServerErrorException('Erreur lors de la recherche par email');
        }
    }
    async findByPhone(phone) {
        const operationId = this.logger.startOperation('findUserByPhone', { phone });
        try {
            const cacheKey = `${this.CACHE_PREFIX}phone:${phone}`;
            const cached = await this.redis.getCache(cacheKey);
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
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'UsersService.findByPhone', undefined, JSON.stringify({ phone }));
            this.logger.endOperation('findUserByPhone', operationId, false);
            throw new common_1.InternalServerErrorException('Erreur lors de la recherche par téléphone');
        }
    }
    async update(id, updateData) {
        const operationId = this.logger.startOperation('updateUser', { userId: id });
        try {
            const existingUser = await this.findById(id);
            if (!existingUser) {
                throw new common_1.NotFoundException('Utilisateur introuvable');
            }
            const prismaUpdateData = {
                first_name: updateData.firstName,
                last_name: updateData.lastName,
                phone: updateData.phone,
                avatar: updateData.avatar,
                is_active: updateData.isActive,
                email_verified: updateData.emailVerified ? new Date() : undefined,
                phone_verified: updateData.phoneVerified ? new Date() : undefined,
                last_login: updateData.lastLogin,
                metadata: updateData.metadata
            };
            if (updateData.password) {
                prismaUpdateData.password = await bcrypt.hash(updateData.password, 12);
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
            await this.invalidateUserCache(id);
            this.logger.logBusinessEvent('USER_UPDATED', {
                userId: id,
                changes: Object.keys(updateData).filter(key => updateData[key] !== undefined)
            }, id);
            this.logger.endOperation('updateUser', operationId, true);
            return this.transformUserFromPrisma(updatedUser);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'UsersService.update', id, JSON.stringify({ updateData }));
            this.logger.endOperation('updateUser', operationId, false);
            throw error;
        }
    }
    async delete(id) {
        const operationId = this.logger.startOperation('deleteUser', { userId: id });
        try {
            const user = await this.findById(id);
            if (!user) {
                throw new common_1.NotFoundException('Utilisateur introuvable');
            }
            await this.prisma.users.update({
                where: { id },
                data: {
                    is_active: false,
                    metadata: {
                        ...(user.metadata || {}),
                        deletedAt: new Date().toISOString(),
                        deletedReason: 'USER_DELETION_REQUEST'
                    }
                }
            });
            await this.invalidateUserCache(id);
            this.logger.logBusinessEvent('USER_DELETED', {
                userId: id,
                deletedAt: new Date().toISOString()
            }, id);
            this.logger.endOperation('deleteUser', operationId, true);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'UsersService.delete', id);
            this.logger.endOperation('deleteUser', operationId, false);
            throw error;
        }
    }
    async search(params) {
        const operationId = this.logger.startOperation('searchUsers', params);
        try {
            const { query, filters, pagination, sorting, include } = params;
            const page = pagination?.page || 1;
            const limit = pagination?.limit || 20;
            const offset = (page - 1) * limit;
            const whereConditions = this.buildWhereConditions(filters, query);
            const includeConditions = this.buildIncludeConditions(include);
            const total = await this.prisma.users.count({ where: whereConditions });
            const users = await this.prisma.users.findMany({
                where: whereConditions,
                include: includeConditions,
                orderBy: sorting ? { [sorting.field]: sorting.order } : { created_at: 'desc' },
                skip: offset,
                take: limit
            });
            const result = {
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
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'UsersService.search', undefined, JSON.stringify(params));
            this.logger.endOperation('searchUsers', operationId, false);
            throw new common_1.InternalServerErrorException('Erreur lors de la recherche');
        }
    }
    async findMany(filters) {
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
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'UsersService.findMany', undefined, JSON.stringify(filters));
            this.logger.endOperation('findManyUsers', operationId, false);
            throw new common_1.InternalServerErrorException('Erreur lors de la récupération des utilisateurs');
        }
    }
    async count(filters) {
        const operationId = this.logger.startOperation('countUsers', filters);
        try {
            const whereConditions = filters ? this.buildWhereConditions(filters) : {};
            const count = await this.prisma.users.count({ where: whereConditions });
            this.logger.endOperation('countUsers', operationId, true);
            return count;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'UsersService.count', undefined, JSON.stringify({ filters }));
            this.logger.endOperation('countUsers', operationId, false);
            throw new common_1.InternalServerErrorException('Erreur lors du comptage');
        }
    }
    async activate(id) {
        const operationId = this.logger.startOperation('activateUser', { userId: id });
        try {
            const user = await this.update(id, { isActive: true });
            this.logger.logBusinessEvent('USER_ACTIVATED', {
                userId: id,
                activatedAt: new Date().toISOString()
            }, id);
            this.logger.endOperation('activateUser', operationId, true);
            return user;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'UsersService.activate', id);
            this.logger.endOperation('activateUser', operationId, false);
            throw error;
        }
    }
    async deactivate(id) {
        const operationId = this.logger.startOperation('deactivateUser', { userId: id });
        try {
            const user = await this.update(id, { isActive: false });
            this.logger.logBusinessEvent('USER_DEACTIVATED', {
                userId: id,
                deactivatedAt: new Date().toISOString()
            }, id);
            this.logger.endOperation('deactivateUser', operationId, true);
            return user;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'UsersService.deactivate', id);
            this.logger.endOperation('deactivateUser', operationId, false);
            throw error;
        }
    }
    async suspend(id, reason) {
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
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'UsersService.suspend', id, JSON.stringify({ reason }));
            this.logger.endOperation('suspendUser', operationId, false);
            throw error;
        }
    }
    async verify(id) {
        const operationId = this.logger.startOperation('verifyUser', { userId: id });
        try {
            const updateData = {
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
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'UsersService.verify', id);
            this.logger.endOperation('verifyUser', operationId, false);
            throw error;
        }
    }
    async getUserGroups(userId) {
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
            const result = userGroups.map(ug => ({
                groupId: ug.group_id,
                groupName: ug.groups.name,
                groupType: ug.groups.type,
                role: 'MEMBER',
                joinedAt: ug.joined_at,
                isActive: ug.groups.is_active
            }));
            this.logger.endOperation('getUserGroups', operationId, true);
            return result;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'UsersService.getUserGroups', userId);
            this.logger.endOperation('getUserGroups', operationId, false);
            throw new common_1.InternalServerErrorException('Erreur lors de la récupération des groupes');
        }
    }
    async getUserRoles(userId) {
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
            const result = userRoles.map(ur => ({
                roleId: ur.role_id,
                roleName: ur.roles.name,
                roleCode: ur.roles.code,
                assignedAt: ur.assigned_at,
                validUntil: ur.valid_until || undefined,
                isActive: ur.roles.is_active
            }));
            this.logger.endOperation('getUserRoles', operationId, true);
            return result;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'UsersService.getUserRoles', userId);
            this.logger.endOperation('getUserRoles', operationId, false);
            throw new common_1.InternalServerErrorException('Erreur lors de la récupération des rôles');
        }
    }
    async getStats(filters) {
        const operationId = this.logger.startOperation('getUserStats', { hasFilters: !!filters });
        try {
            const whereConditions = filters ? this.buildWhereConditions(filters) : {};
            const [totalUsers, activeUsers, verifiedUsers, newUsersToday, newUsersThisWeek, newUsersThisMonth] = await Promise.all([
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
            const usersByCountry = await this.prisma.user_profiles.groupBy({
                by: ['country'],
                _count: { user_id: true },
                where: {
                    country: { not: null }
                },
                orderBy: { _count: { user_id: 'desc' } },
                take: 10
            });
            const countryStats = usersByCountry.map(stat => ({
                country: stat.country || 'Unknown',
                count: stat._count.user_id,
                percentage: totalUsers > 0 ? (stat._count.user_id / totalUsers) * 100 : 0
            }));
            const usersByLanguage = await this.prisma.user_profiles.groupBy({
                by: ['language'],
                _count: { user_id: true },
                where: {
                    language: { not: null }
                },
                orderBy: { _count: { user_id: 'desc' } },
                take: 10
            });
            const languageStats = usersByLanguage.map(stat => ({
                language: stat.language || 'Unknown',
                count: stat._count.user_id,
                percentage: totalUsers > 0 ? (stat._count.user_id / totalUsers) * 100 : 0
            }));
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const registrationTrend = [];
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
            const stats = {
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
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'UsersService.getStats', undefined, JSON.stringify({ filters }));
            this.logger.endOperation('getUserStats', operationId, false);
            throw new common_1.InternalServerErrorException('Erreur lors du calcul des statistiques');
        }
    }
    transformUserFromPrisma(prismaUser) {
        return {
            id: prismaUser.id,
            email: prismaUser.email,
            firstName: prismaUser.first_name,
            lastName: prismaUser.last_name,
            phone: prismaUser.phone,
            avatar: prismaUser.avatar,
            isActive: prismaUser.is_active,
            emailVerified: !!prismaUser.email_verified,
            phoneVerified: !!prismaUser.phone_verified,
            lastLogin: prismaUser.last_login,
            createdAt: prismaUser.created_at,
            updatedAt: prismaUser.updated_at,
            metadata: prismaUser.metadata,
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
            userGroups: prismaUser.user_groups_user_groups_user_idTousers?.map((ug) => ({
                groupId: ug.group_id,
                groupName: ug.groups?.name,
                groupType: ug.groups?.type,
                role: ug.role,
                joinedAt: ug.joined_at,
                status: ug.status
            })),
            userRoles: prismaUser.user_roles_user_roles_user_idTousers?.map((ur) => ({
                roleId: ur.role_id,
                roleName: ur.roles?.name,
                roleCode: ur.roles?.code,
                assignedAt: ur.assigned_at,
                validUntil: ur.valid_until
            }))
        };
    }
    buildWhereConditions(filters, query) {
        const where = {};
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
            if (filters.country || filters.city || filters.language) {
                where.user_profiles = {
                    ...(filters.country && { country: filters.country }),
                    ...(filters.city && { city: filters.city }),
                    ...(filters.language && { language: filters.language })
                };
            }
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
    buildIncludeConditions(include) {
        const includeConditions = {};
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
    async invalidateUserCache(userId) {
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
                    await Promise.all(keys.map(key => this.redis.delCache(key)));
                    this.logger.logCacheEvent('del', pattern, undefined, { keysDeleted: keys.length });
                }
            }
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'UsersService.invalidateUserCache', userId);
        }
    }
    validateCreateData(data) {
        if (!data.email || !this.isValidEmail(data.email)) {
            throw new common_1.BadRequestException('Email invalide');
        }
        if (!data.password || data.password.length < 8) {
            throw new common_1.BadRequestException('Le mot de passe doit contenir au moins 8 caractères');
        }
        if (!data.firstName || data.firstName.trim().length < 2) {
            throw new common_1.BadRequestException('Prénom invalide');
        }
        if (!data.lastName || data.lastName.trim().length < 2) {
            throw new common_1.BadRequestException('Nom invalide');
        }
        if (data.phone && !this.isValidPhone(data.phone)) {
            throw new common_1.BadRequestException('Numéro de téléphone invalide');
        }
    }
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    async changePassword(id, oldPassword, newPassword) {
        const operationId = this.logger.startOperation('changePassword', { userId: id });
        try {
            const user = await this.prisma.users.findUnique({
                where: { id },
                select: {
                    id: true,
                    password: true,
                    email: true
                }
            });
            if (!user) {
                throw new common_1.NotFoundException('Utilisateur introuvable');
            }
            const isValidPassword = await bcrypt.compare(oldPassword, user.password);
            if (!isValidPassword) {
                throw new common_1.BadRequestException('Mot de passe actuel incorrect');
            }
            if (oldPassword === newPassword) {
                throw new common_1.BadRequestException('Le nouveau mot de passe doit être différent de l\'ancien');
            }
            if (newPassword.length < 8) {
                throw new common_1.BadRequestException('Le nouveau mot de passe doit contenir au moins 8 caractères');
            }
            const hashedPassword = await bcrypt.hash(newPassword, 12);
            const updatedUser = await this.prisma.users.update({
                where: { id },
                data: { password: hashedPassword },
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
            await this.invalidateUserCache(id);
            this.logger.logSecurityEvent('PASSWORD_CHANGED', id);
            this.logger.endOperation('changePassword', operationId, true);
            return this.transformUserFromPrisma(updatedUser);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'UsersService.changePassword', id);
            this.logger.endOperation('changePassword', operationId, false);
            throw error;
        }
    }
    async verifyPassword(email, password) {
        const operationId = this.logger.startOperation('verifyPassword', { email });
        try {
            const user = await this.prisma.users.findUnique({
                where: { email },
                select: {
                    id: true,
                    password: true,
                    is_active: true
                }
            });
            if (!user || !user.is_active) {
                this.logger.endOperation('verifyPassword', operationId, false);
                return false;
            }
            const isValid = await bcrypt.compare(password, user.password);
            this.logger.endOperation('verifyPassword', operationId, true);
            return isValid;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'UsersService.verifyPassword', undefined, JSON.stringify({ email }));
            this.logger.endOperation('verifyPassword', operationId, false);
            throw error;
        }
    }
    isValidPhone(phone) {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        bullmq_service_1.BullmqService,
        email_service_1.EmailService,
        logger_service_1.LoggerService])
], UsersService);
//# sourceMappingURL=users.service.js.map