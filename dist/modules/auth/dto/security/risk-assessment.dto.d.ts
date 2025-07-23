export declare class RiskAssessmentDto {
    score: number;
    factors: {
        unknownDevice: boolean;
        newLocation: boolean;
        unusualTime: boolean;
        failedAttempts: number;
        suspiciousIp: boolean;
        multipleSessions: boolean;
    };
    recommendation: 'ALLOW' | 'REQUIRE_MFA' | 'BLOCK' | 'ALERT';
    requiresMfa: boolean;
    details?: {
        geolocation?: {
            country: string;
            city: string;
            suspicious: boolean;
        };
        device?: {
            fingerprint: string;
            trusted: boolean;
            lastSeen?: string;
        };
        behavior?: {
            loginPattern: string;
            velocityScore: number;
        };
    };
}
