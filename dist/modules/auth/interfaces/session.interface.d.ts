export interface IUserSession {
    id: string;
    session_token: string;
    user_id: string;
    ip_address: string;
    user_agent: string | null;
    device_fingerprint: string | null;
    geolocation: any | null;
    is_active: boolean;
    last_activity: Date;
    expires_at: Date;
    created_at: Date;
    updated_at: Date;
}
export interface ISessionInfo {
    sessionId: string;
    expiresAt: string;
    deviceInfo: IDeviceInfo;
    isActive: boolean;
    lastActivity: string;
}
export interface IDeviceInfo {
    deviceId?: string;
    userAgent: string;
    browser?: string;
    os?: string;
    isMobile: boolean;
    ipAddress: string;
    geolocation?: {
        country: string;
        city: string;
        coordinates?: [number, number];
    };
}
export interface ITokenPair {
    accessToken: string;
    refreshToken: string;
    tokenType: 'Bearer';
    expiresIn: number;
}
export interface ISessionService {
    createSession(userId: string, deviceInfo: IDeviceInfo, rememberMe?: boolean): Promise<IUserSession>;
    validateSession(sessionToken: string): Promise<IUserSession | null>;
    refreshSession(refreshToken: string): Promise<ITokenPair>;
    revokeSession(sessionId: string): Promise<boolean>;
    revokeAllUserSessions(userId: string): Promise<number>;
    getUserActiveSessions(userId: string): Promise<IUserSession[]>;
    cleanupExpiredSessions(): Promise<number>;
}
