import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { EmailService } from '../../../shared/email/email.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { BullmqService } from '../../../shared/bullmq/bullmq.service';
import { SendInvitationDto } from '../dto/invitations/send-invitation.dto';
import { BulkInvitationDto } from '../dto/invitations/bulk-invitation.dto';
import { InvitationType, InvitationStatus } from '../types/enums';
interface StoredInvitation {
    id: string;
    type: InvitationType;
    status: InvitationStatus;
    token: string;
    contextId: string;
    contextName: string;
    invitedBy: string;
    inviterName: string;
    invitedEmail?: string;
    invitedUserId?: string;
    invitedName?: string;
    proposedRole?: string;
    message?: string;
    createdAt: string;
    expiresAt: string;
    respondedAt?: string;
    remindersSent: number;
    lastReminderAt?: string;
    viewedAt?: string;
    ipAddress?: string;
    userAgent?: string;
}
interface InvitationResult {
    id: string;
    token: string;
    type: InvitationType;
    status: InvitationStatus;
    contextId: string;
    contextName: string;
    invitedEmail?: string;
    invitedUserId?: string;
    expiresAt: Date;
    invitationUrl: string;
    emailSent: boolean;
    smsSent: boolean;
}
interface BulkInvitationResult {
    total: number;
    successful: InvitationResult[];
    failed: Array<{
        email?: string;
        userId?: string;
        name?: string;
        error: string;
        code: string;
    }>;
    duplicates?: Array<{
        email?: string;
        userId?: string;
        reason: string;
    }>;
    processingTime: number;
    warnings?: string[];
}
interface InvitationStats {
    total: number;
    pending: number;
    accepted: number;
    declined: number;
    expired: number;
    cancelled: number;
    acceptanceRate: number;
    averageResponseTime: number;
}
export declare class InvitationsService {
    private readonly prisma;
    private readonly email;
    private readonly redis;
    private readonly bullmq;
    private readonly logger;
    private readonly CACHE_PREFIX;
    private readonly TOKEN_LENGTH;
    constructor(prisma: PrismaService, loggerService: LoggerService, email: EmailService, redis: RedisService, bullmq: BullmqService);
    send(invitationData: SendInvitationDto, invitedBy: string): Promise<InvitationResult>;
    sendBulk(bulkData: BulkInvitationDto, invitedBy: string): Promise<BulkInvitationResult>;
    accept(token: string, userId: string, ipAddress?: string, userAgent?: string): Promise<any>;
    decline(token: string, userId: string, reason?: string, ipAddress?: string, userAgent?: string): Promise<void>;
    findByToken(token: string): Promise<StoredInvitation | null>;
    cleanupExpired(): Promise<number>;
    getStats(contextId?: string, type?: InvitationType): Promise<InvitationStats>;
    private validateInviterPermissions;
    private validateGroupInvitePermissions;
    private validateEventInvitePermissions;
    private checkInvitationLimits;
    private checkBulkInvitationLimits;
    private checkExistingInvitation;
    private findExistingInvitation;
    private getContextName;
    private getInviterName;
    private storeInvitation;
    private updateInvitationStatus;
    private processGroupInvitationAcceptance;
    private processEventInvitationAcceptance;
    private processFriendInvitationAcceptance;
    private validateInvitation;
    private checkIfAlreadyMember;
    private cacheInvitation;
    private removeFromCache;
    private cleanExpiredFromCache;
    private countPendingInvitations;
    private countDailyInvitations;
    private sendInvitationEmail;
    private sendInvitationSms;
    private scheduleReminders;
    private sendAcceptanceNotifications;
    private sendDeclineNotification;
    private getPostAcceptanceActions;
}
export {};
