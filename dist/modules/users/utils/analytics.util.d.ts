import { UserWithRelations } from '../types/user.types';
import { GroupWithMembers } from '../types/group.types';
import { IncentiveType } from '../types/enums';
export declare class AnalyticsUtil {
    static calculateProfileCompletion(user: UserWithRelations): number;
    static calculateAge(dateOfBirth: Date): number;
    static calculateConversionRate(totalAnonymous: number, totalConverted: number): number;
    static calculateAverageConversionTime(conversions: Array<{
        createdAt: Date;
        convertedAt: Date;
    }>): number;
    static analyzeIncentiveEffectiveness(incentives: Array<{
        type: IncentiveType;
        value: number;
        converted: boolean;
        createdAt: Date;
        convertedAt?: Date;
    }>): Record<IncentiveType, {
        total: number;
        converted: number;
        conversionRate: number;
        averageConversionTime: number;
        averageValue: number;
    }>;
    static segmentUsersByActivity(users: Array<{
        id: string;
        createdAt: Date;
        lastLogin?: Date;
        emailVerified: boolean;
        groupsCount?: number;
        ordersCount?: number;
    }>): {
        new: number;
        active: number;
        inactive: number;
        dormant: number;
        churned: number;
    };
    static calculateCohortRetention(users: Array<{
        createdAt: Date;
        lastLogin?: Date;
    }>, periods?: number[]): Array<{
        cohort: string;
        totalUsers: number;
        retention: Record<number, number>;
    }>;
    static calculateGroupEngagement(group: GroupWithMembers & {
        activities?: Array<{
            createdAt: Date;
            type: string;
        }>;
        purchases?: Array<{
            createdAt: Date;
            amount: number;
        }>;
    }): {
        activityScore: number;
        memberEngagement: number;
        purchaseActivity: number;
        growthRate: number;
        overallScore: number;
    };
    static generateTimeTrends<T extends {
        createdAt: Date;
    }>(data: T[], period?: 'day' | 'week' | 'month', last?: number): Array<{
        date: string;
        count: number;
        label: string;
    }>;
    static calculatePercentiles(values: number[], percentiles?: number[]): Record<number, number>;
    static detectAnomalies(data: Array<{
        date: Date;
        value: number;
    }>, threshold?: number): Array<{
        date: Date;
        value: number;
        isAnomaly: boolean;
        zScore: number;
    }>;
}
