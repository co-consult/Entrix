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
exports.GroupInvitationQueue = void 0;
const common_1 = require("@nestjs/common");
const bullmq_service_1 = require("../../../shared/bullmq/bullmq.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
let GroupInvitationQueue = class GroupInvitationQueue {
    bullmq;
    logger;
    constructor(bullmq, logger) {
        this.bullmq = bullmq;
        this.logger = logger.createChildLogger('GroupInvitationQueue');
    }
    async sendGroupInvitation(data) {
        try {
            this.logger.info('Scheduling group invitation email', JSON.stringify({
                invitationId: data.invitationId,
                groupId: data.groupId,
                invitedEmail: data.invitedEmail,
                proposedRole: data.proposedRole,
            }));
            await this.bullmq.addPriorityJob('email', 'send-group-invitation', data, 'HIGH');
            await this.scheduleInvitationReminders(data);
            this.logger.info('Group invitation email scheduled successfully', JSON.stringify({
                invitationId: data.invitationId,
                jobType: 'send-group-invitation',
            }));
        }
        catch (error) {
            this.logger.error('Failed to schedule group invitation email', error.stack, JSON.stringify({
                invitationId: data.invitationId,
                groupId: data.groupId,
            }));
            throw error;
        }
    }
    async sendBulkGroupInvitations(invitations) {
        try {
            this.logger.info('Scheduling bulk group invitations', JSON.stringify({
                count: invitations.length,
                groupId: invitations[0]?.groupId,
            }));
            for (const invitation of invitations) {
                await this.bullmq.addJob('email', 'send-group-invitation', invitation);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            this.logger.info('Bulk group invitations scheduled successfully', JSON.stringify({
                count: invitations.length,
                jobType: 'send-group-invitation-bulk',
            }));
        }
        catch (error) {
            this.logger.error('Failed to schedule bulk group invitations', error.stack, JSON.stringify({ count: invitations.length }));
            throw error;
        }
    }
    async scheduleInvitationReminders(data) {
        try {
            const now = new Date();
            const expiresAt = new Date(data.expiresAt);
            const timeUntilExpiry = expiresAt.getTime() - now.getTime();
            if (timeUntilExpiry > 48 * 60 * 60 * 1000) {
                const firstReminderData = {
                    invitationId: data.invitationId,
                    reminderNumber: 1,
                    originalData: data,
                };
                await this.bullmq.addDelayedJob('email', 'send-invitation-reminder', firstReminderData, 24 * 60 * 60 * 1000);
            }
            if (timeUntilExpiry > 48 * 60 * 60 * 1000) {
                const finalReminderData = {
                    invitationId: data.invitationId,
                    reminderNumber: 2,
                    originalData: data,
                };
                await this.bullmq.addDelayedJob('email', 'send-invitation-reminder', finalReminderData, timeUntilExpiry - 24 * 60 * 60 * 1000);
            }
            this.logger.info('Invitation reminders scheduled', JSON.stringify({
                invitationId: data.invitationId,
                timeUntilExpiry: Math.round(timeUntilExpiry / (60 * 60 * 1000)),
            }));
        }
        catch (error) {
            this.logger.error('Failed to schedule invitation reminders', error.stack, JSON.stringify({ invitationId: data.invitationId }));
        }
    }
    async sendInvitationReminder(data) {
        try {
            this.logger.info('Scheduling invitation reminder email', JSON.stringify({
                invitationId: data.invitationId,
                reminderNumber: data.reminderNumber,
            }));
            await this.bullmq.addPriorityJob('email', 'send-invitation-reminder', data, 'NORMAL');
            this.logger.info('Invitation reminder scheduled successfully', JSON.stringify({
                invitationId: data.invitationId,
                jobType: 'send-invitation-reminder',
            }));
        }
        catch (error) {
            this.logger.error('Failed to schedule invitation reminder', error.stack, JSON.stringify({ invitationId: data.invitationId }));
            throw error;
        }
    }
    async sendGroupNotification(data) {
        try {
            this.logger.info('Scheduling group notification', JSON.stringify({
                groupId: data.groupId,
                notificationType: data.notificationType,
                memberName: data.memberName,
                adminCount: data.adminEmails.length,
            }));
            await this.bullmq.addJob('email', 'send-group-notification', data);
            this.logger.info('Group notification scheduled successfully', JSON.stringify({
                groupId: data.groupId,
                notificationType: data.notificationType,
                jobType: 'send-group-notification',
            }));
        }
        catch (error) {
            this.logger.error('Failed to schedule group notification', error.stack, JSON.stringify({
                groupId: data.groupId,
                notificationType: data.notificationType,
            }));
            throw error;
        }
    }
    async notifyMemberJoined(groupId, groupName, memberName, memberEmail, memberRole, adminEmails) {
        const data = {
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
    async notifyMemberLeft(groupId, groupName, memberName, memberEmail, reason, adminEmails) {
        const data = {
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
    async notifyRoleChanged(groupId, groupName, memberName, memberEmail, oldRole, newRole, actorName, adminEmails, reason) {
        const data = {
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
    async cancelInvitationReminders(invitationId) {
        try {
            this.logger.info('Cancelling invitation reminders', JSON.stringify({ invitationId }));
            this.logger.info('Invitation reminders cancelled successfully', JSON.stringify({
                invitationId,
                action: 'cancelled-reminders',
            }));
        }
        catch (error) {
            this.logger.error('Failed to cancel invitation reminders', error.stack, JSON.stringify({ invitationId }));
            throw error;
        }
    }
};
exports.GroupInvitationQueue = GroupInvitationQueue;
exports.GroupInvitationQueue = GroupInvitationQueue = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bullmq_service_1.BullmqService,
        logger_service_1.LoggerService])
], GroupInvitationQueue);
//# sourceMappingURL=group-invitation.queue.js.map