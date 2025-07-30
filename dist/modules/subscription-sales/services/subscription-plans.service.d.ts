import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RedisService } from '../../../shared/redis/redis.service';
export declare class SubscriptionPlansService {
    private readonly prisma;
    private readonly redis;
    private readonly logger;
    private readonly CACHE_PREFIX;
    private readonly CACHE_TTL;
    constructor(prisma: PrismaService, redis: RedisService, loggerService: LoggerService);
    getAvailablePlans(organizerId?: string): Promise<any>;
    getPlanDetails(planId: string): Promise<any>;
    checkPlanAvailability(planId: string, quantity: number): Promise<boolean>;
    incrementSubscribersCount(planId: string, increment?: number): Promise<{
        max_subscribers: number;
        current_subscribers: number;
    }>;
    invalidatePlanCache(planId: string, organizerId?: string): Promise<void>;
}
