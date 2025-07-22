import { Job } from 'bull';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { EmailService } from '../../../shared/email/email.service';
import { LoggerService } from '../../../shared/logger/logger.service';
export interface GroupInvitationJobData {
    invitationId: string;
    groupId: string;
    groupName: string;
    groupType: string;
    invitedEmail?: string;
    invitedUserId?: string;
    invitedName?: string;
    inviterName: string;
    inviterEmail: string;
    inviterUserId: string;
    proposedRole: string;
    message?: string;
    expiresAt: string;
    invitationToken: string;
    acceptUrl: string;
    declineUrl: string;
}
export interface GroupReminderJobData {
    invitationId: string;
    reminderNumber: number;
    originalData: GroupInvitationJobData;
}
export interface GroupNotificationJobData {
    groupId: string;
    groupName: string;
    notificationType: 'MEMBER_JOINED' | 'MEMBER_LEFT' | 'ROLE_CHANGED' | 'INVITATION_ACCEPTED' | 'INVITATION_DECLINED';
    memberName: string;
    memberEmail: string;
    memberUserId: string;
    memberRole?: string;
    oldRole?: string;
    newRole?: string;
    actorName: string;
    reason?: string;
    adminEmails: string[];
    metadata?: Record<string, any>;
}
export declare class GroupInvitationProcessor {
    private readonly prisma;
    private readonly emailService;
    private readonly logger;
    constructor(prisma: PrismaService, emailService: EmailService, logger: LoggerService);
    processGroupInvitation(job: Job<GroupInvitationJobData>): Promise<void>;
    processGroupReminder(job: Job<GroupReminderJobData>): Promise<void>;
    processGroupNotification(job: Job<GroupNotificationJobData>): Promise<void>;
    private getGroupTypeLabel;
    private getRoleLabel;
    private isRolePromotion;
}
