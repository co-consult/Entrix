import { IncentiveType } from '../types/enums';
export declare class OnboardingUtil {
    static generateOnboardingKey(prefix?: string, context?: string, length?: number): string;
    static generateContextualOnboardingKey(options: {
        eventType?: string;
        ticketType?: string;
        userType?: string;
        campaign?: string;
    }): string;
    static validateOnboardingKeyFormat(key: string): {
        isValid: boolean;
        parts?: {
            prefix: string;
            yearMonth: string;
            context: string;
            random: string;
        };
        errors: string[];
    };
    static generateKeyHash(key: string, salt?: string): string;
    static determineIncentive(context: {
        eventType?: string;
        ticketPrice?: number;
        userHistory?: 'new' | 'returning' | 'vip';
        groupSize?: number;
        campaign?: string;
    }): {
        type: IncentiveType;
        value: number;
        description: string;
        priority: 'low' | 'medium' | 'high';
    };
    static calculateExpirationDate(incentiveType: IncentiveType, customHours?: number): Date;
    static generateOnboardingMessage(guestName: string, incentive: {
        type: IncentiveType;
        value: number;
        description: string;
    }, context?: {
        eventName?: string;
        eventDate?: Date;
        organizerName?: string;
    }): {
        subject: string;
        greeting: string;
        incentiveText: string;
        callToAction: string;
        footer: string;
    };
    static generateOnboardingUrl(onboardingKey: string, baseUrl?: string, additionalParams?: Record<string, string>): string;
    static isKeyExpired(expiresAt: Date): boolean;
    static getTimeUntilExpiration(expiresAt: Date): {
        isExpired: boolean;
        totalHours: number;
        totalDays: number;
        humanReadable: string;
    };
    static generateOnboardingStats(onboardingData: Array<{
        createdAt: Date;
        expiresAt: Date;
        incentiveType: IncentiveType;
        converted: boolean;
        convertedAt?: Date;
    }>): {
        total: number;
        active: number;
        expired: number;
        converted: number;
        conversionRate: number;
        averageTimeToConversion: number;
        incentiveEffectiveness: Record<IncentiveType, {
            total: number;
            converted: number;
            rate: number;
        }>;
    };
}
