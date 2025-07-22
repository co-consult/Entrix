declare class ProfilePreferencesDto {
    eventTypes?: string[];
    language?: string;
    timezone?: string;
    currency?: string;
    notifications?: {
        email?: boolean;
        sms?: boolean;
        push?: boolean;
        marketing?: boolean;
        eventUpdates?: boolean;
        groupInvitations?: boolean;
    };
    privacy?: {
        profileVisible?: boolean;
        showActivity?: boolean;
        allowFriendRequests?: boolean;
        showPurchaseHistory?: boolean;
    };
}
export declare class CreateProfileDto {
    userId: string;
    dateOfBirth?: string;
    gender?: string;
    city?: string;
    country: string;
    language: string;
    occupation?: string;
    educationLevel?: string;
    bio?: string;
    website?: string;
    favoriteTeamId?: string;
    supporterSince?: string;
    preferences?: ProfilePreferencesDto;
}
export {};
