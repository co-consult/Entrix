export declare class ProfilePreferencesDto {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    publicProfile?: boolean;
    privacy?: {
        showEmail?: boolean;
        showPhone?: boolean;
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
    fanId?: string;
    preferences?: ProfilePreferencesDto;
}
