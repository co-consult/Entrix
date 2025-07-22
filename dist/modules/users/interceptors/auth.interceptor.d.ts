import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RedisService } from '../../../shared/redis/redis.service';
export declare class AuthInterceptor implements NestInterceptor {
    private readonly prisma;
    private readonly redis;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService, loggerService: LoggerService);
    intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>>;
    private enrichUserData;
    private trackUserActivity;
    private logAuthenticatedRequest;
    private logSecurityEvents;
}
