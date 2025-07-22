declare class DefaultPermissionsDto {
    canInvite?: boolean;
    canPurchase?: boolean;
    canViewOrders?: boolean;
    spendingLimit?: number | null;
}
export declare class GroupSettingsDto {
    isPrivate?: boolean;
    requireApproval?: boolean;
    maxMembers?: number;
    allowInvites?: boolean;
    autoAcceptRequests?: boolean;
    allowLeaving?: boolean;
    showStats?: boolean;
    showPurchaseHistory?: boolean;
    defaultPermissions?: DefaultPermissionsDto;
    notifyNewEvents?: boolean;
    notifyPurchases?: boolean;
    allowInviteLink?: boolean;
}
export {};
