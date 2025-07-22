import { users, user_groups, user_roles } from '@prisma/client';
import { USER_CONSTANTS } from '../constants/user.constants';
import type { UserProfile } from './profile.types';
export type User = users;
export type UserGroup = user_groups;
export type UserRole = user_roles;
export type UserStatus = keyof typeof USER_CONSTANTS.STATUS;
export type SortableUserField = typeof USER_CONSTANTS.SORTABLE_FIELDS[number];
export type UserWithRelations = User & {
    profile?: UserProfile | null;
    userGroups?: UserGroup[];
    userRoles?: UserRole[];
};
export interface UserResponse {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    avatar?: string | null;
    isActive: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    lastLogin?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    metadata?: any;
    profile?: any;
    userGroups?: any[];
    userRoles?: any[];
}
export type UserResponseWithRelations = UserResponse & {
    profile?: UserProfile | null;
    userGroups?: UserGroup[];
    userRoles?: UserRole[];
};
export type UserBasicInfo = Pick<User, 'id' | 'first_name' | 'last_name' | 'email' | 'avatar'>;
export type UserBasicInfoResponse = Pick<UserResponse, 'id' | 'firstName' | 'lastName' | 'email' | 'avatar'>;
export type PublicUser = Pick<User, 'id' | 'first_name' | 'last_name' | 'avatar'> & {
    isVerified: boolean;
    joinedAt: Date;
};
export type PublicUserResponse = Pick<UserResponse, 'id' | 'firstName' | 'lastName' | 'avatar'> & {
    isVerified: boolean;
    joinedAt: Date;
};
export interface UserSearchParams {
    query?: string;
    verified?: boolean;
    active?: boolean;
    city?: string;
    country?: string;
    language?: string;
    includeProfile?: boolean;
    includeGroups?: boolean;
    includeRoles?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: SortableUserField;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedUserResult {
    users: UserWithRelations[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface PaginatedUserResponseResult {
    data: UserResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface AnonymousUserData {
    guestName: string;
    guestEmail: string;
    guestPhone?: string;
    onboardingKey?: string;
    incentiveType?: string;
    incentiveValue?: number;
    metadata?: Record<string, any>;
}
export interface UserStats {
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    newUsersThisMonth: number;
    usersByCountry: Array<{
        country: string;
        count: number;
    }>;
    usersByLanguage: Array<{
        language: string;
        count: number;
    }>;
}
export interface UserPreferences {
    language: string;
    timezone: string;
    currency: string;
    notifications: {
        email: boolean;
        sms: boolean;
        push: boolean;
        marketing: boolean;
    };
    privacy: {
        profileVisible: boolean;
        showActivity: boolean;
        allowFriendRequests: boolean;
    };
}
export interface UserSecuritySettings {
    twoFactorEnabled: boolean;
    loginAlerts: boolean;
    allowedIPs?: string[];
    sessionTimeout: number;
}
export interface UserActivity {
    id: string;
    action: string;
    resource: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}
export interface UserConversionData {
    anonymousData: AnonymousUserData;
    userData: Partial<User>;
    profileData?: Partial<UserProfile>;
    incentiveApplied: boolean;
}
export interface UserFilters {
    status?: UserStatus;
    verified?: boolean;
    country?: string;
    city?: string;
    language?: string;
    createdAfter?: Date;
    createdBefore?: Date;
    lastLoginAfter?: Date;
    lastLoginBefore?: Date;
}
