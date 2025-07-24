import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { EmailService } from '../../../shared/email/email.service';
export interface EmailVerificationResult {
    success: boolean;
    verified: boolean;
    message: string;
    userId?: string;
}
export interface EmailVerificationToken {
    id: string;
    token: string;
    userId: string;
    email: string;
    expiresAt: Date;
}
export declare class EmailVerificationService {
    private readonly prisma;
    private readonly redis;
    private readonly email;
    private readonly logger;
    private readonly TOKEN_EXPIRY;
    private readonly CACHE_PREFIX;
    private readonly USE_REDIS_CACHE;
    constructor(prisma: PrismaService, redis: RedisService, email: EmailService, loggerService: LoggerService);
    generateVerificationToken(userId: string, email: string): Promise<EmailVerificationToken>;
    verifyEmailToken(token: string): Promise<EmailVerificationResult>;
    private markTokenAsUsed;
    private cleanupOldTokens;
    getVerificationStats(): Promise<{
        totalTokens: number;
        activeTokens: number;
        expiredTokens: number;
        usedTokens: number;
    }>;
}
