import { Job } from 'bull';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
export interface UserActivityJobData {
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    metadata?: Record<string, any>;
    timestamp: Date;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
}
export interface UserBehaviorJobData {
    userId: string;
    eventType: 'PAGE_VIEW' | 'SEARCH' | 'FILTER' | 'CLICK' | 'PURCHASE' | 'SHARE';
    page?: string;
    searchQuery?: string;
    filters?: Record<string, any>;
    clickTarget?: string;
    purchaseData?: {
        orderId: string;
        amount: number;
        items: number;
        category: string;
    };
    shareData?: {
        platform: string;
        contentType: string;
        contentId: string;
    };
    sessionData: {
        sessionId: string;
        sessionStart: Date;
        pageNumber: number;
        timeOnPage?: number;
    };
    deviceData: {
        type: 'desktop' | 'mobile' | 'tablet';
        browser: string;
        os: string;
        screenSize?: string;
    };
    timestamp: Date;
}
export interface UserEngagementJobData {
    userId: string;
    engagementType: 'LOGIN' | 'PROFILE_UPDATE' | 'PREFERENCE_CHANGE' | 'SOCIAL_INTERACTION' | 'SUPPORT_CONTACT';
    details: Record<string, any>;
    timestamp: Date;
}
export interface UserRetentionJobData {
    userId: string;
    cohortMonth: string;
    registrationDate: Date;
    lastActiveDate: Date;
    totalSessions: number;
    totalPurchases: number;
    totalSpent: number;
    isActive: boolean;
    riskScore?: number;
}
export declare class UserAnalyticsProcessor {
    private readonly prisma;
    private readonly redisService;
    private readonly logger;
    constructor(prisma: PrismaService, redisService: RedisService, logger: LoggerService);
    processUserActivity(job: Job<UserActivityJobData>): Promise<void>;
    processUserBehavior(job: Job<UserBehaviorJobData>): Promise<void>;
    processUserEngagement(job: Job<UserEngagementJobData>): Promise<void>;
    processUserRetention(job: Job<UserRetentionJobData>): Promise<void>;
    private mapActionToAuditAction;
    private updateRealTimeMetrics;
    private updateLastActivity;
    private isSignificantActivity;
    private isBusinessCriticalActivity;
    private analyzeUsagePatterns;
    private updateBehaviorMetrics;
    private analyzeNavigationPatterns;
    private analyzePurchaseConversion;
    private updateEngagementScore;
    private getBaseEngagementScore;
    private calculateEngagementScore;
    private updateEngagementCache;
    private flagUserAtRisk;
    private updateRetentionCache;
    private triggerRetentionActions;
}
