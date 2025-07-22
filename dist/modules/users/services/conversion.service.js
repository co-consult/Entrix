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
exports.ConversionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const email_service_1 = require("../../../shared/email/email.service");
const bullmq_service_1 = require("../../../shared/bullmq/bullmq.service");
const bcrypt = __importStar(require("bcrypt"));
const enums_1 = require("../types/enums");
let ConversionService = class ConversionService {
    prisma;
    redis;
    email;
    bullmq;
    logger;
    ONBOARDING_PREFIX = 'onboarding:';
    CACHE_TTL = 3600;
    constructor(prisma, redis, email, bullmq, logger) {
        this.prisma = prisma;
        this.redis = redis;
        this.email = email;
        this.bullmq = bullmq;
        this.logger = logger.createChildLogger('ConversionService');
    }
    async validateOnboardingKey(key) {
        const operationId = this.logger.startOperation('validateOnboardingKey', { key });
        try {
            this.logger.info('Validating onboarding key', JSON.stringify({ key }));
            const cacheKey = `${this.ONBOARDING_PREFIX}${key}`;
            const cached = await this.redis.getCache(cacheKey);
            if (cached) {
                this.logger.logCacheEvent('hit', cacheKey);
                this.logger.endOperation('validateOnboardingKey', operationId, true);
                return cached;
            }
            this.logger.logCacheEvent('miss', cacheKey);
            const order = await this.prisma.orders.findFirst({
                where: {
                    user_id: null,
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
                const result = {
                    isValid: false,
                    isExpired: false,
                    isUsed: false,
                    errors: ['Clé d\'onboarding non trouvée ou invalide'],
                };
                await this.redis.setCache(cacheKey, result, this.CACHE_TTL);
                this.logger.endOperation('validateOnboardingKey', operationId, false);
                return result;
            }
            const metadata = order.metadata;
            const onboardingData = metadata?.onboarding;
            if (!onboardingData) {
                const result = {
                    isValid: false,
                    isExpired: false,
                    isUsed: false,
                    errors: ['Données d\'onboarding manquantes'],
                };
                await this.redis.setCache(cacheKey, result, this.CACHE_TTL);
                this.logger.endOperation('validateOnboardingKey', operationId, false);
                return result;
            }
            if (onboardingData.used === true) {
                const result = {
                    isValid: false,
                    isExpired: false,
                    isUsed: true,
                    errors: ['Clé d\'onboarding déjà utilisée'],
                };
                await this.redis.setCache(cacheKey, result, this.CACHE_TTL);
                this.logger.endOperation('validateOnboardingKey', operationId, false);
                return result;
            }
            const expiresAt = onboardingData.expires_at ?
                new Date(onboardingData.expires_at) : null;
            const isExpired = expiresAt && expiresAt < new Date();
            if (isExpired) {
                const result = {
                    isValid: false,
                    isExpired: true,
                    isUsed: false,
                    errors: ['Clé d\'onboarding expirée'],
                };
                await this.redis.setCache(cacheKey, result, this.CACHE_TTL);
                this.logger.endOperation('validateOnboardingKey', operationId, false);
                return result;
            }
            const result = {
                isValid: true,
                isExpired: false,
                isUsed: false,
                incentiveDetails: {
                    type: onboardingData.incentive_type,
                    value: onboardingData.incentive_value || 0,
                    description: onboardingData.incentive_description || '',
                },
            };
            await this.redis.setCache(cacheKey, result, this.CACHE_TTL);
            this.logger.logCacheEvent('set', cacheKey, this.CACHE_TTL);
            this.logger.endOperation('validateOnboardingKey', operationId, true);
            return result;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'ConversionService.validateOnboardingKey', undefined, JSON.stringify({ key }));
            this.logger.endOperation('validateOnboardingKey', operationId, false);
            throw new common_1.BadRequestException('Erreur lors de la validation de la clé d\'onboarding');
        }
    }
    async convertToRegistered(conversionData) {
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
            const keyValidation = await this.validateOnboardingKey(conversionData.onboardingKey);
            if (!keyValidation.isValid) {
                const result = {
                    success: false,
                    incentiveApplied: false,
                    errors: keyValidation.errors,
                };
                this.logger.endOperation('convertToRegistered', operationId, false);
                return result;
            }
            const existingUser = await this.prisma.users.findUnique({
                where: { email: conversionData.userData.email },
            });
            if (existingUser) {
                const result = {
                    success: false,
                    incentiveApplied: false,
                    errors: ['Un compte avec cet email existe déjà'],
                };
                this.logger.endOperation('convertToRegistered', operationId, false);
                return result;
            }
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
                throw new common_1.NotFoundException('Commande source introuvable');
            }
            if (sourceOrder.guest_email &&
                sourceOrder.guest_email.toLowerCase() !== conversionData.userData.email.toLowerCase()) {
                const result = {
                    success: false,
                    incentiveApplied: false,
                    errors: ['L\'email ne correspond pas à celui utilisé lors de l\'achat anonyme'],
                };
                this.logger.endOperation('convertToRegistered', operationId, false);
                return result;
            }
            const result = await this.prisma.$transaction(async (tx) => {
                const hashedPassword = await bcrypt.hash(conversionData.userData.password, 12);
                const newUser = await tx.users.create({
                    data: {
                        email: conversionData.userData.email,
                        first_name: conversionData.userData.firstName,
                        last_name: conversionData.userData.lastName,
                        phone: conversionData.userData.phone,
                        password: hashedPassword,
                        email_verified: null,
                        is_active: true,
                    },
                });
                let userProfile = null;
                if (conversionData.profileData) {
                    userProfile = await tx.user_profiles.create({
                        data: {
                            user_id: newUser.id,
                            city: conversionData.profileData.city,
                            country: conversionData.profileData.country,
                            language: conversionData.profileData.language || 'fr-TN',
                            date_of_birth: conversionData.profileData.dateOfBirth,
                        },
                    });
                }
                const ordersUpdate = await tx.orders.updateMany({
                    where: {
                        user_id: null,
                        guest_email: sourceOrder.guest_email,
                    },
                    data: {
                        user_id: newUser.id,
                    },
                });
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
                    .map(item => item.ticket_type_id);
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
                const orderItemsWithSubscriptions = await tx.order_items.findMany({
                    where: {
                        orders: {
                            user_id: newUser.id,
                            guest_email: sourceOrder.guest_email,
                        },
                        subscription_plan_id: { not: null },
                    },
                    select: { subscription_plan_id: true },
                });
                const subscriptionPlanIds = orderItemsWithSubscriptions
                    .filter(item => item.subscription_plan_id)
                    .map(item => item.subscription_plan_id);
                let subscriptionsUpdate = { count: 0 };
                if (subscriptionPlanIds.length > 0) {
                    subscriptionsUpdate = await tx.subscriptions.updateMany({
                        where: {
                            user_id: null,
                            plan_id: {
                                in: subscriptionPlanIds,
                            },
                        },
                        data: {
                            user_id: newUser.id,
                        },
                    });
                }
                const currentMetadata = sourceOrder.metadata || {};
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
            let incentiveApplied = false;
            if (keyValidation.incentiveDetails && keyValidation.incentiveDetails.value > 0) {
                try {
                    await this.applyIncentive(result.user.id, keyValidation.incentiveDetails.type, keyValidation.incentiveDetails.value, keyValidation.incentiveDetails.description);
                    incentiveApplied = true;
                }
                catch (error) {
                    this.logger.logErrorEvent(error, 'ConversionService.applyIncentive', result.user.id, JSON.stringify({
                        incentiveType: keyValidation.incentiveDetails.type,
                        incentiveValue: keyValidation.incentiveDetails.value,
                    }));
                }
            }
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
            const cacheKey = `${this.ONBOARDING_PREFIX}${conversionData.onboardingKey}`;
            await this.redis.del(cacheKey);
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
            const conversionResult = {
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
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'ConversionService.convertToRegistered', undefined, JSON.stringify({
                onboardingKey: conversionData.onboardingKey,
                email: conversionData.userData.email,
            }));
            this.logger.endOperation('convertToRegistered', operationId, false);
            throw new common_1.BadRequestException('Erreur lors de la conversion de l\'utilisateur');
        }
    }
    async generateOnboardingKey(data) {
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
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'ConversionService.generateOnboardingKey', undefined, JSON.stringify(data));
            throw new common_1.BadRequestException('Erreur lors de la génération de la clé d\'onboarding');
        }
    }
    async applyIncentive(userId, incentiveType, value, description) {
        try {
            switch (incentiveType) {
                case enums_1.IncentiveType.BONUS_POINTS:
                    await this.bullmq.addJob('LOYALTY_QUEUE', 'ADD_BONUS_POINTS', {
                        userId,
                        points: value,
                        source: 'ONBOARDING_CONVERSION',
                        description,
                    });
                    break;
                case enums_1.IncentiveType.DISCOUNT_NEXT:
                    await this.bullmq.addJob('COUPON_QUEUE', 'CREATE_DISCOUNT_COUPON', {
                        userId,
                        discountAmount: value,
                        source: 'ONBOARDING_CONVERSION',
                        description,
                        expiresIn: 30,
                    });
                    break;
                case enums_1.IncentiveType.FREE_UPGRADE:
                    await this.bullmq.addJob('USER_QUEUE', 'GRANT_FREE_UPGRADE', {
                        userId,
                        upgradeValue: value,
                        source: 'ONBOARDING_CONVERSION',
                        description,
                    });
                    break;
                case enums_1.IncentiveType.EXCLUSIVE_ACCESS:
                    await this.bullmq.addJob('USER_QUEUE', 'GRANT_EXCLUSIVE_ACCESS', {
                        userId,
                        accessLevel: value,
                        source: 'ONBOARDING_CONVERSION',
                        description,
                    });
                    break;
                case enums_1.IncentiveType.GIFT_VOUCHER:
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
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'ConversionService.applyIncentive', userId, JSON.stringify({ incentiveType, value, description }));
            throw error;
        }
    }
    async getConversionStats(period) {
        const operationId = this.logger.startOperation('getConversionStats', period);
        try {
            const startDate = period?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const endDate = period?.to || new Date();
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
            const stats = {
                totalAnonymous: totalAnonymousWithKeys,
                totalConverted,
                conversionRate,
                averageConversionTime: 0,
                conversionsByIncentive: [],
                conversionTrend: [],
                topIncentives: [],
            };
            this.logger.endOperation('getConversionStats', operationId, true);
            return stats;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'ConversionService.getConversionStats', undefined, JSON.stringify(period));
            this.logger.endOperation('getConversionStats', operationId, false);
            throw new common_1.BadRequestException('Erreur lors de la récupération des statistiques');
        }
    }
};
exports.ConversionService = ConversionService;
exports.ConversionService = ConversionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        email_service_1.EmailService,
        bullmq_service_1.BullmqService,
        logger_service_1.LoggerService])
], ConversionService);
//# sourceMappingURL=conversion.service.js.map