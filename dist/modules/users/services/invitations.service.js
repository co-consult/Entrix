"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const email_service_1 = require("../../../shared/email/email.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const bullmq_service_1 = require("../../../shared/bullmq/bullmq.service");
const constants_1 = require("../constants");
const enums_1 = require("../types/enums");
const crypto = __importStar(require("crypto"));
let InvitationsService = class InvitationsService {
    prisma;
    email;
    redis;
    bullmq;
    logger;
    CACHE_PREFIX = 'invitations:';
    TOKEN_LENGTH = 64;
    constructor(prisma, loggerService, email, redis, bullmq) {
        this.prisma = prisma;
        this.email = email;
        this.redis = redis;
        this.bullmq = bullmq;
        this.logger = loggerService.createChildLogger('InvitationsService');
    }
    async send(invitationData, invitedBy) {
        this.logger.info('Sending invitation', JSON.stringify({
            type: invitationData.type,
            contextId: invitationData.contextId,
            invitedEmail: invitationData.invitedEmail,
            invitedUserId: invitationData.invitedUserId,
            invitedBy
        }));
        const startTime = Date.now();
        try {
            await this.validateInviterPermissions(invitedBy, invitationData.contextId, invitationData.type);
            await this.checkInvitationLimits(invitedBy);
            await this.checkExistingInvitation(invitationData, invitedBy);
            const invitationId = crypto.randomUUID();
            const token = crypto.randomBytes(this.TOKEN_LENGTH / 2).toString('hex');
            const contextName = await this.getContextName(invitationData.contextId, invitationData.type);
            const inviterName = await this.getInviterName(invitedBy);
            const invitation = {
                id: invitationId,
                type: invitationData.type,
                status: enums_1.InvitationStatus.PENDING,
                token,
                contextId: invitationData.contextId,
                contextName,
                invitedBy,
                inviterName,
                invitedEmail: invitationData.invitedEmail,
                invitedUserId: invitationData.invitedUserId,
                invitedName: invitationData.invitedName,
                proposedRole: invitationData.proposedRole || constants_1.GROUP_CONSTANTS.ROLES.MEMBER,
                message: invitationData.message,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + (invitationData.expiresInHours || constants_1.INVITATION_CONSTANTS.EXPIRATION.GROUP) * 60 * 60 * 1000).toISOString(),
                remindersSent: 0,
            };
            await this.storeInvitation(invitation);
            await this.cacheInvitation(invitation);
            let emailSent = false;
            if (invitationData.sendEmail !== false && invitationData.invitedEmail) {
                emailSent = await this.sendInvitationEmail(invitation);
            }
            let smsSent = false;
            if (invitationData.sendSms === true) {
                smsSent = await this.sendInvitationSms(invitation);
            }
            if (emailSent) {
                await this.scheduleReminders(invitation);
            }
            const result = {
                id: invitationId,
                token,
                type: invitation.type,
                status: invitation.status,
                contextId: invitation.contextId,
                contextName: invitation.contextName,
                invitedEmail: invitation.invitedEmail,
                invitedUserId: invitation.invitedUserId,
                expiresAt: new Date(invitation.expiresAt),
                invitationUrl: `${process.env.FRONTEND_URL}/invitations/${token}`,
                emailSent,
                smsSent,
            };
            this.logger.info('Invitation sent successfully', JSON.stringify({
                invitationId,
                type: invitation.type,
                invitedEmail: invitation.invitedEmail,
                processingTime: Date.now() - startTime
            }));
            return result;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'InvitationsService.send', JSON.stringify({
                contextId: invitationData.contextId,
                invitedEmail: invitationData.invitedEmail,
                invitedBy
            }));
            throw error;
        }
    }
    async sendBulk(bulkData, invitedBy) {
        this.logger.info('Sending bulk invitations', JSON.stringify({
            type: bulkData.type,
            contextId: bulkData.contextId,
            count: bulkData.invitations.length,
            invitedBy
        }));
        const startTime = Date.now();
        const result = {
            total: bulkData.invitations.length,
            successful: [],
            failed: [],
            duplicates: [],
            processingTime: 0,
            warnings: [],
        };
        try {
            await this.validateInviterPermissions(invitedBy, bulkData.contextId, bulkData.type);
            await this.checkBulkInvitationLimits(invitedBy, bulkData.invitations.length);
            for (let i = 0; i < bulkData.invitations.length; i++) {
                const inviteData = bulkData.invitations[i];
                try {
                    if (i > 0 && bulkData.batchSend !== false) {
                        await new Promise(resolve => setTimeout(resolve, (bulkData.sendDelay || 2) * 1000));
                    }
                    const singleInvitation = {
                        type: bulkData.type,
                        contextId: bulkData.contextId,
                        invitedEmail: inviteData.email,
                        invitedUserId: inviteData.userId,
                        invitedName: inviteData.name,
                        proposedRole: inviteData.role || bulkData.defaultRole,
                        message: inviteData.personalMessage || bulkData.message,
                        expiresInHours: bulkData.expiresInHours,
                        sendEmail: bulkData.sendEmail,
                        sendSms: bulkData.sendSms
                    };
                    const invitation = await this.send(singleInvitation, invitedBy);
                    result.successful.push(invitation);
                }
                catch (error) {
                    this.logger.logErrorEvent(error, 'InvitationsService.sendBulk.individual', JSON.stringify({
                        email: inviteData.email,
                        userId: inviteData.userId,
                        name: inviteData.name
                    }));
                    result.failed.push({
                        email: inviteData.email,
                        userId: inviteData.userId,
                        name: inviteData.name,
                        error: error.message,
                        code: 'SEND_FAILED'
                    });
                    if (bulkData.continueOnError === false) {
                        break;
                    }
                }
            }
            result.processingTime = Date.now() - startTime;
            this.logger.info('Bulk invitations completed', JSON.stringify({
                total: result.total,
                successful: result.successful.length,
                failed: result.failed.length,
                processingTime: result.processingTime
            }));
            return result;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'InvitationsService.sendBulk', JSON.stringify({
                contextId: bulkData.contextId,
                type: bulkData.type,
                count: bulkData.invitations.length
            }));
            throw error;
        }
    }
    async accept(token, userId, ipAddress, userAgent) {
        this.logger.info('Accepting invitation', JSON.stringify({ token, userId }));
        try {
            const invitation = await this.findByToken(token);
            if (!invitation) {
                throw new common_1.NotFoundException(constants_1.INVITATION_CONSTANTS.ERRORS.INVITATION_NOT_FOUND);
            }
            const validation = await this.validateInvitation(invitation);
            if (!validation.canAccept) {
                throw new common_1.BadRequestException(validation.errors.join(', '));
            }
            let result = {};
            await this.prisma.$transaction(async (tx) => {
                await this.updateInvitationStatus(invitation, enums_1.InvitationStatus.ACCEPTED, userId, undefined, ipAddress, userAgent);
                switch (invitation.type) {
                    case enums_1.InvitationType.GROUP:
                        result.groupMember = await this.processGroupInvitationAcceptance(tx, invitation, userId);
                        break;
                    case enums_1.InvitationType.EVENT:
                        result.eventParticipant = await this.processEventInvitationAcceptance(tx, invitation, userId);
                        break;
                    case enums_1.InvitationType.FRIEND:
                        result.friendship = await this.processFriendInvitationAcceptance(tx, invitation, userId);
                        break;
                    default:
                        throw new common_1.BadRequestException('Type d\'invitation non supporté');
                }
                await this.sendAcceptanceNotifications(invitation, userId);
            });
            await this.removeFromCache(invitation.token);
            this.logger.info('Invitation accepted successfully', JSON.stringify({
                invitationId: invitation.id,
                userId,
                type: invitation.type
            }));
            return {
                invitation,
                result,
                additionalActions: this.getPostAcceptanceActions(invitation)
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'InvitationsService.accept', JSON.stringify({ token, userId }));
            throw error;
        }
    }
    async decline(token, userId, reason, ipAddress, userAgent) {
        this.logger.info('Declining invitation', JSON.stringify({ token, userId, reason }));
        try {
            const invitation = await this.findByToken(token);
            if (!invitation) {
                throw new common_1.NotFoundException(constants_1.INVITATION_CONSTANTS.ERRORS.INVITATION_NOT_FOUND);
            }
            if (invitation.status !== enums_1.InvitationStatus.PENDING) {
                throw new common_1.BadRequestException(constants_1.INVITATION_CONSTANTS.ERRORS.INVITATION_ALREADY_RESPONDED);
            }
            await this.updateInvitationStatus(invitation, enums_1.InvitationStatus.DECLINED, userId, reason, ipAddress, userAgent);
            await this.sendDeclineNotification(invitation, userId, reason);
            await this.removeFromCache(invitation.token);
            this.logger.info('Invitation declined successfully', JSON.stringify({
                invitationId: invitation.id,
                userId
            }));
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'InvitationsService.decline', JSON.stringify({ token, userId }));
            throw error;
        }
    }
    async findByToken(token) {
        try {
            const cached = await this.redis.getCache(`${this.CACHE_PREFIX}token:${token}`);
            if (cached) {
                return cached;
            }
            const userGroup = await this.prisma.user_groups.findFirst({
                where: {
                    metadata: {
                        path: ['invitation', 'token'],
                        equals: token
                    }
                },
                include: {
                    users_user_groups_user_idTousers: true,
                    groups: true
                }
            });
            if (!userGroup?.metadata) {
                return null;
            }
            const invitation = userGroup.metadata.invitation;
            await this.cacheInvitation(invitation);
            return invitation;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'InvitationsService.findByToken', JSON.stringify({ token }));
            return null;
        }
    }
    async cleanupExpired() {
        this.logger.info('Starting cleanup of expired invitations');
        try {
            const now = new Date().toISOString();
            const result = await this.prisma.user_groups.updateMany({
                where: {
                    metadata: {
                        path: ['invitation', 'expiresAt'],
                        lt: now
                    },
                    AND: {
                        metadata: {
                            path: ['invitation', 'status'],
                            equals: enums_1.InvitationStatus.PENDING
                        }
                    }
                },
                data: {
                    metadata: {
                        invitation: {
                            status: enums_1.InvitationStatus.EXPIRED,
                            expiredAt: now
                        }
                    }
                }
            });
            await this.cleanExpiredFromCache();
            this.logger.info('Expired invitations cleanup completed', JSON.stringify({
                expiredCount: result.count
            }));
            return result.count;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'InvitationsService.cleanupExpired');
            throw new Error('Erreur lors du nettoyage des invitations expirées');
        }
    }
    async getStats(contextId, type) {
        try {
            const where = {
                metadata: {
                    path: ['invitation'],
                    not: null
                }
            };
            if (contextId) {
                where.metadata = {
                    ...where.metadata,
                    path: ['invitation', 'contextId'],
                    equals: contextId
                };
            }
            if (type) {
                where.metadata = {
                    ...where.metadata,
                    path: ['invitation', 'type'],
                    equals: type
                };
            }
            const totalInvitations = await this.prisma.user_groups.count({
                where: {
                    metadata: {
                        path: ['invitation'],
                        not: null
                    }
                }
            });
            return {
                total: totalInvitations,
                pending: 0,
                accepted: 0,
                declined: 0,
                expired: 0,
                cancelled: 0,
                acceptanceRate: 0,
                averageResponseTime: 0
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'InvitationsService.getStats', JSON.stringify({ contextId, type }));
            throw error;
        }
    }
    async validateInviterPermissions(inviterId, contextId, type) {
        const user = await this.prisma.users.findUnique({
            where: { id: inviterId },
            select: { id: true, is_active: true }
        });
        if (!user || !user.is_active) {
            throw new common_1.ForbiddenException('Utilisateur non autorisé à envoyer des invitations');
        }
        switch (type) {
            case enums_1.InvitationType.GROUP:
                await this.validateGroupInvitePermissions(inviterId, contextId);
                break;
            case enums_1.InvitationType.EVENT:
                await this.validateEventInvitePermissions(inviterId, contextId);
                break;
            case enums_1.InvitationType.FRIEND:
                break;
            default:
                throw new common_1.BadRequestException('Type d\'invitation non supporté');
        }
    }
    async validateGroupInvitePermissions(inviterId, groupId) {
        const membership = await this.prisma.user_groups.findFirst({
            where: {
                user_id: inviterId,
                group_id: groupId,
                status: enums_1.MembershipStatus.ACTIVE
            },
            include: {
                groups: true
            }
        });
        if (!membership) {
            throw new common_1.ForbiddenException('Vous devez être membre du groupe pour inviter');
        }
        const metadata = membership.metadata;
        const canInvite = metadata?.permissions?.canInvite !== false;
        if (!canInvite) {
            throw new common_1.ForbiddenException('Vous n\'avez pas le droit d\'inviter dans ce groupe');
        }
    }
    async validateEventInvitePermissions(inviterId, eventId) {
    }
    async checkInvitationLimits(inviterId) {
        const pendingCount = await this.countPendingInvitations(inviterId);
        if (pendingCount >= constants_1.INVITATION_CONSTANTS.LIMITS.MAX_PENDING_PER_USER) {
            throw new common_1.BadRequestException(constants_1.INVITATION_CONSTANTS.ERRORS.TOO_MANY_PENDING);
        }
        const dailyCount = await this.countDailyInvitations(inviterId);
        if (dailyCount >= constants_1.INVITATION_CONSTANTS.LIMITS.MAX_INVITES_PER_DAY) {
            throw new common_1.BadRequestException(constants_1.INVITATION_CONSTANTS.ERRORS.DAILY_LIMIT_EXCEEDED);
        }
    }
    async checkBulkInvitationLimits(inviterId, count) {
        if (count > constants_1.INVITATION_CONSTANTS.LIMITS.MAX_BULK_INVITES) {
            throw new common_1.BadRequestException(`Vous ne pouvez pas inviter plus de ${constants_1.INVITATION_CONSTANTS.LIMITS.MAX_BULK_INVITES} personnes à la fois`);
        }
        await this.checkInvitationLimits(inviterId);
    }
    async checkExistingInvitation(invitationData, invitedBy) {
        const existing = await this.findExistingInvitation(invitationData.contextId, invitationData.invitedEmail, invitationData.invitedUserId);
        if (existing && existing.status === enums_1.InvitationStatus.PENDING) {
            throw new common_1.ConflictException('Une invitation en attente existe déjà pour cette personne');
        }
    }
    async findExistingInvitation(contextId, email, userId) {
        const where = {
            metadata: {
                path: ['invitation', 'contextId'],
                equals: contextId
            }
        };
        if (email) {
            where.metadata = {
                ...where.metadata,
                path: ['invitation', 'invitedEmail'],
                equals: email
            };
        }
        else if (userId) {
            where.metadata = {
                ...where.metadata,
                path: ['invitation', 'invitedUserId'],
                equals: userId
            };
        }
        const userGroup = await this.prisma.user_groups.findFirst({ where });
        if (!userGroup?.metadata) {
            return null;
        }
        return userGroup.metadata.invitation;
    }
    async getContextName(contextId, type) {
        switch (type) {
            case enums_1.InvitationType.GROUP:
                const group = await this.prisma.groups.findUnique({
                    where: { id: contextId },
                    select: { name: true }
                });
                return group?.name || 'Groupe inconnu';
            case enums_1.InvitationType.EVENT:
                return 'Événement';
            default:
                return 'Contexte inconnu';
        }
    }
    async getInviterName(inviterId) {
        const user = await this.prisma.users.findUnique({
            where: { id: inviterId },
            select: { first_name: true, last_name: true }
        });
        if (!user) {
            return 'Utilisateur inconnu';
        }
        return `${user.first_name} ${user.last_name}`;
    }
    async storeInvitation(invitation) {
        await this.prisma.user_groups.create({
            data: {
                id: invitation.id,
                user_id: invitation.invitedUserId || '00000000-0000-0000-0000-000000000000',
                group_id: invitation.contextId,
                status: enums_1.MembershipStatus.PENDING,
                metadata: {
                    invitation: invitation
                }
            }
        });
    }
    async updateInvitationStatus(invitation, status, userId, reason, ipAddress, userAgent) {
        const updates = {
            status,
            respondedAt: new Date().toISOString(),
            ipAddress,
            userAgent
        };
        if (reason) {
            updates.declineReason = reason;
        }
        await this.prisma.user_groups.updateMany({
            where: {
                metadata: {
                    path: ['invitation', 'id'],
                    equals: invitation.id
                }
            },
            data: {
                metadata: {
                    invitation: {
                        ...invitation,
                        ...updates
                    }
                }
            }
        });
    }
    async processGroupInvitationAcceptance(tx, invitation, userId) {
        const member = await tx.user_groups.update({
            where: { id: invitation.id },
            data: {
                user_id: userId,
                status: enums_1.MembershipStatus.ACTIVE,
                joined_at: new Date(),
                metadata: {
                    role: invitation.proposedRole,
                    permissions: {
                        canInvite: true,
                        canPurchase: true,
                        canViewOrders: true
                    },
                    joinedViaInvitation: true,
                    invitationId: invitation.id
                }
            },
            include: {
                users_user_groups_user_idTousers: true,
                groups: true
            }
        });
        return member;
    }
    async processEventInvitationAcceptance(tx, invitation, userId) {
        return { eventId: invitation.contextId, userId };
    }
    async processFriendInvitationAcceptance(tx, invitation, userId) {
        return { friendshipCreated: true };
    }
    async validateInvitation(invitation) {
        const errors = [];
        const warnings = [];
        const isExpired = new Date(invitation.expiresAt) < new Date();
        if (isExpired) {
            errors.push(constants_1.INVITATION_CONSTANTS.ERRORS.INVITATION_EXPIRED);
        }
        if (invitation.status !== enums_1.InvitationStatus.PENDING) {
            errors.push(constants_1.INVITATION_CONSTANTS.ERRORS.INVITATION_ALREADY_RESPONDED);
        }
        const isAlreadyMember = await this.checkIfAlreadyMember(invitation);
        if (isAlreadyMember) {
            errors.push(constants_1.INVITATION_CONSTANTS.ERRORS.ALREADY_MEMBER);
        }
        return {
            isValid: errors.length === 0,
            isExpired,
            isAlreadyMember,
            canAccept: errors.length === 0,
            errors,
            warnings,
            invitation
        };
    }
    async checkIfAlreadyMember(invitation) {
        if (!invitation.invitedUserId) {
            return false;
        }
        const existing = await this.prisma.user_groups.findFirst({
            where: {
                user_id: invitation.invitedUserId,
                group_id: invitation.contextId,
                status: enums_1.MembershipStatus.ACTIVE
            }
        });
        return !!existing;
    }
    async cacheInvitation(invitation) {
        const cacheKey = `${this.CACHE_PREFIX}token:${invitation.token}`;
        await this.redis.setCache(cacheKey, invitation, 3600);
    }
    async removeFromCache(token) {
        const cacheKey = `${this.CACHE_PREFIX}token:${token}`;
        await this.redis.del(cacheKey);
    }
    async cleanExpiredFromCache() {
        const pattern = `${this.CACHE_PREFIX}token:*`;
        const keys = await this.redis.keys(pattern);
        for (const key of keys) {
            const invitation = await this.redis.getCache(key);
            if (invitation && new Date(invitation.expiresAt) < new Date()) {
                await this.redis.del(key);
            }
        }
    }
    async countPendingInvitations(inviterId) {
        return this.prisma.user_groups.count({
            where: {
                metadata: {
                    path: ['invitation', 'invitedBy'],
                    equals: inviterId
                },
                AND: {
                    metadata: {
                        path: ['invitation', 'status'],
                        equals: enums_1.InvitationStatus.PENDING
                    }
                }
            }
        });
    }
    async countDailyInvitations(inviterId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return this.prisma.user_groups.count({
            where: {
                metadata: {
                    path: ['invitation', 'invitedBy'],
                    equals: inviterId
                },
                AND: {
                    metadata: {
                        path: ['invitation', 'createdAt'],
                        gte: today.toISOString()
                    }
                }
            }
        });
    }
    async sendInvitationEmail(invitation) {
        try {
            if (!invitation.invitedEmail) {
                return false;
            }
            const templateData = {
                inviterName: invitation.inviterName,
                contextName: invitation.contextName,
                message: invitation.message || constants_1.INVITATION_CONSTANTS.DEFAULT_MESSAGES[invitation.type],
                invitationUrl: `${process.env.FRONTEND_URL}/invitations/${invitation.token}`,
                expiresAt: new Date(invitation.expiresAt).toLocaleDateString('fr-TN'),
                type: invitation.type
            };
            await this.email.sendEmail({
                to: invitation.invitedEmail,
                subject: `Invitation - ${invitation.contextName}`,
                template: 'group-invitation',
                context: templateData
            });
            return true;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'InvitationsService.sendInvitationEmail', JSON.stringify({
                invitationId: invitation.id,
                email: invitation.invitedEmail
            }));
            return false;
        }
    }
    async sendInvitationSms(invitation) {
        return false;
    }
    async scheduleReminders(invitation) {
        try {
            for (const hours of constants_1.INVITATION_CONSTANTS.EMAIL_CONFIG.REMINDER_HOURS) {
                const delayMs = hours * 60 * 60 * 1000;
                await this.bullmq.addDelayedJob('EMAIL', 'SEND_INVITATION_REMINDER', {
                    invitationId: invitation.id,
                    token: invitation.token,
                    reminderNumber: constants_1.INVITATION_CONSTANTS.EMAIL_CONFIG.REMINDER_HOURS.indexOf(hours) + 1
                }, delayMs);
            }
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'InvitationsService.scheduleReminders', JSON.stringify({
                invitationId: invitation.id
            }));
        }
    }
    async sendAcceptanceNotifications(invitation, userId) {
        try {
            const inviter = await this.prisma.users.findUnique({
                where: { id: invitation.invitedBy },
                select: { email: true, first_name: true }
            });
            const accepter = await this.prisma.users.findUnique({
                where: { id: userId },
                select: { first_name: true, last_name: true }
            });
            if (inviter?.email) {
                await this.email.sendEmail({
                    to: inviter.email,
                    subject: `Invitation acceptée - ${invitation.contextName}`,
                    template: 'invitation-accepted',
                    context: {
                        inviterName: inviter.first_name,
                        accepterName: `${accepter?.first_name} ${accepter?.last_name}`,
                        contextName: invitation.contextName,
                        type: invitation.type
                    }
                });
            }
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'InvitationsService.sendAcceptanceNotifications', JSON.stringify({
                invitationId: invitation.id,
                userId
            }));
        }
    }
    async sendDeclineNotification(invitation, userId, reason) {
        try {
            const inviter = await this.prisma.users.findUnique({
                where: { id: invitation.invitedBy },
                select: { email: true, first_name: true }
            });
            if (inviter?.email) {
                await this.email.sendEmail({
                    to: inviter.email,
                    subject: `Invitation refusée - ${invitation.contextName}`,
                    template: 'invitation-declined',
                    context: {
                        inviterName: inviter.first_name,
                        contextName: invitation.contextName,
                        reason: reason || 'Aucune raison fournie',
                        type: invitation.type
                    }
                });
            }
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'InvitationsService.sendDeclineNotification', JSON.stringify({
                invitationId: invitation.id,
                userId
            }));
        }
    }
    getPostAcceptanceActions(invitation) {
        const actions = [];
        switch (invitation.type) {
            case enums_1.InvitationType.GROUP:
                actions.push('SETUP_PROFILE');
                actions.push('EXPLORE_GROUP');
                break;
            case enums_1.InvitationType.EVENT:
                actions.push('VIEW_EVENT_DETAILS');
                actions.push('ADD_TO_CALENDAR');
                break;
            case enums_1.InvitationType.FRIEND:
                actions.push('VIEW_PROFILE');
                actions.push('START_CONVERSATION');
                break;
        }
        return actions;
    }
};
exports.InvitationsService = InvitationsService;
exports.InvitationsService = InvitationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        logger_service_1.LoggerService,
        email_service_1.EmailService,
        redis_service_1.RedisService,
        bullmq_service_1.BullmqService])
], InvitationsService);
//# sourceMappingURL=invitations.service.js.map