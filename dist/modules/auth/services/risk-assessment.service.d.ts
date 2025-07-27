import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { IMfaRiskAssessment } from '../interfaces/mfa.interface';
interface RiskContext {
    ipAddress?: string;
    userAgent?: string;
    deviceFingerprint?: string;
    geolocation?: {
        country?: string;
        city?: string;
        coordinates?: [number, number];
    };
}
export declare class RiskAssessmentService {
    private readonly prisma;
    private readonly redis;
    private readonly config;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService, config: ConfigService, loggerService: LoggerService);
    assessLoginRisk(userId: string, context: RiskContext): Promise<number>;
    generateRiskAssessment(userId: string, context: RiskContext): Promise<IMfaRiskAssessment>;
    updateUserRiskProfile(userId: string, action: 'LOGIN_SUCCESS' | 'LOGIN_FAIL' | 'MFA_SUCCESS' | 'MFA_FAIL', context: RiskContext): Promise<void>;
    private checkNewDevice;
    private checkNewLocation;
    private checkSuspiciousActivity;
    private checkTimeOfAccess;
    private checkMultipleFailures;
    private checkVelocityRisk;
    private checkUserBehaviorAnomaly;
    private calculateRiskScore;
    private getMfaThreshold;
    private getRecommendedMethods;
    private getConfiguredMethods;
    private storeRiskAssessment;
    private mapMethodToProvider;
    getRiskStatistics(): Promise<{
        averageRiskScore: number;
        highRiskUsers: number;
        totalAssessments: number;
        riskDistribution: Record<string, number>;
    }>;
}
export {};
