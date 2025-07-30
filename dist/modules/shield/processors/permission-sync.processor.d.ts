import { Job } from 'bullmq';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
interface PermissionSyncJobData {
    type: 'USER_PERMISSIONS' | 'ROLE_PERMISSIONS' | 'HIERARCHY_UPDATE';
    user_id?: string;
    role_id?: string;
    permission_id?: string;
    operation: 'CREATE' | 'UPDATE' | 'DELETE';
    timestamp: Date;
}
export declare class PermissionSyncProcessor {
    private readonly prisma;
    private readonly redis;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService, loggerService: LoggerService);
    processPermissionSync(job: Job<PermissionSyncJobData>): Promise<void>;
    private syncUserPermissions;
    private syncRolePermissions;
    private syncRoleHierarchy;
    private recalculateUserPermissions;
}
export {};
