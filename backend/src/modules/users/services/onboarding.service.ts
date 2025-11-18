// src/modules/users/services/onboarding.service.ts

import { 
  Injectable, 
  NotFoundException, 
  BadRequestException, 
  ConflictException,
  InternalServerErrorException 
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { EmailService } from '../../../shared/email/email.service';
import { BullmqService } from '../../../shared/bullmq/bullmq.service';

// Types et interfaces
interface OnboardingKeyValidation {
  isValid: boolean;
  isExpired: boolean;
  isUsed: boolean;
  keyData?: OnboardingKeyData;
  sourceType?: 'TICKET' | 'SUBSCRIPTION';
  sourceId?: string;
  guestInfo?: {
    name: string;
    email: string;
    phone?: string;
  };
  incentive?: {
    type: string;
    value: number;
    description: string;
  };
  expiresAt?: Date;
  error?: string;
}

interface OnboardingKeyData {
  secretKey: string;
  campaignId: string;
  incentiveType: string;
  incentiveValue: number;
  description: string;
  expiresAt: string;
  used: boolean;
  contactMethod: string;
  communicationSent: boolean;
  createdAt: string;
}

interface ConversionData {
  secretKey: string;
  userData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
    marketingConsent?: boolean;
  };
  profileData?: {
    dateOfBirth?: string;
    city?: string;
    country?: string;
    language?: string;
    preferences?: Record<string, any>;
  };
}

interface ConversionResult {
  success: boolean;
  userId?: string;
  migratedItems?: {
    tickets: number;
    subscriptions: number;
  };
  incentiveApplied?: {
    type: string;
    value: number;
  };
  error?: string;
}

interface OnboardingCampaign {
  id: string;
  name: string;
  incentiveType: string;
  incentiveValue: number;
  description: string;
  isActive: boolean;
  validFrom: Date;
  validUntil: Date;
  targetAudience?: Record<string, any>;
}

interface OnboardingStats {
  totalKeysGenerated: number;
  totalKeysUsed: number;
  conversionRate: number;
  averageConversionTime: number; // en heures
  topIncentiveTypes: Array<{
    type: string;
    count: number;
    conversionRate: number;
  }>;
  campaignPerformance: Array<{
    campaignId: string;
    keysGenerated: number;
    keysUsed: number;
    conversionRate: number;
  }>;
  dateRange: {
    from: Date;
    to: Date;
  };
}

/**
 * Service pour la gestion de l'onboarding intelligent via clés secrètes
 * Permet la conversion d'achats anonymes vers des comptes utilisateur avec incentives
 */
