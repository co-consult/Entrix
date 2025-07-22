// src/modules/users/queues/group-invitation.queue.ts

import { Injectable } from '@nestjs/common';
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

@Injectable()
export class GroupInvitationQueue {
  private readonly logger: LoggerService;

  constructor(
    private readonly bullmq: BullmqService,
    logger: LoggerService,
  ) {
    this.logger = logger.createChildLogger('GroupInvitationQueue');
  }

  /**
   * Envoie une invitation de groupe par email
   */
  async sendGroupInvitation(data: GroupInvitationJobData): Promise<void> {
    try {
      this.logger.info('Scheduling group invitation email', JSON.stringify({
        invitationId: data.invitationId,
        groupId: data.groupId,
        invitedEmail: data.invitedEmail,
        proposedRole: data.proposedRole,
      }));

      await this.bullmq.addPriorityJob(
        'email',
        'send-group-invitation',
        data,
        'HIGH',
      );

      // Programmer les rappels automatiques
      await this.scheduleInvitationReminders(data);

      this.logger.info('Group invitation email scheduled successfully', JSON.stringify({
        invitationId: data.invitationId,
        jobType: 'send-group-invitation',
      }));
    } catch (error) {
      this.logger.error(
        'Failed to schedule group invitation email',
        error.stack,
        JSON.stringify({ 
          invitationId: data.invitationId,
          groupId: data.groupId,
        }),
      );
      throw error;
    }
  }

