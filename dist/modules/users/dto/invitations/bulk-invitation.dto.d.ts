declare class BulkInviteeDto {
    email?: string;
    userId?: string;
    name?: string;
    role?: string;
    personalMessage?: string;
}
export declare class BulkInvitationDto {
    type: string;
    contextId: string;
    invitations: BulkInviteeDto[];
    defaultRole?: string;
    message?: string;
    expiresInHours?: number;
    sendEmail?: boolean;
    sendSms?: boolean;
    continueOnError?: boolean;
    batchSend?: boolean;
    sendDelay?: number;
}
export declare class BulkInvitationResponseDto {
    total: number;
    successful: number;
    failed: number;
    successfulInvitations: Array<{
        id: string;
        email?: string;
        userId?: string;
        name?: string;
        status: string;
        emailSent: boolean;
        smsSent: boolean;
        invitationUrl: string;
    }>;
    failedInvitations: Array<{
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
    sendingStats?: {
        emailsSent: number;
        smsSent: number;
        batchesSent: number;
        averageDelayMs: number;
    };
}
export {};
