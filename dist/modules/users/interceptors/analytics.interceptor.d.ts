import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { LoggerService } from '../../../shared/logger/logger.service';
import { BullmqService } from '../../../shared/bullmq/bullmq.service';
export declare class AnalyticsInterceptor implements NestInterceptor {
    private readonly logger;
    private readonly bullmq;
    constructor(logger: LoggerService, bullmq: BullmqService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private trackAnalyticsEvent;
    private shouldTrackEvent;
    private buildAnalyticsEvent;
    private determineUpdateType;
}
