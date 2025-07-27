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
exports.GroupInvitationProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const email_service_1 = require("../../../shared/email/email.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
let GroupInvitationProcessor = class GroupInvitationProcessor {
    prisma;
    emailService;
    logger;
    constructor(prisma, emailService, logger) {
        this.prisma = prisma;
        this.emailService = emailService;
        this.logger = logger.createChildLogger('GroupInvitationProcessor');
    }
    async processGroupInvitation(job) {
        const { invitationId, groupId, groupName, groupType, invitedEmail, invitedUserId, invitedName, inviterName, inviterEmail, inviterUserId, proposedRole, message, expiresAt, invitationToken, acceptUrl, declineUrl } = job.data;
        this.logger.info('Processing group invitation email', JSON.stringify({
            jobId: job.id,
            invitationId,
            groupId,
            invitedEmail: invitedEmail || 'existing-user',
            proposedRole,
        }));
        try {
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
            const currentMemberCount = await this.prisma.user_groups.count({
                where: {
                    group_id: groupId,
                    status: 'ACTIVE',
                },
            });
            const templateData = {
                invitedName: invitedName || 'Nouvel ami',
                invitedEmail: invitedEmail,
                inviterName,
                inviterEmail,
                groupName: group.name,
                groupDescription: group.description,
                groupType: this.getGroupTypeLabel(group.type),
                memberCount: currentMemberCount,
                maxMembers: group.max_members,
                hasSpaceLeft: !group.max_members || currentMemberCount < group.max_members,
                proposedRole: this.getRoleLabel(proposedRole),
                personalMessage: message,
                expiresAt: expiresAt,
                expiresInDays: Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                acceptUrl,
                declineUrl,
                groupUrl: `${process.env.FRONTEND_URL}/groups/${groupId}`,
                invitationToken,
                supportUrl: `${process.env.FRONTEND_URL}/support`,
                year: new Date().getFullYear(),
            };
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
            await this.emailService.sendEmail({
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
            this.logger.logBusinessEvent('GROUP_INVITATION_EMAIL_SENT', {
                invitationId,
                groupId,
                groupName: group.name,
                invitedEmail: recipientEmail,
                invitedUserId: invitedUserId,
                proposedRole,
                inviterName,
                inviterUserId,
                groupType: group.type,
            }, invitedUserId);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'GroupInvitationProcessor.processGroupInvitation', invitedUserId, JSON.stringify({
                invitationId,
                groupId,
                invitedEmail,
                jobId: job.id,
            }));
            throw error;
        }
    }
    async processGroupReminder(job) {
        const { invitationId, reminderNumber, originalData } = job.data;
        this.logger.info('Processing group invitation reminder', JSON.stringify({
            jobId: job.id,
            invitationId,
            reminderNumber,
            groupId: originalData.groupId,
        }));
        try {
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
            if (new Date() > new Date(originalData.expiresAt)) {
                this.logger.info('Skipping reminder for expired invitation', JSON.stringify({
                    invitationId,
                    expiresAt: originalData.expiresAt,
                    jobId: job.id,
                }));
                return;
            }
            const templateData = {
                ...originalData,
                reminderNumber,
                isFirstReminder: reminderNumber === 1,
                isFinalReminder: reminderNumber === 2,
                expiresInHours: Math.ceil((new Date(originalData.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)),
                urgencyLevel: reminderNumber === 2 ? 'high' : 'medium',
                year: new Date().getFullYear(),
            };
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
            await this.emailService.sendEmail({
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
            this.logger.logBusinessEvent('GROUP_INVITATION_REMINDER_SENT', {
                invitationId,
                reminderNumber,
                groupId: originalData.groupId,
                groupName: originalData.groupName,
                invitedEmail: recipientEmail,
                invitedUserId: originalData.invitedUserId,
            }, originalData.invitedUserId);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'GroupInvitationProcessor.processGroupReminder', originalData.invitedUserId, JSON.stringify({
                invitationId,
                reminderNumber,
                jobId: job.id,
            }));
            throw error;
        }
    }
    async processGroupNotification(job) {
        const { groupId, groupName, notificationType, memberName, memberEmail, memberUserId, memberRole, oldRole, newRole, actorName, reason, adminEmails, metadata } = job.data;
        this.logger.info('Processing group notification', JSON.stringify({
            jobId: job.id,
            groupId,
            notificationType,
            memberEmail,
            adminCount: adminEmails?.length || 0,
        }));
        try {
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
            const baseTemplateData = {
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
            let templateData = { ...baseTemplateData };
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
            if (adminEmails && adminEmails.length > 0) {
                for (const adminEmail of adminEmails) {
                    try {
                        await this.emailService.sendEmail({
                            to: adminEmail,
                            subject,
                            template,
                            context: templateData,
                        });
                    }
                    catch (emailError) {
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
                this.logger.logBusinessEvent('GROUP_NOTIFICATION_SENT', {
                    groupId,
                    groupName: group.name,
                    notificationType,
                    memberName,
                    memberEmail,
                    memberUserId,
                    adminCount: adminEmails.length,
                    hasReason: !!reason,
                }, memberUserId);
            }
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'GroupInvitationProcessor.processGroupNotification', memberUserId, JSON.stringify({
                groupId,
                notificationType,
                jobId: job.id,
            }));
            throw error;
        }
    }
    getGroupTypeLabel(groupType) {
        const typeLabels = {
            FAMILY: 'Famille',
            FRIENDS: 'Amis',
            CORPORATE: 'Entreprise',
            ASSOCIATION: 'Association',
            TEMPORARY: 'Temporaire',
            EDUCATIONAL: 'Éducatif',
        };
        return typeLabels[groupType] || groupType;
    }
    getRoleLabel(role) {
        if (!role)
            return 'Membre';
        const roleLabels = {
            OWNER: 'Propriétaire',
            ADMIN: 'Administrateur',
            MANAGER: 'Gestionnaire',
            MEMBER: 'Membre',
        };
        return roleLabels[role] || role;
    }
    isRolePromotion(oldRole, newRole) {
        if (!oldRole || !newRole)
            return false;
        const roleHierarchy = {
            MEMBER: 1,
            MANAGER: 2,
            ADMIN: 3,
            OWNER: 4,
        };
        return (roleHierarchy[newRole] || 0) > (roleHierarchy[oldRole] || 0);
    }
};
exports.GroupInvitationProcessor = GroupInvitationProcessor;
__decorate([
    (0, bull_1.Process)('send-group-invitation'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GroupInvitationProcessor.prototype, "processGroupInvitation", null);
__decorate([
    (0, bull_1.Process)('send-group-reminder'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GroupInvitationProcessor.prototype, "processGroupReminder", null);
__decorate([
    (0, bull_1.Process)('send-group-notification'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GroupInvitationProcessor.prototype, "processGroupNotification", null);
exports.GroupInvitationProcessor = GroupInvitationProcessor = __decorate([
    (0, common_1.Injectable)(),
    (0, bull_1.Processor)('group-invitations'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService,
        logger_service_1.LoggerService])
], GroupInvitationProcessor);
//# sourceMappingURL=group-invitation.processor.js.map