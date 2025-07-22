import { InvitationType, InvitationStatus } from './enums';
import { GroupRole } from './group.types';
import { UserBasicInfoResponse } from './user.types';
export interface InvitationBase {
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
export interface InvitationResponse {
    id: string;
    type: InvitationType;
    status: InvitationStatus;
    token: string;
    contextId: string;
    contextName: string;
    inviter: UserBasicInfoResponse;
    invitedEmail?: string;
    invitedUserId?: string;
    invitedName?: string;
    proposedRole?: GroupRole;
    message?: string;
    createdAt: Date;
    expiresAt: Date;
    respondedAt?: Date;
    isExpired: boolean;
    daysUntilExpiry: number;
    invitationUrl: string;
    canAccept: boolean;
    canDecline: boolean;
    viewedAt?: Date;
    remindersSent: number;
}
export interface InvitationSendResponse {
    id: string;
    token: string;
    type: InvitationType;
    status: InvitationStatus;
    contextId: string;
    contextName: string;
    invitedEmail?: string;
    invitedUserId?: string;
    invitedName?: string;
    proposedRole?: GroupRole;
    expiresAt: Date;
    invitationUrl: string;
    emailSent: boolean;
    smsSent: boolean;
    message: string;
}
export interface BulkInvitationResponse {
    total: number;
    successful: number;
    failed: number;
    duplicates: number;
    processingTime: number;
    successfulInvitations: InvitationSendResponse[];
    failedInvitations: Array<{
        email?: string;
        userId?: string;
        name?: string;
        error: string;
        code: string;
    }>;
    duplicateInvitations?: Array<{
        email?: string;
        userId?: string;
        reason: string;
    }>;
    warnings?: string[];
    sendingStats?: {
        emailsSent: number;
        smsSent: number;
        batchesSent: number;
        averageDelayMs: number;
    };
}
export interface InvitationActionResponse {
    invitation: InvitationResponse;
    action: 'ACCEPTED' | 'DECLINED';
    result?: {
        groupMember?: {
            id: string;
            role: GroupRole;
            joinedAt: Date;
        };
        eventParticipant?: {
            id: string;
            status: string;
            registeredAt: Date;
        };
        friendship?: {
            id: string;
            status: string;
            createdAt: Date;
        };
    };
    additionalActions?: Array<{
        type: string;
        description: string;
        completed: boolean;
    }>;
    redirectUrl?: string;
    welcomeMessage?: string;
}
export interface InvitationValidationResponse {
    isValid: boolean;
    isExpired: boolean;
    isAlreadyMember: boolean;
    isAlreadyResponded: boolean;
    canAccept: boolean;
    canDecline: boolean;
    errors: Array<{
        code: string;
        message: string;
    }>;
    warnings: Array<{
        code: string;
        message: string;
    }>;
    invitation?: InvitationResponse;
    contextInfo?: {
        name: string;
        type: string;
        memberCount?: number;
        isPrivate?: boolean;
        requiresApproval?: boolean;
    };
}
export interface InvitationStatsResponse {
    total: number;
    pending: number;
    accepted: number;
    declined: number;
    expired: number;
    cancelled: number;
    acceptanceRate: number;
    declineRate: number;
    expirationRate: number;
    averageResponseTime: number;
    byType: Array<{
        type: InvitationType;
        count: number;
        acceptanceRate: number;
        averageResponseTime: number;
    }>;
    byPeriod: Array<{
        period: string;
        sent: number;
        accepted: number;
        declined: number;
        expired: number;
    }>;
    topInviters: Array<{
        userId: string;
        userName: string;
        invitationsSent: number;
        acceptanceRate: number;
    }>;
}
export interface PaginatedInvitationResponse {
    data: InvitationResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface InvitationSearchFilters {
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
    search?: string;
}
export type InvitationSummary = Pick<InvitationResponse, 'id' | 'type' | 'status' | 'contextName' | 'invitedEmail' | 'invitedName' | 'createdAt' | 'expiresAt' | 'isExpired'>;
export interface UserInvitationsResponse {
    received: InvitationResponse[];
    sent: InvitationResponse[];
    summary: {
        receivedCount: number;
        sentCount: number;
        pendingReceived: number;
        pendingSent: number;
        acceptedReceived: number;
        acceptedSent: number;
    };
}
