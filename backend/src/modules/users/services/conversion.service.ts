// src/modules/users/services/conversion.service.ts

import { 
  Injectable, 
  NotFoundException, 
  BadRequestException, 
  ConflictException 
} from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { EmailService } from '../../../shared/email/email.service';
import { BullmqService } from '../../../shared/bullmq/bullmq.service';
import { users, user_profiles } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { 
  ConversionData,
  ConversionResult,
  OnboardingKeyValidation,
  ConversionStats,
  DateRange,
  OnboardingKeyData
} from '../interfaces/anonymous.interface';
import { IncentiveType } from '../types/enums';

/**
 * Service pour la conversion d'utilisateurs anonymes vers enregistrés
 * Gère l'onboarding intelligent via clés secrètes sur tickets/abonnements physiques
 */
@Injectable()
export class ConversionService {
  private readonly logger: LoggerService;
  private readonly ONBOARDING_PREFIX = 'onboarding:';
  private readonly CACHE_TTL = 3600; // 1 heure

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly email: EmailService,
    private readonly bullmq: BullmqService,
    logger: LoggerService,
  ) {
    this.logger = logger.createChildLogger('ConversionService');
  }

  /**
   * Valide une clé d'onboarding en cherchant dans les métadonnées des commandes
   */
  async validateOnboardingKey(key: string): Promise<OnboardingKeyValidation> {
    const operationId = this.logger.startOperation('validateOnboardingKey', { key });

    try {
      this.logger.info('Validating onboarding key', JSON.stringify({ key }));

      // Vérifier d'abord le cache Redis
      const cacheKey = `${this.ONBOARDING_PREFIX}${key}`;
      const cached = await this.redis.getCache<OnboardingKeyValidation>(cacheKey);
      if (cached) {
        this.logger.logCacheEvent('hit', cacheKey);
        this.logger.endOperation('validateOnboardingKey', operationId, true);
        return cached;
      }

      this.logger.logCacheEvent('miss', cacheKey);

      // Chercher dans les commandes anonymes (c'est là que sont guest_email/guest_phone)
      const order = await this.prisma.orders.findFirst({
        where: {
          user_id: null, // Commande anonyme
          metadata: {
            path: ['onboarding', 'secret_key'],
            equals: key,
          },
        },
        select: {
          id: true,
          guest_email: true,
          guest_phone: true,
          guest_name: true,
          metadata: true,
          created_at: true,
        },
      });

      if (!order) {
        const result: OnboardingKeyValidation = {
          isValid: false,
          isExpired: false,
          isUsed: false,
          errors: ['Clé d\'onboarding non trouvée ou invalide'],
        };
        
        await this.redis.setCache(cacheKey, result, this.CACHE_TTL);
        this.logger.endOperation('validateOnboardingKey', operationId, false);
        return result;
      }

      // Extraire les données d'onboarding depuis metadata (avec cast approprié)
      const metadata = order.metadata as any;
      const onboardingData = metadata?.onboarding;
      
      if (!onboardingData) {
        const result: OnboardingKeyValidation = {
          isValid: false,
          isExpired: false,
          isUsed: false,
          errors: ['Données d\'onboarding manquantes'],
        };
        
        await this.redis.setCache(cacheKey, result, this.CACHE_TTL);
        this.logger.endOperation('validateOnboardingKey', operationId, false);
        return result;
      }

      // Vérifier si déjà utilisée
      if (onboardingData.used === true) {
        const result: OnboardingKeyValidation = {
          isValid: false,
          isExpired: false,
          isUsed: true,
          errors: ['Clé d\'onboarding déjà utilisée'],
        };
        
        await this.redis.setCache(cacheKey, result, this.CACHE_TTL);
        this.logger.endOperation('validateOnboardingKey', operationId, false);
        return result;
      }

      // Vérifier expiration
      const expiresAt = onboardingData.expires_at ? 
        new Date(onboardingData.expires_at) : null;
      const isExpired = expiresAt && expiresAt < new Date();

      if (isExpired) {
        const result: OnboardingKeyValidation = {
          isValid: false,
          isExpired: true,
          isUsed: false,
          errors: ['Clé d\'onboarding expirée'],
        };
        
        await this.redis.setCache(cacheKey, result, this.CACHE_TTL);
        this.logger.endOperation('validateOnboardingKey', operationId, false);
        return result;
      }

      // Clé valide
      const result: OnboardingKeyValidation = {
        isValid: true,
        isExpired: false,
        isUsed: false,
        incentiveDetails: {
          type: onboardingData.incentive_type as IncentiveType,
          value: onboardingData.incentive_value || 0,
          description: onboardingData.incentive_description || '',
        },
      };

      // Mettre en cache
      await this.redis.setCache(cacheKey, result, this.CACHE_TTL);
      this.logger.logCacheEvent('set', cacheKey, this.CACHE_TTL);
      
      this.logger.endOperation('validateOnboardingKey', operationId, true);
      return result;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error, 
        'ConversionService.validateOnboardingKey', 
        undefined,
        JSON.stringify({ key })
      );
      this.logger.endOperation('validateOnboardingKey', operationId, false);
      throw new BadRequestException('Erreur lors de la validation de la clé d\'onboarding');
    }
  }

  /**
   * Convertit un utilisateur anonyme vers un utilisateur enregistré
   */
  async convertToRegistered(conversionData: ConversionData): Promise<ConversionResult> {
    const operationId = this.logger.startOperation('convertToRegistered', {
      onboardingKey: conversionData.onboardingKey,
      email: conversionData.userData.email,
    });

    try {
      this.logger.info('Starting anonymous user conversion', JSON.stringify({
        onboardingKey: conversionData.onboardingKey,
        email: conversionData.userData.email,
        firstName: conversionData.userData.firstName,
        lastName: conversionData.userData.lastName,
      }));

      // 1. Valider la clé d'onboarding
      const keyValidation = await this.validateOnboardingKey(conversionData.onboardingKey);
      
      if (!keyValidation.isValid) {
        const result: ConversionResult = {
          success: false,
          incentiveApplied: false,
          errors: keyValidation.errors,
        };
        
        this.logger.endOperation('convertToRegistered', operationId, false);
        return result;
      }

      // 2. Vérifier que l'email n'existe pas déjà
      const existingUser = await this.prisma.users.findUnique({
        where: { email: conversionData.userData.email },
      });

      if (existingUser) {
        const result: ConversionResult = {
          success: false,
          incentiveApplied: false,
          errors: ['Un compte avec cet email existe déjà'],
        };
        
        this.logger.endOperation('convertToRegistered', operationId, false);
        return result;
      }

      // 3. Trouver la commande source pour récupérer les informations guest
      const sourceOrder = await this.prisma.orders.findFirst({
        where: {
          user_id: null,
          metadata: {
            path: ['onboarding', 'secret_key'],
            equals: conversionData.onboardingKey,
          },
        },
        select: {
          id: true,
          guest_email: true,
          guest_phone: true,
          guest_name: true,
          metadata: true,
        },
      });

      if (!sourceOrder) {
        throw new NotFoundException('Commande source introuvable');
      }

      // 4. Vérifier que l'email correspond
      if (sourceOrder.guest_email && 
          sourceOrder.guest_email.toLowerCase() !== conversionData.userData.email.toLowerCase()) {
        const result: ConversionResult = {
          success: false,
          incentiveApplied: false,
          errors: ['L\'email ne correspond pas à celui utilisé lors de l\'achat anonyme'],
        };
        
        this.logger.endOperation('convertToRegistered', operationId, false);
        return result;
      }

      // 5. Créer l'utilisateur dans une transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(conversionData.userData.password, 12);

        // Créer l'utilisateur
        const newUser = await tx.users.create({
          data: {
            email: conversionData.userData.email,
            first_name: conversionData.userData.firstName,
            last_name: conversionData.userData.lastName,
            phone: conversionData.userData.phone,
            password: hashedPassword,
            email_verified: null, // DateTime? dans le schema
            is_active: true,
          },
        });

        // Créer le profil utilisateur si des données profile sont fournies
        let userProfile = null;
        if (conversionData.profileData) {
          userProfile = await tx.user_profiles.create({
            data: {
              user_id: newUser.id,
              city: conversionData.profileData.city,
              country: conversionData.profileData.country,
              language: conversionData.profileData.language || 'fr-TN',
              date_of_birth: conversionData.profileData.dateOfBirth,
              //gender: conversionData.profileData.gender,
              //marketing_consent: conversionData.marketingConsent || false,
            },
          });
        }

        // Migrer les commandes anonymes vers l'utilisateur
        const ordersUpdate = await tx.orders.updateMany({
          where: {
            user_id: null,
            guest_email: sourceOrder.guest_email,
          },
          data: {
            user_id: newUser.id,
          },
        });

        // Migrer les tickets via les order_items de ces commandes
        const orderItems = await tx.order_items.findMany({
          where: {
            orders: {
              user_id: newUser.id,
              guest_email: sourceOrder.guest_email,
            },
          },
          select: { ticket_type_id: true },
        });

        const ticketTypeIds = orderItems
          .filter(item => item.ticket_type_id)
          .map(item => item.ticket_type_id!);

        let ticketsUpdate = { count: 0 };
        if (ticketTypeIds.length > 0) {
          ticketsUpdate = await tx.tickets.updateMany({
            where: {
              user_id: null,
              ticket_type_id: {
                in: ticketTypeIds,
              },
            },
            data: {
              user_id: newUser.id,
            },
          });
        }

        // Migrer les abonnements anonymes via les order_items
        // Les abonnements sont liés aux commandes via les order_items (subscription_plan_id)
        const orderItemsWithSubscriptions = await tx.order_items.findMany({
          where: {
            orders: {
              user_id: newUser.id, // Commandes déjà migrées
              guest_email: sourceOrder.guest_email,
            },
            subscription_plan_id: { not: null },
          },
          select: { subscription_plan_id: true },
        });

        const subscriptionPlanIds = orderItemsWithSubscriptions
          .filter(item => item.subscription_plan_id)
          .map(item => item.subscription_plan_id!);

        let subscriptionsUpdate = { count: 0 };
        if (subscriptionPlanIds.length > 0) {
          // Migrer les abonnements anonymes basés sur les plans achetés
          subscriptionsUpdate = await tx.subscriptions.updateMany({
            where: {
              user_id: null, // Abonnements anonymes
              plan_id: {
                in: subscriptionPlanIds,
              },
            },
            data: {
              user_id: newUser.id,
            },
          });
        }

        // Marquer la clé d'onboarding comme utilisée
        const currentMetadata = sourceOrder.metadata as Record<string, any> || {};
        const currentOnboarding = currentMetadata.onboarding || {};
        
        await tx.orders.update({
          where: { id: sourceOrder.id },
          data: {
            metadata: {
              ...currentMetadata,
              onboarding: {
                ...currentOnboarding,
                used: true,
                used_at: new Date().toISOString(),
                converted_user_id: newUser.id,
              },
            },
          },
        });

        return {
          user: newUser,
          profile: userProfile,
          ordersConverted: ordersUpdate.count,
          ticketsMigrated: ticketsUpdate.count,
          subscriptionsMigrated: subscriptionsUpdate.count,
        };
      });

      // 6. Appliquer l'incentive si défini
      let incentiveApplied = false;
      if (keyValidation.incentiveDetails && keyValidation.incentiveDetails.value > 0) {
        try {
          await this.applyIncentive(
            result.user.id,
            keyValidation.incentiveDetails.type,
            keyValidation.incentiveDetails.value,
            keyValidation.incentiveDetails.description
          );
          incentiveApplied = true;
        } catch (error) {
          this.logger.logErrorEvent(
            error as Error,
            'ConversionService.applyIncentive',
            result.user.id,
            JSON.stringify({
              incentiveType: keyValidation.incentiveDetails.type,
              incentiveValue: keyValidation.incentiveDetails.value,
            })
          );
        }
      }

      // 7. Envoyer emails et notifications asynchrones
      await this.bullmq.addJob('EMAIL_QUEUE', 'CONVERSION_SUCCESS', {
        userId: result.user.id,
        email: result.user.email,
        firstName: result.user.first_name,
        lastName: result.user.last_name,
        incentiveApplied,
        incentiveDetails: keyValidation.incentiveDetails,
        migrationSummary: {
          ticketsMigrated: result.ticketsMigrated,
          subscriptionsMigrated: result.subscriptionsMigrated,
          ordersMigrated: result.ordersConverted,
        },
      });

      // Invalider le cache de la clé d'onboarding
      const cacheKey = `${this.ONBOARDING_PREFIX}${conversionData.onboardingKey}`;
      await this.redis.del(cacheKey);

      // 8. Logger l'événement business
      this.logger.logBusinessEvent('ANONYMOUS_CONVERTED', {
        userId: result.user.id,
        email: result.user.email,
        onboardingKey: conversionData.onboardingKey,
        incentiveApplied,
        incentiveType: keyValidation.incentiveDetails?.type,
        ordersConverted: result.ordersConverted,
        ticketsMigrated: result.ticketsMigrated,
        subscriptionsMigrated: result.subscriptionsMigrated,
      }, result.user.id);

      const conversionResult: ConversionResult = {
        success: true,
        user: result.user,
        incentiveApplied,
        incentiveDetails: keyValidation.incentiveDetails,
        migrationSummary: {
          ticketsMigrated: result.ticketsMigrated,
          subscriptionsMigrated: result.subscriptionsMigrated,
          ordersMigrated: result.ordersConverted,
        },
      };

      this.logger.endOperation('convertToRegistered', operationId, true);
      return conversionResult;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error, 
        'ConversionService.convertToRegistered', 
        undefined,
        JSON.stringify({
          onboardingKey: conversionData.onboardingKey,
          email: conversionData.userData.email,
        })
      );
      this.logger.endOperation('convertToRegistered', operationId, false);
      throw new BadRequestException('Erreur lors de la conversion de l\'utilisateur');
    }
  }

  /**
   * Génère une clé d'onboarding pour un achat anonyme
   */
  async generateOnboardingKey(data: OnboardingKeyData): Promise<string> {
    try {
      this.logger.info('Generating onboarding key', JSON.stringify({
        incentiveType: data.incentiveType,
        incentiveValue: data.incentiveValue,
        expiresInHours: data.expiresInHours,
      }));

      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const typePrefix = data.incentiveType ? 
        data.incentiveType.substring(0, 3).toUpperCase() : 'ONB';
      
      const key = `${typePrefix}_${timestamp}_${random}`;

      this.logger.info('Generated onboarding key', JSON.stringify({ key }));
      return key;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'ConversionService.generateOnboardingKey',
        undefined,
        JSON.stringify(data)
      );
      throw new BadRequestException('Erreur lors de la génération de la clé d\'onboarding');
    }
  }

  /**
   * Applique un incentive à un utilisateur
   */
  private async applyIncentive(
    userId: string, 
    incentiveType: IncentiveType, 
    value: number,
    description: string
  ): Promise<void> {
    try {
      switch (incentiveType) {
        case IncentiveType.BONUS_POINTS:
          // Ajouter des points de fidélité (à implémenter selon le système de points)
          await this.bullmq.addJob('LOYALTY_QUEUE', 'ADD_BONUS_POINTS', {
            userId,
            points: value,
            source: 'ONBOARDING_CONVERSION',
            description,
          });
          break;

        case IncentiveType.DISCOUNT_NEXT:
          // Créer un coupon de réduction (à implémenter selon le système de coupons)
          await this.bullmq.addJob('COUPON_QUEUE', 'CREATE_DISCOUNT_COUPON', {
            userId,
            discountAmount: value,
            source: 'ONBOARDING_CONVERSION',
            description,
            expiresIn: 30, // 30 jours
          });
          break;

        case IncentiveType.FREE_UPGRADE:
          // Marquer l'utilisateur pour un surclassement gratuit
          await this.bullmq.addJob('USER_QUEUE', 'GRANT_FREE_UPGRADE', {
            userId,
            upgradeValue: value,
            source: 'ONBOARDING_CONVERSION',
            description,
          });
          break;

        case IncentiveType.EXCLUSIVE_ACCESS:
          // Donner accès aux ventes privées
          await this.bullmq.addJob('USER_QUEUE', 'GRANT_EXCLUSIVE_ACCESS', {
            userId,
            accessLevel: value,
            source: 'ONBOARDING_CONVERSION',
            description,
          });
          break;

        case IncentiveType.GIFT_VOUCHER:
          // Créer un bon d'achat
          await this.bullmq.addJob('VOUCHER_QUEUE', 'CREATE_GIFT_VOUCHER', {
            userId,
            voucherAmount: value,
            source: 'ONBOARDING_CONVERSION',
            description,
          });
          break;

        default:
          this.logger.warn('Unknown incentive type', JSON.stringify({ 
            incentiveType, 
            userId 
          }));
      }

      this.logger.logBusinessEvent('INCENTIVE_APPLIED', {
        userId,
        incentiveType,
        value,
        description,
        source: 'ONBOARDING_CONVERSION',
      }, userId);

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'ConversionService.applyIncentive',
        userId,
        JSON.stringify({ incentiveType, value, description })
      );
      throw error;
    }
  }

  /**
   * Récupère les statistiques de conversion sur une période donnée
   */
  async getConversionStats(period?: DateRange): Promise<ConversionStats> {
    const operationId = this.logger.startOperation('getConversionStats', period);

    try {
      const startDate = period?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = period?.to || new Date();

      // Compter les commandes anonymes avec clés d'onboarding
      const totalAnonymousWithKeys = await this.prisma.orders.count({
        where: {
          user_id: null,
          created_at: {
            gte: startDate,
            lte: endDate,
          },
          metadata: {
            path: ['onboarding', 'secret_key'],
            not: null,
          },
        },
      });

      // Compter les conversions réussies
      const totalConverted = await this.prisma.orders.count({
        where: {
          user_id: null,
          created_at: {
            gte: startDate,
            lte: endDate,
          },
          metadata: {
            path: ['onboarding', 'used'],
            equals: true,
          },
        },
      });

      const conversionRate = totalAnonymousWithKeys > 0 ? 
        (totalConverted / totalAnonymousWithKeys) * 100 : 0;

      const stats: ConversionStats = {
        totalAnonymous: totalAnonymousWithKeys,
        totalConverted,
        conversionRate,
        averageConversionTime: 0, // TODO: Calculer depuis les métadonnées
        conversionsByIncentive: [], // TODO: Grouper par type d'incentive
        conversionTrend: [], // TODO: Données par jour/semaine
        topIncentives: [], // TODO: Incentives les plus efficaces
      };

      this.logger.endOperation('getConversionStats', operationId, true);
      return stats;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error, 
        'ConversionService.getConversionStats', 
        undefined,
        JSON.stringify(period)
      );
      this.logger.endOperation('getConversionStats', operationId, false);
      throw new BadRequestException('Erreur lors de la récupération des statistiques');
    }
  }
}