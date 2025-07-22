import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
export declare const REQUIRED_GROUP_ROLES = "requiredGroupRoles";
export declare class GroupOwnerGuard implements CanActivate {
    private readonly prisma;
    private readonly redis;
    private readonly reflector;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService, reflector: Reflector, loggerService: LoggerService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private validateRequestInputs;
    private extractGroupId;
    private extractRoleFromMetadata;
    private getCachedMembership;
    private checkPermissionsFromCache;
    private validateMembershipFromDatabase;
    private attachMembershipToRequest;
    private logSuccessfulAccess;
    private handleError;
}
export declare const RequireGroupRoles: (...roles: string[]) => import("@nestjs/common").CustomDecorator<string>;
