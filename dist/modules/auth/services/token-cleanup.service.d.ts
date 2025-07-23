import { PrismaService } from '../../../shared/prisma/prisma.service';
export declare class TokenCleanupService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    cleanupExpiredTokens(): Promise<void>;
    cleanupOldUsedTokens(): Promise<void>;
    cleanupAbandonedTokens(): Promise<void>;
    getCleanupStats(): Promise<{
        totalTokens: number;
        activeTokens: number;
        expiredTokens: number;
        usedTokens: number;
        oldestToken: Date | null;
        newestToken: Date | null;
    }>;
    forceCleanupAll(): Promise<{
        expiredCleaned: number;
        oldUsedCleaned: number;
        abandonedCleaned: number;
        totalCleaned: number;
    }>;
}
