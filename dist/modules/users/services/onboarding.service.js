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
exports.OnboardingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const email_service_1 = require("../../../shared/email/email.service");
const bullmq_service_1 = require("../../../shared/bullmq/bullmq.service");
let OnboardingService = class OnboardingService {
    prisma;
    redis;
    email;
    bullmq;
    logger;
    CACHE_PREFIX = 'onboarding:';
    CACHE_TTL = 3600;
    constructor(prisma, redis, email, bullmq, logger) {
        this.prisma = prisma;
        this.redis = redis;
        this.email = email;
        this.bullmq = bullmq;
        this.logger = logger.createChildLogger('OnboardingService');
    }
    async generateOnboardingKey(sourceType, sourceId, campaignId, incentiveType, incentiveValue, description, expiresAt) {
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
            const timestamp = Date.now().toString(36);
            const random = Math.random().toString(36).substring(2, 10);
            const secretKey = `ONB_${timestamp}_${random}`.toUpperCase();
            const onboardingData = {
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
            if (sourceType === 'TICKET') {
                await this.prisma.tickets.update({
                    where: { id: sourceId },
                    data: {
                        metadata: {
                            onboarding: onboardingData
                        }
                    }
                });
            }
            else if (sourceType === 'SUBSCRIPTION') {
                await this.prisma.subscriptions.update({
                    where: { id: sourceId },
                    data: {
                        metadata: {
                            onboarding: onboardingData
                        }
                    }
                });
            }
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
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'OnboardingService.generateOnboardingKey', JSON.stringify({
                sourceType,
                sourceId,
                campaignId
            }));
            this.logger.endOperation('generateOnboardingKey', operationId, false);
            throw new common_1.InternalServerErrorException('Failed to generate onboarding key');
        }
    }
    async validateOnboardingKey(secretKey) {
        const operationId = this.logger.startOperation('validateOnboardingKey', { secretKey });
        try {
            this.logger.info('Validating onboarding key', JSON.stringify({ secretKey }));
            const cacheKey = `${this.CACHE_PREFIX}${secretKey}`;
            const cached = await this.redis.getCache(cacheKey);
            if (cached) {
                this.logger.logCacheEvent('hit', cacheKey);
                const now = new Date();
                const expiresAt = new Date(cached.expiresAt);
                const result = {
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
                const onboardingData = ticket.metadata?.onboarding;
                if (onboardingData) {
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
                    const result = {
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
                    await this.redis.setCache(cacheKey, {
                        sourceType: 'TICKET',
                        sourceId: ticket.id,
                        ...onboardingData
                    }, this.CACHE_TTL);
                    this.logger.endOperation('validateOnboardingKey', operationId, true);
                    return result;
                }
            }
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
                const onboardingData = subscription.metadata?.onboarding;
                if (onboardingData) {
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
                    const result = {
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
                    await this.redis.setCache(cacheKey, {
                        sourceType: 'SUBSCRIPTION',
                        sourceId: subscription.id,
                        ...onboardingData
                    }, this.CACHE_TTL);
                    this.logger.endOperation('validateOnboardingKey', operationId, true);
                    return result;
                }
            }
            const result = {
                isValid: false,
                isExpired: false,
                isUsed: false,
                error: 'Clé d\'onboarding non trouvée'
            };
            this.logger.endOperation('validateOnboardingKey', operationId, false);
            return result;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'OnboardingService.validateOnboardingKey', JSON.stringify({
                secretKey
            }));
            this.logger.endOperation('validateOnboardingKey', operationId, false);
            throw new common_1.InternalServerErrorException('Failed to validate onboarding key');
        }
    }
    async convertAnonymousUser(conversionData) {
        const operationId = this.logger.startOperation('convertAnonymousUser', {
            secretKey: conversionData.secretKey,
            email: conversionData.userData.email
        });
        const lockKey = `conversion:${conversionData.secretKey}`;
        const lockAcquired = await this.redis.acquireLock(lockKey, 30);
        if (!lockAcquired) {
            throw new common_1.ConflictException('Conversion déjà en cours pour cette clé');
        }
        try {
            this.logger.info('Converting anonymous user', JSON.stringify({
                secretKey: conversionData.secretKey,
                email: conversionData.userData.email
            }));
            const keyValidation = await this.validateOnboardingKey(conversionData.secretKey);
            if (!keyValidation.isValid) {
                throw new common_1.BadRequestException(keyValidation.error || 'Clé d\'onboarding invalide ou expirée');
            }
            const existingUser = await this.prisma.users.findUnique({
                where: { email: conversionData.userData.email }
            });
            if (existingUser) {
                throw new common_1.ConflictException('Un compte existe déjà avec cet email');
            }
            const result = await this.prisma.$transaction(async (tx) => {
                const newUser = await tx.users.create({
                    data: {
                        email: conversionData.userData.email,
                        first_name: conversionData.userData.firstName,
                        last_name: conversionData.userData.lastName,
                        phone: conversionData.userData.phone,
                        password: conversionData.userData.password,
                        email_verified: true,
                        is_active: true
                    }
                });
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
                if (keyValidation.sourceType === 'TICKET' && keyValidation.sourceId) {
                    const updatedOnboarding = keyValidation.keyData ?
                        { ...keyValidation.keyData, used: true } : { used: true };
                    await tx.tickets.update({
                        where: { id: keyValidation.sourceId },
                        data: {
                            user_id: newUser.id,
                            metadata: {
                                onboarding: updatedOnboarding
                            }
                        }
                    });
                    migratedTickets = 1;
                    await tx.access_rights.updateMany({
                        where: { ticket_id: keyValidation.sourceId },
                        data: { user_id: newUser.id }
                    });
                }
                else if (keyValidation.sourceType === 'SUBSCRIPTION' && keyValidation.sourceId) {
                    const updatedOnboarding = keyValidation.keyData ?
                        { ...keyValidation.keyData, used: true } : { used: true };
                    await tx.subscriptions.update({
                        where: { id: keyValidation.sourceId },
                        data: {
                            user_id: newUser.id,
                            metadata: {
                                onboarding: updatedOnboarding
                            }
                        }
                    });
                    migratedSubscriptions = 1;
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
            let incentiveApplied;
            if (keyValidation.incentive) {
                incentiveApplied = await this.applyIncentive(result.user.id, keyValidation.incentive.type, keyValidation.incentive.value, conversionData.secretKey);
            }
            const cacheKey = `${this.CACHE_PREFIX}${conversionData.secretKey}`;
            await this.redis.delCache(cacheKey);
            await this.bullmq.addJob('email', 'send-onboarding-welcome', {
                userId: result.user.id,
                email: result.user.email,
                firstName: result.user.first_name,
                incentive: keyValidation.incentive
            });
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
            const conversionResult = {
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
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'OnboardingService.convertAnonymousUser', JSON.stringify({
                secretKey: conversionData.secretKey,
                email: conversionData.userData.email
            }));
            this.logger.endOperation('convertAnonymousUser', operationId, false);
            if (error instanceof common_1.BadRequestException || error instanceof common_1.ConflictException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to convert anonymous user');
        }
        finally {
            await this.redis.releaseLock(lockKey);
        }
    }
    async applyIncentive(userId, incentiveType, incentiveValue, secretKey) {
        try {
            this.logger.info('Applying incentive', JSON.stringify({
                userId,
                incentiveType,
                incentiveValue
            }));
            switch (incentiveType) {
                case 'BONUS_POINTS':
                    await this.prisma.users.update({
                        where: { id: userId },
                        data: {
                            metadata: {
                                loyaltyPoints: incentiveValue,
                                source: 'onboarding_bonus',
                                earnedAt: new Date().toISOString()
                            }
                        }
                    });
                    break;
                case 'DISCOUNT_NEXT':
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
                            }
                        }
                    });
                    break;
                case 'FREE_UPGRADE':
                    await this.prisma.users.update({
                        where: { id: userId },
                        data: {
                            metadata: {
                                freeUpgrade: {
                                    available: true,
                                    value: incentiveValue,
                                    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
                                }
                            }
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
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'OnboardingService.applyIncentive', JSON.stringify({
                userId,
                incentiveType,
                incentiveValue
            }));
            throw error;
        }
    }
    async getOnboardingStats(startDate, endDate, organizerId) {
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
            const baseFilter = {
                created_at: {
                    gte: startDate,
                    lte: endDate
                }
            };
            if (organizerId) {
                baseFilter.organizer_id = organizerId;
            }
            const ticketsWithOnboarding = await this.prisma.tickets.findMany({
                where: {
                    ...baseFilter,
                    metadata: {
                        path: ['onboarding'],
                        not: client_1.Prisma.AnyNull
                    }
                },
                select: {
                    metadata: true,
                    created_at: true
                }
            });
            const subscriptionsWithOnboarding = await this.prisma.subscriptions.findMany({
                where: {
                    ...baseFilter,
                    metadata: {
                        path: ['onboarding'],
                        not: client_1.Prisma.AnyNull
                    }
                },
                select: {
                    metadata: true,
                    created_at: true
                }
            });
            const totalKeysGenerated = ticketsWithOnboarding.length + subscriptionsWithOnboarding.length;
            const usedTickets = ticketsWithOnboarding.filter(t => t.metadata?.onboarding?.used === true);
            const usedSubscriptions = subscriptionsWithOnboarding.filter(s => s.metadata?.onboarding?.used === true);
            const totalKeysUsed = usedTickets.length + usedSubscriptions.length;
            const conversionRate = totalKeysGenerated > 0 ?
                (totalKeysUsed / totalKeysGenerated) * 100 : 0;
            const incentiveTypes = new Map();
            [...ticketsWithOnboarding, ...subscriptionsWithOnboarding].forEach(item => {
                const onboarding = item.metadata?.onboarding;
                if (onboarding) {
                    const type = onboarding.incentiveType || 'UNKNOWN';
                    const current = incentiveTypes.get(type) || { count: 0, used: 0 };
                    current.count++;
                    if (onboarding.used)
                        current.used++;
                    incentiveTypes.set(type, current);
                }
            });
            const topIncentiveTypes = Array.from(incentiveTypes.entries()).map(([type, data]) => ({
                type,
                count: data.count,
                conversionRate: data.count > 0 ? (data.used / data.count) * 100 : 0
            })).sort((a, b) => b.count - a.count);
            const campaigns = new Map();
            [...ticketsWithOnboarding, ...subscriptionsWithOnboarding].forEach(item => {
                const onboarding = item.metadata?.onboarding;
                if (onboarding) {
                    const campaignId = onboarding.campaignId || 'UNKNOWN';
                    const current = campaigns.get(campaignId) || { generated: 0, used: 0 };
                    current.generated++;
                    if (onboarding.used)
                        current.used++;
                    campaigns.set(campaignId, current);
                }
            });
            const campaignPerformance = Array.from(campaigns.entries()).map(([campaignId, data]) => ({
                campaignId,
                keysGenerated: data.generated,
                keysUsed: data.used,
                conversionRate: data.generated > 0 ? (data.used / data.generated) * 100 : 0
            }));
            const conversionTimes = [];
            [...usedTickets, ...usedSubscriptions].forEach(item => {
                const onboarding = item.metadata?.onboarding;
                if (onboarding && onboarding.createdAt) {
                    const created = new Date(onboarding.createdAt);
                    const used = new Date();
                    const diffHours = (used.getTime() - created.getTime()) / (1000 * 60 * 60);
                    if (diffHours > 0 && diffHours < 24 * 30) {
                        conversionTimes.push(diffHours);
                    }
                }
            });
            const averageConversionTime = conversionTimes.length > 0 ?
                conversionTimes.reduce((sum, time) => sum + time, 0) / conversionTimes.length : 0;
            const stats = {
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
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'OnboardingService.getOnboardingStats', JSON.stringify({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                organizerId
            }));
            this.logger.endOperation('getOnboardingStats', operationId, false);
            throw new common_1.InternalServerErrorException('Failed to generate onboarding stats');
        }
    }
    async sendOnboardingReminder(secretKey) {
        const operationId = this.logger.startOperation('sendOnboardingReminder', { secretKey });
        try {
            const keyValidation = await this.validateOnboardingKey(secretKey);
            if (!keyValidation.isValid || keyValidation.isUsed || !keyValidation.guestInfo) {
                return false;
            }
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
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'OnboardingService.sendOnboardingReminder', JSON.stringify({
                secretKey
            }));
            this.logger.endOperation('sendOnboardingReminder', operationId, false);
            return false;
        }
    }
    async cleanupExpiredKeys() {
        const operationId = this.logger.startOperation('cleanupExpiredKeys', {});
        try {
            const now = new Date();
            let cleanedCount = 0;
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
                const metadata = ticket.metadata;
                if (metadata?.onboarding && !metadata.onboarding.used) {
                    const updatedMetadata = {
                        ...metadata,
                        onboarding: {
                            ...metadata.onboarding,
                            expired: true
                        }
                    };
                    await this.prisma.tickets.update({
                        where: { id: ticket.id },
                        data: { metadata: updatedMetadata }
                    });
                    cleanedCount++;
                }
            }
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
                const metadata = subscription.metadata;
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
                        data: { metadata: updatedMetadata }
                    });
                    cleanedCount++;
                }
            }
            const cacheKeys = await this.redis.keys(`${this.CACHE_PREFIX}*`);
            for (const cacheKey of cacheKeys) {
                const cached = await this.redis.getCache(cacheKey);
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
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'OnboardingService.cleanupExpiredKeys', JSON.stringify({}));
            this.logger.endOperation('cleanupExpiredKeys', operationId, false);
            return 0;
        }
    }
};
exports.OnboardingService = OnboardingService;
exports.OnboardingService = OnboardingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        email_service_1.EmailService,
        bullmq_service_1.BullmqService,
        logger_service_1.LoggerService])
], OnboardingService);
//# sourceMappingURL=onboarding.service.js.map