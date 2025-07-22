import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RedisService } from '../../../shared/redis/redis.service';
export declare class GroupMemberGuard implements CanActivate {
    private readonly prisma;
    private readonly reflector;
    private readonly redis;
    private readonly logger;
    constructor(prisma: PrismaService, reflector: Reflector, redis: RedisService, loggerService: LoggerService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractGroupId;
    private validateRequest;
    private getCachedMembership;
    private cacheMembership;
    private validateGroup;
    private validateMembership;
    private attachMembershipToRequest;
    private logSuccessfulAccess;
    private handleError;
}
