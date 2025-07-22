export declare class GetProfileCompletionDto {
    includeSuggestions?: boolean;
    includeIncentives?: boolean;
    includeNextSteps?: boolean;
}
export declare class ProfileCompletionResponseDto {
    percentage: number;
    completedFields: string[];
    missingFields: string[];
    suggestions: Array<{
        field: string;
        title: string;
        description: string;
        priority: 'LOW' | 'MEDIUM' | 'HIGH';
        incentive?: {
            type: string;
            value: number;
            description: string;
        };
    }>;
    nextSteps: string[];
    milestones: Array<{
        level: string;
        percentage: number;
        achieved: boolean;
        reward: string;
    }>;
    qualityScore: {
        overall: number;
        completeness: number;
        authenticity: number;
        engagement: number;
    };
}
