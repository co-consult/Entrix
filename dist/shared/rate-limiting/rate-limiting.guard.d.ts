import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitingService } from './rate-limiting.service';
import { LoggerService } from '../logger/logger.service';
export declare const RATE_LIMIT_KEY = "rate_limit_options";
export declare class RateLimitingGuard implements CanActivate {
    private readonly rateLimitingService;
    private readonly reflector;
    private readonly loggerService;
    private readonly logger;
    constructor(rateLimitingService: RateLimitingService, reflector: Reflector, loggerService: LoggerService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private generateIdentifier;
    private getClientIp;
    private extractUserId;
    private getRoutePattern;
    private setHeaders;
    private throwRateLimitException;
    private logRateLimitExceeded;
    private logSecurityEvent;
}
