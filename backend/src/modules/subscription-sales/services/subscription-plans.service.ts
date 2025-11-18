// src/modules/subscription-sales/services/subscription-plans.service.ts

import { 
  Injectable, 
  NotFoundException,
  BadRequestException,
  ConflictException
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
  async getAvailablePlans(organizerId?: string, skipCache: boolean = false) {
    const operationId = this.logger.startOperation('getAvailablePlans', { organizerId, skipCache });

    try {
      // Debug: Log the request parameters
      this.logger.info('🔍 getAvailablePlans called with organizerId:', organizerId);
      
      // Vérifier cache (skip if skipCache is true - used when timestamp parameter is present)
      const cacheKey = `${this.CACHE_PREFIX}available:${organizerId || 'all'}`;
      
      if (!skipCache) {
      const cached = await this.redis.getCache<any>(cacheKey);
      
      if (cached) {
        this.logger.logCacheEvent('hit', cacheKey);
        this.logger.endOperation('getAvailablePlans', operationId, true);
        return cached;
        }
      }

      // Construire les conditions de filtrage
      const where: any = {
        is_active: true,
        AND: [
          {
            OR: [
              { sale_start_date: null },
              { sale_start_date: { lte: new Date() } }
            ]
          },
          {
            OR: [
              { sale_end_date: null },
              { sale_end_date: { gte: new Date() } }
            ]
          }
        ]
      };

      if (organizerId) {
        where.organizer_id = organizerId;
      }

      // Debug: Log the where conditions
      this.logger.info('🔍 Database query conditions:', JSON.stringify(where, null, 2));

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
          { priority_booking: 'desc' },
          { price: 'asc' }
        ]
      });

      // Debug: Log the query results
      this.logger.info('🔍 Database query returned plans count:', plans.length.toString());
      if (plans.length === 0) {
        this.logger.warn('⚠️ No plans found in database with current filters');
      } else {
        // Debug: Log the first plan structure
        this.logger.info('🔍 First plan structure:', JSON.stringify(plans[0], null, 2));
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
        isCurrentlyOnSale: this.isPlanCurrentlyOnSale(plan),
        maxSubscribers: plan.max_subscribers,
        currentSubscribers: plan.current_subscribers,
        activeSubscriptions: plan._count.subscriptions, // Nombre d'abonnements actifs
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
        createdAt: plan.created_at,
        updatedAt: plan.updated_at,
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
          // Don't filter by is_active - allow fetching inactive plans for editing
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
        isActive: plan.is_active,
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
        cacheKeys.push(
          `${this.CACHE_PREFIX}available:${organizerId}`,
          `${this.CACHE_PREFIX}all-organizer:${organizerId}` // Also invalidate getAllPlansByOrganizer cache
        );
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
  async getAllPlansByOrganizer(organizerId: string, skipCache: boolean = false) {
    const operationId = this.logger.startOperation('getAllPlansByOrganizer', { organizerId, skipCache });

    try {
      // Vérifier cache (skip if skipCache is true - used when timestamp parameter is present)
      const cacheKey = `${this.CACHE_PREFIX}all-organizer:${organizerId}`;
      
      if (!skipCache) {
      const cached = await this.redis.getCache<any>(cacheKey);
      
      if (cached) {
        this.logger.logCacheEvent('hit', cacheKey);
        this.logger.endOperation('getAllPlansByOrganizer', operationId, true);
        return cached;
        }
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
   * Create a new subscription plan
   */
  async createPlan(data: any) {
    const operationId = this.logger.startOperation('createPlan', { code: data.code });

    try {
      // Validate dates
      const validFrom = new Date(data.valid_from);
      const validUntil = new Date(data.valid_until);
      
      if (validUntil < validFrom) {
        throw new BadRequestException('valid_until must be greater than or equal to valid_from');
      }

      if (data.sale_start_date && data.sale_end_date) {
        const saleStart = new Date(data.sale_start_date);
        const saleEnd = new Date(data.sale_end_date);
        if (saleEnd < saleStart) {
          throw new BadRequestException('sale_end_date must be greater than or equal to sale_start_date');
        }
      }

      // Check if code already exists
      const existingPlan = await this.prisma.subscription_plans.findUnique({
        where: { code: data.code },
        select: { id: true },
      });

      if (existingPlan) {
        throw new ConflictException(`A subscription plan with code "${data.code}" already exists`);
      }

      // Validate max_subscribers if provided
      if (data.max_subscribers !== undefined && data.max_subscribers !== null) {
        if (data.max_subscribers <= 0) {
          throw new BadRequestException('max_subscribers must be greater than 0');
        }
      }

      // Create the plan with related data in a transaction
      const plan = await this.prisma.$transaction(async (tx) => {
        // Create the plan
        const newPlan = await tx.subscription_plans.create({
          data: {
            code: data.code,
            name: data.name,
            description: data.description,
            type: data.type,
            price: data.price,
            currency: data.currency || 'TND',
            organizer_id: data.organizer_id,
            max_subscribers: data.max_subscribers,
            current_subscribers: 0,
            valid_from: validFrom,
            valid_until: validUntil,
            sale_start_date: data.sale_start_date ? new Date(data.sale_start_date) : null,
            sale_end_date: data.sale_end_date ? new Date(data.sale_end_date) : null,
            transferable: data.transferable ?? false,
            max_transfers: data.max_transfers ?? 0,
            auto_renew: data.auto_renew ?? false,
            includes_playoffs: data.includes_playoffs ?? false,
            priority_booking: data.priority_booking ?? false,
            benefits: data.benefits || null,
            restrictions: data.restrictions || null,
            metadata: data.metadata || null,
            is_active: true,
          },
        });

        // Link zones if provided
        if (data.zones && data.zones.length > 0) {
          await tx.subscription_plan_zones.createMany({
            data: data.zones.map((zone: any) => ({
              subscription_plan_id: newPlan.id,
              zone_id: zone.zone_id,
              is_included: zone.is_included ?? true,
              price_override: zone.price_override || null,
              priority_level: zone.priority_level || 0,
              metadata: null,
            })),
          });
        }

        // Link events if provided
        if (data.events && data.events.length > 0) {
          await tx.subscription_plan_events.createMany({
            data: data.events.map((event: any) => ({
              subscription_plan_id: newPlan.id,
              event_id: event.event_id,
              is_included: event.is_included ?? true,
              is_priority: event.is_priority ?? false,
              access_level: event.access_level || 'STANDARD',
              metadata: null,
            })),
          });
        }

        return newPlan;
      });

      // Invalidate cache immediately - clear all relevant caches
      await this.invalidatePlanCache(plan.id, data.organizer_id);
      // Also explicitly clear the all-organizer cache to ensure fresh data
      if (data.organizer_id) {
        await this.redis.delCache(`${this.CACHE_PREFIX}all-organizer:${data.organizer_id}`);
      }

      // Fetch the complete plan with relations
      const completePlan = await this.getPlanDetails(plan.id);

      this.logger.logBusinessEvent('SUBSCRIPTION_PLAN_CREATED', JSON.stringify({
        planId: plan.id,
        code: plan.code,
        name: plan.name,
        organizerId: data.organizer_id,
      }));

      this.logger.endOperation('createPlan', operationId, true);
      return completePlan;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'SubscriptionPlansService.createPlan',
        undefined,
        JSON.stringify({ code: data.code })
      );
      this.logger.endOperation('createPlan', operationId, false);
      throw error;
    }
  }

  /**
   * Update an existing subscription plan
   */
  async updatePlan(planId: string, data: any) {
    const operationId = this.logger.startOperation('updatePlan', { planId });

    try {
      // Check if plan exists
      const existingPlan = await this.prisma.subscription_plans.findUnique({
        where: { id: planId },
        select: { 
          id: true, 
          code: true, 
          organizer_id: true,
          valid_from: true,
          valid_until: true,
          current_subscribers: true,
        },
      });

      if (!existingPlan) {
        throw new NotFoundException('Subscription plan not found');
      }

      // If code is being changed, check if new code exists
      if (data.code && data.code !== existingPlan.code) {
        const codeExists = await this.prisma.subscription_plans.findUnique({
          where: { code: data.code },
          select: { id: true },
        });

        if (codeExists) {
          throw new ConflictException(`A subscription plan with code "${data.code}" already exists`);
        }
      }

      // Validate dates if provided
      if (data.valid_from || data.valid_until) {
        const validFrom = data.valid_from ? new Date(data.valid_from) : existingPlan.valid_from;
        const validUntil = data.valid_until ? new Date(data.valid_until) : existingPlan.valid_until;
        
        if (validUntil < validFrom) {
          throw new BadRequestException('valid_until must be greater than or equal to valid_from');
        }
      }

      if (data.sale_start_date || data.sale_end_date) {
        const saleStart = data.sale_start_date ? new Date(data.sale_start_date) : null;
        const saleEnd = data.sale_end_date ? new Date(data.sale_end_date) : null;
        
        if (saleStart && saleEnd && saleEnd < saleStart) {
          throw new BadRequestException('sale_end_date must be greater than or equal to sale_start_date');
        }
      }

      // Validate max_subscribers if being updated
      if (data.max_subscribers !== undefined && data.max_subscribers !== null) {
        if (data.max_subscribers <= 0) {
          throw new BadRequestException('max_subscribers must be greater than 0');
        }
        
        // Check current subscribers don't exceed new max
        if (existingPlan.current_subscribers > data.max_subscribers) {
          throw new BadRequestException(
            `Cannot set max_subscribers to ${data.max_subscribers} because current_subscribers is ${existingPlan.current_subscribers}`
          );
        }
      }

      // Update the plan with related data in a transaction
      const updatedPlan = await this.prisma.$transaction(async (tx) => {
        // Prepare update data
        const updateData: any = {};
        
        if (data.code !== undefined) updateData.code = data.code;
        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.price !== undefined) updateData.price = data.price;
        if (data.currency !== undefined) updateData.currency = data.currency;
        if (data.max_subscribers !== undefined) updateData.max_subscribers = data.max_subscribers;
        if (data.valid_from !== undefined) updateData.valid_from = new Date(data.valid_from);
        if (data.valid_until !== undefined) updateData.valid_until = new Date(data.valid_until);
        if (data.sale_start_date !== undefined) updateData.sale_start_date = data.sale_start_date ? new Date(data.sale_start_date) : null;
        if (data.sale_end_date !== undefined) updateData.sale_end_date = data.sale_end_date ? new Date(data.sale_end_date) : null;
        if (data.transferable !== undefined) updateData.transferable = data.transferable;
        if (data.max_transfers !== undefined) updateData.max_transfers = data.max_transfers;
        if (data.auto_renew !== undefined) updateData.auto_renew = data.auto_renew;
        if (data.includes_playoffs !== undefined) updateData.includes_playoffs = data.includes_playoffs;
        if (data.priority_booking !== undefined) updateData.priority_booking = data.priority_booking;
        if (data.benefits !== undefined) updateData.benefits = data.benefits;
        if (data.restrictions !== undefined) updateData.restrictions = data.restrictions;
        if (data.metadata !== undefined) updateData.metadata = data.metadata;
        if (data.is_active !== undefined) updateData.is_active = data.is_active;

        updateData.updated_at = new Date();

        // Update the plan
        const plan = await tx.subscription_plans.update({
          where: { id: planId },
          data: updateData,
        });

        // Update zones if provided
        if (data.zones !== undefined) {
          // Delete existing zones
          await tx.subscription_plan_zones.deleteMany({
            where: { subscription_plan_id: planId },
          });

          // Create new zones
          if (data.zones.length > 0) {
            await tx.subscription_plan_zones.createMany({
              data: data.zones.map((zone: any) => ({
                subscription_plan_id: planId,
                zone_id: zone.zone_id,
                is_included: zone.is_included ?? true,
                price_override: zone.price_override || null,
                priority_level: zone.priority_level || 0,
                metadata: null,
              })),
            });
          }
        }

        // Update events if provided
        if (data.events !== undefined) {
          // Delete existing events
          await tx.subscription_plan_events.deleteMany({
            where: { subscription_plan_id: planId },
          });

          // Create new events
          if (data.events.length > 0) {
            await tx.subscription_plan_events.createMany({
              data: data.events.map((event: any) => ({
                subscription_plan_id: planId,
                event_id: event.event_id,
                is_included: event.is_included ?? true,
                is_priority: event.is_priority ?? false,
                access_level: event.access_level || 'STANDARD',
                metadata: null,
              })),
            });
          }
        }

        return plan;
      });

      // Invalidate cache immediately - clear all relevant caches
      await this.invalidatePlanCache(planId, existingPlan.organizer_id);
      // Also explicitly clear the all-organizer cache to ensure fresh data
      if (existingPlan.organizer_id) {
        await this.redis.delCache(`${this.CACHE_PREFIX}all-organizer:${existingPlan.organizer_id}`);
      }

      // Fetch the complete plan with relations
      const completePlan = await this.getPlanDetails(planId);

      this.logger.logBusinessEvent('SUBSCRIPTION_PLAN_UPDATED', JSON.stringify({
        planId: updatedPlan.id,
        code: updatedPlan.code,
      }));

      this.logger.endOperation('updatePlan', operationId, true);
      return completePlan;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'SubscriptionPlansService.updatePlan',
        undefined,
        JSON.stringify({ planId })
      );
      this.logger.endOperation('updatePlan', operationId, false);
      throw error;
    }
  }

  /**
   * Delete a subscription plan
   */
  async deletePlan(planId: string) {
    const operationId = this.logger.startOperation('deletePlan', { planId });

    try {
      // Check if plan exists
      const existingPlan = await this.prisma.subscription_plans.findUnique({
        where: { id: planId },
        include: {
          _count: {
            select: {
              subscriptions: true,
              physical_qr_codes: true,
            },
          },
        },
      });

      if (!existingPlan) {
        throw new NotFoundException('Subscription plan not found');
      }

      // Check if plan has active subscriptions
      const activeSubscriptions = await this.prisma.subscriptions.count({
        where: {
          plan_id: planId,
          status: 'ACTIVE',
        },
      });

      if (activeSubscriptions > 0) {
        throw new BadRequestException(
          `Cannot delete subscription plan with ${activeSubscriptions} active subscription(s). Please deactivate it instead.`
        );
      }

      // Check if plan has QR codes
      if (existingPlan._count.physical_qr_codes > 0) {
        throw new BadRequestException(
          `Cannot delete subscription plan with ${existingPlan._count.physical_qr_codes} QR code(s) associated. Please deactivate it instead.`
        );
      }

      // Delete related records first (cascade should handle this, but being explicit)
      await this.prisma.$transaction(async (tx) => {
        await tx.subscription_plan_zones.deleteMany({
          where: { subscription_plan_id: planId },
        });

        await tx.subscription_plan_events.deleteMany({
          where: { subscription_plan_id: planId },
        });

        await tx.subscription_plan_event_groups.deleteMany({
          where: { subscription_plan_id: planId },
        });

        // Delete the plan
        await tx.subscription_plans.delete({
          where: { id: planId },
        });
      });

      // Invalidate cache immediately - clear all relevant caches
      await this.invalidatePlanCache(planId, existingPlan.organizer_id);
      // Also explicitly clear the all-organizer cache to ensure fresh data
      if (existingPlan.organizer_id) {
        await this.redis.delCache(`${this.CACHE_PREFIX}all-organizer:${existingPlan.organizer_id}`);
      }

      this.logger.logBusinessEvent('SUBSCRIPTION_PLAN_DELETED', JSON.stringify({
        planId: existingPlan.id,
        code: existingPlan.code,
      }));

      this.logger.endOperation('deletePlan', operationId, true);
      return { success: true, message: 'Subscription plan deleted successfully' };

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'SubscriptionPlansService.deletePlan',
        undefined,
        JSON.stringify({ planId })
      );
      this.logger.endOperation('deletePlan', operationId, false);
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