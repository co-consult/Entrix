import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { Reflector } from '@nestjs/core';
interface RateLimitConfig {
    key: string;
    limit: number;
    window: number;
    skip_successful?: boolean;
    custom_key_generator?: (request: any) => string;
}
export declare const RATE_LIMIT_KEY = "rate_limit";
export declare class RateLimitInterceptor implements NestInterceptor {
    private readonly redis;
    private readonly reflector;
    private readonly logger;
    constructor(redis: RedisService, reflector: Reflector, loggerService: LoggerService);
    intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>>;
    private getRateLimitConfig;
    private generateLimitKey;
    private checkRateLimit;
    private logRateLimitExceeded;
}
export declare const RateLimit: (config: Omit<RateLimitConfig, "custom_key_generator"> & {
    custom_key_generator?: (request: any) => string;
}) => import("@nestjs/common").CustomDecorator<string>;
export {};
