import { PrismaService } from '../../shared/prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import { LoggerService } from '../../shared/logger/logger.service';
export interface UserSession {
    id: string;
    userId: string;
    ipAddress: string;
    userAgent: string;
    isActive: boolean;
    lastActivityAt: Date;
    createdAt: Date;
    expiresAt: Date;
}
export declare class SessionsService {
    private readonly prisma;
    private readonly redis;
    private readonly logger;
    private readonly SESSION_PREFIX;
    private readonly USER_SESSIONS_PREFIX;
    private readonly SESSION_DURATION;
    constructor(prisma: PrismaService, redis: RedisService, logger: LoggerService);
    createSession(userId: string, ipAddress: string, userAgent: string): Promise<UserSession>;
    getSession(sessionId: string): Promise<UserSession | null>;
    updateSessionActivity(sessionId: string): Promise<void>;
    revokeSession(sessionId: string): Promise<void>;
    revokeAllUserSessions(userId: string): Promise<void>;
    getUserSessions(userId: string): Promise<UserSession[]>;
    cleanupExpiredSessions(): Promise<number>;
    validateAndRefreshSession(sessionId: string): Promise<UserSession | null>;
}