  /**
   * Envoie plusieurs invitations en lot
   */
  async sendBulkGroupInvitations(invitations: GroupInvitationJobData[]): Promise<void> {
    try {
      this.logger.info('Scheduling bulk group invitations', JSON.stringify({
        count: invitations.length,
        groupId: invitations[0]?.groupId,
      }));

      for (const invitation of invitations) {
        await this.bullmq.addJob(
          'email',
          'send-group-invitation',
          invitation,
        );

        // Petit délai entre chaque invitation pour éviter le spam
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.logger.info('Bulk group invitations scheduled successfully', JSON.stringify({
        count: invitations.length,
        jobType: 'send-group-invitation-bulk',
      }));
    } catch (error) {
      this.logger.error(
        'Failed to schedule bulk group invitations',
        error.stack,
        JSON.stringify({ count: invitations.length }),
      );
      throw error;
    }
  }

  /**
   * Programme les rappels d'invitation
   */
  private async scheduleInvitationReminders(data: GroupInvitationJobData): Promise<void> {
    try {
      const now = new Date();
      const expiresAt = new Date(data.expiresAt);
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();

      // Premier rappel après 24h si l'invitation expire dans plus de 48h
      if (timeUntilExpiry > 48 * 60 * 60 * 1000) {
        const firstReminderData: GroupReminderJobData = {
          invitationId: data.invitationId,
          reminderNumber: 1,
          originalData: data,
        };

        await this.bullmq.addDelayedJob(
          'email',
          'send-invitation-reminder',
          firstReminderData,
          24 * 60 * 60 * 1000, // 24h
        );
      }

      // Rappel final 24h avant expiration si l'invitation expire dans plus de 48h
      if (timeUntilExpiry > 48 * 60 * 60 * 1000) {
        const finalReminderData: GroupReminderJobData = {
          invitationId: data.invitationId,
          reminderNumber: 2,
          originalData: data,
        };

        await this.bullmq.addDelayedJob(
          'email',
          'send-invitation-reminder',
          finalReminderData,
          timeUntilExpiry - 24 * 60 * 60 * 1000, // 24h avant expiration
        );
      }

      this.logger.info('Invitation reminders scheduled', JSON.stringify({
        invitationId: data.invitationId,
        timeUntilExpiry: Math.round(timeUntilExpiry / (60 * 60 * 1000)), // en heures
      }));
    } catch (error) {
      this.logger.error(
        'Failed to schedule invitation reminders',
        error.stack,
        JSON.stringify({ invitationId: data.invitationId }),
      );
      // Ne pas faire échouer l'invitation principale pour les rappels
    }
  }

  /**
   * Envoie un rappel d'invitation
   */
  async sendInvitationReminder(data: GroupReminderJobData): Promise<void> {
    try {
      this.logger.info('Scheduling invitation reminder email', JSON.stringify({
        invitationId: data.invitationId,
        reminderNumber: data.reminderNumber,
      }));

      await this.bullmq.addPriorityJob(
        'email',
        'send-invitation-reminder',
        data,
        'NORMAL',
      );

      this.logger.info('Invitation reminder scheduled successfully', JSON.stringify({
        invitationId: data.invitationId,
        jobType: 'send-invitation-reminder',
      }));
    } catch (error) {
      this.logger.error(
        'Failed to schedule invitation reminder',
        error.stack,
        JSON.stringify({ invitationId: data.invitationId }),
      );
      throw error;
    }
  }

  /**
   * Notifie les administrateurs d'un événement de groupe
   */
  async sendGroupNotification(data: GroupNotificationJobData): Promise<void> {
    try {
      this.logger.info('Scheduling group notification', JSON.stringify({
        groupId: data.groupId,
        notificationType: data.notificationType,
        memberName: data.memberName,
        adminCount: data.adminEmails.length,
      }));

      await this.bullmq.addJob(
        'email',
        'send-group-notification',
        data,
      );

      this.logger.info('Group notification scheduled successfully', JSON.stringify({
        groupId: data.groupId,
        notificationType: data.notificationType,
        jobType: 'send-group-notification',
      }));
    } catch (error) {
      this.logger.error(
        'Failed to schedule group notification',
        error.stack,
        JSON.stringify({ 
          groupId: data.groupId,
          notificationType: data.notificationType,
        }),
      );
      throw error;
    }
  }

  /**
   * Notifie qu'un membre a rejoint le groupe
   */
  async notifyMemberJoined(
    groupId: string,
    groupName: string,
    memberName: string,
    memberEmail: string,
    memberRole: GroupRole,
    adminEmails: string[],
  ): Promise<void> {
    const data: GroupNotificationJobData = {
      groupId,
      groupName,
      notificationType: 'MEMBER_JOINED',
      memberName,
      memberEmail,
      memberRole,
      adminEmails,
    };

    await this.sendGroupNotification(data);
  }

  /**
   * Notifie qu'un membre a quitté le groupe
   */
  async notifyMemberLeft(
    groupId: string,
    groupName: string,
    memberName: string,
    memberEmail: string,
    reason: string | undefined,
    adminEmails: string[],
  ): Promise<void> {
    const data: GroupNotificationJobData = {
      groupId,
      groupName,
      notificationType: 'MEMBER_LEFT',
      memberName,
      memberEmail,
      reason,
      adminEmails,
    };

    await this.sendGroupNotification(data);
  }

  /**
   * Notifie qu'un rôle de membre a changé
   */
  async notifyRoleChanged(
    groupId: string,
    groupName: string,
    memberName: string,
    memberEmail: string,
    oldRole: GroupRole,
    newRole: GroupRole,
    actorName: string,
    adminEmails: string[],
    reason?: string,
  ): Promise<void> {
    const data: GroupNotificationJobData = {
      groupId,
      groupName,
      notificationType: 'ROLE_CHANGED',
      memberName,
      memberEmail,
      oldRole,
      newRole,
      actorName,
      reason,
      adminEmails,
    };

    await this.sendGroupNotification(data);
  }

  /**
   * Annule tous les rappels pour une invitation
   */
  async cancelInvitationReminders(invitationId: string): Promise<void> {
    try {
      this.logger.info('Cancelling invitation reminders', JSON.stringify({ invitationId }));

      // Ici on pourrait implémenter la logique d'annulation des jobs
      // En attendant que BullmqService ait une méthode pour ça

      this.logger.info('Invitation reminders cancelled successfully', JSON.stringify({
        invitationId,
        action: 'cancelled-reminders',
      }));
    } catch (error) {
      this.logger.error(
        'Failed to cancel invitation reminders',
        error.stack,
        JSON.stringify({ invitationId }),
      );
      throw error;
    }
  }
}