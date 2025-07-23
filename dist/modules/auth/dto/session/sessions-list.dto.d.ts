export declare class SessionDto {
    sessionId: string;
    deviceInfo: any;
    location: string;
    createdAt: string;
    lastActivity: string;
    isCurrent: boolean;
}
export declare class SessionsListResponseDto {
    success: boolean;
    data: {
        sessions: SessionDto[];
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
