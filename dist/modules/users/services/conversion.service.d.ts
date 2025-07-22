import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { EmailService } from '../../../shared/email/email.service';
import { BullmqService } from '../../../shared/bullmq/bullmq.service';
import { ConversionData, ConversionResult, OnboardingKeyValidation, ConversionStats, DateRange, OnboardingKeyData } from '../interfaces/anonymous.interface';
export declare class ConversionService {
    private readonly prisma;
    private readonly redis;
    private readonly email;
    private readonly bullmq;
    private readonly logger;
    private readonly ONBOARDING_PREFIX;
    private readonly CACHE_TTL;
    constructor(prisma: PrismaService, redis: RedisService, email: EmailService, bullmq: BullmqService, logger: LoggerService);
    validateOnboardingKey(key: string): Promise<OnboardingKeyValidation>;
    convertToRegistered(conversionData: ConversionData): Promise<ConversionResult>;
    generateOnboardingKey(data: OnboardingKeyData): Promise<string>;
    private applyIncentive;
    getConversionStats(period?: DateRange): Promise<ConversionStats>;
}
