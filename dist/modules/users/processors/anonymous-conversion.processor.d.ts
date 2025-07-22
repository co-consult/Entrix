import { Job } from 'bull';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { EmailService } from '../../../shared/email/email.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { IncentiveType } from '../types/enums';
export interface ConversionJobData {
    userId: string;
    anonymousId: string;
    onboardingKey: string;
    incentiveType: IncentiveType;
    incentiveValue: number;
    incentiveDescription: string;
    conversionMetadata: {
        source: string;
        campaignId?: string;
        conversionTime: Date;
        userAgent?: string;
        ipAddress?: string;
    };
}
export interface IncentiveApplicationJobData {
    userId: string;
    incentiveType: IncentiveType;
    incentiveValue: number;
    description: string;
    sourceType: 'CONVERSION' | 'WELCOME_BONUS' | 'REFERRAL' | 'PROMOTION';
    sourceId?: string;
    expiresAt?: Date;
}
export interface ConversionEmailJobData {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    incentiveApplied: {
        type: IncentiveType;
        value: number;
        description: string;
    };
    migrationSummary: {
        ticketsMigrated: number;
        subscriptionsMigrated: number;
        ordersMigrated: number;
        totalValue: number;
    };
    originalPurchaseData?: {
        firstPurchaseDate: Date;
        totalPurchases: number;
        favoriteEventType?: string;
    };
}
export declare class AnonymousConversionProcessor {
    private readonly prisma;
    private readonly emailService;
    private readonly redisService;
    private readonly logger;
    constructor(prisma: PrismaService, emailService: EmailService, redisService: RedisService, logger: LoggerService);
    processConversion(job: Job<ConversionJobData>): Promise<void>;
    processIncentiveApplication(job: Job<IncentiveApplicationJobData>): Promise<void>;
    processSendConversionEmail(job: Job<ConversionEmailJobData>): Promise<void>;
    private invalidateUserCaches;
    private applyConversionIncentive;
    private applyBonusPoints;
    private applyDiscountCoupon;
    private applyFreeUpgrade;
    private applyExclusiveAccess;
    private applyGiftVoucher;
    private sendConversionConfirmationEmail;
    private notifyConversionEmailFailure;
    private getIncentiveTypeLabel;
    private getIncentiveUsageInstructions;
}
