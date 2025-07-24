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
exports.AnonymousService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const email_service_1 = require("../../../shared/email/email.service");
const bullmq_service_1 = require("../../../shared/bullmq/bullmq.service");
const bcrypt = __importStar(require("bcrypt"));
const enums_1 = require("../types/enums");
let AnonymousService = class AnonymousService {
    prisma;
    redis;
    email;
    bullmq;
    logger;
    CACHE_PREFIX = 'anonymous:';
    ONBOARDING_PREFIX = 'onboarding:';
    DEFAULT_EXPIRY = 30 * 24 * 3600;
    constructor(prisma, redis, email, bullmq, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.email = email;
        this.bullmq = bullmq;
        this.logger = loggerService.createChildLogger('AnonymousService');
    }
    async createAnonymousUser(data) {
        const operationId = this.logger.startOperation('create_anonymous_user', {
            guestEmail: data.guestEmail
        });
        try {
            this.logger.info('Creating anonymous user', JSON.stringify({
                guestEmail: data.guestEmail,
                incentiveType: data.incentiveType
            }));
            const existingUser = await this.prisma.users.findUnique({
                where: { email: data.guestEmail }
            });
            if (existingUser) {
                throw new common_1.ConflictException('Un utilisateur enregistré existe déjà avec cet email');
            }
            const anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            let onboardingKey;
            if (data.incentiveType) {
                onboardingKey = await this.generateOnboardingKey({
                    anonymousUserId: anonymousId,
                    incentiveType: data.incentiveType,
                    incentiveValue: data.incentiveValue || 0,
                    description: data.incentiveDescription || '',
                    expiresInHours: 168
                });
            }
            const anonymousUser = {
                id: anonymousId,
                guestName: data.guestName,
                guestEmail: data.guestEmail,
                guestPhone: data.guestPhone,
                onboardingKey,
                incentiveType: data.incentiveType,
                incentiveValue: data.incentiveValue,
                incentiveDescription: data.incentiveDescription,
                expiresAt: data.expiresAt || new Date(Date.now() + this.DEFAULT_EXPIRY * 1000),
                converted: false,
                convertedAt: null,
                convertedUserId: null,
                metadata: data.metadata || {},
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const cacheKey = `${this.CACHE_PREFIX}${anonymousId}`;
            await this.redis.setCache(cacheKey, anonymousUser, this.DEFAULT_EXPIRY);
            const emailKey = `${this.CACHE_PREFIX}email:${data.guestEmail}`;
            await this.redis.setCache(emailKey, anonymousId, this.DEFAULT_EXPIRY);
            if (onboardingKey) {
                const keyKey = `${this.ONBOARDING_PREFIX}${onboardingKey}`;
                await this.redis.setCache(keyKey, anonymousId, this.DEFAULT_EXPIRY);
            }
            this.logger.logBusinessEvent('ANONYMOUS_USER_CREATED', {
                anonymousId,
                guestEmail: data.guestEmail,
                hasIncentive: !!data.incentiveType,
                incentiveType: data.incentiveType,
                onboardingKeyGenerated: !!onboardingKey
            });
            this.logger.endOperation('create_anonymous_user', operationId, true);
            return anonymousUser;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AnonymousService.createAnonymousUser', JSON.stringify({
                guestEmail: data.guestEmail,
                incentiveType: data.incentiveType
            }));
            this.logger.endOperation('create_anonymous_user', operationId, false);
            throw error;
        }
    }
    async findByEmail(email) {
        try {
            const emailKey = `${this.CACHE_PREFIX}email:${email}`;
            const anonymousId = await this.redis.getCache(emailKey);
            if (!anonymousId) {
                return null;
            }
            const cacheKey = `${this.CACHE_PREFIX}${anonymousId}`;
            return await this.redis.getCache(cacheKey);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AnonymousService.findByEmail', JSON.stringify({ email }));
            return null;
        }
    }
    async findByOnboardingKey(key) {
        try {
            const keyKey = `${this.ONBOARDING_PREFIX}${key}`;
            const anonymousId = await this.redis.getCache(keyKey);
            if (!anonymousId) {
                return null;
            }
            const cacheKey = `${this.CACHE_PREFIX}${anonymousId}`;
            return await this.redis.getCache(cacheKey);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AnonymousService.findByOnboardingKey', JSON.stringify({ key }));
            return null;
        }
    }
    async convertToRegistered(conversionData) {
        const operationId = this.logger.startOperation('convert_to_registered', {
            onboardingKey: conversionData.onboardingKey,
            email: conversionData.userData.email
        });
        try {
            this.logger.info('Starting anonymous user conversion', JSON.stringify({
                onboardingKey: conversionData.onboardingKey,
                email: conversionData.userData.email
            }));
            const validation = await this.validateOnboardingKey(conversionData.onboardingKey);
            if (!validation.isValid) {
                this.logger.endOperation('convert_to_registered', operationId, false);
                return {
                    success: false,
                    incentiveApplied: false,
                    errors: validation.errors || ['Clé d\'onboarding invalide']
                };
            }
            const anonymousUser = validation.anonymousUser;
            if (conversionData.userData.email.toLowerCase() !== anonymousUser.guestEmail.toLowerCase()) {
                this.logger.endOperation('convert_to_registered', operationId, false);
                return {
                    success: false,
                    incentiveApplied: false,
                    errors: ['L\'email doit correspondre à celui utilisé lors de l\'achat anonyme']
                };
            }
            const existingUser = await this.prisma.users.findUnique({
                where: { email: conversionData.userData.email }
            });
            if (existingUser) {
                this.logger.endOperation('convert_to_registered', operationId, false);
                return {
                    success: false,
                    incentiveApplied: false,
                    errors: ['Un utilisateur existe déjà avec cet email']
                };
            }
            const hashedPassword = await bcrypt.hash(conversionData.userData.password, 12);
            const result = await this.prisma.transactionWithRetry(async (tx) => {
                const newUser = await tx.users.create({
                    data: {
                        email: conversionData.userData.email,
                        first_name: conversionData.userData.firstName,
                        last_name: conversionData.userData.lastName,
                        phone: conversionData.userData.phone,
                        password: hashedPassword,
                        is_active: true,
                        email_verified: null,
                        phone_verified: conversionData.userData.phone != null,
                        metadata: {
                            convertedFromAnonymous: true,
                            anonymousId: anonymousUser.id,
                            conversionDate: new Date(),
                            originalPurchaseData: anonymousUser.metadata
                        }
                    }
                });
                if (conversionData.profileData) {
                    await tx.user_profiles.create({
                        data: {
                            user_id: newUser.id,
                            date_of_birth: conversionData.profileData.dateOfBirth,
                            city: conversionData.profileData.city,
                            country: conversionData.profileData.country || 'TN',
                            language: conversionData.profileData.language || 'fr',
                        }
                    });
                }
                await tx.orders.updateMany({
                    where: {
                        user_id: null,
                        guest_email: anonymousUser.guestEmail
                    },
                    data: {
                        user_id: newUser.id
                    }
                });
                await tx.subscriptions.updateMany({
                    where: {
                        user_id: null,
                        metadata: {
                            path: ['anonymousUser', 'guestEmail'],
                            equals: anonymousUser.guestEmail
                        }
                    },
                    data: {
                        user_id: newUser.id,
                        metadata: {
                            ...{},
                            migrationInfo: {
                                migratedAt: new Date(),
                                migratedFromAnonymous: anonymousUser.id,
                                conversionKey: conversionData.onboardingKey
                            }
                        }
                    }
                });
                const orderIds = await tx.orders.findMany({
                    where: { user_id: newUser.id },
                    select: { id: true }
                });
                if (orderIds.length > 0) {
                    await tx.access_rights.updateMany({
                        where: {
                            user_id: null,
                            OR: [
                                {
                                    ticket_id: {
                                        in: await tx.tickets.findMany({
                                            where: { user_id: newUser.id },
                                            select: { id: true }
                                        }).then(tickets => tickets.map(t => t.id))
                                    }
                                },
                                {
                                    subscription_id: {
                                        in: await tx.subscriptions.findMany({
                                            where: { user_id: newUser.id },
                                            select: { id: true }
                                        }).then(subs => subs.map(s => s.id))
                                    }
                                }
                            ]
                        },
                        data: {
                            user_id: newUser.id
                        }
                    });
                }
                return newUser;
            });
            let incentiveApplied = false;
            let incentiveDetails = undefined;
            if (anonymousUser.incentiveType && anonymousUser.incentiveValue) {
                try {
                    await this.applyIncentive(result.id, anonymousUser.incentiveType, anonymousUser.incentiveValue);
                    incentiveApplied = true;
                    incentiveDetails = {
                        type: anonymousUser.incentiveType,
                        value: anonymousUser.incentiveValue,
                        description: anonymousUser.incentiveDescription || ''
                    };
                }
                catch (error) {
                    this.logger.logErrorEvent(error, 'AnonymousService.applyIncentive', JSON.stringify({
                        userId: result.id,
                        incentiveType: anonymousUser.incentiveType,
                        incentiveValue: anonymousUser.incentiveValue
                    }));
                }
            }
            anonymousUser.converted = true;
            anonymousUser.convertedAt = new Date();
            anonymousUser.convertedUserId = result.id;
            const cacheKey = `${this.CACHE_PREFIX}${anonymousUser.id}`;
            await this.redis.setCache(cacheKey, anonymousUser, 3600);
            try {
                await this.email.sendWelcomeEmail(result.email, result.first_name);
            }
            catch (emailError) {
                this.logger.logErrorEvent(emailError, 'AnonymousService.sendWelcomeEmail', JSON.stringify({
                    userId: result.id,
                    email: result.email
                }));
            }
            this.logger.logBusinessEvent('ANONYMOUS_USER_CONVERTED', {
                anonymousId: anonymousUser.id,
                newUserId: result.id,
                email: result.email,
                incentiveApplied,
                incentiveType: anonymousUser.incentiveType,
                incentiveValue: anonymousUser.incentiveValue
            });
            this.logger.endOperation('convert_to_registered', operationId, true);
            return {
                success: true,
                user: result,
                incentiveApplied,
                incentiveDetails,
                migrationSummary: {
                    ticketsMigrated: 0,
                    subscriptionsMigrated: 0,
                    ordersMigrated: 0,
                }
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AnonymousService.convertToRegistered', JSON.stringify({
                onboardingKey: conversionData.onboardingKey,
                email: conversionData.userData.email
            }));
            this.logger.endOperation('convert_to_registered', operationId, false);
            return {
                success: false,
                incentiveApplied: false,
                errors: ['Erreur lors de la conversion. Veuillez réessayer.']
            };
        }
    }
    async validateOnboardingKey(key) {
        try {
            const anonymousUser = await this.findByOnboardingKey(key);
            if (!anonymousUser) {
                return {
                    isValid: false,
                    isExpired: false,
                    isUsed: false,
                    errors: ['Clé d\'onboarding introuvable']
                };
            }
            if (anonymousUser.converted) {
                return {
                    isValid: false,
                    isExpired: false,
                    isUsed: true,
                    anonymousUser,
                    errors: ['Cette clé a déjà été utilisée']
                };
            }
            const isExpired = anonymousUser.expiresAt && new Date(anonymousUser.expiresAt) < new Date();
            if (isExpired) {
                return {
                    isValid: false,
                    isExpired: true,
                    isUsed: false,
                    anonymousUser,
                    errors: ['Cette clé a expiré']
                };
            }
            return {
                isValid: true,
                isExpired: false,
                isUsed: false,
                anonymousUser,
                incentiveDetails: anonymousUser.incentiveType ? {
                    type: anonymousUser.incentiveType,
                    value: anonymousUser.incentiveValue || 0,
                    description: anonymousUser.incentiveDescription || ''
                } : undefined
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AnonymousService.validateOnboardingKey', JSON.stringify({ key }));
            return {
                isValid: false,
                isExpired: false,
                isUsed: false,
                errors: ['Erreur lors de la validation']
            };
        }
    }
    async generateOnboardingKey(data) {
        try {
            const timestamp = Date.now().toString(36);
            const random = Math.random().toString(36).substr(2, 8);
            const typePrefix = data.incentiveType ? data.incentiveType.substring(0, 3) : 'GEN';
            const key = `ONB_${typePrefix}_${timestamp}_${random}`.toUpperCase();
            this.logger.info('Generated onboarding key', JSON.stringify({
                anonymousUserId: data.anonymousUserId,
                key,
                incentiveType: data.incentiveType,
                expiresInHours: data.expiresInHours
            }));
            return key;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AnonymousService.generateOnboardingKey', JSON.stringify(data));
            throw new common_1.BadRequestException('Erreur lors de la génération de la clé d\'onboarding');
        }
    }
    async applyIncentive(userId, incentiveType, value) {
        try {
            this.logger.info('Applying incentive to user', JSON.stringify({
                userId,
                incentiveType,
                value
            }));
            switch (incentiveType) {
                case enums_1.IncentiveType.BONUS_POINTS:
                    this.logger.info('Would apply bonus points', JSON.stringify({ userId, points: value }));
                    break;
                case enums_1.IncentiveType.DISCOUNT_NEXT:
                    this.logger.info('Would create discount coupon', JSON.stringify({ userId, discount: value }));
                    break;
                case enums_1.IncentiveType.FREE_UPGRADE:
                    this.logger.info('Would create upgrade voucher', JSON.stringify({ userId }));
                    break;
                case enums_1.IncentiveType.EXCLUSIVE_ACCESS:
                    this.logger.info('Would grant exclusive access', JSON.stringify({ userId }));
                    break;
                case enums_1.IncentiveType.GIFT_VOUCHER:
                    this.logger.info('Would create gift voucher', JSON.stringify({ userId, amount: value }));
                    break;
                default:
                    this.logger.warn('Unknown incentive type', JSON.stringify({ incentiveType }));
            }
            this.logger.logBusinessEvent('INCENTIVE_APPLIED', {
                userId,
                incentiveType,
                value,
                appliedAt: new Date()
            });
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AnonymousService.applyIncentive', JSON.stringify({
                userId,
                incentiveType,
                value
            }));
            throw error;
        }
    }
    async getConversionStats(period) {
        try {
            return {
                totalAnonymous: 0,
                totalConverted: 0,
                conversionRate: 0,
                averageConversionTime: 0,
                conversionsByIncentive: [],
                conversionTrend: [],
                topIncentives: []
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AnonymousService.getConversionStats', JSON.stringify({ period }));
            throw error;
        }
    }
    async getAnonymousStats() {
        try {
            return {
                totalAnonymous: 0,
                activeAnonymous: 0,
                expiredAnonymous: 0,
                convertedAnonymous: 0,
                pendingConversion: 0,
                averageTimeToConversion: 0,
                mostEffectiveIncentive: {
                    type: enums_1.IncentiveType.BONUS_POINTS,
                    conversionRate: 0
                }
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AnonymousService.getAnonymousStats', JSON.stringify({}));
            throw error;
        }
    }
    mapGenderToEnum(gender) {
        if (!gender)
            return undefined;
        switch (gender) {
            case 'M':
                return 'MALE';
            case 'F':
                return 'FEMALE';
            case 'OTHER':
                return 'OTHER';
            case 'PREFER_NOT_TO_SAY':
                return 'PREFER_NOT_TO_SAY';
            default:
                return undefined;
        }
    }
};
exports.AnonymousService = AnonymousService;
exports.AnonymousService = AnonymousService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        email_service_1.EmailService,
        bullmq_service_1.BullmqService,
        logger_service_1.LoggerService])
], AnonymousService);
//# sourceMappingURL=anonymous.service.js.map