// src/modules/users/processors/group-invitation.processor.ts

import { Processor, Process } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { EmailService } from '../../../shared/email/email.service';
import { LoggerService } from '../../../shared/logger/logger.service';

// Types d'interfaces pour les jobs
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

@Injectable()
@Processor('group-invitations')
export class GroupInvitationProcessor {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    logger: LoggerService,
  ) {
    this.logger = logger.createChildLogger('GroupInvitationProcessor');
  }

  @Process('send-group-invitation')
  async processGroupInvitation(job: Job<GroupInvitationJobData>): Promise<void> {
    const { 
      invitationId, 
      groupId, 
      groupName, 
      groupType,
      invitedEmail, 
      invitedUserId,
      invitedName,
      inviterName,
      inviterEmail,
      inviterUserId,
      proposedRole,
      message,
      expiresAt,
      invitationToken,
      acceptUrl,
      declineUrl
    } = job.data;

    this.logger.info('Processing group invitation email', JSON.stringify({
      jobId: job.id,
      invitationId,
      groupId,
      invitedEmail: invitedEmail || 'existing-user',
      proposedRole,
    }));

    try {
      // Vérifier que le groupe existe toujours et est actif
      const group = await this.prisma.groups.findUnique({
        where: { id: groupId },
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          is_active: true,
          max_members: true,
          metadata: true,
        },
      });

      if (!group || !group.is_active) {
        this.logger.error('Group not found or inactive', '', JSON.stringify({
          groupId,
          invitationId,
          jobId: job.id,
        }));
        return;
      }

      // Compter les membres actuels
      const currentMemberCount = await this.prisma.user_groups.count({
        where: {
          group_id: groupId,
          status: 'ACTIVE',
        },
      });

      // Préparer les données pour le template email
      const templateData = {
        // Informations sur l'invité
        invitedName: invitedName || 'Nouvel ami',
        invitedEmail: invitedEmail,
        
        // Informations sur l'inviteur
        inviterName,
        inviterEmail,
        
        // Informations sur le groupe
        groupName: group.name,
        groupDescription: group.description,
        groupType: this.getGroupTypeLabel(group.type),
        memberCount: currentMemberCount,
        maxMembers: group.max_members,
        hasSpaceLeft: !group.max_members || currentMemberCount < group.max_members,
        
        // Informations sur l'invitation
        proposedRole: this.getRoleLabel(proposedRole),
        personalMessage: message,
        expiresAt: expiresAt,
        expiresInDays: Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        
        // URLs d'action
        acceptUrl,
        declineUrl,
        groupUrl: `${process.env.FRONTEND_URL}/groups/${groupId}`,
        
        // Métadonnées
        invitationToken,
        supportUrl: `${process.env.FRONTEND_URL}/support`,
        year: new Date().getFullYear(),
      };

      // Déterminer l'email de destination
      let recipientEmail = invitedEmail;
      if (!recipientEmail && invitedUserId) {
        const invitedUser = await this.prisma.users.findUnique({
          where: { id: invitedUserId },
          select: { email: true },
        });
        recipientEmail = invitedUser?.email;
      }

      if (!recipientEmail) {
        this.logger.error('No recipient email found', '', JSON.stringify({
          invitationId,
          invitedUserId,
          jobId: job.id,
        }));
        return;
      }

      // Envoyer l'email d'invitation
      await this.emailService.sendMail({
        to: recipientEmail,
        subject: `${inviterName} vous invite à rejoindre le groupe "${group.name}"`,
        template: 'group-invitation',
        context: templateData,
      });

      this.logger.info('Group invitation email sent successfully', JSON.stringify({
        invitationId,
        groupId,
        recipientEmail,
        jobId: job.id,
      }));

      // Logger l'événement business
      this.logger.logBusinessEvent(
        'GROUP_INVITATION_EMAIL_SENT',
        {
          invitationId,
          groupId,
          groupName: group.name,
          invitedEmail: recipientEmail,
          invitedUserId: invitedUserId,
          proposedRole,
          inviterName,
          inviterUserId,
          groupType: group.type,
        },
        invitedUserId,
      );

    } catch (error) {
      this.logger.logErrorEvent(
        error,
        'GroupInvitationProcessor.processGroupInvitation',
        invitedUserId,
        JSON.stringify({
          invitationId,
          groupId,
          invitedEmail,
          jobId: job.id,
        }),
      );

      throw error;
    }
  }

  @Process('send-group-reminder')
  async processGroupReminder(job: Job<GroupReminderJobData>): Promise<void> {
    const { invitationId, reminderNumber, originalData } = job.data;

    this.logger.info('Processing group invitation reminder', JSON.stringify({
      jobId: job.id,
      invitationId,
      reminderNumber,
      groupId: originalData.groupId,
    }));

    try {
      // Vérifier que le groupe est toujours actif
      const group = await this.prisma.groups.findUnique({
        where: { id: originalData.groupId },
        select: {
          id: true,
          name: true,
          is_active: true,
        },
      });

      if (!group || !group.is_active) {
        this.logger.info('Skipping reminder for inactive group', JSON.stringify({
          invitationId,
          groupId: originalData.groupId,
          jobId: job.id,
        }));
        return;
      }

      // Vérifier si l'utilisateur n'a pas déjà rejoint le groupe
      if (originalData.invitedUserId) {
        const existingMember = await this.prisma.user_groups.findFirst({
          where: {
            user_id: originalData.invitedUserId,
            group_id: originalData.groupId,
            status: 'ACTIVE',
          },
        });

        if (existingMember) {
          this.logger.info('Skipping reminder - user already joined group', JSON.stringify({
            invitationId,
            userId: originalData.invitedUserId,
            groupId: originalData.groupId,
            jobId: job.id,
          }));
          return;
        }
      }

      // Vérifier que l'invitation n'a pas expiré
      if (new Date() > new Date(originalData.expiresAt)) {
        this.logger.info('Skipping reminder for expired invitation', JSON.stringify({
          invitationId,
          expiresAt: originalData.expiresAt,
          jobId: job.id,
        }));
        return;
      }

      // Préparer les données pour le template de rappel
      const templateData = {
        ...originalData,
        reminderNumber,
        isFirstReminder: reminderNumber === 1,
        isFinalReminder: reminderNumber === 2,
        expiresInHours: Math.ceil((new Date(originalData.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)),
        urgencyLevel: reminderNumber === 2 ? 'high' : 'medium',
        year: new Date().getFullYear(),
      };

      // Déterminer l'email de destination
      let recipientEmail = originalData.invitedEmail;
      if (!recipientEmail && originalData.invitedUserId) {
        const invitedUser = await this.prisma.users.findUnique({
          where: { id: originalData.invitedUserId },
          select: { email: true },
        });
        recipientEmail = invitedUser?.email;
      }

      if (!recipientEmail) {
        this.logger.error('No recipient email found for reminder', '', JSON.stringify({
          invitationId,
          invitedUserId: originalData.invitedUserId,
          jobId: job.id,
        }));
        return;
      }

      // Envoyer le rappel
      await this.emailService.sendMail({
        to: recipientEmail,
        subject: `Rappel: Invitation à rejoindre "${originalData.groupName}"`,
        template: 'group-invitation-reminder',
        context: templateData,
      });

      this.logger.info('Group invitation reminder sent successfully', JSON.stringify({
        invitationId,
        reminderNumber,
        groupId: originalData.groupId,
        recipientEmail,
        jobId: job.id,
      }));

      // Logger l'événement business
      this.logger.logBusinessEvent(
        'GROUP_INVITATION_REMINDER_SENT',
        {
          invitationId,
          reminderNumber,
          groupId: originalData.groupId,
          groupName: originalData.groupName,
          invitedEmail: recipientEmail,
          invitedUserId: originalData.invitedUserId,
        },
        originalData.invitedUserId,
      );

    } catch (error) {
      this.logger.logErrorEvent(
        error,
        'GroupInvitationProcessor.processGroupReminder',
        originalData.invitedUserId,
        JSON.stringify({
          invitationId,
          reminderNumber,
          jobId: job.id,
        }),
      );

      throw error;
    }
  }

  @Process('send-group-notification')
  async processGroupNotification(job: Job<GroupNotificationJobData>): Promise<void> {
    const { 
      groupId, 
      groupName, 
      notificationType, 
      memberName, 
      memberEmail,
      memberUserId,
      memberRole,
      oldRole,
      newRole,
      actorName,
      reason,
      adminEmails,
      metadata 
    } = job.data;

    this.logger.info('Processing group notification', JSON.stringify({
      jobId: job.id,
      groupId,
      notificationType,
      memberEmail,
      adminCount: adminEmails?.length || 0,
    }));

    try {
      // Vérifier que le groupe existe toujours
      const group = await this.prisma.groups.findUnique({
        where: { id: groupId },
        select: {
          id: true,
          name: true,
          is_active: true,
        },
      });

      if (!group || !group.is_active) {
        this.logger.error('Group not found or inactive for notification', '', JSON.stringify({
          groupId,
          notificationType,
          jobId: job.id,
        }));
        return;
      }

      // Préparer les données communes pour le template
      const baseTemplateData: Record<string, any> = {
        groupName: group.name,
        groupUrl: `${process.env.FRONTEND_URL}/groups/${groupId}`,
        memberName,
        memberEmail,
        memberRole: this.getRoleLabel(memberRole),
        actorName,
        reason,
        timestamp: new Date(),
        notificationType,
        year: new Date().getFullYear(),
        supportUrl: `${process.env.FRONTEND_URL}/support`,
        ...metadata,
      };

      // Préparer les données spécifiques selon le type de notification
      let templateData: Record<string, any> = { ...baseTemplateData };
      let subject = '';
      let template = '';

      switch (notificationType) {
        case 'MEMBER_JOINED':
          subject = `${memberName} a rejoint le groupe "${group.name}"`;
          template = 'group-member-joined';
          break;

        case 'MEMBER_LEFT':
          subject = `${memberName} a quitté le groupe "${group.name}"`;
          template = 'group-member-left';
          templateData = { ...baseTemplateData, reason };
          break;

        case 'ROLE_CHANGED':
          subject = `Rôle modifié pour ${memberName} dans "${group.name}"`;
          template = 'group-role-changed';
          templateData = { 
            ...baseTemplateData, 
            oldRole: this.getRoleLabel(oldRole),
            newRole: this.getRoleLabel(newRole),
            isPromotion: this.isRolePromotion(oldRole, newRole),
          };
          break;

        case 'INVITATION_ACCEPTED':
          subject = `${memberName} a accepté l'invitation au groupe "${group.name}"`;
          template = 'group-invitation-accepted';
          break;

        case 'INVITATION_DECLINED':
          subject = `${memberName} a décliné l'invitation au groupe "${group.name}"`;
          template = 'group-invitation-declined';
          break;

        default:
          this.logger.error('Unknown notification type', '', JSON.stringify({
            notificationType,
            groupId,
            jobId: job.id,
          }));
          return;
      }

      // Envoyer les notifications aux administrateurs
      if (adminEmails && adminEmails.length > 0) {
        for (const adminEmail of adminEmails) {
          try {
            await this.emailService.sendMail({
              to: adminEmail,
              subject,
              template,
              context: templateData,
            });
          } catch (emailError) {
            this.logger.error(`Failed to send notification to admin ${adminEmail}`, emailError.stack, JSON.stringify({
              groupId,
              notificationType,
              adminEmail,
              jobId: job.id,
            }));
          }
        }

        this.logger.info('Group notification emails sent successfully', JSON.stringify({
          groupId,
          notificationType,
          adminEmailsSent: adminEmails.length,
          jobId: job.id,
        }));

        // Logger l'événement business
        this.logger.logBusinessEvent(
          'GROUP_NOTIFICATION_SENT',
          {
            groupId,
            groupName: group.name,
            notificationType,
            memberName,
            memberEmail,
            memberUserId,
            adminCount: adminEmails.length,
            hasReason: !!reason,
          },
          memberUserId,
        );
      }

    } catch (error) {
      this.logger.logErrorEvent(
        error,
        'GroupInvitationProcessor.processGroupNotification',
        memberUserId,
        JSON.stringify({
          groupId,
          notificationType,
          jobId: job.id,
        }),
      );

      throw error;
    }
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES PRIVÉES
  // ============================================================================

  /**
   * Convertit le type de groupe en label lisible
   */
  private getGroupTypeLabel(groupType: string): string {
    const typeLabels: Record<string, string> = {
      FAMILY: 'Famille',
      FRIENDS: 'Amis',
      CORPORATE: 'Entreprise',
      ASSOCIATION: 'Association',
      TEMPORARY: 'Temporaire',
      EDUCATIONAL: 'Éducatif',
    };

    return typeLabels[groupType] || groupType;
  }

  /**
   * Convertit le rôle en label lisible
   */
  private getRoleLabel(role?: string): string {
    if (!role) return 'Membre';

    const roleLabels: Record<string, string> = {
      OWNER: 'Propriétaire',
      ADMIN: 'Administrateur',
      MANAGER: 'Gestionnaire',
      MEMBER: 'Membre',
    };

    return roleLabels[role] || role;
  }

  /**
   * Détermine si un changement de rôle est une promotion
   */
  private isRolePromotion(oldRole?: string, newRole?: string): boolean {
    if (!oldRole || !newRole) return false;

    const roleHierarchy: Record<string, number> = {
      MEMBER: 1,
      MANAGER: 2,
      ADMIN: 3,
      OWNER: 4,
    };

    return (roleHierarchy[newRole] || 0) > (roleHierarchy[oldRole] || 0);
  }
}