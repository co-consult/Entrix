/// <reference types="node" />
import { InvitationType, InvitationStatus } from '../types/enums';
import { GroupRole } from '../types/group.types';
import { ValidationResult, PaginationParams } from './user.interface';
export interface IInvitationService {
    create(invitationData: CreateInvitationData): Promise<Invitation>;
    findById(id: string): Promise<Invitation | null>;
    findByToken(token: string): Promise<Invitation | null>;
    update(id: string, updateData: UpdateInvitationData): Promise<Invitation>;
    delete(id: string): Promise<void>;
    send(invitationData: SendInvitationData): Promise<Invitation>;
    sendBulk(bulkData: BulkInvitationData): Promise<BulkInvitationResult>;
    resend(id: string): Promise<Invitation>;
    cancel(id: string, cancelledBy: string): Promise<void>;
    accept(id: string, userId: string): Promise<InvitationResponse>;
    decline(id: string, userId: string, reason?: string): Promise<void>;
    findUserInvitations(userId: string, filters?: InvitationFilters): Promise<Invitation[]>;
    findPendingInvitations(contextId: string, type: InvitationType): Promise<Invitation[]>;
    findExpiredInvitations(): Promise<Invitation[]>;
    validateInvitation(id: string): Promise<InvitationValidation>;
    canInvite(inviterId: string, contextId: string, type: InvitationType): Promise<boolean>;
    cleanupExpired(): Promise<number>;
    sendReminders(): Promise<number>;
    getInvitationStats(contextId?: string, type?: InvitationType): Promise<InvitationStats>;
}
export interface IInvitationRepository {
    create(data: CreateInvitationData): Promise<Invitation>;
    findById(id: string): Promise<Invitation | null>;
    findByToken(token: string): Promise<Invitation | null>;
    findMany(filters: InvitationFilters, pagination?: PaginationParams): Promise<Invitation[]>;
    update(id: string, data: UpdateInvitationData): Promise<Invitation>;
    delete(id: string): Promise<void>;
    count(filters?: InvitationFilters): Promise<number>;
    findExpired(): Promise<Invitation[]>;
}
export interface Invitation {
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
    proposedRole?: GroupRole;
    message?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    expiresAt: Date;
    respondedAt?: Date;
    remindersSent: number;
    lastReminderAt?: Date;
    viewedAt?: Date;
    ipAddress?: string;
    userAgent?: string;
}
export interface CreateInvitationData {
    type: InvitationType;
    contextId: string;
    contextName: string;
    invitedBy: string;
    inviterName: string;
    invitedEmail?: string;
    invitedUserId?: string;
    invitedName?: string;
    proposedRole?: GroupRole;
    message?: string;
    expiresAt?: Date;
    metadata?: Record<string, any>;
}
export interface UpdateInvitationData {
    status?: InvitationStatus;
    respondedAt?: Date;
    remindersSent?: number;
    lastReminderAt?: Date;
    viewedAt?: Date;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
}
export interface SendInvitationData {
    type: InvitationType;
    contextId: string;
    invitedEmail?: string;
    invitedUserId?: string;
    proposedRole?: GroupRole;
    message?: string;
    expiresInHours?: number;
    sendEmail?: boolean;
    sendSms?: boolean;
}
export interface BulkInvitationData {
    type: InvitationType;
    contextId: string;
    invitations: Array<{
        email?: string;
        userId?: string;
        name?: string;
        role?: GroupRole;
    }>;
    message?: string;
    expiresInHours?: number;
    sendEmail?: boolean;
}
export interface BulkInvitationResult {
    total: number;
    successful: Invitation[];
    failed: Array<{
        email?: string;
        userId?: string;
        error: string;
    }>;
}
export interface InvitationResponse {
    invitation: Invitation;
    result?: {
        groupMember?: any;
        eventParticipant?: any;
        friendship?: any;
    };
    additionalActions?: string[];
}
export interface InvitationFilters {
    type?: InvitationType;
    status?: InvitationStatus;
    contextId?: string;
    invitedBy?: string;
    invitedEmail?: string;
    invitedUserId?: string;
    createdAfter?: Date;
    createdBefore?: Date;
    expiresAfter?: Date;
    expiresBefore?: Date;
    hasViewed?: boolean;
}
export interface InvitationValidation {
    isValid: boolean;
    isExpired: boolean;
    isAlreadyMember: boolean;
    canAccept: boolean;
    errors: string[];
    warnings: string[];
    invitation?: Invitation;
}
export interface InvitationStats {
    total: number;
    pending: number;
    accepted: number;
    declined: number;
    expired: number;
    cancelled: number;
    acceptanceRate: number;
    averageResponseTime: number;
    byType: Array<{
        type: InvitationType;
        count: number;
        acceptanceRate: number;
    }>;
    trend: Array<{
        date: string;
        sent: number;
        accepted: number;
        declined: number;
    }>;
}
export interface IInvitationValidator {
    validateCreateData(data: CreateInvitationData): ValidationResult;
    validateSendData(data: SendInvitationData): ValidationResult;
    validateBulkData(data: BulkInvitationData): ValidationResult;
    validateEmail(email: string): boolean;
    validateMessage(message: string): boolean;
    validateExpiration(expiresAt: Date): boolean;
}
export interface InvitationEvent {
    type: 'INVITATION_SENT' | 'INVITATION_VIEWED' | 'INVITATION_ACCEPTED' | 'INVITATION_DECLINED' | 'INVITATION_EXPIRED' | 'REMINDER_SENT';
    invitationId: string;
    userId?: string;
    data: Record<string, any>;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface InvitationEmailConfig {
    template: string;
    subject: string;
    variables: Record<string, any>;
    attachments?: Array<{
        filename: string;
        content: Buffer;
        contentType: string;
    }>;
}
export interface ReminderConfig {
    enabled: boolean;
    intervals: number[];
    maxReminders: number;
    templates: {
        first: string;
        followUp: string;
        final: string;
    };
}
