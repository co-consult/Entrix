// src/modules/users/interfaces/group.interface.ts

import { Group, GroupMember, GroupPermissions, GroupSettings, GroupType, GroupRole, MemberStatus } from '../types/group.types';
import { PaginationParams, SortingParams, ValidationResult, TrendData } from './user.interface';

// Interface de service groupe
export interface IGroupService {
  // CRUD de base
  create(groupData: CreateGroupData, ownerId: string): Promise<Group>;
  findById(id: string): Promise<Group | null>;
  findByCode(code: string): Promise<Group | null>;
  update(id: string, updateData: UpdateGroupData, userId: string): Promise<Group>;
  delete(id: string, userId: string): Promise<void>;
  
  // Recherche et listing
  search(params: GroupSearchParams): Promise<PaginatedGroupResult>;
  findUserGroups(userId: string, filters?: GroupFilters): Promise<Group[]>;
  findPublicGroups(filters?: GroupFilters): Promise<Group[]>;
  
  // Gestion des membres
  addMember(groupId: string, userId: string, role: GroupRole, addedBy: string): Promise<GroupMember>;
  removeMember(groupId: string, userId: string, removedBy: string): Promise<void>;
  updateMemberRole(groupId: string, userId: string, newRole: GroupRole, updatedBy: string): Promise<GroupMember>;
  updateMemberPermissions(groupId: string, userId: string, permissions: Partial<GroupPermissions>, updatedBy: string): Promise<GroupMember>;
  
  // Invitations
  inviteUser(groupId: string, inviteData: GroupInviteData, invitedBy: string): Promise<GroupInvitation>;
  acceptInvitation(invitationId: string, userId: string): Promise<GroupMember>;
  declineInvitation(invitationId: string, userId: string): Promise<void>;
  
  // Permissions et vérifications
  hasPermission(groupId: string, userId: string, permission: keyof GroupPermissions): Promise<boolean>;
  getUserRole(groupId: string, userId: string): Promise<GroupRole | null>;
  canPerformAction(groupId: string, userId: string, action: GroupAction): Promise<PermissionCheck>;
  
  // Statistiques
  getGroupStats(groupId: string): Promise<GroupStats>;
  getOverallStats(filters?: GroupFilters): Promise<OverallGroupStats>;
}

// Interface de repository groupe
export interface IGroupRepository {
  create(groupData: CreateGroupData): Promise<Group>;
  findById(id: string, include?: GroupInclude): Promise<Group | null>;
  findByCode(code: string, include?: GroupInclude): Promise<Group | null>;
  findMany(filters: GroupFilters, pagination?: PaginationParams): Promise<Group[]>;
  update(id: string, updateData: UpdateGroupData): Promise<Group>;
  delete(id: string): Promise<void>;
  count(filters?: GroupFilters): Promise<number>;
  
  // Membres
  addMember(membership: CreateMembershipData): Promise<GroupMember>;
  removeMember(groupId: string, userId: string): Promise<void>;
  updateMember(groupId: string, userId: string, updateData: UpdateMembershipData): Promise<GroupMember>;
  getMembers(groupId: string): Promise<GroupMember[]>;
  getMemberCount(groupId: string): Promise<number>;
}

// Données de création de groupe
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

// Données de mise à jour de groupe
export interface UpdateGroupData {
  name?: string;
  description?: string;
  maxMembers?: number;
  isActive?: boolean;
  settings?: Partial<GroupSettings>;
  metadata?: Record<string, any>;
}

// Paramètres de recherche groupes
export interface GroupSearchParams {
  query?: string;
  filters?: GroupFilters;
  pagination?: PaginationParams;
  sorting?: SortingParams;
  include?: GroupInclude;
}

// Filtres groupe
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

// Relations à inclure
export interface GroupInclude {
  members?: boolean;
  owner?: boolean;
  stats?: boolean;
}

// Résultat paginé de groupes
export interface PaginatedGroupResult {
  data: Group[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Données de création de membership
export interface CreateMembershipData {
  userId: string;
  groupId: string;
  role: GroupRole;
  status: MemberStatus;
  addedBy: string;
  permissions: GroupPermissions;
  notes?: string;
}

// Données de mise à jour de membership
export interface UpdateMembershipData {
  role?: GroupRole;
  status?: MemberStatus;
  permissions?: Partial<GroupPermissions>;
  notes?: string;
}

// Données d'invitation
export interface GroupInviteData {
  email?: string;
  userId?: string;
  role: GroupRole;
  message?: string;
  expiresAt?: Date;
}

// Invitation de groupe
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

// Actions possibles sur un groupe
export type GroupAction = 
  | 'VIEW'
  | 'JOIN'
  | 'LEAVE'
  | 'INVITE'
  | 'EDIT'
  | 'DELETE'
  | 'MANAGE_MEMBERS'
  | 'PURCHASE'
  | 'VIEW_ORDERS';

// Vérification de permission
export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
  requiredRole?: GroupRole;
  requiredPermission?: keyof GroupPermissions;
}

// Statistiques d'un groupe
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

// Statistiques mensuelles
export interface MonthlyGroupStats {
  month: string;
  newMembers: number;
  activeMembers: number;
  totalSpent: number;
  eventsAttended: number;
}

// Statistiques générales des groupes
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

// Interface de validation groupe
export interface IGroupValidator {
  validateCreateData(data: CreateGroupData): ValidationResult;
  validateUpdateData(data: UpdateGroupData): ValidationResult;
  validateGroupName(name: string): boolean;
  validateGroupCode(code: string): boolean;
  validatePermissions(permissions: GroupPermissions): ValidationResult;
  validateSettings(settings: GroupSettings): ValidationResult;
}

// Événement groupe
export interface GroupEvent {
  type: 'GROUP_CREATED' | 'GROUP_UPDATED' | 'MEMBER_JOINED' | 'MEMBER_LEFT' | 'ROLE_CHANGED' | 'PERMISSIONS_UPDATED';
  groupId: string;
  userId?: string;
  data: Record<string, any>;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Configuration d'un type de groupe
export interface GroupTypeConfig {
  type: GroupType;
  defaultSettings: GroupSettings;
  defaultPermissions: Record<GroupRole, GroupPermissions>;
  maxMembers: number;
  allowPublic: boolean;
  requireApproval: boolean;
}