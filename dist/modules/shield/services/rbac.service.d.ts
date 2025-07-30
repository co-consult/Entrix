import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { BullmqService } from '../../../shared/bullmq/bullmq.service';
import { PermissionCheck, PermissionResult, EffectivePermissions, UserPermissionsResponse } from '../interfaces/rbac.interface';
import { ResourceType } from '../types/access-enums';
export declare class RbacService {
    private readonly prisma;
    private readonly redis;
    private readonly bullmq;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService, bullmq: BullmqService, loggerService: LoggerService);
    checkPermission(checkData: PermissionCheck): Promise<PermissionResult>;
    getEffectivePermissions(userId: string): Promise<EffectivePermissions>;
    private evaluatePermission;
    private evaluatePermissionConditions;
    private evaluateTimeRestrictions;
    private getInheritedRolePermissions;
    private buildPermissionCacheKey;
    private getCachedPermissionResult;
    private cachePermissionResult;
    private deduplicatePermissions;
    private hashObject;
    private auditPermissionCheck;
    hasPermission(userId: string, permission: string, resourceType: ResourceType, resourceId?: string, context?: any): Promise<boolean>;
    getUserPermissions(userId: string): Promise<UserPermissionsResponse>;
    invalidateUserPermissionsCache(userId: string): Promise<void>;
}
