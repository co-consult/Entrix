export declare class LogoutDto {
    allDevices?: boolean;
}
export declare class LogoutResponseDto {
    success: boolean;
    data?: {
        message: string;
        tokensInvalidated: number;
        sessionsTerminated: number;
    };
}
