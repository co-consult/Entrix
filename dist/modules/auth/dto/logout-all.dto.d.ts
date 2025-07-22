export declare class LogoutAllDto {
    password: string;
    keepCurrentSession?: boolean;
    revokeRefreshTokens?: boolean;
    reason?: string;
}
export declare class LogoutAllResponseDto {
    sessionsTerminated: number;
    tokensRevoked: number;
    currentSessionKept: boolean;
    timestamp: string;
    message: string;
}
