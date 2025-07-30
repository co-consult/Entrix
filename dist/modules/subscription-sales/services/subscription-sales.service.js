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
exports.SubscriptionSalesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const bullmq_service_1 = require("../../../shared/bullmq/bullmq.service");
const hashing_service_1 = require("../../../shared/hashing/hashing.service");
const users_service_1 = require("../../users/services/users.service");
const profiles_service_1 = require("../../users/services/profiles.service");
const sale_types_1 = require("../types/sale-types");
let SubscriptionSalesService = class SubscriptionSalesService {
    prisma;
    redis;
    bullmq;
    hashingService;
    usersService;
    profilesService;
    logger;
    CACHE_PREFIX = 'subscription-sale:';
    QR_CACHE_PREFIX = 'qr-code:';
    CACHE_TTL = 3600;
    constructor(prisma, redis, bullmq, hashingService, usersService, profilesService, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.bullmq = bullmq;
        this.hashingService = hashingService;
        this.usersService = usersService;
        this.profilesService = profilesService;
        this.logger = loggerService.createChildLogger('SubscriptionSalesService');
    }
    async createSubscriptionSale(saleData) {
        const operationId = this.logger.startOperation('createSubscriptionSale', {
            planId: saleData.planId,
            quantity: saleData.quantity,
            saleMode: saleData.saleMode,
            saleChannel: saleData.saleChannel,
        });
        try {
            this.logger.info('Starting subscription sale', JSON.stringify({
                planId: saleData.planId,
                quantity: saleData.quantity,
                saleMode: saleData.saleMode,
                qrCodesCount: saleData.qrCodes.length,
            }));
            await this.validateSaleData(saleData);
            const qrValidations = await this.validateQRCodesAvailability(saleData.qrCodes, saleData.planId);
            const unavailableCodes = qrValidations.filter(v => !v.isAvailable);
            if (unavailableCodes.length > 0) {
                throw new common_1.BadRequestException(`QR codes non disponibles: ${unavailableCodes.map(v => v.qrCode).join(', ')}`);
            }
            const subscriptionPlan = await this.getSubscriptionPlan(saleData.planId);
            let user = null;
            if (saleData.saleMode === sale_types_1.SaleMode.IDENTIFIED && saleData.customerInfo) {
                user = await this.createUserWithProfile(saleData.customerInfo);
            }
            const result = await this.prisma.transactionWithRetry(async (tx) => {
                const order = await this.createOrder(tx, saleData, user?.id, subscriptionPlan);
                const subscriptions = await this.createSubscriptions(tx, saleData, subscriptionPlan, user?.id, order.id);
                await this.createAccessRights(tx, subscriptions, subscriptionPlan);
                await this.assignQRCodes(tx, saleData.qrCodes, saleData.sellerId);
                return { order, subscriptions };
            });
            await this.cacheResults(result, user);
            this.logger.logBusinessEvent('SUBSCRIPTION_SALE_COMPLETED', {
                planId: saleData.planId,
                quantity: saleData.quantity,
                amount: saleData.amount,
                saleMode: saleData.saleMode,
                userId: user?.id,
                orderId: result.order.id,
                subscriptionIds: result.subscriptions.map(s => s.id),
            }, user?.id);
            this.logger.endOperation('createSubscriptionSale', operationId, true);
            return this.buildSaleResult(result, user, saleData);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'SubscriptionSalesService.createSubscriptionSale', undefined, JSON.stringify({ saleData }));
            this.logger.endOperation('createSubscriptionSale', operationId, false);
            throw error;
        }
    }
    async convertAnonymousSubscription(conversionData) {
        const operationId = this.logger.startOperation('convertAnonymousSubscription', {
            onboardingKey: conversionData.onboardingKey,
            email: conversionData.customerInfo.email,
        });
        try {
            this.logger.info('Starting anonymous subscription conversion', JSON.stringify({
                onboardingKey: conversionData.onboardingKey,
                email: conversionData.customerInfo.email,
            }));
            const subscriptions = await this.getSubscriptionsByOnboardingKey(conversionData.onboardingKey);
            if (subscriptions.length === 0) {
                throw new common_1.NotFoundException('Aucun abonnement trouvé avec cette clé d\'onboarding');
            }
            const nonAnonymous = subscriptions.filter(s => s.user_id !== null);
            if (nonAnonymous.length > 0) {
                throw new common_1.ConflictException('Cette clé d\'onboarding a déjà été utilisée');
            }
            const user = await this.createUserWithProfile(conversionData.customerInfo, conversionData.password);
            const migrationResult = await this.prisma.transactionWithRetry(async (tx) => {
                const updatedSubscriptions = await Promise.all(subscriptions.map(subscription => tx.subscriptions.update({
                    where: { id: subscription.id },
                    data: {
                        user_id: user.id,
                        updated_at: new Date(),
                    },
                })));
                await tx.access_rights.updateMany({
                    where: {
                        subscription_id: { in: subscriptions.map(s => s.id) }
                    },
                    data: {
                        user_id: user.id,
                        updated_at: new Date(),
                    },
                });
                await Promise.all(subscriptions.map(subscription => {
                    const currentMetadata = subscription.metadata || {};
                    const updatedMetadata = {
                        ...currentMetadata,
                        onboarding: {
                            ...(currentMetadata.onboarding || {}),
                            used: true,
                            usedAt: new Date().toISOString(),
                            convertedUserId: user.id,
                        },
                    };
                    return tx.subscriptions.update({
                        where: { id: subscription.id },
                        data: {
                            metadata: updatedMetadata,
                        },
                    });
                }));
                return { updatedSubscriptions, subscriptionsCount: subscriptions.length };
            });
            const incentivesApplied = await this.applyOnboardingIncentives(user.id, subscriptions, conversionData.onboardingKey);
            await this.bullmq.addJob('email', 'send-welcome-email', {
                userId: user.id,
                email: user.email,
                firstName: user.firstName,
                subscriptionsCount: migrationResult.subscriptionsCount,
                incentives: incentivesApplied,
            });
            this.logger.logBusinessEvent('ANONYMOUS_SUBSCRIPTION_CONVERTED', {
                userId: user.id,
                email: user.email,
                onboardingKey: conversionData.onboardingKey,
                subscriptionsMigrated: migrationResult.subscriptionsCount,
                incentives: incentivesApplied,
            }, user.id);
            this.logger.endOperation('convertAnonymousSubscription', operationId, true);
            return {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                },
                subscriptionsMigrated: migrationResult.subscriptionsCount,
                incentivesApplied,
                message: `Compte créé avec succès. ${migrationResult.subscriptionsCount} abonnement(s) associé(s) à votre compte.`,
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'SubscriptionSalesService.convertAnonymousSubscription', undefined, JSON.stringify({ conversionData }));
            this.logger.endOperation('convertAnonymousSubscription', operationId, false);
            throw error;
        }
    }
    async validateQRCodesAvailability(qrCodes, planId) {
        try {
            const validations = await Promise.all(qrCodes.map(async (qrCode) => {
                const cacheKey = `${this.QR_CACHE_PREFIX}${qrCode}`;
                const cached = await this.redis.getCache(cacheKey);
                if (cached) {
                    const isAvailable = cached.status === sale_types_1.QRCodeStatus.AVAILABLE;
                    const planMatches = !planId || cached.subscription_plan_id === planId;
                    return {
                        qrCode,
                        isAvailable: isAvailable && planMatches,
                        status: cached.status,
                        assignedAt: cached.assigned_at,
                        errorMessage: !isAvailable
                            ? `QR code ${cached.status.toLowerCase()}`
                            : !planMatches
                                ? 'QR code associé à un autre plan d\'abonnement'
                                : undefined,
                    };
                }
                const physicalQR = await this.prisma.physical_qr_codes.findUnique({
                    where: { qr_code: qrCode },
                });
                if (!physicalQR) {
                    return {
                        qrCode,
                        isAvailable: false,
                        status: 'NOT_FOUND',
                        errorMessage: 'QR code non trouvé',
                    };
                }
                const planMatches = !planId || physicalQR.subscription_plan_id === planId;
                const isAvailable = physicalQR.status === sale_types_1.QRCodeStatus.AVAILABLE;
                await this.redis.setCache(cacheKey, physicalQR, this.CACHE_TTL);
                return {
                    qrCode,
                    isAvailable: isAvailable && planMatches,
                    status: physicalQR.status,
                    assignedAt: physicalQR.assigned_at,
                    errorMessage: !isAvailable
                        ? `QR code ${physicalQR.status.toLowerCase()}`
                        : !planMatches
                            ? 'QR code associé à un autre plan d\'abonnement'
                            : undefined,
                };
            }));
            return validations;
        }
        catch (error) {
            this.logger.error('Error validating QR codes availability', error.stack);
            throw new common_1.InternalServerErrorException('Erreur lors de la validation des QR codes');
        }
    }
    async getAvailableQRCodes(planId, quantity) {
        try {
            const availableQRs = await this.prisma.physical_qr_codes.findMany({
                where: {
                    status: sale_types_1.QRCodeStatus.AVAILABLE,
                    subscription_plan_id: planId,
                },
                take: quantity,
                orderBy: { created_at: 'asc' },
            });
            if (availableQRs.length < quantity) {
                throw new common_1.BadRequestException(`Seulement ${availableQRs.length} QR codes disponibles pour ce plan sur ${quantity} demandés`);
            }
            return availableQRs.map(qr => ({
                qrCode: qr.qr_code,
                onboardingKey: qr.onboarding_key,
                serialNumber: qr.serial_number,
                subscriptionPlanId: qr.subscription_plan_id,
                status: qr.status,
                cardBatch: qr.card_batch,
                cardType: qr.card_type,
                assignedBy: qr.assigned_by,
            }));
        }
        catch (error) {
            this.logger.error('Error getting available QR codes', error.stack);
            throw error;
        }
    }
    async getSaleDetails(saleId) {
        try {
            const order = await this.prisma.orders.findUnique({
                where: { id: saleId },
                include: {
                    order_items: true,
                    users: true,
                },
            });
            if (!order) {
                throw new common_1.NotFoundException('Vente non trouvée');
            }
            const subscriptions = await this.prisma.subscriptions.findMany({
                where: {
                    id: { in: order.order_items.map(item => item.subscription_plan_id).filter(Boolean) }
                },
                include: {
                    subscription_plans: true,
                    access_rights: true,
                },
            });
            return {
                order,
                subscriptions,
            };
        }
        catch (error) {
            this.logger.error('Error getting sale details', error.stack);
            throw error;
        }
    }
    async getSubscriptionsByOnboardingKey(onboardingKey) {
        try {
            const subscriptions = await this.prisma.subscriptions.findMany({
                where: {
                    metadata: {
                        path: ['onboarding', 'secretKey'],
                        equals: onboardingKey
                    }
                },
                include: {
                    subscription_plans: true,
                    access_rights: true,
                },
            });
            return subscriptions;
        }
        catch (error) {
            this.logger.error('Error getting subscriptions by onboarding key', error.stack);
            throw error;
        }
    }
    async validateSaleData(saleData) {
        if (saleData.qrCodes.length !== saleData.quantity) {
            throw new common_1.BadRequestException(`Incohérence: ${saleData.quantity} abonnements demandés mais ${saleData.qrCodes.length} QR codes fournis`);
        }
        if (saleData.saleMode === sale_types_1.SaleMode.IDENTIFIED && !saleData.customerInfo) {
            throw new common_1.BadRequestException('Informations client requises pour une vente identifiée');
        }
        if (saleData.amount <= 0) {
            throw new common_1.BadRequestException('Le montant doit être positif');
        }
    }
    async getSubscriptionPlan(planId) {
        const plan = await this.prisma.subscription_plans.findUnique({
            where: { id: planId },
            include: {
                organizers: true,
            },
        });
        if (!plan) {
            throw new common_1.NotFoundException('Plan d\'abonnement non trouvé');
        }
        if (!plan.is_active) {
            throw new common_1.BadRequestException('Plan d\'abonnement inactif');
        }
        const now = new Date();
        if (plan.sale_start_date && now < plan.sale_start_date) {
            throw new common_1.BadRequestException('Vente pas encore ouverte pour ce plan');
        }
        if (plan.sale_end_date && now > plan.sale_end_date) {
            throw new common_1.BadRequestException('Vente fermée pour ce plan');
        }
        return plan;
    }
    async createUserWithProfile(customerInfo, password) {
        const userPassword = password || this.generateRandomPassword();
        const user = await this.usersService.create({
            email: customerInfo.email,
            password: userPassword,
            firstName: customerInfo.firstName,
            lastName: customerInfo.lastName,
            phone: customerInfo.phone,
            isActive: true,
            emailVerified: false,
            phoneVerified: false,
        });
        if (customerInfo.fanId) {
            await this.profilesService.create({
                userId: user.id,
                fanId: customerInfo.fanId,
                language: 'fr',
                country: 'TN',
            });
        }
        return user;
    }
    async createOrder(tx, saleData, userId, plan) {
        return await tx.orders.create({
            data: {
                user_id: userId,
                organizer_id: plan.organizer_id,
                order_type: 'SUBSCRIPTION',
                status: 'CONFIRMED',
                total: saleData.amount,
                currency: saleData.currency,
                channel: saleData.saleChannel,
                purchase_channel: saleData.saleChannel === 'PHYSICAL' ? 'PHYSICAL' : 'ONLINE',
                payment_method: saleData.paymentMethod,
                metadata: {
                    ...saleData.metadata,
                    sellerId: saleData.sellerId,
                    qrCodes: saleData.qrCodes,
                },
                confirmed_at: new Date(),
                completed_at: new Date(),
            },
        });
    }
    async createSubscriptions(tx, saleData, plan, userId, orderId) {
        const subscriptions = [];
        for (let i = 0; i < saleData.quantity; i++) {
            const qrCode = saleData.qrCodes[i];
            const physicalQR = await tx.physical_qr_codes.findUnique({
                where: { qr_code: qrCode },
            });
            const subscription = await tx.subscriptions.create({
                data: {
                    plan_id: plan.id,
                    user_id: userId,
                    guest_name: saleData.customerInfo ?
                        `${saleData.customerInfo.firstName} ${saleData.customerInfo.lastName}` : null,
                    guest_email: saleData.customerInfo?.email || null,
                    guest_phone: saleData.customerInfo?.phone || null,
                    qr_code: qrCode,
                    organizer_id: plan.organizer_id,
                    status: 'ACTIVE',
                    start_date: plan.valid_from,
                    end_date: plan.valid_until,
                    price_paid: saleData.amount / saleData.quantity,
                    currency: saleData.currency,
                    metadata: {
                        orderId,
                        saleMode: saleData.saleMode,
                        saleChannel: saleData.saleChannel,
                        onboarding: {
                            secretKey: physicalQR.onboarding_key,
                            campaignId: physicalQR.metadata?.campaignId || `sale_${plan.type.toLowerCase()}`,
                            incentiveType: physicalQR.metadata?.incentives?.type || 'BONUS_POINTS',
                            incentiveValue: physicalQR.metadata?.incentives?.value || 50,
                            description: physicalQR.metadata?.incentives?.description || 'Bonus inscription',
                            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                            used: saleData.saleMode === sale_types_1.SaleMode.IDENTIFIED,
                            contactMethod: saleData.customerInfo?.email ? 'email' : 'none',
                            communicationSent: false,
                            createdAt: new Date().toISOString(),
                        },
                    },
                },
            });
            subscriptions.push(subscription);
            await tx.order_items.create({
                data: {
                    order_id: orderId,
                    subscription_plan_id: plan.id,
                    item_type: 'SUBSCRIPTION',
                    item_name: plan.name,
                    quantity: 1,
                    unit_price: saleData.amount / saleData.quantity,
                    total_price: saleData.amount / saleData.quantity,
                    currency: saleData.currency,
                },
            });
        }
        return subscriptions;
    }
    async createAccessRights(tx, subscriptions, plan) {
        for (const subscription of subscriptions) {
            await tx.access_rights.create({
                data: {
                    qr_code: subscription.qr_code,
                    user_id: subscription.user_id,
                    subscription_id: subscription.id,
                    subscription_plan_id: plan.id,
                    organizer_id: plan.organizer_id,
                    access_type: 'SUBSCRIPTION',
                    status: 'ACTIVE',
                    valid_from: plan.valid_from,
                    valid_until: plan.valid_until,
                    max_uses: 999999,
                    current_uses: 0,
                    benefits: plan.benefits,
                    metadata: {
                        subscriptionType: plan.type,
                        planName: plan.name,
                    },
                },
            });
        }
    }
    async assignQRCodes(tx, qrCodes, assignedBy) {
        await tx.physical_qr_codes.updateMany({
            where: { qr_code: { in: qrCodes } },
            data: {
                status: sale_types_1.QRCodeStatus.ASSIGNED,
                assigned_at: new Date(),
                assigned_by: assignedBy || null,
            },
        });
        for (const qrCode of qrCodes) {
            const cacheKey = `${this.QR_CACHE_PREFIX}${qrCode}`;
            await this.redis.delCache(cacheKey);
        }
    }
    async cacheResults(result, user) {
        const cacheKey = `${this.CACHE_PREFIX}${result.order.id}`;
        await this.redis.setCache(cacheKey, {
            order: result.order,
            subscriptions: result.subscriptions,
            user
        }, this.CACHE_TTL);
    }
    buildSaleResult(result, user, saleData) {
        return {
            success: true,
            subscriptions: result.subscriptions.map((sub) => ({
                id: sub.id,
                qrCode: sub.qr_code,
                onboardingKey: sub.metadata?.onboarding?.secretKey || 'N/A',
            })),
            user: user ? {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
            } : undefined,
            order: {
                id: result.order.id,
                total: result.order.total,
                currency: result.order.currency,
            },
            message: saleData.saleMode === sale_types_1.SaleMode.IDENTIFIED
                ? `Vente réalisée avec succès. ${saleData.quantity} abonnement(s) créé(s) et associé(s) au compte client.`
                : `Vente anonyme réalisée avec succès. ${saleData.quantity} abonnement(s) créé(s). Le client peut créer son compte avec les clés d'onboarding.`,
        };
    }
    async applyOnboardingIncentives(userId, subscriptions, onboardingKey) {
        try {
            const firstSubscription = subscriptions[0];
            const onboardingData = firstSubscription?.metadata?.onboarding;
            if (!onboardingData) {
                this.logger.warn('No onboarding data found in subscription metadata', JSON.stringify({
                    subscriptionId: firstSubscription?.id,
                    onboardingKey
                }));
                return null;
            }
            const incentiveType = onboardingData.incentiveType || 'BONUS_POINTS';
            const incentiveValue = onboardingData.incentiveValue || 50;
            const description = onboardingData.description || 'Bonus inscription';
            this.logger.logBusinessEvent('ONBOARDING_INCENTIVE_APPLIED', {
                userId,
                onboardingKey,
                incentiveType,
                incentiveValue,
                description,
                subscriptionsCount: subscriptions.length,
            }, userId);
            return {
                type: incentiveType,
                value: incentiveValue,
                description: description,
            };
        }
        catch (error) {
            this.logger.error('Error applying onboarding incentives', error.stack);
            return null;
        }
    }
    generateRandomPassword() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!%*?&';
        let password = '';
        password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
        password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
        password += '0123456789'[Math.floor(Math.random() * 10)];
        password += '@$!%*?&'[Math.floor(Math.random() * 7)];
        for (let i = 4; i < 12; i++) {
            password += chars[Math.floor(Math.random() * chars.length)];
        }
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }
};
exports.SubscriptionSalesService = SubscriptionSalesService;
exports.SubscriptionSalesService = SubscriptionSalesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        bullmq_service_1.BullmqService,
        hashing_service_1.HashingService,
        users_service_1.UsersService,
        profiles_service_1.ProfilesService,
        logger_service_1.LoggerService])
], SubscriptionSalesService);
//# sourceMappingURL=subscription-sales.service.js.map