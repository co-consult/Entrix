import { BullmqService } from '../../../shared/bullmq/bullmq.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PermissionSyncProcessor } from '../processors/permission-sync.processor';
export declare class PermissionSyncQueue {
    private readonly bullmq;
    private readonly permissionSyncProcessor;
    private readonly logger;
    constructor(bullmq: BullmqService, permissionSyncProcessor: PermissionSyncProcessor, loggerService: LoggerService);
    private initializeQueue;
    syncUserPermissions(userId: string, operation: string): Promise<void>;
    syncRolePermissions(roleId: string, operation: string): Promise<void>;
}
