// src/modules/subscription-sales/services/subscription-plans.service.ts

import { 
  Injectable, 
  NotFoundException 
} from '@nestjs/common';

// Services partagés
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RedisService } from '../../../shared/redis/redis.service';

/**
 * Service pour la gestion des plans d'abonnement disponibles
 * Étape 1 du flow de vente
 */
@Injectable()
export class SubscriptionPlansService {
  private readonly logger: LoggerService;
  private readonly CACHE_PREFIX = 'subscription-plans:';
  private readonly CACHE_TTL = 1800; // 30 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('SubscriptionPlansService');
  }

  /**
   * Récupère tous les plans d'abonnement disponibles à la vente
   */
  async getAvailablePlans(organizerId?: string) {
    const operationId = this.logger.startOperation('getAvailablePlans', { organizerId });

    try {
      // Vérifier cache
      const cacheKey = `${this.CACHE_PREFIX}available:${organizerId || 'all'}`;
      const cached = await this.redis.getCache<any>(cacheKey);
      
      if (cached) {
        this.logger.logCacheEvent('hit', cacheKey);
        this.logger.endOperation('getAvailablePlans', operationId, true);
        return cached;
      }

      // Construire les conditions de filtrage
      const where: any = {
        is_active: true,
        sale_start_date: { lte: new Date() },
        OR: [
          { sale_end_date: null },
          { sale_end_date: { gte: new Date() } }
        ]
      };

      if (organizerId) {
        where.organizer_id = organizerId;
      }

      // Récupérer les plans avec leurs relations
      const plans = await this.prisma.subscription_plans.findMany({
        where,
        include: {
          organizers: {
            select: {
              id: true,
              name: true,
              code: true,
            }
          },
          subscription_plan_zones: {
            where: { is_included: true },
            include: {
              venue_zones: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  capacity: true,
                  zone_type: true,
                  _count: {
                    select: {
                      seats: {
                        where: {
                          status: 'AVAILABLE'
                        }
                      }
                    }
                  }
                }
              }
            },
            orderBy: { priority_level: 'desc' }
          },
          subscription_plan_events: {
            where: { is_included: true },
            include: {
              events: {
                select: {
                  id: true,
                  name: true,
                  scheduled_start: true,
                  scheduled_end: true,
                }
              }
            },
            orderBy: { events: { scheduled_start: 'asc' } }
          }
        },
        orderBy: [
          { priority_booking: 'desc' },
          { price: 'asc' }
        ]
      });

      // Transformer les données pour l'API
      const result = plans.map(plan => ({
        id: plan.id,
        code: plan.code,
        name: plan.name,
        description: plan.description,
        type: plan.type,
        price: Number(plan.price),
        currency: plan.currency,
        maxSubscribers: plan.max_subscribers,
        currentSubscribers: plan.current_subscribers,
        availableSlots: plan.max_subscribers 
          ? plan.max_subscribers - plan.current_subscribers : null,
        validFrom: plan.valid_from,
        validUntil: plan.valid_until,
        saleStartDate: plan.sale_start_date,
        saleEndDate: plan.sale_end_date,
        transferable: plan.transferable,
        maxTransfers: plan.max_transfers,
        autoRenew: plan.auto_renew,
        includesPlayoffs: plan.includes_playoffs,
        priorityBooking: plan.priority_booking,
        benefits: plan.benefits,
        restrictions: plan.restrictions,
        organizer: {
          id: plan.organizers.id,
          name: plan.organizers.name,
          code: plan.organizers.code,
        },
        zones: plan.subscription_plan_zones.map(spz => ({
          id: spz.venue_zones.id,
          name: spz.venue_zones.name,
          code: spz.venue_zones.code,
          capacity: spz.venue_zones.capacity,
          hasSeats: spz.venue_zones._count.seats > 0,
          availableSeatsCount: spz.venue_zones._count.seats,
          zoneType: spz.venue_zones.zone_type,
          isIncluded: spz.is_included,
          priceOverride: spz.price_override ? Number(spz.price_override) : null,
          priorityLevel: spz.priority_level,
        })),
        includedEvents: plan.subscription_plan_events.map(spe => ({
          id: spe.events.id,
          name: spe.events.name,
          scheduledStart: spe.events.scheduled_start,
          scheduledEnd: spe.events.scheduled_end,
          isPriority: spe.is_priority,
        })),
        metadata: plan.metadata,
      }));

      // Mettre en cache
      await this.redis.setCache(cacheKey, result, this.CACHE_TTL);
      this.logger.logCacheEvent('set', cacheKey, this.CACHE_TTL);

      this.logger.endOperation('getAvailablePlans', operationId, true);
      return result;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'SubscriptionPlansService.getAvailablePlans',
        undefined,
        JSON.stringify({ organizerId })
      );
      this.logger.endOperation('getAvailablePlans', operationId, false);
      throw error;
    }
  }

  /**
   * Récupère un plan d'abonnement spécifique avec tous ses détails
   */
  async getPlanDetails(planId: string) {
    const operationId = this.logger.startOperation('getPlanDetails', { planId });

    try {
      // Vérifier cache
      const cacheKey = `${this.CACHE_PREFIX}details:${planId}`;
      const cached = await this.redis.getCache<any>(cacheKey);
      
      if (cached) {
        this.logger.logCacheEvent('hit', cacheKey);
        this.logger.endOperation('getPlanDetails', operationId, true);
        return cached;
      }

      const plan = await this.prisma.subscription_plans.findUnique({
        where: { 
          id: planId,
          is_active: true,
        },
        include: {
          organizers: {
            select: {
              id: true,
              name: true,
              code: true,
              contact_email: true,
            }
          },
          subscription_plan_zones: {
            where: { is_included: true },
            include: {
              venue_zones: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  description: true,
                  capacity: true,
                  zone_type: true,
                  category: true,
                  base_price: true,
                  amenities: true,
                  is_accessible: true,
                  _count: {
                    select: {
                      seats: {
                        where: {
                          status: 'AVAILABLE'
                        }
                      }
                    }
                  }
                }
              }
            },
            orderBy: { priority_level: 'desc' }
          },
          subscription_plan_events: {
            where: { is_included: true },
            include: {
              events: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  scheduled_start: true,
                  scheduled_end: true,
                  status: true,
                }
              }
            },
            orderBy: { events: { scheduled_start: 'asc' } }
          }
        }
      });

      if (!plan) {
        throw new NotFoundException('Plan d\'abonnement non trouvé');
      }

      // Transformer les données détaillées
      const result = {
        id: plan.id,
        code: plan.code,
        name: plan.name,
        description: plan.description,
        type: plan.type,
        price: Number(plan.price),
        currency: plan.currency,
        maxSubscribers: plan.max_subscribers,
        currentSubscribers: plan.current_subscribers,
        availableSlots: plan.max_subscribers 
          ? plan.max_subscribers - plan.current_subscribers : null,
        validFrom: plan.valid_from,
        validUntil: plan.valid_until,
        saleStartDate: plan.sale_start_date,
        saleEndDate: plan.sale_end_date,
        transferable: plan.transferable,
        maxTransfers: plan.max_transfers,
        autoRenew: plan.auto_renew,
        includesPlayoffs: plan.includes_playoffs,
        priorityBooking: plan.priority_booking,
        benefits: plan.benefits,
        restrictions: plan.restrictions,
        organizer: {
          id: plan.organizers.id,
          name: plan.organizers.name,
          code: plan.organizers.code,
          contactEmail: plan.organizers.contact_email,
        },
        zones: plan.subscription_plan_zones.map(spz => ({
          id: spz.venue_zones.id,
          name: spz.venue_zones.name,
          code: spz.venue_zones.code,
          description: spz.venue_zones.description,
          capacity: spz.venue_zones.capacity,
          hasSeats: spz.venue_zones._count.seats > 0,
          availableSeatsCount: spz.venue_zones._count.seats,
          zoneType: spz.venue_zones.zone_type,
          category: spz.venue_zones.category,
          basePrice: Number(spz.venue_zones.base_price),
          amenities: spz.venue_zones.amenities,
          isAccessible: spz.venue_zones.is_accessible,
          isIncluded: spz.is_included,
          priceOverride: spz.price_override ? Number(spz.price_override) : null,
          priorityLevel: spz.priority_level,
        })),
        includedEvents: plan.subscription_plan_events.map(spe => ({
          id: spe.events.id,
          name: spe.events.name,
          description: spe.events.description,
          scheduledStart: spe.events.scheduled_start,
          scheduledEnd: spe.events.scheduled_end,
          status: spe.events.status,
          isPriority: spe.is_priority,
          accessLevel: spe.access_level,
        })),
        metadata: plan.metadata,
      };

      // Mettre en cache les détails
      await this.redis.setCache(cacheKey, result, this.CACHE_TTL);
      this.logger.logCacheEvent('set', cacheKey, this.CACHE_TTL);

      this.logger.endOperation('getPlanDetails', operationId, true);
      return result;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'SubscriptionPlansService.getPlanDetails',
        undefined,
        JSON.stringify({ planId })
      );
      this.logger.endOperation('getPlanDetails', operationId, false);
      throw error;
    }
  }

  /**
   * Vérifie la disponibilité d'un plan pour une quantité donnée
   */
  async checkPlanAvailability(planId: string, quantity: number): Promise<boolean> {
    const operationId = this.logger.startOperation('checkPlanAvailability', { planId, quantity });

    try {
      const plan = await this.prisma.subscription_plans.findUnique({
        where: { 
          id: planId,
          is_active: true,
        },
        select: {
          max_subscribers: true,
          current_subscribers: true,
          sale_start_date: true,
          sale_end_date: true,
        }
      });

      if (!plan) {
        this.logger.endOperation('checkPlanAvailability', operationId, false);
        return false;
      }

      // Vérifier période de vente
      const now = new Date();
      if (plan.sale_start_date && now < plan.sale_start_date) {
        this.logger.endOperation('checkPlanAvailability', operationId, false);
        return false;
      }

      if (plan.sale_end_date && now > plan.sale_end_date) {
        this.logger.endOperation('checkPlanAvailability', operationId, false);
        return false;
      }

      // Vérifier disponibilité
      if (plan.max_subscribers) {
        const availableSlots = plan.max_subscribers - plan.current_subscribers;
        const isAvailable = availableSlots >= quantity;
        
        this.logger.endOperation('checkPlanAvailability', operationId, true);
        return isAvailable;
      }

      // Pas de limite de souscripteurs
      this.logger.endOperation('checkPlanAvailability', operationId, true);
      return true;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'SubscriptionPlansService.checkPlanAvailability',
        undefined,
        JSON.stringify({ planId, quantity })
      );
      this.logger.endOperation('checkPlanAvailability', operationId, false);
      throw error;
    }
  }

  /**
   * Incrémente le compteur de souscripteurs d'un plan
   */
  async incrementSubscribersCount(planId: string, increment: number = 1) {
    const operationId = this.logger.startOperation('incrementSubscribersCount', { 
      planId, 
      increment 
    });

    try {
      const updatedPlan = await this.prisma.subscription_plans.update({
        where: { id: planId },
        data: {
          current_subscribers: {
            increment: increment
          }
        },
        select: {
          current_subscribers: true,
          max_subscribers: true,
        }
      });

      // Invalider le cache
      await this.redis.delCache(`${this.CACHE_PREFIX}details:${planId}`);
      await this.redis.delCache(`${this.CACHE_PREFIX}available:all`);

      this.logger.logBusinessEvent('PLAN_SUBSCRIBERS_INCREMENTED', JSON.stringify({
        planId,
        increment,
        newCount: updatedPlan.current_subscribers,
        maxSubscribers: updatedPlan.max_subscribers,
      }));

      this.logger.endOperation('incrementSubscribersCount', operationId, true);
      return updatedPlan;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'SubscriptionPlansService.incrementSubscribersCount',
        undefined,
        JSON.stringify({ planId, increment })
      );
      this.logger.endOperation('incrementSubscribersCount', operationId, false);
      throw error;
    }
  }

  /**
   * Invalide le cache d'un plan spécifique
   */
  async invalidatePlanCache(planId: string, organizerId?: string) {
    try {
      const cacheKeys = [
        `${this.CACHE_PREFIX}details:${planId}`,
        `${this.CACHE_PREFIX}available:all`,
      ];

      if (organizerId) {
        cacheKeys.push(`${this.CACHE_PREFIX}available:${organizerId}`);
      }

      await Promise.all(
        cacheKeys.map(key => this.redis.delCache(key))
      );

      this.logger.logCacheEvent('del', `plan-cache-${planId}`);
    } catch (error) {
      this.logger.error('Failed to invalidate plan cache', JSON.stringify({ 
        planId, 
        organizerId, 
        error: error.message 
      }));
    }
  }

  /**
   * Récupère TOUS les plans d'abonnement d'un organisateur (actifs et inactifs)
   */
  async getAllPlansByOrganizer(organizerId: string) {
    const operationId = this.logger.startOperation('getAllPlansByOrganizer', { organizerId });

    try {
      // Vérifier cache
      const cacheKey = `${this.CACHE_PREFIX}all-organizer:${organizerId}`;
      const cached = await this.redis.getCache<any>(cacheKey);
      
      if (cached) {
        this.logger.logCacheEvent('hit', cacheKey);
        this.logger.endOperation('getAllPlansByOrganizer', operationId, true);
        return cached;
      }

      // Récupérer TOUS les plans de l'organisateur (actifs et inactifs)
      const plans = await this.prisma.subscription_plans.findMany({
        where: {
          organizer_id: organizerId,
          // Pas de filtre is_active pour récupérer tous les plans
        },
        include: {
          organizers: {
            select: {
              id: true,
              name: true,
              code: true,
              contact_email: true,
            }
          },
          subscription_plan_zones: {
            where: { is_included: true },
            include: {
              venue_zones: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  capacity: true,
                  zone_type: true,
                  category: true,
                  _count: {
                    select: {
                      seats: {
                        where: {
                          status: 'AVAILABLE'
                        }
                      }
                    }
                  }
                }
              }
            },
            orderBy: { priority_level: 'desc' }
          },
          subscription_plan_events: {
            where: { is_included: true },
            include: {
              events: {
                select: {
                  id: true,
                  name: true,
                  scheduled_start: true,
                  scheduled_end: true,
                  status: true,
                }
              }
            },
            orderBy: { events: { scheduled_start: 'asc' } }
          },
          _count: {
            select: {
              subscriptions: {
                where: {
                  status: 'ACTIVE'
                }
              }
            }
          }
        },
        orderBy: [
          { is_active: 'desc' }, // Plans actifs en premier
          { created_at: 'desc' }  // Plus récents en premier
        ]
      });

      if (plans.length === 0) {
        this.logger.info('Aucun plan trouvé pour cet organisateur', JSON.stringify({ organizerId }));
      }

      // Transformer les données pour l'API
      const result = plans.map(plan => ({
        id: plan.id,
        code: plan.code,
        name: plan.name,
        description: plan.description,
        type: plan.type,
        price: Number(plan.price),
        currency: plan.currency,
        isActive: plan.is_active,
        maxSubscribers: plan.max_subscribers,
        currentSubscribers: plan.current_subscribers,
        activeSubscriptions: plan._count.subscriptions, // Nombre d'abonnements actifs
        availableSlots: plan.max_subscribers 
          ? plan.max_subscribers - plan.current_subscribers 
          : null,
        validFrom: plan.valid_from,
        validUntil: plan.valid_until,
        saleStartDate: plan.sale_start_date,
        saleEndDate: plan.sale_end_date,
        isCurrentlyOnSale: this.isPlanCurrentlyOnSale(plan),
        transferable: plan.transferable,
        maxTransfers: plan.max_transfers,
        autoRenew: plan.auto_renew,
        includesPlayoffs: plan.includes_playoffs,
        priorityBooking: plan.priority_booking,
        benefits: plan.benefits,
        restrictions: plan.restrictions,
        organizer: {
          id: plan.organizers.id,
          name: plan.organizers.name,
          code: plan.organizers.code,
          contactEmail: plan.organizers.contact_email,
        },
        zones: plan.subscription_plan_zones.map(spz => ({
          id: spz.venue_zones.id,
          name: spz.venue_zones.name,
          code: spz.venue_zones.code,
          capacity: spz.venue_zones.capacity,
          hasSeats: spz.venue_zones._count.seats > 0,
          availableSeatsCount: spz.venue_zones._count.seats,
          zoneType: spz.venue_zones.zone_type,
          category: spz.venue_zones.category,
          isIncluded: spz.is_included,
          priceOverride: spz.price_override ? Number(spz.price_override) : null,
          priorityLevel: spz.priority_level,
        })),
        includedEvents: plan.subscription_plan_events.map(spe => ({
          id: spe.events.id,
          name: spe.events.name,
          scheduledStart: spe.events.scheduled_start,
          scheduledEnd: spe.events.scheduled_end,
          status: spe.events.status,
          isPriority: spe.is_priority,
          accessLevel: spe.access_level,
        })),
        metadata: plan.metadata,
        createdAt: plan.created_at,
        updatedAt: plan.updated_at,
      }));

      // Mettre en cache (durée plus courte car données administratives)
      await this.redis.setCache(cacheKey, result, 900); // 15 minutes
      this.logger.logCacheEvent('set', cacheKey, 900);

      this.logger.logBusinessEvent('ALL_PLANS_FETCHED_BY_ORGANIZER', {
        organizerId,
        totalPlans: result.length,
        activePlans: result.filter(p => p.isActive).length,
        inactivePlans: result.filter(p => !p.isActive).length,
        plansOnSale: result.filter(p => p.isCurrentlyOnSale).length,
      });

      this.logger.endOperation('getAllPlansByOrganizer', operationId, true);
      return result;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'SubscriptionPlansService.getAllPlansByOrganizer',
        undefined,
        JSON.stringify({ organizerId })
      );
      this.logger.endOperation('getAllPlansByOrganizer', operationId, false);
      throw error;
    }
  }

  /**
   * Méthode utilitaire pour vérifier si un plan est actuellement en vente
   */
  private isPlanCurrentlyOnSale(plan: any): boolean {
    const now = new Date();
    const saleStarted = !plan.sale_start_date || plan.sale_start_date <= now;
    const saleNotEnded = !plan.sale_end_date || plan.sale_end_date >= now;
    
    return plan.is_active && saleStarted && saleNotEnded;
  }
}