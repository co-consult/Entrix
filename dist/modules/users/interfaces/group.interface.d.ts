import { Group, GroupMember, GroupPermissions, GroupSettings, GroupType, GroupRole, MemberStatus } from '../types/group.types';
import { PaginationParams, SortingParams, ValidationResult, TrendData } from './user.interface';
export interface IGroupService {
    create(groupData: CreateGroupData, ownerId: string): Promise<Group>;
    findById(id: string): Promise<Group | null>;
    findByCode(code: string): Promise<Group | null>;
    update(id: string, updateData: UpdateGroupData, userId: string): Promise<Group>;
    delete(id: string, userId: string): Promise<void>;
    search(params: GroupSearchParams): Promise<PaginatedGroupResult>;
    findUserGroups(userId: string, filters?: GroupFilters): Promise<Group[]>;
    findPublicGroups(filters?: GroupFilters): Promise<Group[]>;
    addMember(groupId: string, userId: string, role: GroupRole, addedBy: string): Promise<GroupMember>;
    removeMember(groupId: string, userId: string, removedBy: string): Promise<void>;
    updateMemberRole(groupId: string, userId: string, newRole: GroupRole, updatedBy: string): Promise<GroupMember>;
    updateMemberPermissions(groupId: string, userId: string, permissions: Partial<GroupPermissions>, updatedBy: string): Promise<GroupMember>;
    inviteUser(groupId: string, inviteData: GroupInviteData, invitedBy: string): Promise<GroupInvitation>;
    acceptInvitation(invitationId: string, userId: string): Promise<GroupMember>;
    declineInvitation(invitationId: string, userId: string): Promise<void>;
    hasPermission(groupId: string, userId: string, permission: keyof GroupPermissions): Promise<boolean>;
    getUserRole(groupId: string, userId: string): Promise<GroupRole | null>;
    canPerformAction(groupId: string, userId: string, action: GroupAction): Promise<PermissionCheck>;
    getGroupStats(groupId: string): Promise<GroupStats>;
    getOverallStats(filters?: GroupFilters): Promise<OverallGroupStats>;
}
export interface IGroupRepository {
    create(groupData: CreateGroupData): Promise<Group>;
    findById(id: string, include?: GroupInclude): Promise<Group | null>;
    findByCode(code: string, include?: GroupInclude): Promise<Group | null>;
    findMany(filters: GroupFilters, pagination?: PaginationParams): Promise<Group[]>;
    update(id: string, updateData: UpdateGroupData): Promise<Group>;
    delete(id: string): Promise<void>;
    count(filters?: GroupFilters): Promise<number>;
    addMember(membership: CreateMembershipData): Promise<GroupMember>;
    removeMember(groupId: string, userId: string): Promise<void>;
    updateMember(groupId: string, userId: string, updateData: UpdateMembershipData): Promise<GroupMember>;
    getMembers(groupId: string): Promise<GroupMember[]>;
    getMemberCount(groupId: string): Promise<number>;
}
export interface CreateGroupData {
    name: string;
    description?: string;
    type: GroupType;
    code: string;
    maxMembers?: number;
    isActive?: boolean;
    settings: GroupSettings;
    metadata?: Record<string, any>;
}
export interface UpdateGroupData {
    name?: string;
    description?: string;
    maxMembers?: number;
    isActive?: boolean;
    settings?: Partial<GroupSettings>;
    metadata?: Record<string, any>;
}
export interface GroupSearchParams {
    query?: string;
    filters?: GroupFilters;
    pagination?: PaginationParams;
    sorting?: SortingParams;
    include?: GroupInclude;
}
export interface GroupFilters {
    type?: GroupType;
    isActive?: boolean;
    isPrivate?: boolean;
    hasSpace?: boolean;
    ownerId?: string;
    createdAfter?: Date;
    createdBefore?: Date;
    minMembers?: number;
    maxMembers?: number;
}
export interface GroupInclude {
    members?: boolean;
    owner?: boolean;
    stats?: boolean;
}
export interface PaginatedGroupResult {
    data: Group[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface CreateMembershipData {
    userId: string;
    groupId: string;
    role: GroupRole;
    status: MemberStatus;
    addedBy: string;
    permissions: GroupPermissions;
    notes?: string;
}
export interface UpdateMembershipData {
    role?: GroupRole;
    status?: MemberStatus;
    permissions?: Partial<GroupPermissions>;
    notes?: string;
}
export interface GroupInviteData {
    email?: string;
    userId?: string;
    role: GroupRole;
    message?: string;
    expiresAt?: Date;
}
export interface GroupInvitation {
    id: string;
    groupId: string;
    invitedEmail?: string;
    invitedUserId?: string;
    invitedBy: string;
    role: GroupRole;
    message?: string;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
    expiresAt: Date;
    createdAt: Date;
}
export type GroupAction = 'VIEW' | 'JOIN' | 'LEAVE' | 'INVITE' | 'EDIT' | 'DELETE' | 'MANAGE_MEMBERS' | 'PURCHASE' | 'VIEW_ORDERS';
export interface PermissionCheck {
    allowed: boolean;
    reason?: string;
    requiredRole?: GroupRole;
    requiredPermission?: keyof GroupPermissions;
}
export interface GroupStats {
    memberCount: number;
    activeMemberCount: number;
    pendingInvitations: number;
    totalSpent: number;
    averageSpentPerMember: number;
    eventsAttended: number;
    createdAt: Date;
    lastActivity: Date;
    monthlyStats: MonthlyGroupStats[];
}
export interface MonthlyGroupStats {
    month: string;
    newMembers: number;
    activeMembers: number;
    totalSpent: number;
    eventsAttended: number;
}
export interface OverallGroupStats {
    totalGroups: number;
    activeGroups: number;
    totalMembers: number;
    averageMembersPerGroup: number;
    groupsByType: Array<{
        type: GroupType;
        count: number;
        percentage: number;
    }>;
    membershipTrend: TrendData[];
    activityTrend: TrendData[];
}
export interface IGroupValidator {
    validateCreateData(data: CreateGroupData): ValidationResult;
    validateUpdateData(data: UpdateGroupData): ValidationResult;
    validateGroupName(name: string): boolean;
    validateGroupCode(code: string): boolean;
    validatePermissions(permissions: GroupPermissions): ValidationResult;
    validateSettings(settings: GroupSettings): ValidationResult;
}
export interface GroupEvent {
    type: 'GROUP_CREATED' | 'GROUP_UPDATED' | 'MEMBER_JOINED' | 'MEMBER_LEFT' | 'ROLE_CHANGED' | 'PERMISSIONS_UPDATED';
    groupId: string;
    userId?: string;
    data: Record<string, any>;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface GroupTypeConfig {
    type: GroupType;
    defaultSettings: GroupSettings;
    defaultPermissions: Record<GroupRole, GroupPermissions>;
    maxMembers: number;
    allowPublic: boolean;
    requireApproval: boolean;
}
