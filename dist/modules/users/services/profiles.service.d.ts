import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { BullmqService } from '../../../shared/bullmq/bullmq.service';
import { EmailService } from '../../../shared/email/email.service';
import { CreateProfileDto, UpdateProfileDto } from '../dto';
export declare class ProfilesService {
    private readonly prisma;
    private readonly redis;
    private readonly bullmq;
    private readonly email;
    private readonly logger;
    private readonly CACHE_PREFIX;
    private readonly CACHE_TTL;
    private readonly COMPLETION_CACHE_TTL;
    constructor(prisma: PrismaService, redis: RedisService, bullmq: BullmqService, email: EmailService, loggerService: LoggerService);
    create(profileData: CreateProfileDto): Promise<any>;
    findByUserId(userId: string): Promise<any | null>;
    update(userId: string, updateData: UpdateProfileDto): Promise<any>;
    delete(userId: string): Promise<void>;
    getCompletionStatus(userId: string): Promise<any>;
    updatePreferences(userId: string, preferences: Record<string, any>): Promise<any>;
    searchProfiles(filters: any, limit?: number, offset?: number): Promise<any>;
    private calculateCompletionPercentage;
    private generateCompletionSuggestions;
    private getNextSteps;
    private invalidateUserCaches;
}
