import { groups, user_groups } from '@prisma/client';
import { GROUP_CONSTANTS } from '../constants/group.constants';
import { UserBasicInfo } from './user.types';
export type Group = groups;
export type UserGroupMembership = user_groups;
export type GroupType = keyof typeof GROUP_CONSTANTS.TYPES;
export type GroupRole = keyof typeof GROUP_CONSTANTS.ROLES;
export type MemberStatus = keyof typeof GROUP_CONSTANTS.MEMBER_STATUS;
export type SortableGroupField = typeof GROUP_CONSTANTS.SORTABLE_FIELDS[number];
export interface GroupPermissions {
    canInvite: boolean;
    canPurchase: boolean;
    canViewOrders: boolean;
    canManageMembers: boolean;
    canEditGroup: boolean;
    canDeleteGroup: boolean;
    spendingLimit?: number | null;
}
export interface GroupSettings {
    isPrivate: boolean;
    requireApproval: boolean;
    maxMembers?: number;
    allowInvites: boolean;
    autoAcceptInvites?: boolean;
    memberCanInvite?: boolean;
    defaultPermissions: Partial<GroupPermissions>;
}
export interface GroupMember {
    id: string;
    user: UserBasicInfo;
    role: GroupRole;
    status: MemberStatus;
    permissions: GroupPermissions;
    joinedAt: Date;
    invitedBy?: string;
    approvedBy?: string;
    approvedAt?: Date;
    lastActivity?: Date;
    totalSpent?: number;
    notes?: string;
}
export type GroupWithMembers = Group & {
    members?: GroupMember[];
    memberCount?: number;
    myRole?: GroupRole;
    myPermissions?: GroupPermissions;
};
export type GroupBasicInfo = Pick<Group, 'id' | 'name' | 'description' | 'type'> & {
    memberCount: number;
    isPrivate: boolean;
};
export interface GroupSearchParams {
    query?: string;
    type?: GroupType;
    isPrivate?: boolean;
    hasSpace?: boolean;
    userId?: string;
    includeMembers?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: SortableGroupField;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedGroupResult {
    groups: GroupWithMembers[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface GroupStats {
    totalMembers: number;
    activeMembers: number;
    pendingInvitations: number;
    totalSpent: number;
    averageSpentPerMember: number;
    eventsAttended: number;
    monthlyActivity: Array<{
        month: string;
        activeMembers: number;
        totalSpent: number;
    }>;
}
export interface GroupActivity {
    id: string;
    type: 'MEMBER_JOINED' | 'MEMBER_LEFT' | 'PURCHASE' | 'ROLE_CHANGED' | 'SETTINGS_UPDATED';
    description: string;
    actor?: UserBasicInfo;
    target?: UserBasicInfo;
    details?: Record<string, any>;
    createdAt: Date;
}
export interface GroupInvitation {
    id: string;
    groupId: string;
    groupName: string;
    invitedEmail?: string;
    invitedUserId?: string;
    invitedBy: UserBasicInfo;
    proposedRole: GroupRole;
    message?: string;
    expiresAt: Date;
    createdAt: Date;
}
export interface GroupFilters {
    type?: GroupType;
    isPrivate?: boolean;
    isActive?: boolean;
    hasSpace?: boolean;
    createdAfter?: Date;
    createdBefore?: Date;
    minMembers?: number;
    maxMembers?: number;
}
export interface GroupMetadata {
    description?: string;
    tags?: string[];
    website?: string;
    socialLinks?: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
    };
    preferences?: {
        eventTypes?: string[];
        priceRange?: {
            min: number;
            max: number;
        };
        location?: {
            city: string;
            radius: number;
        };
    };
    customFields?: Record<string, any>;
}
export type GroupAction = 'VIEW' | 'JOIN' | 'LEAVE' | 'INVITE' | 'EDIT' | 'DELETE' | 'MANAGE_MEMBERS' | 'PURCHASE' | 'VIEW_ORDERS';
export interface PermissionCheck {
    allowed: boolean;
    reason?: string;
    requiredRole?: GroupRole;
    requiredPermission?: keyof GroupPermissions;
}
