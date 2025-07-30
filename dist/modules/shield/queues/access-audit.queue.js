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
exports.AccessAuditQueue = void 0;
const common_1 = require("@nestjs/common");
const bullmq_service_1 = require("../../../shared/bullmq/bullmq.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const shield_constants_1 = require("../types/shield-constants");
const access_audit_processor_1 = require("../processors/access-audit.processor");
let AccessAuditQueue = class AccessAuditQueue {
    bullmq;
    accessAuditProcessor;
    logger;
    constructor(bullmq, accessAuditProcessor, loggerService) {
        this.bullmq = bullmq;
        this.accessAuditProcessor = accessAuditProcessor;
        this.logger = loggerService.createChildLogger('AccessAuditQueue');
        this.initializeQueue();
    }
    async initializeQueue() {
        try {
            this.bullmq.registerProcessor(shield_constants_1.SHIELD_CONSTANTS.QUEUES.ACCESS_AUDIT, shield_constants_1.SHIELD_CONSTANTS.JOBS.LOG_ACCESS_EVENT, this.accessAuditProcessor.processAccessAuditEvent.bind(this.accessAuditProcessor));
            this.logger.info('Access Audit Queue initialized', {
                queueName: shield_constants_1.SHIELD_CONSTANTS.QUEUES.ACCESS_AUDIT,
                jobType: shield_constants_1.SHIELD_CONSTANTS.JOBS.LOG_ACCESS_EVENT,
            });
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AccessAuditQueue.initializeQueue', 'system');
            throw error;
        }
    }
    async addAuditEvent(eventData, options) {
        try {
            await this.bullmq.addJob(shield_constants_1.SHIELD_CONSTANTS.QUEUES.ACCESS_AUDIT, shield_constants_1.SHIELD_CONSTANTS.JOBS.LOG_ACCESS_EVENT, eventData, {
                priority: shield_constants_1.SHIELD_CONSTANTS.JOB_PRIORITIES.HIGH,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
                ...options,
            });
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AccessAuditQueue.addAuditEvent', eventData.user_id || 'unknown');
            throw error;
        }
    }
};
exports.AccessAuditQueue = AccessAuditQueue;
exports.AccessAuditQueue = AccessAuditQueue = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bullmq_service_1.BullmqService,
        access_audit_processor_1.AccessAuditProcessor,
        logger_service_1.LoggerService])
], AccessAuditQueue);
//# sourceMappingURL=access-audit.queue.js.map