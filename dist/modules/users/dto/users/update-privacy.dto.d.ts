declare class NotificationPreferencesDto {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    marketing?: boolean;
    eventUpdates?: boolean;
    groupInvitations?: boolean;
}
declare class PrivacySettingsDto {
    profileVisible?: boolean;
    showActivity?: boolean;
    allowFriendRequests?: boolean;
    showPurchaseHistory?: boolean;
}
export declare class UpdatePrivacyDto {
    notifications?: NotificationPreferencesDto;
    privacy?: PrivacySettingsDto;
}
export {};
