declare class GroupPermissionsDto {
    canInvite: boolean;
    canPurchase: boolean;
    canViewOrders: boolean;
    spendingLimit?: number | null;
}
declare class GroupSettingsDto {
    isPrivate: boolean;
    requireApproval: boolean;
    maxMembers?: number;
    allowInvites: boolean;
    defaultPermissions: GroupPermissionsDto;
}
declare class InitialInviteDto {
    email?: string;
    userId?: string;
    name?: string;
    role?: string;
}
export declare class CreateGroupDto {
    name: string;
    description?: string;
    type: string;
    settings: GroupSettingsDto;
    initialInvites?: InitialInviteDto[];
    metadata?: Record<string, any>;
}
export {};
