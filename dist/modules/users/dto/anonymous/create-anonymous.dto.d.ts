export declare class CreateAnonymousDto {
    guestName: string;
    guestEmail: string;
    guestPhone?: string;
    incentiveType?: string;
    incentiveValue?: number;
    incentiveDescription?: string;
    expiresAt?: string;
    metadata?: Record<string, any>;
}
export declare class CreateAnonymousResponseDto {
    id: string;
    guestName: string;
    guestEmail: string;
    onboardingKey?: string;
    incentive?: {
        type: string;
        value: number;
        description: string;
        expiresAt?: string;
    };
    createdAt: string;
    onboardingUrl?: string;
}
