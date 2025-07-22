declare class ConversionProfileDataDto {
    city?: string;
    country?: string;
    language?: string;
    dateOfBirth?: string;
    gender?: string;
}
export declare class ConvertAnonymousDto {
    onboardingKey: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
    profileData?: ConversionProfileDataDto;
    acceptedTerms: boolean;
    marketingConsent?: boolean;
}
export declare class ConvertAnonymousResponseDto {
    success: boolean;
    user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone?: string;
        avatar?: string;
        createdAt: string;
    };
    incentiveApplied: boolean;
    incentiveDetails?: {
        type: string;
        value: number;
        description: string;
    };
    errors?: string[];
    migrationSummary?: {
        ticketsMigrated: number;
        subscriptionsMigrated: number;
        ordersMigrated: number;
    };
    accessToken?: string;
    nextSteps?: string[];
}
export {};
