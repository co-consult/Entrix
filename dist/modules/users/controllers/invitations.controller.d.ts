import { Request } from 'express';
import { SendInvitationDto } from '../dto/invitations/send-invitation.dto';
import { BulkInvitationDto } from '../dto/invitations/bulk-invitation.dto';
import { RespondInvitationDto } from '../dto/invitations/respond-invitation.dto';
import { InvitationsService } from '../services/invitations.service';
import { StandardResponse, CreatedResponse } from '../types/response.types';
interface InvitationResult {
    id: string;
    token: string;
    type: string;
    status: string;
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
interface StoredInvitation {
    id: string;
    type: string;
    status: string;
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
export declare class InvitationsController {
    private readonly invitationsService;
    constructor(invitationsService: InvitationsService);
    sendInvitation(dto: SendInvitationDto, invitedBy: string, req: Request): Promise<CreatedResponse<InvitationResult>>;
    sendBulkInvitations(dto: BulkInvitationDto, invitedBy: string, req: Request): Promise<CreatedResponse<BulkInvitationResult>>;
    getInvitationByToken(token: string): Promise<StandardResponse<StoredInvitation>>;
    acceptInvitation(token: string, userId: string, req: Request): Promise<StandardResponse<any>>;
    declineInvitation(id: string, dto: RespondInvitationDto, userId: string, req: Request): Promise<StandardResponse<null>>;
}
export {};
