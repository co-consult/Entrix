"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionSyncQueue = void 0;
const common_1 = require("@nestjs/common");
const bullmq_service_1 = require("../../../shared/bullmq/bullmq.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const shield_constants_1 = require("../types/shield-constants");
const permission_sync_processor_1 = require("../processors/permission-sync.processor");
let PermissionSyncQueue = class PermissionSyncQueue {
    bullmq;
    permissionSyncProcessor;
    logger;
    constructor(bullmq, permissionSyncProcessor, loggerService) {
        this.bullmq = bullmq;
        this.permissionSyncProcessor = permissionSyncProcessor;
        this.logger = loggerService.createChildLogger('PermissionSyncQueue');
        this.initializeQueue();
    }
    async initializeQueue() {
        try {
            this.bullmq.registerProcessor(shield_constants_1.SHIELD_CONSTANTS.QUEUES.PERMISSION_SYNC, shield_constants_1.SHIELD_CONSTANTS.JOBS.SYNC_USER_PERMISSIONS, this.permissionSyncProcessor.processPermissionSync.bind(this.permissionSyncProcessor));
            this.logger.info('Permission Sync Queue initialized', {
                queueName: shield_constants_1.SHIELD_CONSTANTS.QUEUES.PERMISSION_SYNC,
                jobType: shield_constants_1.SHIELD_CONSTANTS.JOBS.SYNC_USER_PERMISSIONS,
            });
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'PermissionSyncQueue.initializeQueue', 'system');
            throw error;
        }
    }
    async syncUserPermissions(userId, operation) {
        try {
            await this.bullmq.addJob(shield_constants_1.SHIELD_CONSTANTS.QUEUES.PERMISSION_SYNC, shield_constants_1.SHIELD_CONSTANTS.JOBS.SYNC_USER_PERMISSIONS, {
                type: 'USER_PERMISSIONS',
                user_id: userId,
                operation,
                timestamp: new Date(),
            }, {
                priority: shield_constants_1.SHIELD_CONSTANTS.JOB_PRIORITIES.NORMAL,
                attempts: 2,
                delay: 1000,
            });
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'PermissionSyncQueue.syncUserPermissions', userId);
            throw error;
        }
    }
    async syncRolePermissions(roleId, operation) {
        try {
            await this.bullmq.addJob(shield_constants_1.SHIELD_CONSTANTS.QUEUES.PERMISSION_SYNC, shield_constants_1.SHIELD_CONSTANTS.JOBS.UPDATE_ROLE_HIERARCHY, {
                type: 'ROLE_PERMISSIONS',
                role_id: roleId,
                operation,
                timestamp: new Date(),
            }, {
                priority: shield_constants_1.SHIELD_CONSTANTS.JOB_PRIORITIES.HIGH,
                attempts: 2,
            });
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'PermissionSyncQueue.syncRolePermissions', 'system', { roleId });
            throw error;
        }
    }
};
exports.PermissionSyncQueue = PermissionSyncQueue;
exports.PermissionSyncQueue = PermissionSyncQueue = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bullmq_service_1.BullmqService,
        permission_sync_processor_1.PermissionSyncProcessor,
        logger_service_1.LoggerService])
], PermissionSyncQueue);
//# sourceMappingURL=permission-sync.queue.js.map