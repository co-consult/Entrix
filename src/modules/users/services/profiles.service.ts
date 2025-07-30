// src/modules/users/services/profiles.service.ts

import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException,
  InternalServerErrorException 
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { BullmqService } from '../../../shared/bullmq/bullmq.service';
import { EmailService } from '../../../shared/email/email.service';
import { 
  CreateProfileDto, 
  UpdateProfileDto, 
} from '../dto';
import { QUEUE_NAMES } from '../../../shared/bullmq/bullmq.constants';

/**
 * Service Grade A+ pour la gestion des profils utilisateurs
 * Respecte strictement le schema Prisma et utilise les services partagés
 */
@Injectable()
export class ProfilesService {
  private readonly logger: LoggerService;
  private readonly CACHE_PREFIX = 'profile:';
  private readonly CACHE_TTL = 3600; // 1 heure
  private readonly COMPLETION_CACHE_TTL = 1800; // 30 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly bullmq: BullmqService,
    private readonly email: EmailService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('ProfilesService');
  }

  // ============================================================================
  // MÉTHODES CRUD DE BASE
  // ============================================================================

  /**
   * Crée un profil pour un utilisateur
   */
  async create(profileData: CreateProfileDto): Promise<any> {
    const userId = profileData.userId;
    const operationId = this.logger.startOperation('createProfile', { userId });

    try {
      this.logger.info('Creating user profile', JSON.stringify({ 
        userId: profileData.userId, 
        hasDateOfBirth: !!profileData.dateOfBirth,
        city: profileData.city,
        country: profileData.country 
      }));

      // Vérifier que l'utilisateur existe selon le schema exact
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
        this.logger.logErrorEvent(
          new Error('User not found'), 
          'ProfilesService.create',
          JSON.stringify({ userId: profileData.userId })
        );
        throw new NotFoundException('Utilisateur introuvable');
      }

      if (!user.is_active) {
        throw new BadRequestException('Utilisateur inactif');
      }

      // Vérifier qu'aucun profil n'existe déjà (contrainte UNIQUE sur user_id)
      const existingProfile = await this.prisma.user_profiles.findUnique({
        where: { user_id: profileData.userId }
      });

      if (existingProfile) {
        throw new ConflictException('Un profil existe déjà pour cet utilisateur');
      }

      // Valider et préparer les données selon le schema Prisma exact et DTO
      const profileCreateData: Prisma.user_profilesCreateInput = {
        users: { connect: { id: profileData.userId } },
        date_of_birth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : null,
        gender: profileData.gender as any, // gender? enum dans le schema
        city: profileData.city || null,
        country: profileData.country, // obligatoire dans DTO
        language: profileData.language, // obligatoire dans DTO
        ...(profileData.favoriteTeamId && { 
          participants: { connect: { id: profileData.favoriteTeamId } } 
        }),
        supporter_since: profileData.supporterSince ? new Date(profileData.supporterSince) : null,
        preferences: profileData.preferences ? JSON.parse(JSON.stringify(profileData.preferences)) : null,
        // Note: occupation, educationLevel, bio, website ne sont pas dans le schema user_profiles
        // Ils pourraient être stockés dans preferences ou metadata selon l'architecture
      };

      // Créer le profil en transaction pour assurer la cohérence
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

        // Logger l'événement business
        this.logger.logBusinessEvent('PROFILE_CREATED', {
          userId,
          profileId: newProfile.id,
          hasDateOfBirth: !!newProfile.date_of_birth,
          country: newProfile.country,
          language: newProfile.language
        }, userId);

        return newProfile;
      });

      // Invalider les caches liés
      await this.invalidateUserCaches(userId);

      // Programmer un job asynchrone pour calculer la complétion
      await this.bullmq.addJob(QUEUE_NAMES.REPORTS, 'calculate-profile-completion', {
        userId: user.id,
        profileId: result.id,
        trigger: 'profile_created'
      });


      // Programmer un job pour des suggestions personnalisées
      await this.bullmq.addJob(QUEUE_NAMES.REPORTS, 'generate-profile-suggestions', {
        userId: user.id,
        profileData: {
          country: result.country,
          language: result.language,
          hasDateOfBirth: !!result.date_of_birth
        }
      });

      this.logger.endOperation('createProfile', operationId, true);
      return result;

    } catch (error) {
      this.logger.endOperation('createProfile', operationId, false);
      
      if (error instanceof ConflictException || 
          error instanceof NotFoundException || 
          error instanceof BadRequestException) {
        throw error;
      }

      this.logger.logErrorEvent(
        error, 
        'ProfilesService.create', 
        JSON.stringify({ userId, profileData })
      );
      throw new InternalServerErrorException('Erreur lors de la création du profil');
    }
  }

  /**
   * Trouve un profil par user_id avec cache Redis
   */
  async findByUserId(userId: string): Promise<any | null> {
    const operationId = this.logger.startOperation('findProfileByUserId', { userId });

    try {
      // Vérifier le cache d'abord
      const cacheKey = `${this.CACHE_PREFIX}user:${userId}`;
      const cached = await this.redis.getCache<any>(cacheKey);
      
      if (cached) {
        this.logger.logCacheEvent('hit', cacheKey);
        this.logger.endOperation('findProfileByUserId', operationId, true);
        return cached;
      }

      this.logger.logCacheEvent('miss', cacheKey);

      // Récupérer depuis la base avec relations selon le schema
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
        // Mettre en cache avec TTL
        await this.redis.setCache(cacheKey, profile, this.CACHE_TTL);
        this.logger.logCacheEvent('set', cacheKey, this.CACHE_TTL);
      }

      this.logger.endOperation('findProfileByUserId', operationId, true);
      return profile;

    } catch (error) {
      this.logger.endOperation('findProfileByUserId', operationId, false);
      this.logger.logErrorEvent(
        error, 
        'ProfilesService.findByUserId', 
        JSON.stringify({ userId })
      );
      throw new InternalServerErrorException('Erreur lors de la récupération du profil');
    }
  }

  /**
   * Met à jour un profil existant
   */
  async update(userId: string, updateData: UpdateProfileDto): Promise<any> {
    const operationId = this.logger.startOperation('updateProfile', { userId });

    try {
      this.logger.info('Updating user profile', JSON.stringify({ 
        userId,
        fieldsToUpdate: Object.keys(updateData)
      }));

      // Vérifier que le profil existe
      const existingProfile = await this.prisma.user_profiles.findUnique({
        where: { user_id: userId },
        select: { id: true, user_id: true }
      });

      if (!existingProfile) {
        throw new NotFoundException('Profil introuvable');
      }

      // Préparer les données selon le schema Prisma et DTO
      const updatePayload: Prisma.user_profilesUpdateInput = {};

      // Mapper uniquement les champs fournis selon le DTO UpdateProfileDto
      if (updateData.dateOfBirth !== undefined) {
        updatePayload.date_of_birth = updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : null;
      }
      if (updateData.gender !== undefined) {
        updatePayload.gender = updateData.gender as any;
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
        } else {
          updatePayload.participants = { disconnect: true };
        }
      }
      if (updateData.preferences !== undefined) {
        updatePayload.preferences = updateData.preferences ? JSON.parse(JSON.stringify(updateData.preferences)) : null;
      }
      
      // Note: Les champs occupation, educationLevel, bio, website du DTO 
      // ne correspondent à aucun champ dans le schema user_profiles
      // Ils pourraient être stockés dans preferences selon l'architecture

      // Mise à jour en transaction
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

        // Logger l'événement business
        this.logger.logBusinessEvent('PROFILE_UPDATED', {
          userId,
          profileId: updatedProfile.id,
          fieldsUpdated: Object.keys(updateData),
          hasNewFavoriteTeam: !!updateData.favoriteTeamId
        }, userId);

        return updatedProfile;
      });

      // Invalider les caches
      await this.invalidateUserCaches(userId);

      // Job asynchrone pour recalculer la complétion
      await this.bullmq.addJob(QUEUE_NAMES.NOTIFICATIONS, 'calculate-profile-completion', {
        userId,
        profileId: result.id,
        trigger: 'profile_updated',
        updatedFields: Object.keys(updateData)
      });

      this.logger.endOperation('updateProfile', operationId, true);
      return result;

    } catch (error) {
      this.logger.endOperation('updateProfile', operationId, false);
      
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.logErrorEvent(
        error, 
        'ProfilesService.update', 
        JSON.stringify({ userId, updateData })
      );
      throw new InternalServerErrorException('Erreur lors de la mise à jour du profil');
    }
  }

  /**
   * Supprime un profil utilisateur
   */
  async delete(userId: string): Promise<void> {
    const operationId = this.logger.startOperation('deleteProfile', { userId });

    try {
      this.logger.info('Deleting user profile', JSON.stringify({ userId }));

      // Vérifier que le profil existe
      const existingProfile = await this.prisma.user_profiles.findUnique({
        where: { user_id: userId },
        select: { id: true }
      });

      if (!existingProfile) {
        throw new NotFoundException('Profil introuvable');
      }

      // Suppression en transaction
      await this.prisma.$transaction(async (tx) => {
        await tx.user_profiles.delete({
          where: { user_id: userId }
        });

        // Logger l'événement business
        this.logger.logBusinessEvent('PROFILE_DELETED', {
          userId,
          profileId: existingProfile.id
        }, userId);
      });

      // Nettoyer les caches
      await this.invalidateUserCaches(userId);

      this.logger.endOperation('deleteProfile', operationId, true);

    } catch (error) {
      this.logger.endOperation('deleteProfile', operationId, false);
      
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.logErrorEvent(
        error, 
        'ProfilesService.delete', 
        JSON.stringify({ userId })
      );
      throw new InternalServerErrorException('Erreur lors de la suppression du profil');
    }
  }

  // ============================================================================
  // MÉTHODES AVANCÉES
  // ============================================================================

  /**
   * Calcule le pourcentage de complétion d'un profil avec cache
   */
  async getCompletionStatus(userId: string): Promise<any> {
    const operationId = this.logger.startOperation('getCompletionStatus', { userId });

    try {
      // Vérifier le cache de complétion
      const cacheKey = `${this.CACHE_PREFIX}completion:${userId}`;
      const cached = await this.redis.getCache<any>(cacheKey);
      
      if (cached) {
        this.logger.logCacheEvent('hit', cacheKey);
        this.logger.endOperation('getCompletionStatus', operationId, true);
        return cached;
      }

      this.logger.logCacheEvent('miss', cacheKey);

      // Récupérer le profil complet
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
        throw new NotFoundException('Profil introuvable');
      }

      // Calculer la complétion selon les champs du schema
      const completionData = this.calculateCompletionPercentage(profile);

      // Mettre en cache avec TTL plus court (30 min)
      await this.redis.setCache(cacheKey, completionData, this.COMPLETION_CACHE_TTL);
      this.logger.logCacheEvent('set', cacheKey, this.COMPLETION_CACHE_TTL);

      this.logger.endOperation('getCompletionStatus', operationId, true);
      return completionData;

    } catch (error) {
      this.logger.endOperation('getCompletionStatus', operationId, false);
      
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.logErrorEvent(
        error, 
        'ProfilesService.getCompletionStatus', 
        JSON.stringify({ userId })
      );
      throw new InternalServerErrorException('Erreur lors du calcul de complétion');
    }
  }

  /**
   * Met à jour les préférences utilisateur
   */
  async updatePreferences(userId: string, preferences: Record<string, any>): Promise<any> {
    const operationId = this.logger.startOperation('updatePreferences', { userId });

    try {
      this.logger.info('Updating user preferences', JSON.stringify({ 
        userId,
        preferencesKeys: Object.keys(preferences)
      }));

      // Récupérer les préférences actuelles
      const currentProfile = await this.prisma.user_profiles.findUnique({
        where: { user_id: userId },
        select: { preferences: true }
      });

      if (!currentProfile) {
        throw new NotFoundException('Profil introuvable');
      }

      // Fusionner avec les préférences existantes
      const currentPrefs = (currentProfile.preferences as any) || {};
      const updatedPrefs = { ...currentPrefs, ...preferences };

      // Mise à jour
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

      // Invalider caches
      await this.invalidateUserCaches(userId);

      // Logger l'événement
      this.logger.logBusinessEvent('PREFERENCES_UPDATED', {
        userId,
        updatedKeys: Object.keys(preferences)
      }, userId);

      this.logger.endOperation('updatePreferences', operationId, true);
      return result;

    } catch (error) {
      this.logger.endOperation('updatePreferences', operationId, false);
      
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.logErrorEvent(
        error, 
        'ProfilesService.updatePreferences', 
        JSON.stringify({ userId, preferences })
      );
      throw new InternalServerErrorException('Erreur lors de la mise à jour des préférences');
    }
  }

  /**
   * Recherche de profils avec filtres
   */
  async searchProfiles(filters: any, limit: number = 20, offset: number = 0): Promise<any> {
    const operationId = this.logger.startOperation('searchProfiles', { filters });

    try {
      // Construire les conditions WHERE selon le schema
      const where: Prisma.user_profilesWhereInput = {
        users: {
          is_active: true // Seulement les utilisateurs actifs
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
        where.gender = filters.gender as any;
      }
      if (filters.favoriteTeamId) {
        where.favorite_team_id = filters.favoriteTeamId;
      }
      if (filters.supporterSince) {
        where.supporter_since = {
          gte: new Date(filters.supporterSince)
        };
      }

      // Pagination avec Prisma
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

    } catch (error) {
      this.logger.endOperation('searchProfiles', operationId, false);
      this.logger.logErrorEvent(
        error, 
        'ProfilesService.searchProfiles', 
        JSON.stringify({ filters, limit, offset })
      );
      throw new InternalServerErrorException('Erreur lors de la recherche de profils');
    }
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES PRIVÉES
  // ============================================================================

  /**
   * Calcule le pourcentage de complétion d'un profil
   */
  private calculateCompletionPercentage(profile: any): any {
    const user = profile.users;
    
    // Champs essentiels selon le schema Prisma et les DTOs disponibles
    const fields = {
      // Champs utilisateur de base
      first_name: !!user.first_name,
      last_name: !!user.last_name,
      email: !!user.email,
      phone: !!user.phone,
      avatar: !!user.avatar,
      
      // Champs profil selon DTO et schema
      date_of_birth: !!profile.date_of_birth,
      gender: !!profile.gender,
      city: !!profile.city,
      country: !!profile.country, // obligatoire dans DTO mais on vérifie quand même
      language: !!profile.language, // obligatoire dans DTO mais on vérifie quand même
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

    // Suggestions basées sur les champs manquants
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

  /**
   * Génère des suggestions pour améliorer le profil
   */
  private generateCompletionSuggestions(missingFields: string[]): any[] {
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

  /**
   * Détermine les prochaines étapes selon le pourcentage
   */
  private getNextSteps(percentage: number, missingFields: string[]): string[] {
    if (percentage < 30) {
      return [
        'Complétez vos informations de base',
        'Ajoutez votre date de naissance',
        'Choisissez votre équipe favorite'
      ];
    } else if (percentage < 70) {
      return [
        'Ajoutez votre photo de profil',
        'Renseignez vos préférences',
        'Indiquez votre ville'
      ];
    } else {
      return [
        'Ajoutez votre numéro de téléphone',
        'Configurez vos préférences avancées',
        'Explorez les événements disponibles'
      ];
    }
  }

  /**
   * Invalide tous les caches liés à un utilisateur
   */
  private async invalidateUserCaches(userId: string): Promise<void> {
    try {
      const cacheKeys = [
        `${this.CACHE_PREFIX}user:${userId}`,
        `${this.CACHE_PREFIX}completion:${userId}`,
        `${this.CACHE_PREFIX}stats:${userId}`,
        `user:${userId}:*` // Pattern pour autres caches utilisateur
      ];

      await Promise.all(
        cacheKeys.map(key => 
          key.includes('*') 
            ? this.redis.cleanup(key)
            : this.redis.del(key)
        )
      );

      this.logger.logCacheEvent('del', `user:${userId}:*`);
    } catch (error) {
      this.logger.logErrorEvent(
        error, 
        'ProfilesService.invalidateUserCaches', 
        JSON.stringify({ userId })
      );
      // Ne pas faire échouer l'opération principale pour un problème de cache
    }
  }
}