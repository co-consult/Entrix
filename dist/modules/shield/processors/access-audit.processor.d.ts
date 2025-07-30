import { Job } from 'bullmq';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { EmailService } from '../../../shared/email/email.service';
import { AuditEventType, AccessStatus, ResourceType } from '../types/access-enums';
interface AccessAuditJobData {
    user_id: string | null;
    event_type: AuditEventType;
    resource_type: ResourceType;
    resource_id: string | null;
    action: string;
    status: AccessStatus;
    ip_address: string | null;
    user_agent: string | null;
    details: any;
    timestamp: Date;
}
export declare class AccessAuditProcessor {
    private readonly prisma;
    private readonly emailService;
    private readonly logger;
    constructor(prisma: PrismaService, emailService: EmailService, loggerService: LoggerService);
    processAccessAuditEvent(job: Job<AccessAuditJobData>): Promise<void>;
    private storeAuditEvent;
    private detectAnomalies;
    private detectFailedAttemptPattern;
    private detectSuspiciousAccess;
    private detectActivitySpikes;
    private updateMetrics;
    private triggerNotifications;
    private isCriticalEvent;
    private isSecurityViolation;
    private createSecurityAlert;
    private sendCriticalEventNotification;
    private sendSecurityViolationNotification;
    private sendSecurityAlertEmail;
}
export {};
