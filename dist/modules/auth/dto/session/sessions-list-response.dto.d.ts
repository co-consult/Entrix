export declare class SessionItemDto {
    sessionId: string;
    deviceInfo: {
        userAgent: string;
        browser: string;
        os: string;
        isMobile: boolean;
    };
    location: string;
    createdAt: string;
    lastActivity: string;
    isCurrent: boolean;
}
export declare class SessionsListResponseDto {
    success: boolean;
    data: {
        sessions: SessionItemDto[];
        total: number;
    };
}
export declare class RevokeSessionResponseDto {
    success: boolean;
    data: {
        sessionRevoked: boolean;
        sessionId: string;
    };
}
