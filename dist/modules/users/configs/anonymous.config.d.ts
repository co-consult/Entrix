import { IncentiveType } from '../types/enums';
export interface AnonymousConfig {
    onboarding: {
        keyLength: number;
        keyPrefix: string;
        defaultExpirationHours: number;
        maxExpirationHours: number;
        secretLength: number;
    };
    incentives: {
        enabled: boolean;
        defaultType: IncentiveType;
        configurations: Record<IncentiveType, {
            enabled: boolean;
            defaultValue: number;
            maxValue: number;
            description: string;
            conversionBonus: number;
        }>;
    };
    conversion: {
        enabled: boolean;
        requireEmailMatch: boolean;
        autoMigrateData: boolean;
        deleteAnonymousAfterConversion: boolean;
        maxConversionAttempts: number;
        conversionTimeoutMinutes: number;
    };
    session: {
        defaultDurationMinutes: number;
        maxDurationMinutes: number;
        extendOnActivity: boolean;
        maxExtensions: number;
        cleanupIntervalMinutes: number;
    };
    communication: {
        sendWelcomeEmail: boolean;
        sendOnboardingReminders: boolean;
        reminderIntervals: number[];
        maxReminders: number;
        emailTemplates: {
            onboarding: string;
            conversion: string;
            reminder: string;
        };
    };
    analytics: {
        trackConversions: boolean;
        trackIncentiveEffectiveness: boolean;
        retentionPeriodDays: number;
        anonymizeAfterDays: number;
    };
    limits: {
        maxAnonymousPerEmail: number;
        maxCreationsPerHour: number;
        maxCreationsPerDay: number;
        cleanupExpiredAfterDays: number;
    };
}
declare const _default: (() => AnonymousConfig) & import("@nestjs/config").ConfigFactoryKeyHost<AnonymousConfig>;
export default _default;
export declare const ANONYMOUS_CONFIG_DEFAULTS: {
    onboarding: {
        keyLength: number;
        keyPrefix: string;
        defaultExpirationHours: number;
        maxExpirationHours: number;
        secretLength: number;
    };
    incentives: {
        enabled: boolean;
        defaultType: IncentiveType;
    };
    conversion: {
        enabled: boolean;
        requireEmailMatch: boolean;
        autoMigrateData: boolean;
        deleteAnonymousAfterConversion: boolean;
        maxConversionAttempts: number;
        conversionTimeoutMinutes: number;
    };
    session: {
        defaultDurationMinutes: number;
        maxDurationMinutes: number;
        extendOnActivity: boolean;
        maxExtensions: number;
        cleanupIntervalMinutes: number;
    };
    communication: {
        sendWelcomeEmail: boolean;
        sendOnboardingReminders: boolean;
        reminderIntervals: number[];
        maxReminders: number;
    };
    analytics: {
        trackConversions: boolean;
        trackIncentiveEffectiveness: boolean;
        retentionPeriodDays: number;
        anonymizeAfterDays: number;
    };
    limits: {
        maxAnonymousPerEmail: number;
        maxCreationsPerHour: number;
        maxCreationsPerDay: number;
        cleanupExpiredAfterDays: number;
    };
};
