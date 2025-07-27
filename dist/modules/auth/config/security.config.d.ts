import { ConfigService } from '@nestjs/config';
export interface SecurityConfig {
    riskScoring: {
        enabled: boolean;
        requireMfaThreshold: number;
        blockThreshold: number;
        alertThreshold: number;
        maxRiskScore: number;
        defaultRiskScore: number;
    };
    geolocation: {
        enabled: boolean;
        maxReasonableSpeedKmH: number;
        earthRadiusKm: number;
        trustedCountries: string[];
        highRiskCountries: string[];
        impossibleTravelDetection: boolean;
        vpnDetection: boolean;
        datacenterDetection: boolean;
    };
    deviceFingerprinting: {
        enabled: boolean;
        sessionHijackingDetection: boolean;
        maxConcurrentSessions: number;
        maxSessionsPerIp: number;
        tokenReuseDetection: boolean;
    };
    audit: {
        enabled: boolean;
        securityLogsRetentionDays: number;
        auditLogsRetentionDays: number;
        highRiskLogsRetentionDays: number;
        complianceAlertsEnabled: boolean;
        gdprDeletionTracking: boolean;
    };
    botDetection: {
        enabled: boolean;
        captchaThreshold: number;
        rapidRequestsThreshold: number;
        identicalRequestsThreshold: number;
        suspiciousHeadersScore: number;
    };
    incidentResponse: {
        autoLockAccountRisk: number;
        autoRequireMfaRisk: number;
        securityTeamAlertRisk: number;
        emergencyLockdownRisk: number;
        quarantineSuspiciousSessions: boolean;
        quarantineDurationHours: number;
    };
    alerts: {
        emailAlertsEnabled: boolean;
        slackAlertsEnabled: boolean;
        smsAlertsEnabled: boolean;
        maxAlertsPerUserHour: number;
        maxAlertsPerTypeHour: number;
        alertCooldownMinutes: number;
    };
}
export declare const getSecurityConfig: (configService: ConfigService) => SecurityConfig;
export declare const getAdaptiveSessionTimeouts: (riskLevel: 'LOW' | 'MEDIUM' | 'HIGH') => number;
export declare const isHighRiskCountry: (countryCode: string, configService: ConfigService) => boolean;
export declare const isSuspiciousUserAgent: (userAgent: string) => boolean;
export declare const isImpossibleTravel: (lastLocation: {
    lat: number;
    lon: number;
    timestamp: Date;
}, currentLocation: {
    lat: number;
    lon: number;
    timestamp: Date;
}) => boolean;
export declare const SECURITY_PRESETS: {
    readonly PRODUCTION: {
        readonly riskScoring: {
            readonly enabled: true;
            readonly requireMfaThreshold: 40;
            readonly blockThreshold: 70;
        };
        readonly geolocation: {
            readonly enabled: true;
            readonly impossibleTravelDetection: true;
        };
        readonly botDetection: {
            readonly enabled: true;
            readonly captchaThreshold: 30;
        };
        readonly incidentResponse: {
            readonly autoLockAccountRisk: 75;
            readonly quarantineSuspiciousSessions: true;
        };
    };
    readonly STAGING: {
        readonly riskScoring: {
            readonly enabled: true;
            readonly requireMfaThreshold: 50;
            readonly blockThreshold: 80;
        };
        readonly geolocation: {
            readonly enabled: true;
            readonly impossibleTravelDetection: true;
        };
        readonly botDetection: {
            readonly enabled: true;
            readonly captchaThreshold: 40;
        };
        readonly incidentResponse: {
            readonly autoLockAccountRisk: 85;
            readonly quarantineSuspiciousSessions: false;
        };
    };
    readonly DEVELOPMENT: {
        readonly riskScoring: {
            readonly enabled: false;
            readonly requireMfaThreshold: 90;
            readonly blockThreshold: 95;
        };
        readonly geolocation: {
            readonly enabled: false;
            readonly impossibleTravelDetection: false;
        };
        readonly botDetection: {
            readonly enabled: false;
            readonly captchaThreshold: 90;
        };
        readonly incidentResponse: {
            readonly autoLockAccountRisk: 95;
            readonly quarantineSuspiciousSessions: false;
        };
    };
};
