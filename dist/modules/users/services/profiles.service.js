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
exports.ProfilesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const bullmq_service_1 = require("../../../shared/bullmq/bullmq.service");
const email_service_1 = require("../../../shared/email/email.service");
const bullmq_constants_1 = require("../../../shared/bullmq/bullmq.constants");
let ProfilesService = class ProfilesService {
    prisma;
    redis;
    bullmq;
    email;
    logger;
    CACHE_PREFIX = 'profile:';
    CACHE_TTL = 3600;
    COMPLETION_CACHE_TTL = 1800;
    constructor(prisma, redis, bullmq, email, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.bullmq = bullmq;
        this.email = email;
        this.logger = loggerService.createChildLogger('ProfilesService');
    }
    async create(profileData) {
        const userId = profileData.userId;
        const operationId = this.logger.startOperation('createProfile', { userId });
        try {
            this.logger.info('Creating user profile', JSON.stringify({
                userId: profileData.userId,
                hasDateOfBirth: !!profileData.dateOfBirth,
                city: profileData.city,
                country: profileData.country
            }));
            const user = await this.prisma.users.findUnique({
                where: { id: profileData.userId },
                select: {
                    id: true,
                    is_active: true,
                    first_name: true,
                    last_name: true,
                    email: true
                }
            });
            if (!user) {
                this.logger.logErrorEvent(new Error('User not found'), 'ProfilesService.create', JSON.stringify({ userId: profileData.userId }));
                throw new common_1.NotFoundException('Utilisateur introuvable');
            }
            if (!user.is_active) {
                throw new common_1.BadRequestException('Utilisateur inactif');
            }
            const existingProfile = await this.prisma.user_profiles.findUnique({
                where: { user_id: profileData.userId }
            });
            if (existingProfile) {
                throw new common_1.ConflictException('Un profil existe déjà pour cet utilisateur');
            }
            const profileCreateData = {
                users: { connect: { id: profileData.userId } },
                date_of_birth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : null,
                gender: profileData.gender,
                city: profileData.city || null,
                country: profileData.country,
                language: profileData.language,
                ...(profileData.favoriteTeamId && {
                    participants: { connect: { id: profileData.favoriteTeamId } }
                }),
                supporter_since: profileData.supporterSince ? new Date(profileData.supporterSince) : null,
                preferences: profileData.preferences ? JSON.parse(JSON.stringify(profileData.preferences)) : null,
            };
            const result = await this.prisma.$transaction(async (tx) => {
                const newProfile = await tx.user_profiles.create({
                    data: profileCreateData,
                    include: {
                        users: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                                email: true,
                                avatar: true,
                                created_at: true
                            }
                        },
                        participants: {
                            select: {
                                id: true,
                                name: true,
                                type: true
                            }
                        }
                    }
                });
                this.logger.logBusinessEvent('PROFILE_CREATED', {
                    userId,
                    profileId: newProfile.id,
                    hasDateOfBirth: !!newProfile.date_of_birth,
                    country: newProfile.country,
                    language: newProfile.language
                }, userId);
                return newProfile;
            });
            await this.invalidateUserCaches(userId);
            await this.bullmq.addJob(bullmq_constants_1.QUEUE_NAMES.REPORTS, 'calculate-profile-completion', {
                userId: user.id,
                profileId: result.id,
                trigger: 'profile_created'
            });
            await this.bullmq.addJob(bullmq_constants_1.QUEUE_NAMES.REPORTS, 'generate-profile-suggestions', {
                userId: user.id,
                profileData: {
                    country: result.country,
                    language: result.language,
                    hasDateOfBirth: !!result.date_of_birth
                }
            });
            this.logger.endOperation('createProfile', operationId, true);
            return result;
        }
        catch (error) {
            this.logger.endOperation('createProfile', operationId, false);
            if (error instanceof common_1.ConflictException ||
                error instanceof common_1.NotFoundException ||
                error instanceof common_1.BadRequestException) {
                throw error;
            }
            this.logger.logErrorEvent(error, 'ProfilesService.create', JSON.stringify({ userId, profileData }));
            throw new common_1.InternalServerErrorException('Erreur lors de la création du profil');
        }
    }
    async findByUserId(userId) {
        const operationId = this.logger.startOperation('findProfileByUserId', { userId });
        try {
            const cacheKey = `${this.CACHE_PREFIX}user:${userId}`;
            const cached = await this.redis.getCache(cacheKey);
            if (cached) {
                this.logger.logCacheEvent('hit', cacheKey);
                this.logger.endOperation('findProfileByUserId', operationId, true);
                return cached;
            }
            this.logger.logCacheEvent('miss', cacheKey);
            const profile = await this.prisma.user_profiles.findUnique({
                where: { user_id: userId },
                include: {
                    users: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true,
                            avatar: true,
                            is_active: true,
                            created_at: true,
                            last_login: true
                        }
                    },
                    participants: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                            logo_url: true
                        }
                    }
                }
            });
            if (profile) {
                await this.redis.setCache(cacheKey, profile, this.CACHE_TTL);
                this.logger.logCacheEvent('set', cacheKey, this.CACHE_TTL);
            }
            this.logger.endOperation('findProfileByUserId', operationId, true);
            return profile;
        }
        catch (error) {
            this.logger.endOperation('findProfileByUserId', operationId, false);
            this.logger.logErrorEvent(error, 'ProfilesService.findByUserId', JSON.stringify({ userId }));
            throw new common_1.InternalServerErrorException('Erreur lors de la récupération du profil');
        }
    }
    async update(userId, updateData) {
        const operationId = this.logger.startOperation('updateProfile', { userId });
        try {
            this.logger.info('Updating user profile', JSON.stringify({
                userId,
                fieldsToUpdate: Object.keys(updateData)
            }));
            const existingProfile = await this.prisma.user_profiles.findUnique({
                where: { user_id: userId },
                select: { id: true, user_id: true }
            });
            if (!existingProfile) {
                throw new common_1.NotFoundException('Profil introuvable');
            }
            const updatePayload = {};
            if (updateData.dateOfBirth !== undefined) {
                updatePayload.date_of_birth = updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : null;
            }
            if (updateData.gender !== undefined) {
                updatePayload.gender = updateData.gender;
            }
            if (updateData.city !== undefined) {
                updatePayload.city = updateData.city;
            }
            if (updateData.country !== undefined) {
                updatePayload.country = updateData.country;
            }
            if (updateData.language !== undefined) {
                updatePayload.language = updateData.language;
            }
            if (updateData.supporterSince !== undefined) {
                updatePayload.supporter_since = updateData.supporterSince ? new Date(updateData.supporterSince) : null;
            }
            if (updateData.favoriteTeamId !== undefined) {
                if (updateData.favoriteTeamId) {
                    updatePayload.participants = { connect: { id: updateData.favoriteTeamId } };
                }
                else {
                    updatePayload.participants = { disconnect: true };
                }
            }
            if (updateData.preferences !== undefined) {
                updatePayload.preferences = updateData.preferences ? JSON.parse(JSON.stringify(updateData.preferences)) : null;
            }
            const result = await this.prisma.$transaction(async (tx) => {
                const updatedProfile = await tx.user_profiles.update({
                    where: { user_id: userId },
                    data: updatePayload,
                    include: {
                        users: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                                email: true,
                                avatar: true
                            }
                        },
                        participants: {
                            select: {
                                id: true,
                                name: true,
                                type: true
                            }
                        }
                    }
                });
                this.logger.logBusinessEvent('PROFILE_UPDATED', {
                    userId,
                    profileId: updatedProfile.id,
                    fieldsUpdated: Object.keys(updateData),
                    hasNewFavoriteTeam: !!updateData.favoriteTeamId
                }, userId);
                return updatedProfile;
            });
            await this.invalidateUserCaches(userId);
            await this.bullmq.addJob(bullmq_constants_1.QUEUE_NAMES.NOTIFICATIONS, 'calculate-profile-completion', {
                userId,
                profileId: result.id,
                trigger: 'profile_updated',
                updatedFields: Object.keys(updateData)
            });
            this.logger.endOperation('updateProfile', operationId, true);
            return result;
        }
        catch (error) {
            this.logger.endOperation('updateProfile', operationId, false);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.logErrorEvent(error, 'ProfilesService.update', JSON.stringify({ userId, updateData }));
            throw new common_1.InternalServerErrorException('Erreur lors de la mise à jour du profil');
        }
    }
    async delete(userId) {
        const operationId = this.logger.startOperation('deleteProfile', { userId });
        try {
            this.logger.info('Deleting user profile', JSON.stringify({ userId }));
            const existingProfile = await this.prisma.user_profiles.findUnique({
                where: { user_id: userId },
                select: { id: true }
            });
            if (!existingProfile) {
                throw new common_1.NotFoundException('Profil introuvable');
            }
            await this.prisma.$transaction(async (tx) => {
                await tx.user_profiles.delete({
                    where: { user_id: userId }
                });
                this.logger.logBusinessEvent('PROFILE_DELETED', {
                    userId,
                    profileId: existingProfile.id
                }, userId);
            });
            await this.invalidateUserCaches(userId);
            this.logger.endOperation('deleteProfile', operationId, true);
        }
        catch (error) {
            this.logger.endOperation('deleteProfile', operationId, false);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.logErrorEvent(error, 'ProfilesService.delete', JSON.stringify({ userId }));
            throw new common_1.InternalServerErrorException('Erreur lors de la suppression du profil');
        }
    }
    async getCompletionStatus(userId) {
        const operationId = this.logger.startOperation('getCompletionStatus', { userId });
        try {
            const cacheKey = `${this.CACHE_PREFIX}completion:${userId}`;
            const cached = await this.redis.getCache(cacheKey);
            if (cached) {
                this.logger.logCacheEvent('hit', cacheKey);
                this.logger.endOperation('getCompletionStatus', operationId, true);
                return cached;
            }
            this.logger.logCacheEvent('miss', cacheKey);
            const profile = await this.prisma.user_profiles.findUnique({
                where: { user_id: userId },
                include: {
                    users: {
                        select: {
                            first_name: true,
                            last_name: true,
                            email: true,
                            avatar: true,
                            phone: true
                        }
                    }
                }
            });
            if (!profile) {
                throw new common_1.NotFoundException('Profil introuvable');
            }
            const completionData = this.calculateCompletionPercentage(profile);
            await this.redis.setCache(cacheKey, completionData, this.COMPLETION_CACHE_TTL);
            this.logger.logCacheEvent('set', cacheKey, this.COMPLETION_CACHE_TTL);
            this.logger.endOperation('getCompletionStatus', operationId, true);
            return completionData;
        }
        catch (error) {
            this.logger.endOperation('getCompletionStatus', operationId, false);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.logErrorEvent(error, 'ProfilesService.getCompletionStatus', JSON.stringify({ userId }));
            throw new common_1.InternalServerErrorException('Erreur lors du calcul de complétion');
        }
    }
    async updatePreferences(userId, preferences) {
        const operationId = this.logger.startOperation('updatePreferences', { userId });
        try {
            this.logger.info('Updating user preferences', JSON.stringify({
                userId,
                preferencesKeys: Object.keys(preferences)
            }));
            const currentProfile = await this.prisma.user_profiles.findUnique({
                where: { user_id: userId },
                select: { preferences: true }
            });
            if (!currentProfile) {
                throw new common_1.NotFoundException('Profil introuvable');
            }
            const currentPrefs = currentProfile.preferences || {};
            const updatedPrefs = { ...currentPrefs, ...preferences };
            const result = await this.prisma.user_profiles.update({
                where: { user_id: userId },
                data: {
                    preferences: JSON.parse(JSON.stringify(updatedPrefs))
                },
                include: {
                    users: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true
                        }
                    }
                }
            });
            await this.invalidateUserCaches(userId);
            this.logger.logBusinessEvent('PREFERENCES_UPDATED', {
                userId,
                updatedKeys: Object.keys(preferences)
            }, userId);
            this.logger.endOperation('updatePreferences', operationId, true);
            return result;
        }
        catch (error) {
            this.logger.endOperation('updatePreferences', operationId, false);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.logErrorEvent(error, 'ProfilesService.updatePreferences', JSON.stringify({ userId, preferences }));
            throw new common_1.InternalServerErrorException('Erreur lors de la mise à jour des préférences');
        }
    }
    async searchProfiles(filters, limit = 20, offset = 0) {
        const operationId = this.logger.startOperation('searchProfiles', { filters });
        try {
            const where = {
                users: {
                    is_active: true
                }
            };
            if (filters.country) {
                where.country = filters.country;
            }
            if (filters.city) {
                where.city = {
                    contains: filters.city,
                    mode: 'insensitive'
                };
            }
            if (filters.language) {
                where.language = filters.language;
            }
            if (filters.gender) {
                where.gender = filters.gender;
            }
            if (filters.favoriteTeamId) {
                where.favorite_team_id = filters.favoriteTeamId;
            }
            if (filters.supporterSince) {
                where.supporter_since = {
                    gte: new Date(filters.supporterSince)
                };
            }
            const [profiles, total] = await Promise.all([
                this.prisma.user_profiles.findMany({
                    where,
                    include: {
                        users: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                                avatar: true,
                                created_at: true
                            }
                        },
                        participants: {
                            select: {
                                id: true,
                                name: true,
                                type: true
                            }
                        }
                    },
                    skip: offset,
                    take: limit,
                    orderBy: {
                        created_at: 'desc'
                    }
                }),
                this.prisma.user_profiles.count({ where })
            ]);
            const result = {
                profiles,
                pagination: {
                    total,
                    limit,
                    offset,
                    totalPages: Math.ceil(total / limit),
                    hasNext: offset + limit < total,
                    hasPrev: offset > 0
                }
            };
            this.logger.endOperation('searchProfiles', operationId, true);
            return result;
        }
        catch (error) {
            this.logger.endOperation('searchProfiles', operationId, false);
            this.logger.logErrorEvent(error, 'ProfilesService.searchProfiles', JSON.stringify({ filters, limit, offset }));
            throw new common_1.InternalServerErrorException('Erreur lors de la recherche de profils');
        }
    }
    calculateCompletionPercentage(profile) {
        const user = profile.users;
        const fields = {
            first_name: !!user.first_name,
            last_name: !!user.last_name,
            email: !!user.email,
            phone: !!user.phone,
            avatar: !!user.avatar,
            date_of_birth: !!profile.date_of_birth,
            gender: !!profile.gender,
            city: !!profile.city,
            country: !!profile.country,
            language: !!profile.language,
            supporter_since: !!profile.supporter_since,
            favorite_team_id: !!profile.favorite_team_id,
            preferences: !!profile.preferences
        };
        const completedFields = Object.entries(fields)
            .filter(([_, isCompleted]) => isCompleted)
            .map(([field, _]) => field);
        const totalFields = Object.keys(fields).length;
        const percentage = Math.round((completedFields.length / totalFields) * 100);
        const missingFields = Object.entries(fields)
            .filter(([_, isCompleted]) => !isCompleted)
            .map(([field, _]) => field);
        const suggestions = this.generateCompletionSuggestions(missingFields);
        return {
            percentage,
            completedFields,
            missingFields,
            totalFields,
            suggestions,
            nextSteps: this.getNextSteps(percentage, missingFields)
        };
    }
    generateCompletionSuggestions(missingFields) {
        const suggestions = [];
        if (missingFields.includes('date_of_birth')) {
            suggestions.push({
                field: 'date_of_birth',
                title: 'Ajoutez votre date de naissance',
                description: 'Recevez des offres personnalisées selon votre âge',
                priority: 'HIGH',
                incentive: {
                    type: 'BONUS_POINTS',
                    value: 50,
                    description: '50 points bonus'
                }
            });
        }
        if (missingFields.includes('favorite_team_id')) {
            suggestions.push({
                field: 'favorite_team_id',
                title: 'Choisissez votre équipe favorite',
                description: 'Recevez des notifications pour vos équipes préférées',
                priority: 'HIGH',
                incentive: {
                    type: 'EARLY_ACCESS',
                    value: 1,
                    description: 'Accès anticipé aux billets'
                }
            });
        }
        if (missingFields.includes('city')) {
            suggestions.push({
                field: 'city',
                title: 'Indiquez votre ville',
                description: 'Découvrez les événements près de chez vous',
                priority: 'MEDIUM'
            });
        }
        if (missingFields.includes('gender')) {
            suggestions.push({
                field: 'gender',
                title: 'Précisez votre genre',
                description: 'Améliore les recommandations personnalisées',
                priority: 'LOW'
            });
        }
        if (missingFields.includes('preferences')) {
            suggestions.push({
                field: 'preferences',
                title: 'Configurez vos préférences',
                description: 'Personnalisez votre expérience Entrix',
                priority: 'MEDIUM'
            });
        }
        if (missingFields.includes('phone')) {
            suggestions.push({
                field: 'phone',
                title: 'Ajoutez votre numéro de téléphone',
                description: 'Recevez des notifications importantes par SMS',
                priority: 'MEDIUM'
            });
        }
        if (missingFields.includes('avatar')) {
            suggestions.push({
                field: 'avatar',
                title: 'Ajoutez votre photo de profil',
                description: 'Personnalisez votre profil et soyez reconnu',
                priority: 'LOW'
            });
        }
        return suggestions;
    }
    getNextSteps(percentage, missingFields) {
        if (percentage < 30) {
            return [
                'Complétez vos informations de base',
                'Ajoutez votre date de naissance',
                'Choisissez votre équipe favorite'
            ];
        }
        else if (percentage < 70) {
            return [
                'Ajoutez votre photo de profil',
                'Renseignez vos préférences',
                'Indiquez votre ville'
            ];
        }
        else {
            return [
                'Ajoutez votre numéro de téléphone',
                'Configurez vos préférences avancées',
                'Explorez les événements disponibles'
            ];
        }
    }
    async invalidateUserCaches(userId) {
        try {
            const cacheKeys = [
                `${this.CACHE_PREFIX}user:${userId}`,
                `${this.CACHE_PREFIX}completion:${userId}`,
                `${this.CACHE_PREFIX}stats:${userId}`,
                `user:${userId}:*`
            ];
            await Promise.all(cacheKeys.map(key => key.includes('*')
                ? this.redis.cleanup(key)
                : this.redis.del(key)));
            this.logger.logCacheEvent('del', `user:${userId}:*`);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'ProfilesService.invalidateUserCaches', JSON.stringify({ userId }));
        }
    }
};
exports.ProfilesService = ProfilesService;
exports.ProfilesService = ProfilesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        bullmq_service_1.BullmqService,
        email_service_1.EmailService,
        logger_service_1.LoggerService])
], ProfilesService);
//# sourceMappingURL=profiles.service.js.map