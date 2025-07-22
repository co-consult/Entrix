import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../shared/redis/redis.service';
import { EmailService } from '../../../shared/email/email.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
export interface SecurityEvent {
    id: string;
    userId: string;
    type: 'LOGIN_ATTEMPT' | 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'SUSPICIOUS_ACTIVITY' | 'PASSWORD_CHANGE' | 'ACCOUNT_LOCKED';
    description: string;
    ipAddress: string;
    userAgent: string;
    riskScore: number;
    metadata?: Record<string, any>;
    createdAt: Date;
}
export interface RiskAssessment {
    score: number;
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    factors: string[];
    recommendations: string[];
}
export declare class SecurityService {
    private readonly redis;
    private readonly email;
    private readonly logger;
    private readonly prisma;
    private readonly config;
    private readonly RATE_LIMIT_PREFIX;
    private readonly SECURITY_EVENT_PREFIX;
    private readonly FAILED_ATTEMPTS_PREFIX;
    private readonly ACCOUNT_LOCK_PREFIX;
    constructor(redis: RedisService, email: EmailService, logger: LoggerService, prisma: PrismaService, config: ConfigService);
    assessLoginRisk(userId: string, ipAddress: string, userAgent: string, email: string): Promise<RiskAssessment>;
    logSecurityEvent(userId: string, type: SecurityEvent['type'], description: string, ipAddress: string, userAgent: string, riskScore?: number, metadata?: Record<string, any>): Promise<void>;
    recordFailedAttempt(email: string, ipAddress: string): Promise<{
        attempts: number;
        locked: boolean;
    }>;
    clearFailedAttempts(email: string, ipAddress: string): Promise<void>;
    isAccountLocked(email: string): Promise<boolean>;
    lockAccount(email: string, reason: string): Promise<void>;
    unlockAccount(email: string): Promise<void>;
    getUserSecurityEvents(userId: string, limit?: number): Promise<SecurityEvent[]>;
    private checkUnusualLocation;
    private checkUnknownDevice;
    private getFailedAttempts;
    private checkUnusualTime;
    private checkSuspiciousIp;
    private generateRecommendations;
    private handleCriticalSecurityEvent;
    private sendAccountLockNotification;
    private generateEventId;
}
