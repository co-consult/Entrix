import { BullmqService } from '../../../shared/bullmq/bullmq.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { AccessAuditProcessor } from '../processors/access-audit.processor';
export declare class AccessAuditQueue {
    private readonly bullmq;
    private readonly accessAuditProcessor;
    private readonly logger;
    constructor(bullmq: BullmqService, accessAuditProcessor: AccessAuditProcessor, loggerService: LoggerService);
    private initializeQueue;
    addAuditEvent(eventData: any, options?: any): Promise<void>;
}