@Injectable()
export class OnboardingService {
  private readonly logger: LoggerService;
  private readonly CACHE_PREFIX = 'onboarding:';
  private readonly CACHE_TTL = 3600; // 1 heure

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly email: EmailService,
    private readonly bullmq: BullmqService,
    logger: LoggerService,
  ) {
    this.logger = logger.createChildLogger('OnboardingService');
  }

  /**
   * Génère une clé d'onboarding unique pour un ticket ou abonnement anonyme
   */
  async generateOnboardingKey(
    sourceType: 'TICKET' | 'SUBSCRIPTION',
    sourceId: string,
    campaignId: string,
    incentiveType: string,
    incentiveValue: number,
    description: string,
    expiresAt?: Date
  ): Promise<string> {
    const operationId = this.logger.startOperation('generateOnboardingKey', { 
      sourceType, 
      sourceId, 
      campaignId 
    });

    try {
      this.logger.info('Generating onboarding key', JSON.stringify({
        sourceType,
        sourceId,
        campaignId,
        incentiveType,
        incentiveValue
      }));

      // Générer clé unique
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 10);
      const secretKey = `ONB_${timestamp}_${random}`.toUpperCase();

      // Données d'onboarding
      const onboardingData: OnboardingKeyData = {
        secretKey,
        campaignId,
        incentiveType,
        incentiveValue,
        description,
        expiresAt: (expiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)).toISOString(),
        used: false,
        contactMethod: 'email',
        communicationSent: false,
        createdAt: new Date().toISOString()
      };

      // Mettre à jour les metadata du ticket ou abonnement
      if (sourceType === 'TICKET') {
        await this.prisma.tickets.update({
          where: { id: sourceId },
          data: {
            metadata: {
              onboarding: onboardingData as Record<string, any>
            }
          }
        });
      } else if (sourceType === 'SUBSCRIPTION') {
        await this.prisma.subscriptions.update({
          where: { id: sourceId },
          data: {
            metadata: {
              onboarding: onboardingData as Record<string, any>
            }
          }
        });
      }

      // Cache pour accès rapide
      const cacheKey = `${this.CACHE_PREFIX}${secretKey}`;
      await this.redis.setCache(cacheKey, {
        sourceType,
        sourceId,
        ...onboardingData
      }, this.CACHE_TTL);

      this.logger.logBusinessEvent('ONBOARDING_KEY_GENERATED', {
        secretKey,
        sourceType,
        sourceId,
        campaignId,
        incentiveType,
        incentiveValue
      });

      this.logger.endOperation('generateOnboardingKey', operationId, true);
      return secretKey;

    } catch (error) {
      this.logger.logErrorEvent(error, 'OnboardingService.generateOnboardingKey', JSON.stringify({
        sourceType,
        sourceId,
        campaignId
      }));
      this.logger.endOperation('generateOnboardingKey', operationId, false);
      throw new InternalServerErrorException('Failed to generate onboarding key');
    }
  }

  /**
   * Valide une clé d'onboarding
   */
  async validateOnboardingKey(secretKey: string): Promise<OnboardingKeyValidation> {
    const operationId = this.logger.startOperation('validateOnboardingKey', { secretKey });

    try {
      this.logger.info('Validating onboarding key', JSON.stringify({ secretKey }));

      // Vérifier cache d'abord
      const cacheKey = `${this.CACHE_PREFIX}${secretKey}`;
      const cached = await this.redis.getCache<any>(cacheKey);
      
      if (cached) {
        this.logger.logCacheEvent('hit', cacheKey);
        
        // Valider expiration et utilisation depuis le cache
        const now = new Date();
        const expiresAt = new Date(cached.expiresAt);
        
        const result: OnboardingKeyValidation = {
          isValid: !cached.used && now < expiresAt,
          isExpired: now >= expiresAt,
          isUsed: cached.used,
          keyData: cached,
          sourceType: cached.sourceType,
          sourceId: cached.sourceId
        };

        this.logger.endOperation('validateOnboardingKey', operationId, true);
        return result;
      }

      this.logger.logCacheEvent('miss', cacheKey);

      // Chercher dans les tickets
      const ticket = await this.prisma.tickets.findFirst({
        where: {
          metadata: {
            path: ['onboarding', 'secretKey'],
            equals: secretKey
          }
        },
        include: {
          events: {
            select: {
              name: true,
              scheduled_start: true
            }
          }
        }
      });

      if (ticket) {
        const onboardingData = (ticket.metadata as any)?.onboarding as OnboardingKeyData;
        if (onboardingData) {
          // Récupérer infos guest depuis order via ticket_type et event
          const order = await this.prisma.orders.findFirst({
            where: {
              order_items: {
                some: {
                  ticket_type_id: ticket.ticket_type_id,
                  event_id: ticket.event_id
                }
              }
            },
            select: {
              guest_name: true,
              guest_email: true,
              guest_phone: true
            }
          });

          const now = new Date();
          const expiresAt = new Date(onboardingData.expiresAt);

          const result: OnboardingKeyValidation = {
            isValid: !onboardingData.used && now < expiresAt,
            isExpired: now >= expiresAt,
            isUsed: onboardingData.used,
            keyData: onboardingData,
            sourceType: 'TICKET',
            sourceId: ticket.id,
            guestInfo: order ? {
              name: order.guest_name || '',
              email: order.guest_email || '',
              phone: order.guest_phone || undefined
            } : undefined,
            incentive: {
              type: onboardingData.incentiveType,
              value: onboardingData.incentiveValue,
              description: onboardingData.description
            },
            expiresAt
          };

          // Mettre en cache
          await this.redis.setCache(cacheKey, {
            sourceType: 'TICKET',
            sourceId: ticket.id,
            ...onboardingData
          }, this.CACHE_TTL);

          this.logger.endOperation('validateOnboardingKey', operationId, true);
          return result;
        }
      }

      // Chercher dans les subscriptions
      const subscription = await this.prisma.subscriptions.findFirst({
        where: {
          metadata: {
            path: ['onboarding', 'secretKey'],
            equals: secretKey
          }
        },
        include: {
          subscription_plans: {
            select: {
              name: true,
              description: true
            }
          }
        }
      });

      if (subscription) {
        const onboardingData = (subscription.metadata as any)?.onboarding as OnboardingKeyData;
        if (onboardingData) {
          // Récupérer infos guest depuis order via subscription_plan
          const order = await this.prisma.orders.findFirst({
            where: {
              order_items: {
                some: {
                  subscription_plan_id: subscription.plan_id
                }
              }
            },
            select: {
              guest_name: true,
              guest_email: true,
              guest_phone: true
            }
          });

          const now = new Date();
          const expiresAt = new Date(onboardingData.expiresAt);

          const result: OnboardingKeyValidation = {
            isValid: !onboardingData.used && now < expiresAt,
            isExpired: now >= expiresAt,
            isUsed: onboardingData.used,
            keyData: onboardingData,
            sourceType: 'SUBSCRIPTION',
            sourceId: subscription.id,
            guestInfo: order ? {
              name: order.guest_name || '',
              email: order.guest_email || '',
              phone: order.guest_phone || undefined
            } : undefined,
            incentive: {
              type: onboardingData.incentiveType,
              value: onboardingData.incentiveValue,
              description: onboardingData.description
            },
            expiresAt
          };

          // Mettre en cache
          await this.redis.setCache(cacheKey, {
            sourceType: 'SUBSCRIPTION',
            sourceId: subscription.id,
            ...onboardingData
          }, this.CACHE_TTL);

          this.logger.endOperation('validateOnboardingKey', operationId, true);
          return result;
        }
      }

      // Clé non trouvée
      const result: OnboardingKeyValidation = {
        isValid: false,
        isExpired: false,
        isUsed: false,
        error: 'Clé d\'onboarding non trouvée'
      };

      this.logger.endOperation('validateOnboardingKey', operationId, false);
      return result;

    } catch (error) {
      this.logger.logErrorEvent(error, 'OnboardingService.validateOnboardingKey', JSON.stringify({
        secretKey
      }));
      this.logger.endOperation('validateOnboardingKey', operationId, false);
      throw new InternalServerErrorException('Failed to validate onboarding key');
    }
  }

  /**
   * Convertit un utilisateur anonyme en utilisateur enregistré via clé d'onboarding
   */
  async convertAnonymousUser(conversionData: ConversionData): Promise<ConversionResult> {
    const operationId = this.logger.startOperation('convertAnonymousUser', { 
      secretKey: conversionData.secretKey,
      email: conversionData.userData.email 
    });

    // Acquérir un verrou pour éviter les conversions multiples
    const lockKey = `conversion:${conversionData.secretKey}`;
    const lockAcquired = await this.redis.acquireLock(lockKey, 30);
    
    if (!lockAcquired) {
      throw new ConflictException('Conversion déjà en cours pour cette clé');
    }

    try {
      this.logger.info('Converting anonymous user', JSON.stringify({
        secretKey: conversionData.secretKey,
        email: conversionData.userData.email
      }));

      // Valider la clé d'onboarding
      const keyValidation = await this.validateOnboardingKey(conversionData.secretKey);
      
      if (!keyValidation.isValid) {
        throw new BadRequestException(
          keyValidation.error || 'Clé d\'onboarding invalide ou expirée'
        );
      }

      // Vérifier que l'email n'existe pas déjà
      const existingUser = await this.prisma.users.findUnique({
        where: { email: conversionData.userData.email }
      });

      if (existingUser) {
        throw new ConflictException('Un compte existe déjà avec cet email');
      }

      // Effectuer la conversion dans une transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Créer l'utilisateur
        const newUser = await tx.users.create({
          data: {
            email: conversionData.userData.email,
            first_name: conversionData.userData.firstName,
            last_name: conversionData.userData.lastName,
            phone: conversionData.userData.phone,
            password: conversionData.userData.password, // Champ correct selon schema
            email_verified: true, 
            is_active: true
          }
        });

        // Créer le profil utilisateur si données fournies
        if (conversionData.profileData) {
          await tx.user_profiles.create({
            data: {
              user_id: newUser.id,
              date_of_birth: conversionData.profileData.dateOfBirth ? 
                new Date(conversionData.profileData.dateOfBirth) : null,
              city: conversionData.profileData.city,
              country: conversionData.profileData.country || 'TN',
              language: conversionData.profileData.language || 'fr-TN',
              preferences: conversionData.profileData.preferences || null,
            }
          });
        }

        let migratedTickets = 0;
        let migratedSubscriptions = 0;

        // Migrer les tickets/subscriptions vers le nouvel utilisateur
        if (keyValidation.sourceType === 'TICKET' && keyValidation.sourceId) {
          const updatedOnboarding = keyValidation.keyData ? 
            { ...keyValidation.keyData, used: true } : { used: true };
          
          await tx.tickets.update({
            where: { id: keyValidation.sourceId },
            data: {
              user_id: newUser.id,
              metadata: {
                onboarding: updatedOnboarding as Record<string, any>
              }
            }
          });
          migratedTickets = 1;

          // Migrer tous les access_rights liés au ticket
          await tx.access_rights.updateMany({
            where: { ticket_id: keyValidation.sourceId },
            data: { user_id: newUser.id }
          });

        } else if (keyValidation.sourceType === 'SUBSCRIPTION' && keyValidation.sourceId) {
          const updatedOnboarding = keyValidation.keyData ? 
            { ...keyValidation.keyData, used: true } : { used: true };
            
          await tx.subscriptions.update({
            where: { id: keyValidation.sourceId },
            data: {
              user_id: newUser.id,
              metadata: {
                onboarding: updatedOnboarding as Record<string, any>
              }
            }
          });
          migratedSubscriptions = 1;

          // Migrer tous les access_rights liés à l'abonnement
          await tx.access_rights.updateMany({
            where: { subscription_id: keyValidation.sourceId },
            data: { user_id: newUser.id }
          });
        }

        return {
          user: newUser,
          migratedTickets,
          migratedSubscriptions
        };
      });

      // Appliquer l'incentive après la transaction
      let incentiveApplied;
      if (keyValidation.incentive) {
        incentiveApplied = await this.applyIncentive(
          result.user.id,
          keyValidation.incentive.type,
          keyValidation.incentive.value,
          conversionData.secretKey
        );
      }

      // Invalider le cache
      const cacheKey = `${this.CACHE_PREFIX}${conversionData.secretKey}`;
      await this.redis.delCache(cacheKey);

      // Programmer l'envoi d'email de bienvenue (asynchrone)
      await this.bullmq.addJob('email', 'send-onboarding-welcome', {
        userId: result.user.id,
        email: result.user.email,
        firstName: result.user.first_name,
        incentive: keyValidation.incentive
      });

      // Logger l'événement business
      this.logger.logBusinessEvent('ANONYMOUS_USER_CONVERTED', {
        userId: result.user.id,
        email: result.user.email,
        secretKey: conversionData.secretKey,
        sourceType: keyValidation.sourceType,
        sourceId: keyValidation.sourceId,
        incentiveType: keyValidation.incentive?.type,
        incentiveValue: keyValidation.incentive?.value,
        migratedTickets: result.migratedTickets,
        migratedSubscriptions: result.migratedSubscriptions
      });

      const conversionResult: ConversionResult = {
        success: true,
        userId: result.user.id,
        migratedItems: {
          tickets: result.migratedTickets,
          subscriptions: result.migratedSubscriptions
        },
        incentiveApplied
      };

      this.logger.endOperation('convertAnonymousUser', operationId, true);
      return conversionResult;

    } catch (error) {
      this.logger.logErrorEvent(error, 'OnboardingService.convertAnonymousUser', JSON.stringify({
        secretKey: conversionData.secretKey,
        email: conversionData.userData.email
      }));
      this.logger.endOperation('convertAnonymousUser', operationId, false);
      
      if (error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to convert anonymous user');
    } finally {
      // Libérer le verrou
      await this.redis.releaseLock(lockKey);
    }
  }

  /**
   * Applique un incentive à un utilisateur nouvellement converti
   */
  private async applyIncentive(
    userId: string,
    incentiveType: string,
    incentiveValue: number,
    secretKey: string
  ): Promise<{ type: string; value: number }> {
    try {
      this.logger.info('Applying incentive', JSON.stringify({
        userId,
        incentiveType,
        incentiveValue
      }));

      switch (incentiveType) {
        case 'BONUS_POINTS':
          // Ajouter des points de fidélité (nécessiterait une table loyalty_points)
          // Pour l'instant, on simule avec des métadonnées utilisateur
          await this.prisma.users.update({
            where: { id: userId },
            data: {
              metadata: {
                loyaltyPoints: incentiveValue,
                source: 'onboarding_bonus',
                earnedAt: new Date().toISOString()
              } as Record<string, any>
            }
          });
          break;

        case 'DISCOUNT_NEXT':
          // Créer un coupon de réduction personnalisé
          // Simulation dans les métadonnées
          await this.prisma.users.update({
            where: { id: userId },
            data: {
              metadata: {
                discountCoupon: {
                  code: `WELCOME${userId.slice(-8).toUpperCase()}`,
                  value: incentiveValue,
                  type: 'percentage',
                  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                }
              } as Record<string, any>
            }
          });
          break;

        case 'FREE_UPGRADE':
          // Marquer l'utilisateur pour un upgrade gratuit
          await this.prisma.users.update({
            where: { id: userId },
            data: {
              metadata: {
                freeUpgrade: {
                  available: true,
                  value: incentiveValue,
                  expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
                }
              } as Record<string, any>
            }
          });
          break;

        default:
          this.logger.warn('Unknown incentive type', JSON.stringify({ incentiveType }));
      }

      this.logger.logBusinessEvent('INCENTIVE_APPLIED', {
        userId,
        incentiveType,
        incentiveValue,
        secretKey
      });

      return { type: incentiveType, value: incentiveValue };

    } catch (error) {
      this.logger.logErrorEvent(error, 'OnboardingService.applyIncentive', JSON.stringify({
        userId,
        incentiveType,
        incentiveValue
      }));
      throw error;
    }
  }

  /**
   * Génère les statistiques d'onboarding
   */
  async getOnboardingStats(
    startDate: Date,
    endDate: Date,
    organizerId?: string
  ): Promise<OnboardingStats> {
    const operationId = this.logger.startOperation('getOnboardingStats', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      organizerId
    });

    try {
      this.logger.info('Generating onboarding stats', JSON.stringify({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        organizerId
      }));

      // Construire les filtres de base
      const baseFilter: any = {
        created_at: {
          gte: startDate,
          lte: endDate
        }
      };

      if (organizerId) {
        baseFilter.organizer_id = organizerId;
      }

      // Compter les clés générées (tickets avec metadata onboarding)
      const ticketsWithOnboarding = await this.prisma.tickets.findMany({
        where: {
          ...baseFilter,
          metadata: {
            path: ['onboarding'],
            not: Prisma.AnyNull
          }
        },
        select: {
          metadata: true,
          created_at: true
        }
      });

      // Compter les abonnements avec onboarding
      const subscriptionsWithOnboarding = await this.prisma.subscriptions.findMany({
        where: {
          ...baseFilter,
          metadata: {
            path: ['onboarding'],
            not: Prisma.AnyNull
          }
        },
        select: {
          metadata: true,
          created_at: true
        }
      });

      const totalKeysGenerated = ticketsWithOnboarding.length + subscriptionsWithOnboarding.length;

      // Compter les clés utilisées
      const usedTickets = ticketsWithOnboarding.filter(t => 
        (t.metadata as any)?.onboarding?.used === true
      );
      const usedSubscriptions = subscriptionsWithOnboarding.filter(s => 
        (s.metadata as any)?.onboarding?.used === true
      );
      const totalKeysUsed = usedTickets.length + usedSubscriptions.length;

      // Calculer taux de conversion
      const conversionRate = totalKeysGenerated > 0 ? 
        (totalKeysUsed / totalKeysGenerated) * 100 : 0;

      // Analyser les types d'incentives
      const incentiveTypes = new Map<string, { count: number; used: number }>();
      
      [...ticketsWithOnboarding, ...subscriptionsWithOnboarding].forEach(item => {
        const onboarding = (item.metadata as any)?.onboarding;
        if (onboarding) {
          const type = onboarding.incentiveType || 'UNKNOWN';
          const current = incentiveTypes.get(type) || { count: 0, used: 0 };
          current.count++;
          if (onboarding.used) current.used++;
          incentiveTypes.set(type, current);
        }
      });

      const topIncentiveTypes = Array.from(incentiveTypes.entries()).map(([type, data]) => ({
        type,
        count: data.count,
        conversionRate: data.count > 0 ? (data.used / data.count) * 100 : 0
      })).sort((a, b) => b.count - a.count);

      // Analyser les campagnes
      const campaigns = new Map<string, { generated: number; used: number }>();
      
      [...ticketsWithOnboarding, ...subscriptionsWithOnboarding].forEach(item => {
        const onboarding = (item.metadata as any)?.onboarding;
        if (onboarding) {
          const campaignId = onboarding.campaignId || 'UNKNOWN';
          const current = campaigns.get(campaignId) || { generated: 0, used: 0 };
          current.generated++;
          if (onboarding.used) current.used++;
          campaigns.set(campaignId, current);
        }
      });

      const campaignPerformance = Array.from(campaigns.entries()).map(([campaignId, data]) => ({
        campaignId,
        keysGenerated: data.generated,
        keysUsed: data.used,
        conversionRate: data.generated > 0 ? (data.used / data.generated) * 100 : 0
      }));

      // Calculer temps moyen de conversion (approximatif)
      const conversionTimes: number[] = [];
      [...usedTickets, ...usedSubscriptions].forEach(item => {
        const onboarding = (item.metadata as any)?.onboarding;
        if (onboarding && onboarding.createdAt) {
          const created = new Date(onboarding.createdAt);
          const used = new Date(); // Approximation, il faudrait stocker la date d'utilisation
          const diffHours = (used.getTime() - created.getTime()) / (1000 * 60 * 60);
          if (diffHours > 0 && diffHours < 24 * 30) { // Filtrer les valeurs aberrantes
            conversionTimes.push(diffHours);
          }
        }
      });

      const averageConversionTime = conversionTimes.length > 0 ?
        conversionTimes.reduce((sum, time) => sum + time, 0) / conversionTimes.length : 0;

      const stats: OnboardingStats = {
        totalKeysGenerated,
        totalKeysUsed,
        conversionRate,
        averageConversionTime,
        topIncentiveTypes,
        campaignPerformance,
        dateRange: {
          from: startDate,
          to: endDate
        }
      };

      this.logger.logBusinessEvent('ONBOARDING_STATS_GENERATED', {
        organizerId,
        dateRange: { from: startDate.toISOString(), to: endDate.toISOString() },
        totalKeysGenerated,
        totalKeysUsed,
        conversionRate
      });

      this.logger.endOperation('getOnboardingStats', operationId, true);
      return stats;

    } catch (error) {
      this.logger.logErrorEvent(error, 'OnboardingService.getOnboardingStats', JSON.stringify({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        organizerId
      }));
      this.logger.endOperation('getOnboardingStats', operationId, false);
      throw new InternalServerErrorException('Failed to generate onboarding stats');
    }
  }

  /**
   * Envoie un rappel d'onboarding pour les clés non utilisées
   */
  async sendOnboardingReminder(secretKey: string): Promise<boolean> {
    const operationId = this.logger.startOperation('sendOnboardingReminder', { secretKey });

    try {
      const keyValidation = await this.validateOnboardingKey(secretKey);
      
      if (!keyValidation.isValid || keyValidation.isUsed || !keyValidation.guestInfo) {
        return false;
      }

      // Programmer l'envoi d'email de rappel
      await this.bullmq.addJob('email', 'send-onboarding-reminder', {
        email: keyValidation.guestInfo.email,
        name: keyValidation.guestInfo.name,
        secretKey,
        incentive: keyValidation.incentive,
        expiresAt: keyValidation.expiresAt
      });

      this.logger.logBusinessEvent('ONBOARDING_REMINDER_SENT', {
        secretKey,
        email: keyValidation.guestInfo.email,
        sourceType: keyValidation.sourceType,
        sourceId: keyValidation.sourceId
      });

      this.logger.endOperation('sendOnboardingReminder', operationId, true);
      return true;

    } catch (error) {
      this.logger.logErrorEvent(error, 'OnboardingService.sendOnboardingReminder', JSON.stringify({
        secretKey
      }));
      this.logger.endOperation('sendOnboardingReminder', operationId, false);
      return false;
    }
  }

  /**
   * Nettoie les clés d'onboarding expirées
   */
  async cleanupExpiredKeys(): Promise<number> {
    const operationId = this.logger.startOperation('cleanupExpiredKeys', {});

    try {
      const now = new Date();
      let cleanedCount = 0;

      // Nettoyer les tickets avec clés expirées
      const expiredTickets = await this.prisma.tickets.findMany({
        where: {
          metadata: {
            path: ['onboarding', 'expiresAt'],
            lt: now.toISOString()
          }
        },
        select: { id: true, metadata: true }
      });

      for (const ticket of expiredTickets) {
        const metadata = ticket.metadata as any;
        if (metadata?.onboarding && !metadata.onboarding.used) {
          // Marquer comme expiré plutôt que supprimer
          const updatedMetadata = {
            ...metadata,
            onboarding: {
              ...metadata.onboarding,
              expired: true
            }
          };
          await this.prisma.tickets.update({
            where: { id: ticket.id },
            data: { metadata: updatedMetadata as Record<string, any> }
          });
          cleanedCount++;
        }
      }

      // Nettoyer les abonnements avec clés expirées
      const expiredSubscriptions = await this.prisma.subscriptions.findMany({
        where: {
          metadata: {
            path: ['onboarding', 'expiresAt'],
            lt: now.toISOString()
          }
        },
        select: { id: true, metadata: true }
      });

      for (const subscription of expiredSubscriptions) {
        const metadata = subscription.metadata as any;
        if (metadata?.onboarding && !metadata.onboarding.used) {
          const updatedMetadata = {
            ...metadata,
            onboarding: {
              ...metadata.onboarding,
              expired: true
            }
          };
          await this.prisma.subscriptions.update({
            where: { id: subscription.id },
            data: { metadata: updatedMetadata as Record<string, any> }
          });
          cleanedCount++;
        }
      }

      // Nettoyer le cache Redis des clés expirées
      const cacheKeys = await this.redis.keys(`${this.CACHE_PREFIX}*`);
      for (const cacheKey of cacheKeys) {
        const cached = await this.redis.getCache<any>(cacheKey);
        if (cached && cached.expiresAt && new Date(cached.expiresAt) < now) {
          await this.redis.delCache(cacheKey);
        }
      }

      this.logger.logBusinessEvent('EXPIRED_ONBOARDING_KEYS_CLEANED', {
        cleanedCount,
        ticketsProcessed: expiredTickets.length,
        subscriptionsProcessed: expiredSubscriptions.length
      });

      this.logger.endOperation('cleanupExpiredKeys', operationId, true);
      return cleanedCount;

    } catch (error) {
      this.logger.logErrorEvent(error, 'OnboardingService.cleanupExpiredKeys', JSON.stringify({}));
      this.logger.endOperation('cleanupExpiredKeys', operationId, false);
      return 0;
    }
  }
}