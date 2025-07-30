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
exports.SubscriptionPlansService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
let SubscriptionPlansService = class SubscriptionPlansService {
    prisma;
    redis;
    logger;
    CACHE_PREFIX = 'subscription-plans:';
    CACHE_TTL = 1800;
    constructor(prisma, redis, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.logger = loggerService.createChildLogger('SubscriptionPlansService');
    }
    async getAvailablePlans(organizerId) {
        const operationId = this.logger.startOperation('getAvailablePlans', { organizerId });
        try {
            const cacheKey = `${this.CACHE_PREFIX}available:${organizerId || 'all'}`;
            const cached = await this.redis.getCache(cacheKey);
            if (cached) {
                this.logger.logCacheEvent('hit', cacheKey);
                this.logger.endOperation('getAvailablePlans', operationId, true);
                return cached;
            }
            const where = {
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
            await this.redis.setCache(cacheKey, result, this.CACHE_TTL);
            this.logger.logCacheEvent('set', cacheKey, this.CACHE_TTL);
            this.logger.endOperation('getAvailablePlans', operationId, true);
            return result;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'SubscriptionPlansService.getAvailablePlans', undefined, JSON.stringify({ organizerId }));
            this.logger.endOperation('getAvailablePlans', operationId, false);
            throw error;
        }
    }
    async getPlanDetails(planId) {
        const operationId = this.logger.startOperation('getPlanDetails', { planId });
        try {
            const cacheKey = `${this.CACHE_PREFIX}details:${planId}`;
            const cached = await this.redis.getCache(cacheKey);
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
                throw new common_1.NotFoundException('Plan d\'abonnement non trouvé');
            }
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
            await this.redis.setCache(cacheKey, result, this.CACHE_TTL);
            this.logger.logCacheEvent('set', cacheKey, this.CACHE_TTL);
            this.logger.endOperation('getPlanDetails', operationId, true);
            return result;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'SubscriptionPlansService.getPlanDetails', undefined, JSON.stringify({ planId }));
            this.logger.endOperation('getPlanDetails', operationId, false);
            throw error;
        }
    }
    async checkPlanAvailability(planId, quantity) {
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
            const now = new Date();
            if (plan.sale_start_date && now < plan.sale_start_date) {
                this.logger.endOperation('checkPlanAvailability', operationId, false);
                return false;
            }
            if (plan.sale_end_date && now > plan.sale_end_date) {
                this.logger.endOperation('checkPlanAvailability', operationId, false);
                return false;
            }
            if (plan.max_subscribers) {
                const availableSlots = plan.max_subscribers - plan.current_subscribers;
                const isAvailable = availableSlots >= quantity;
                this.logger.endOperation('checkPlanAvailability', operationId, true);
                return isAvailable;
            }
            this.logger.endOperation('checkPlanAvailability', operationId, true);
            return true;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'SubscriptionPlansService.checkPlanAvailability', undefined, JSON.stringify({ planId, quantity }));
            this.logger.endOperation('checkPlanAvailability', operationId, false);
            throw error;
        }
    }
    async incrementSubscribersCount(planId, increment = 1) {
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
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'SubscriptionPlansService.incrementSubscribersCount', undefined, JSON.stringify({ planId, increment }));
            this.logger.endOperation('incrementSubscribersCount', operationId, false);
            throw error;
        }
    }
    async invalidatePlanCache(planId, organizerId) {
        try {
            const cacheKeys = [
                `${this.CACHE_PREFIX}details:${planId}`,
                `${this.CACHE_PREFIX}available:all`,
            ];
            if (organizerId) {
                cacheKeys.push(`${this.CACHE_PREFIX}available:${organizerId}`);
            }
            await Promise.all(cacheKeys.map(key => this.redis.delCache(key)));
            this.logger.logCacheEvent('del', `plan-cache-${planId}`);
        }
        catch (error) {
            this.logger.error('Failed to invalidate plan cache', JSON.stringify({
                planId,
                organizerId,
                error: error.message
            }));
        }
    }
};
exports.SubscriptionPlansService = SubscriptionPlansService;
exports.SubscriptionPlansService = SubscriptionPlansService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        logger_service_1.LoggerService])
], SubscriptionPlansService);
//# sourceMappingURL=subscription-plans.service.js.map