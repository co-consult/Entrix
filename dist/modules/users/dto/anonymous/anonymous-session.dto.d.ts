export declare class CreateAnonymousSessionDto {
    anonymousUserId: string;
    ipAddress?: string;
    userAgent?: string;
    deviceFingerprint?: string;
    geolocation?: {
        country?: string;
        city?: string;
        latitude?: number;
        longitude?: number;
    };
    durationMinutes?: number;
    metadata?: Record<string, any>;
}
export declare class UpdateAnonymousSessionDto {
    lastActivity?: string;
    extendMinutes?: number;
    metadata?: Record<string, any>;
}
export declare class AnonymousSessionResponseDto {
    sessionId: string;
    sessionToken: string;
    anonymousUserId: string;
    expiresAt: string;
    status: string;
    anonymousUser?: {
        guestName: string;
        guestEmail: string;
        onboardingKey?: string;
        incentiveType?: string;
        incentiveValue?: number;
        incentiveDescription?: string;
    };
    createdAt: string;
    lastActivity?: string;
    metadata?: Record<string, any>;
}
