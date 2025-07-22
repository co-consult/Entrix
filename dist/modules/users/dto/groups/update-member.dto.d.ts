declare class UpdatePermissionsDto {
    canInvite?: boolean;
    canPurchase?: boolean;
    canViewOrders?: boolean;
    canManageMembers?: boolean;
    canEditGroup?: boolean;
    canDeleteGroup?: boolean;
    spendingLimit?: number | null;
}
export declare class UpdateMemberDto {
    action: string;
    newRole?: string;
    permissions?: UpdatePermissionsDto;
    spendingLimit?: number | null;
    reason?: string;
    sendNotification?: boolean;
}
export {};
