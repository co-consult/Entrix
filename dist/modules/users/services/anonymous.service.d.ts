import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { EmailService } from '../../../shared/email/email.service';
import { BullmqService } from '../../../shared/bullmq/bullmq.service';
import { CreateAnonymousData, ConversionData, ConversionResult, OnboardingKeyValidation, AnonymousStats, ConversionStats, DateRange, OnboardingKeyData } from '../interfaces/anonymous.interface';
import { IncentiveType } from '../types/enums';
export declare class AnonymousService {
    private readonly prisma;
    private readonly redis;
    private readonly email;
    private readonly bullmq;
    private readonly logger;
    private readonly CACHE_PREFIX;
    private readonly ONBOARDING_PREFIX;
    private readonly DEFAULT_EXPIRY;
    constructor(prisma: PrismaService, redis: RedisService, email: EmailService, bullmq: BullmqService, loggerService: LoggerService);
    createAnonymousUser(data: CreateAnonymousData): Promise<any>;
    findByEmail(email: string): Promise<any | null>;
    findByOnboardingKey(key: string): Promise<any | null>;
    convertToRegistered(conversionData: ConversionData): Promise<ConversionResult>;
    validateOnboardingKey(key: string): Promise<OnboardingKeyValidation>;
    generateOnboardingKey(data: OnboardingKeyData): Promise<string>;
    applyIncentive(userId: string, incentiveType: IncentiveType, value: number): Promise<void>;
    getConversionStats(period?: DateRange): Promise<ConversionStats>;
    getAnonymousStats(): Promise<AnonymousStats>;
    private mapGenderToEnum;
}
