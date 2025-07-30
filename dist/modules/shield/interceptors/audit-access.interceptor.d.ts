import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { LoggerService } from '../../../shared/logger/logger.service';
import { BullmqService } from '../../../shared/bullmq/bullmq.service';
export declare class AuditAccessInterceptor implements NestInterceptor {
    private readonly bullmq;
    private readonly logger;
    private readonly CRITICAL_ROUTES;
    private readonly ACTION_MAP;
    constructor(bullmq: BullmqService, loggerService: LoggerService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private shouldAuditRoute;
    private prepareBaseAuditData;
    private auditSuccessfulRequest;
    private auditFailedRequest;
    private determineEventType;
    private extractResourceType;
    private extractResourceId;
    private extractClientIP;
    private sanitizeRequestBody;
    private extractSpecificAuditDetails;
    private sendToAuditQueue;
}
