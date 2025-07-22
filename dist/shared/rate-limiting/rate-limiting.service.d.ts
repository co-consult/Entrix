import { RedisService } from '../redis/redis.service';
import { RateLimitOptions, RateLimitResult, RateLimitingMetrics } from './interfaces';
export declare class RateLimitingService {
    private readonly redis;
    private readonly logger;
    private metrics;
    private readonly DEFAULT_LIMIT;
    private readonly DEFAULT_WINDOW_MS;
    private readonly DEFAULT_ALGORITHM;
    constructor(redis: RedisService);
    checkLimit(identifier: string, options?: RateLimitOptions): Promise<RateLimitResult>;
    private slidingWindowCheck;
    private tokenBucketCheck;
    private fixedWindowCheck;
    checkIpLimit(ip: string, options?: RateLimitOptions): Promise<RateLimitResult>;
    checkUserLimit(userId: string, options?: RateLimitOptions): Promise<RateLimitResult>;
    checkRouteLimit(ip: string, route: string, options?: RateLimitOptions): Promise<RateLimitResult>;
    checkGlobalLimit(options?: RateLimitOptions): Promise<RateLimitResult>;
    checkAdaptiveLimit(identifier: string, baseLimit: number, windowMs: number, loadFactor?: number): Promise<RateLimitResult>;
    isWhitelisted(identifier: string): Promise<boolean>;
    addToWhitelist(identifier: string, ttlSeconds?: number): Promise<void>;
    removeFromWhitelist(identifier: string): Promise<void>;
    addToBlacklist(identifier: string, ttlSeconds?: number): Promise<void>;
    isBlacklisted(identifier: string): Promise<boolean>;
    resetLimit(identifier: string): Promise<void>;
    getStats(identifier?: string): Promise<{
        identifier?: string;
        currentRequests: number;
        metrics: RateLimitingMetrics;
        topLimitedIps?: string[];
    }>;
    cleanup(): Promise<number>;
    getMetrics(): {
        blockRate: number;
        allowRate: number;
        errorRate: number;
        totalRequests: number;
        blockedRequests: number;
        allowedRequests: number;
        errorCount: number;
    };
    resetMetrics(): void;
}
