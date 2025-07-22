import { BullmqService } from '../../../shared/bullmq/bullmq.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { GroupRole } from '../types/group.types';
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
    proposedRole: GroupRole;
    message?: string;
    expiresAt: Date;
    invitationToken: string;
    acceptUrl: string;
    declineUrl: string;
}
export interface GroupReminderJobData {
    invitationId: string;
    reminderNumber: 1 | 2;
    originalData: GroupInvitationJobData;
}
export interface GroupNotificationJobData {
    groupId: string;
    groupName: string;
    notificationType: 'MEMBER_JOINED' | 'MEMBER_LEFT' | 'ROLE_CHANGED' | 'INVITATION_ACCEPTED' | 'INVITATION_DECLINED';
    memberName: string;
    memberEmail: string;
    memberRole?: GroupRole;
    oldRole?: GroupRole;
    newRole?: GroupRole;
    actorName?: string;
    reason?: string;
    adminEmails: string[];
    metadata?: Record<string, any>;
}
export declare class GroupInvitationQueue {
    private readonly bullmq;
    private readonly logger;
    constructor(bullmq: BullmqService, logger: LoggerService);
    sendGroupInvitation(data: GroupInvitationJobData): Promise<void>;
    sendBulkGroupInvitations(invitations: GroupInvitationJobData[]): Promise<void>;
    private scheduleInvitationReminders;
    sendInvitationReminder(data: GroupReminderJobData): Promise<void>;
    sendGroupNotification(data: GroupNotificationJobData): Promise<void>;
    notifyMemberJoined(groupId: string, groupName: string, memberName: string, memberEmail: string, memberRole: GroupRole, adminEmails: string[]): Promise<void>;
    notifyMemberLeft(groupId: string, groupName: string, memberName: string, memberEmail: string, reason: string | undefined, adminEmails: string[]): Promise<void>;
    notifyRoleChanged(groupId: string, groupName: string, memberName: string, memberEmail: string, oldRole: GroupRole, newRole: GroupRole, actorName: string, adminEmails: string[], reason?: string): Promise<void>;
    cancelInvitationReminders(invitationId: string): Promise<void>;
}
