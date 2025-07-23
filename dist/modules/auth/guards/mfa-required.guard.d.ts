import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RedisService } from '../../../shared/redis/redis.service';
export declare class MfaRequiredGuard implements CanActivate {
    private readonly reflector;
    private readonly redis;
    private readonly logger;
    constructor(reflector: Reflector, redis: RedisService, loggerService: LoggerService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private isMfaValidatedInSession;
    private generateMfaChallenge;
    private getAvailableMfaMethods;
}
