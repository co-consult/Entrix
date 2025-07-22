import { GroupRole, GroupPermissions, GroupType, GroupMember } from '../types/group.types';
export declare class GroupPermissionsUtil {
    private static readonly ROLE_HIERARCHY;
    static isRoleHigherOrEqual(role: GroupRole, comparedTo: GroupRole): boolean;
    static isRoleHigher(role: GroupRole, comparedTo: GroupRole): boolean;
    static getHighestRole(roles: GroupRole[]): GroupRole | null;
    static getDefaultPermissions(role: GroupRole, groupType: GroupType): GroupPermissions;
    static hasPermission(member: GroupMember, permission: keyof Omit<GroupPermissions, 'spendingLimit'>, groupType?: GroupType): boolean;
    static canPurchase(member: GroupMember, amount: number, groupType?: GroupType): {
        allowed: boolean;
        reason?: string;
        remainingLimit?: number;
    };
    static canManageMember(manager: GroupMember, target: GroupMember, action: 'update_role' | 'update_permissions' | 'remove' | 'suspend'): {
        allowed: boolean;
        reason?: string;
    };
    static canInvite(member: GroupMember, groupType: GroupType, currentGroupSize: number, maxGroupSize?: number): {
        allowed: boolean;
        reason?: string;
    };
    static calculateEffectivePermissions(member: GroupMember, groupType: GroupType): GroupPermissions;
    static validatePermissionUpdate(currentMember: GroupMember, newPermissions: Partial<GroupPermissions>, updatedBy: GroupMember, groupType: GroupType): {
        valid: boolean;
        errors: string[];
        warnings: string[];
    };
    static getMaxAssignableRole(assignerRole: GroupRole): GroupRole;
    static getAvailableActions(member: GroupMember, groupType: GroupType, groupSize: number, maxGroupSize?: number): string[];
    static suggestPermissionAdjustments(groupType: GroupType, memberCount: number, currentPermissions: GroupPermissions, role: GroupRole): Array<{
        suggestion: string;
        reason: string;
        priority: 'low' | 'medium' | 'high';
    }>;
}
