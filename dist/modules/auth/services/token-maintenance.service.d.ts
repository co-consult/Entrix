import { LoggerService } from '../../../shared/logger/logger.service';
import { PersistentTokenService } from './persistent-token.service';
import { ValidationTokenService } from './validation-token.service';
import { TokenService } from './token.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { BullmqService } from '../../../shared/bullmq/bullmq.service';
export declare class TokenMaintenanceService {
    private readonly persistentTokenService;
    private readonly validationTokenService;
    private readonly tokenService;
    private readonly redis;
    private readonly bullmq;
    private readonly logger;
    constructor(persistentTokenService: PersistentTokenService, validationTokenService: ValidationTokenService, tokenService: TokenService, redis: RedisService, bullmq: BullmqService, loggerService: LoggerService);
    dailyTokenCleanup(): Promise<void>;
    weeklyDeepCleanup(): Promise<void>;
    hourlyCacheOptimization(): Promise<void>;
    tokenHealthMonitoring(): Promise<void>;
    cleanupRedisCache(): Promise<number>;
    optimizeTokenCache(): Promise<number>;
    generateHealthReport(): Promise<{
        timestamp: string;
        overall_health_score: number;
        persistent_tokens: any;
        validation_tokens: any;
        jwt_metrics: any;
        cache_metrics: any;
        alerts?: Array<{
            level: 'warning' | 'error' | 'critical';
            message: string;
            metric: string;
            value: number;
            threshold: number;
        }>;
    }>;
    checkHealthAlerts(healthReport: any): Promise<void>;
    private analyzeHealthMetrics;
    private calculateHealthScore;
    private getCacheMetrics;
    private scheduleCleanupReport;
    private scheduleMaintenanceAlert;
    private getAlertSeverity;
    forceCleanup(type?: 'daily' | 'weekly' | 'full'): Promise<any>;
    getHealthReport(): Promise<any>;
    forceOptimization(): Promise<number>;
    private scanRedisKeys;
    private getKeyTTL;
    private setKeyExpiry;
}
