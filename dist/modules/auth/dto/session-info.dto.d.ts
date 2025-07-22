export declare class GeolocationCoordinatesDto {
    latitude: number;
    longitude: number;
}
export declare class GeolocationDto {
    country?: string;
    region?: string;
    city?: string;
    coordinates?: GeolocationCoordinatesDto;
    provider?: string;
}
export declare class DeviceInfoDto {
    browser?: string;
    browserVersion?: string;
    os?: string;
    osVersion?: string;
    device?: 'Desktop' | 'Mobile' | 'Tablet' | 'TV' | 'Unknown';
    deviceVendor?: string;
}
export declare class SessionSecurityInfoDto {
    isSuspicious: boolean;
    riskScore: number;
    newLocation: boolean;
    newDevice: boolean;
    vpnDetected?: boolean;
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
export declare class SessionInfoDto {
    id: string;
    ipAddress: string;
    userAgent?: string;
    deviceFingerprint?: string;
    geolocation?: GeolocationDto;
    isActive: boolean;
    isCurrent: boolean;
    createdAt: Date;
    lastActivity: Date;
    expiresAt: Date;
    deviceInfo?: DeviceInfoDto;
    securityInfo: SessionSecurityInfoDto;
    durationMinutes: number;
    lastAction?: string;
    requestCount: number;
}
export declare class UserSessionsDto {
    sessions: SessionInfoDto[];
    totalActiveSessions: number;
    maxConcurrentSessions: number;
    suspiciousSessions: number;
    currentSessionId: string;
    lastUpdated: Date;
}
export declare class CurrentSessionDto {
    session: SessionInfoDto;
    totalActiveSessions: number;
}
export declare class SessionStatsDto {
    totalActive: number;
    desktop: number;
    mobile: number;
    suspicious: number;
    countries: string[];
    oldestSession: Date;
    newestSession: Date;
}
