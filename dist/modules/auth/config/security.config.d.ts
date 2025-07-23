import { ConfigService } from '@nestjs/config';
export interface SecurityConfig {
    riskScoring: {
        enabled: boolean;
        requireMfaThreshold: number;
        blockThreshold: number;
        alertThreshold: number;
    };
    geolocation: {
        enabled: boolean;
        maxDistanceKm: number;
        trustedCountries: string[];
        highRiskCountries: string[];
        timeout: number;
    };
    deviceFingerprinting: {
        enabled: boolean;
        trustDuration: number;
        requiredFields: string[];
        minEntropy: number;
    };
    audit: {
        enabled: boolean;
        retentionDays: number;
        highRiskRetentionDays: number;
    };
}
export declare const getSecurityConfig: (configService: ConfigService) => SecurityConfig;
