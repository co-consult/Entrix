export declare class RespondInvitationDto {
    response: 'ACCEPTED' | 'DECLINED';
    reason?: string;
    message?: string;
}
export declare class ValidateInvitationDto {
    checkEligibility?: boolean;
    includeContext?: boolean;
}
export declare class ValidateInvitationResponseDto {
    isValid: boolean;
    isExpired: boolean;
    isAlreadyMember: boolean;
    canAccept: boolean;
    errors?: string[];
    warnings?: string[];
    invitation?: {
        id: string;
        type: string;
        contextId: string;
        contextName: string;
        inviterName: string;
        proposedRole?: string;
        message?: string;
        createdAt: string;
        expiresAt: string;
    };
    context?: {
        id: string;
        name: string;
        type?: string;
        description?: string;
        memberCount?: number;
        maxMembers?: number;
        isPrivate?: boolean;
        avatar?: string;
    };
}
export declare class RespondInvitationResponseDto {
    success: boolean;
    response: 'ACCEPTED' | 'DECLINED';
    invitation: {
        id: string;
        status: string;
        respondedAt: string;
    };
    result?: {
        groupMember?: {
            id: string;
            role: string;
            joinedAt: string;
            permissions: string[];
        };
        eventParticipant?: any;
        friendship?: any;
    };
    additionalActions?: string[];
    nextSteps?: string[];
    errors?: string[];
}
