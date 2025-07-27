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
exports.AnonymousConversionProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const email_service_1 = require("../../../shared/email/email.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const enums_1 = require("../types/enums");
let AnonymousConversionProcessor = class AnonymousConversionProcessor {
    prisma;
    emailService;
    redisService;
    logger;
    constructor(prisma, emailService, redisService, logger) {
        this.prisma = prisma;
        this.emailService = emailService;
        this.redisService = redisService;
        this.logger = logger.createChildLogger('AnonymousConversionProcessor');
    }
    async processConversion(job) {
        const { userId, anonymousId, onboardingKey, incentiveType, incentiveValue, incentiveDescription, conversionMetadata } = job.data;
        this.logger.info('Processing anonymous user conversion', JSON.stringify({
            jobId: job.id,
            userId,
            anonymousId,
            incentiveType,
            incentiveValue,
            source: conversionMetadata.source,
        }));
        try {
            const result = await this.prisma.transactionWithRetry(async (tx) => {
                const user = await tx.users.findUnique({
                    where: { id: userId },
                    select: {
                        id: true,
                        email: true,
                        first_name: true,
                        last_name: true,
                        is_active: true,
                        created_at: true,
                    },
                });
                if (!user || !user.is_active) {
                    throw new Error(`User ${userId} not found or inactive`);
                }
                const ordersUpdate = await tx.orders.updateMany({
                    where: {
                        AND: [
                            { user_id: null },
                            { guest_email: user.email },
                        ],
                    },
                    data: {
                        user_id: user.id,
                        metadata: {
                            migratedFrom: 'anonymous',
                            originalGuestEmail: user.email,
                            migrationDate: new Date(),
                            onboardingKey,
                        },
                    },
                });
                const ordersMigrated = ordersUpdate.count || 0;
                const ticketsUpdate = await tx.tickets.updateMany({
                    where: {
                        user_id: null,
                        access_rights: {
                            some: {},
                        },
                    },
                    data: {
                        user_id: user.id,
                        metadata: {
                            migratedFrom: 'anonymous',
                            originalGuestEmail: user.email,
                            migrationDate: new Date(),
                            onboardingKey,
                        },
                    },
                });
                const subscriptionsUpdate = await tx.subscriptions.updateMany({
                    where: {
                        AND: [
                            { user_id: null },
                            {
                                metadata: {
                                    path: ['guestEmail'],
                                    equals: user.email,
                                },
                            },
                        ],
                    },
                    data: {
                        user_id: user.id,
                        metadata: {
                            migratedFrom: 'anonymous',
                            originalGuestEmail: user.email,
                            migrationDate: new Date(),
                            onboardingKey,
                        },
                    },
                });
                const ticketsMigrated = ticketsUpdate.count || 0;
                const subscriptionsMigrated = subscriptionsUpdate.count || 0;
                const migratedOrders = await tx.orders.findMany({
                    where: {
                        user_id: user.id,
                        metadata: {
                            path: ['onboardingKey'],
                            equals: onboardingKey,
                        },
                    },
                    select: { total_amount: true },
                });
                const migratedTickets = await tx.tickets.findMany({
                    where: {
                        user_id: user.id,
                        metadata: {
                            path: ['onboardingKey'],
                            equals: onboardingKey,
                        },
                    },
                    select: { price_paid: true },
                });
                const migratedSubscriptions = await tx.subscriptions.findMany({
                    where: {
                        user_id: user.id,
                        metadata: {
                            path: ['onboardingKey'],
                            equals: onboardingKey,
                        },
                    },
                    select: { price_paid: true },
                });
                const totalValue = [
                    ...migratedOrders.map(o => Number(o.total_amount) || 0),
                    ...migratedTickets.map(t => Number(t.price_paid) || 0),
                    ...migratedSubscriptions.map(s => Number(s.price_paid) || 0),
                ].reduce((sum, value) => sum + value, 0);
                this.logger.info('Anonymous conversion data migration completed', JSON.stringify({
                    userId,
                    ordersMigrated,
                    ticketsMigrated,
                    subscriptionsMigrated,
                    totalValue,
                    jobId: job.id,
                }));
                return {
                    user,
                    migrationSummary: {
                        ticketsMigrated,
                        subscriptionsMigrated,
                        ordersMigrated,
                        totalValue,
                    },
                };
            });
            await this.invalidateUserCaches(result.user.email, result.user.id);
            if (incentiveType && incentiveValue) {
                await this.applyConversionIncentive(result.user.id, incentiveType, incentiveValue, incentiveDescription);
            }
            await this.sendConversionConfirmationEmail({
                userId: result.user.id,
                email: result.user.email,
                firstName: result.user.first_name,
                lastName: result.user.last_name,
                incentiveApplied: {
                    type: incentiveType,
                    value: incentiveValue,
                    description: incentiveDescription,
                },
                migrationSummary: result.migrationSummary,
            });
            this.logger.logBusinessEvent('ANONYMOUS_USER_CONVERTED', {
                userId: result.user.id,
                anonymousId,
                onboardingKey,
                incentiveType,
                incentiveValue,
                source: conversionMetadata.source,
                ticketsMigrated: result.migrationSummary.ticketsMigrated,
                subscriptionsMigrated: result.migrationSummary.subscriptionsMigrated,
                ordersMigrated: result.migrationSummary.ordersMigrated,
                totalValue: result.migrationSummary.totalValue,
            }, result.user.id);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AnonymousConversionProcessor.processConversion', userId, JSON.stringify({
                originalJobData: job.data,
            }));
            throw error;
        }
    }
    async processIncentiveApplication(job) {
        const { userId, incentiveType, incentiveValue, description, sourceType, sourceId, expiresAt } = job.data;
        this.logger.info('Processing incentive application', JSON.stringify({
            jobId: job.id,
            userId,
            incentiveType,
            incentiveValue,
            sourceType,
        }));
        try {
            const user = await this.prisma.users.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    first_name: true,
                    is_active: true
                },
            });
            if (!user || !user.is_active) {
                throw new Error(`User ${userId} not found or inactive`);
            }
            let incentiveApplied = false;
            switch (incentiveType) {
                case enums_1.IncentiveType.BONUS_POINTS:
                    incentiveApplied = await this.applyBonusPoints(userId, incentiveValue, description, expiresAt);
                    break;
                case enums_1.IncentiveType.DISCOUNT_NEXT:
                    incentiveApplied = await this.applyDiscountCoupon(userId, incentiveValue, description, expiresAt);
                    break;
                case enums_1.IncentiveType.FREE_UPGRADE:
                    incentiveApplied = await this.applyFreeUpgrade(userId, incentiveValue, description, expiresAt);
                    break;
                case enums_1.IncentiveType.EXCLUSIVE_ACCESS:
                    incentiveApplied = await this.applyExclusiveAccess(userId, incentiveValue, description, expiresAt);
                    break;
                case enums_1.IncentiveType.GIFT_VOUCHER:
                    incentiveApplied = await this.applyGiftVoucher(userId, incentiveValue, description, expiresAt);
                    break;
                default:
                    this.logger.warn('Unknown incentive type', JSON.stringify({ incentiveType, userId }));
                    break;
            }
            if (incentiveApplied) {
                this.logger.logBusinessEvent('INCENTIVE_APPLIED', {
                    userId,
                    incentiveType,
                    incentiveValue,
                    description,
                    sourceType,
                    sourceId,
                }, userId);
                this.logger.info('Incentive applied successfully', JSON.stringify({
                    userId,
                    incentiveType,
                    incentiveValue,
                    jobId: job.id,
                }));
            }
            else {
                this.logger.warn('Failed to apply incentive', JSON.stringify({
                    userId,
                    incentiveType,
                    incentiveValue,
                    jobId: job.id,
                }));
            }
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AnonymousConversionProcessor.processIncentiveApplication', userId, JSON.stringify({
                originalJobData: job.data,
            }));
            throw error;
        }
    }
    async processSendConversionEmail(job) {
        const { userId, email, firstName, lastName, incentiveApplied, migrationSummary } = job.data;
        this.logger.info('Processing conversion confirmation email', JSON.stringify({
            jobId: job.id,
            userId,
            email,
        }));
        try {
            await this.emailService.sendEmail({
                to: email,
                subject: '🎉 Bienvenue sur Entrix ! Votre conversion est réussie',
                template: 'anonymous-conversion',
                context: {
                    firstName,
                    lastName,
                    incentiveApplied,
                    migrationSummary,
                    dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
                    supportUrl: `${process.env.FRONTEND_URL}/support`,
                    incentiveUsageInstructions: this.getIncentiveUsageInstructions(incentiveApplied.type),
                },
            });
            this.logger.logNotificationEvent('sent', 'email', email, job.id.toString(), {
                emailType: 'conversion-confirmation',
                userId,
                incentiveType: incentiveApplied.type,
            });
            this.logger.info('Conversion email sent successfully', JSON.stringify({
                userId,
                email,
                jobId: job.id,
            }));
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AnonymousConversionProcessor.processSendConversionEmail', userId, JSON.stringify({
                originalJobData: job.data,
            }));
            await this.notifyConversionEmailFailure(job.data, error);
            throw error;
        }
    }
    async invalidateUserCaches(email, userId) {
        try {
            await Promise.all([
                this.redisService.delCache(`user:${userId}`),
                this.redisService.delCache(`user:email:${email}`),
                this.redisService.delCache(`user:profile:${userId}`),
                this.redisService.delCache(`user:groups:${userId}`),
                this.redisService.delCache(`user:permissions:${userId}`),
            ]);
            this.logger.logCacheEvent('del', `user-conversion-${userId}`);
        }
        catch (error) {
            this.logger.warn('Failed to invalidate user caches', JSON.stringify({
                userId,
                email,
                error: error.message
            }));
        }
    }
    async applyConversionIncentive(userId, incentiveType, incentiveValue, description) {
        try {
            const expiresAt = new Date();
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
            switch (incentiveType) {
                case enums_1.IncentiveType.BONUS_POINTS:
                    await this.applyBonusPoints(userId, incentiveValue, description, expiresAt);
                    break;
                case enums_1.IncentiveType.DISCOUNT_NEXT:
                    await this.applyDiscountCoupon(userId, incentiveValue, description, expiresAt);
                    break;
                case enums_1.IncentiveType.FREE_UPGRADE:
                    await this.applyFreeUpgrade(userId, incentiveValue, description, expiresAt);
                    break;
                case enums_1.IncentiveType.EXCLUSIVE_ACCESS:
                    await this.applyExclusiveAccess(userId, incentiveValue, description, expiresAt);
                    break;
                case enums_1.IncentiveType.GIFT_VOUCHER:
                    await this.applyGiftVoucher(userId, incentiveValue, description, expiresAt);
                    break;
            }
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AnonymousConversionProcessor.applyConversionIncentive', userId, JSON.stringify({
                incentiveType,
                incentiveValue,
                description,
            }));
        }
    }
    async applyBonusPoints(userId, points, description, expiresAt) {
        try {
            await this.prisma.executeWithRetry(async () => {
                await this.prisma.audit_logs.create({
                    data: {
                        user_id: userId,
                        table_name: 'loyalty_points',
                        action: 'CREATE',
                        new_values: {
                            userId,
                            points,
                            source: 'CONVERSION_BONUS',
                            description,
                            expiresAt,
                        },
                        description: `Bonus points applied: ${points} points`,
                    },
                });
            });
            this.logger.info('Bonus points applied successfully', JSON.stringify({
                userId,
                points,
                description,
            }));
            return true;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AnonymousConversionProcessor.applyBonusPoints', userId, JSON.stringify({ points, description }));
            return false;
        }
    }
    async applyDiscountCoupon(userId, discountPercent, description, expiresAt) {
        try {
            await this.prisma.executeWithRetry(async () => {
                await this.prisma.audit_logs.create({
                    data: {
                        user_id: userId,
                        table_name: 'user_coupons',
                        action: 'CREATE',
                        new_values: {
                            userId,
                            discountPercent,
                            source: 'CONVERSION_BONUS',
                            description,
                            expiresAt,
                            isActive: true,
                        },
                        description: `Discount coupon applied: ${discountPercent}%`,
                    },
                });
            });
            return true;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AnonymousConversionProcessor.applyDiscountCoupon', userId, JSON.stringify({ discountPercent, description }));
            return false;
        }
    }
    async applyFreeUpgrade(userId, upgradeCount, description, expiresAt) {
        try {
            await this.prisma.executeWithRetry(async () => {
                await this.prisma.audit_logs.create({
                    data: {
                        user_id: userId,
                        table_name: 'user_upgrades',
                        action: 'CREATE',
                        new_values: {
                            userId,
                            upgradeCount,
                            source: 'CONVERSION_BONUS',
                            description,
                            expiresAt,
                            isActive: true,
                        },
                        description: `Free upgrade applied: ${upgradeCount} upgrades`,
                    },
                });
            });
            return true;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AnonymousConversionProcessor.applyFreeUpgrade', userId, JSON.stringify({ upgradeCount, description }));
            return false;
        }
    }
    async applyExclusiveAccess(userId, durationDays, description, expiresAt) {
        try {
            await this.prisma.executeWithRetry(async () => {
                await this.prisma.audit_logs.create({
                    data: {
                        user_id: userId,
                        table_name: 'user_exclusive_access',
                        action: 'CREATE',
                        new_values: {
                            userId,
                            durationDays,
                            source: 'CONVERSION_BONUS',
                            description,
                            expiresAt,
                            isActive: true,
                        },
                        description: `Exclusive access applied: ${durationDays} days`,
                    },
                });
            });
            return true;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AnonymousConversionProcessor.applyExclusiveAccess', userId, JSON.stringify({ durationDays, description }));
            return false;
        }
    }
    async applyGiftVoucher(userId, amount, description, expiresAt) {
        try {
            await this.prisma.executeWithRetry(async () => {
                await this.prisma.audit_logs.create({
                    data: {
                        user_id: userId,
                        table_name: 'user_vouchers',
                        action: 'CREATE',
                        new_values: {
                            userId,
                            amount,
                            currency: 'TND',
                            source: 'CONVERSION_BONUS',
                            description,
                            expiresAt: expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                            isActive: true,
                        },
                        description: `Gift voucher applied: ${amount} TND`,
                    },
                });
            });
            return true;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AnonymousConversionProcessor.applyGiftVoucher', userId, JSON.stringify({ amount, description }));
            return false;
        }
    }
    async sendConversionConfirmationEmail(data) {
        try {
            await this.emailService.sendEmail({
                to: data.email,
                subject: '🎉 Bienvenue sur Entrix ! Votre conversion est réussie',
                template: 'anonymous-conversion',
                context: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    incentiveApplied: data.incentiveApplied,
                    migrationSummary: data.migrationSummary,
                    dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
                    supportUrl: `${process.env.FRONTEND_URL}/support`,
                    incentiveTypeLabel: this.getIncentiveTypeLabel(data.incentiveApplied.type),
                    incentiveUsageInstructions: this.getIncentiveUsageInstructions(data.incentiveApplied.type),
                },
            });
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AnonymousConversionProcessor.sendConversionConfirmationEmail', data.userId, JSON.stringify({ email: data.email }));
            throw error;
        }
    }
    async notifyConversionEmailFailure(jobData, error) {
        try {
            this.logger.logErrorEvent(error, 'AnonymousConversionProcessor.notifyConversionFailure', jobData.userId, JSON.stringify({
                originalJobData: jobData,
            }));
        }
        catch (notificationError) {
            this.logger.logErrorEvent(notificationError, 'AnonymousConversionProcessor.notifyConversionFailure', jobData.userId);
        }
    }
    getIncentiveTypeLabel(type) {
        const labels = {
            [enums_1.IncentiveType.BONUS_POINTS]: 'Points Bonus',
            [enums_1.IncentiveType.DISCOUNT_NEXT]: 'Réduction',
            [enums_1.IncentiveType.FREE_UPGRADE]: 'Surclassement Gratuit',
            [enums_1.IncentiveType.EXCLUSIVE_ACCESS]: 'Accès Exclusif',
            [enums_1.IncentiveType.GIFT_VOUCHER]: 'Bon d\'Achat',
        };
        return labels[type] || type;
    }
    getIncentiveUsageInstructions(type) {
        const instructions = {
            [enums_1.IncentiveType.BONUS_POINTS]: 'Vos points sont automatiquement ajoutés à votre compte et peuvent être utilisés lors de vos prochains achats.',
            [enums_1.IncentiveType.DISCOUNT_NEXT]: 'Votre réduction sera automatiquement appliquée lors de votre prochain achat.',
            [enums_1.IncentiveType.FREE_UPGRADE]: 'Votre surclassement gratuit sera proposé automatiquement lors de la sélection de places.',
            [enums_1.IncentiveType.EXCLUSIVE_ACCESS]: 'Vous recevrez des invitations aux ventes privées par email.',
            [enums_1.IncentiveType.GIFT_VOUCHER]: 'Votre bon d\'achat est disponible dans votre espace récompenses.',
        };
        return instructions[type] || 'Consultez votre compte pour plus de détails.';
    }
};
exports.AnonymousConversionProcessor = AnonymousConversionProcessor;
__decorate([
    (0, bull_1.Process)('process-conversion'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnonymousConversionProcessor.prototype, "processConversion", null);
__decorate([
    (0, bull_1.Process)('apply-incentive'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnonymousConversionProcessor.prototype, "processIncentiveApplication", null);
__decorate([
    (0, bull_1.Process)('send-conversion-email'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnonymousConversionProcessor.prototype, "processSendConversionEmail", null);
exports.AnonymousConversionProcessor = AnonymousConversionProcessor = __decorate([
    (0, common_1.Injectable)(),
    (0, bull_1.Processor)('conversion'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService,
        redis_service_1.RedisService,
        logger_service_1.LoggerService])
], AnonymousConversionProcessor);
//# sourceMappingURL=anonymous-conversion.processor.js.map