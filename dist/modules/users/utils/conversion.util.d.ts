import { IncentiveType } from '../types/enums';
import { AnonymousUser, ConversionData, ConversionResult } from '../interfaces/anonymous.interface';
export declare class ConversionUtil {
    static validateConversionData(conversionData: ConversionData, anonymousUser: AnonymousUser): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    };
    private static namesAreSimilar;
    private static levenshteinDistance;
    static prepareMigrationData(anonymousUser: AnonymousUser): {
        ticketIds: string[];
        subscriptionIds: string[];
        orderIds: string[];
        metadata: Record<string, any>;
    };
    static calculateIncentive(anonymousUser: AnonymousUser): {
        type: IncentiveType | null;
        value: number;
        description: string;
        additionalBonus: number;
    };
    private static getDefaultIncentiveDescription;
    static generateConversionSummary(anonymousUser: AnonymousUser, createdUser: any, migrationData: any, incentiveApplied: boolean): ConversionResult;
    static canConvert(anonymousUser: AnonymousUser): {
        canConvert: boolean;
        reasons: string[];
        blockers: string[];
    };
    static calculateConversionQualityScore(anonymousUser: AnonymousUser, conversionData: ConversionData): {
        score: number;
        factors: Array<{
            factor: string;
            score: number;
            weight: number;
            impact: string;
        }>;
    };
    static generatePostConversionRecommendations(user: any, migrationSummary: any, incentiveApplied: boolean): string[];
}
