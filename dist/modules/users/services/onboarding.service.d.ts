import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { EmailService } from '../../../shared/email/email.service';
import { BullmqService } from '../../../shared/bullmq/bullmq.service';
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
interface OnboardingStats {
    totalKeysGenerated: number;
    totalKeysUsed: number;
    conversionRate: number;
    averageConversionTime: number;
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
export declare class OnboardingService {
    private readonly prisma;
    private readonly redis;
    private readonly email;
    private readonly bullmq;
    private readonly logger;
    private readonly CACHE_PREFIX;
    private readonly CACHE_TTL;
    constructor(prisma: PrismaService, redis: RedisService, email: EmailService, bullmq: BullmqService, logger: LoggerService);
    generateOnboardingKey(sourceType: 'TICKET' | 'SUBSCRIPTION', sourceId: string, campaignId: string, incentiveType: string, incentiveValue: number, description: string, expiresAt?: Date): Promise<string>;
    validateOnboardingKey(secretKey: string): Promise<OnboardingKeyValidation>;
    convertAnonymousUser(conversionData: ConversionData): Promise<ConversionResult>;
    private applyIncentive;
    getOnboardingStats(startDate: Date, endDate: Date, organizerId?: string): Promise<OnboardingStats>;
    sendOnboardingReminder(secretKey: string): Promise<boolean>;
    cleanupExpiredKeys(): Promise<number>;
}
export {};
