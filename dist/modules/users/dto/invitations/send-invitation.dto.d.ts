export declare class SendInvitationDto {
    type: string;
    contextId: string;
    invitedEmail?: string;
    invitedUserId?: string;
    invitedName?: string;
    proposedRole?: string;
    message?: string;
    expiresInHours?: number;
    sendEmail?: boolean;
    sendSms?: boolean;
    sendReminders?: boolean;
    priority?: string;
}
export declare class SendInvitationResponseDto {
    success: boolean;
    invitation: {
        id: string;
        token: string;
        type: string;
        status: string;
        contextId: string;
        contextName: string;
        invitedEmail?: string;
        invitedUserId?: string;
        proposedRole?: string;
        message?: string;
        expiresAt: string;
        createdAt: string;
    };
    emailSent: boolean;
    smsSent: boolean;
    invitationUrl?: string;
    errors?: string[];
    warnings?: string[];
}
