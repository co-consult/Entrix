import { gender, membership_status, mfa_method } from '@prisma/client';
export interface User {
    id: string;
    email: string;
    phone?: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    isActive: boolean;
    emailVerified?: Date;
    phoneVerified?: Date;
    identityDocumentType?: 'CIN' | 'PASSPORT' | 'DRIVING_LICENSE' | 'RESIDENCE_PERMIT' | 'MILITARY_ID' | 'STUDENT_ID' | 'PROFESSIONAL_ID' | 'OTHER';
    identityDocumentNumber?: string;
    identityVerified: boolean;
    identityVerifiedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    lastLogin?: Date;
    profile?: UserProfile;
    roles?: UserRoleAssignment[];
    groups?: UserGroupAssignment[];
}
export interface UserProfile {
    id: string;
    userId: string;
    dateOfBirth?: Date;
    gender?: gender;
    address?: string;
    city?: string;
    country: string;
    postalCode?: string;
    language: string;
    timezone: string;
    notifications: boolean;
    newsletter: boolean;
    supporterSince?: Date;
    favoritePlayer?: string;
    favoriteTeamId?: string;
    preferences?: UserPreferences;
    emergencyContact?: EmergencyContact;
    identityVerified?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserPreferences {
    theme?: 'light' | 'dark' | 'auto';
    pushNotifications?: {
        events: boolean;
        reminders: boolean;
        offers: boolean;
        security: boolean;
    };
    emailNotifications?: {
        marketing: boolean;
        transactional: boolean;
        security: boolean;
        newsletters: boolean;
    };
    eventPreferences?: {
        categories: string[];
        venues: string[];
        priceRange: {
            min: number;
            max: number;
        };
        daysAdvance: number;
    };
    accessibility?: {
        largeText: boolean;
        highContrast: boolean;
        screenReader: boolean;
        reducedMotion: boolean;
    };
    privacy?: {
        profileVisible: boolean;
        activityVisible: boolean;
        contactVisible: boolean;
    };
}
export interface EmergencyContact {
    fullName: string;
    relationship: string;
    phone: string;
    email?: string;
    address?: string;
}
export interface UserRoleAssignment {
    id: string;
    userId: string;
    roleId: string;
    assignedAt: Date;
    validUntil?: Date;
    status: membership_status;
    assignedBy?: string;
    notes?: string;
    role?: UserRole;
}
export interface UserRole {
    id: string;
    code: string;
    name: string;
    description?: string;
    level: number;
    isActive: boolean;
    permissions?: Record<string, any>;
}
export interface UserGroupAssignment {
    id: string;
    userId: string;
    groupId: string;
    joinedAt: Date;
    validUntil?: Date;
    status: membership_status;
    addedBy?: string;
    metadata?: Record<string, any>;
    group?: UserGroup;
}
export interface UserGroup {
    id: string;
    code: string;
    name: string;
    description?: string;
    type: string;
    isActive: boolean;
    maxMembers?: number;
    metadata?: Record<string, any>;
}
export interface UserSearchCriteria {
    search?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    isActive?: boolean;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    roles?: string[];
    groups?: string[];
    city?: string;
    country?: string;
    gender?: gender;
    identityDocumentType?: 'CIN' | 'PASSPORT' | 'DRIVING_LICENSE' | 'RESIDENCE_PERMIT' | 'MILITARY_ID' | 'STUDENT_ID' | 'PROFESSIONAL_ID' | 'OTHER';
    identityDocumentNumber?: string;
    identityVerified?: boolean;
    identityVerifiedAt?: Date;
    minAge?: number;
    maxAge?: number;
    supporterSince?: Date;
    createdAfter?: Date;
    createdBefore?: Date;
    lastLoginAfter?: Date;
    lastLoginBefore?: Date;
}
export interface UserSearchOptions {
    page?: number;
    limit?: number;
    orderBy?: {
        field: keyof User | keyof UserProfile;
        direction: 'asc' | 'desc';
    };
    includeProfile?: boolean;
    includeRoles?: boolean;
    includeGroups?: boolean;
}
export interface UserSearchResult {
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface CreateUserData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    profile?: Partial<CreateUserProfileData>;
    roles?: string[];
    groups?: string[];
}
export interface UpdateUserData {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
    isActive?: boolean;
}
export interface CreateUserProfileData {
    dateOfBirth?: Date;
    gender?: gender;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
    language?: string;
    timezone?: string;
    notifications?: boolean;
    newsletter?: boolean;
    supporterSince?: Date;
    favoritePlayer?: string;
    favoriteTeamId?: string;
    identityDocumentType?: 'CIN' | 'PASSPORT' | 'DRIVING_LICENSE' | 'RESIDENCE_PERMIT' | 'MILITARY_ID' | 'STUDENT_ID' | 'PROFESSIONAL_ID' | 'OTHER';
    identityDocumentNumber?: string;
    identityVerified?: boolean;
    identityVerifiedAt?: Date;
    preferences?: UserPreferences;
    emergencyContact?: EmergencyContact;
}
export interface UpdateUserProfileData extends Partial<CreateUserProfileData> {
}
export interface UserStatistics {
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    newUsers: number;
    genderDistribution: Record<string, number>;
    countryDistribution: Record<string, number>;
    ageDistribution: Record<string, number>;
    roleDistribution: Record<string, number>;
}
export interface UserActivity {
    id: string;
    userId: string;
    type: string;
    description: string;
    data?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}
export interface UserValidation {
    emailValid: boolean;
    phoneValid: boolean;
    identityVerified: boolean;
    profileComplete: boolean;
    documentsProvided: boolean;
    trustScore: number;
    lastValidated: Date;
}
export interface KycStatus {
    level: 'UNVERIFIED' | 'PARTIALLY_VERIFIED' | 'FULLY_VERIFIED';
    emailVerified: boolean;
    phoneVerified: boolean;
    identityVerified: boolean;
    documentProvided: boolean;
    documentType?: 'CIN' | 'PASSPORT' | 'DRIVING_LICENSE' | 'RESIDENCE_PERMIT' | 'MILITARY_ID' | 'STUDENT_ID' | 'PROFESSIONAL_ID' | 'OTHER';
    lastVerifiedAt?: Date;
    trustScore: number;
}
export interface UserMfaConfig {
    enabled: boolean;
    methods: {
        [K in mfa_method]?: {
            enabled: boolean;
            verified: boolean;
            configuredAt: Date;
            lastUsed?: Date;
        };
    };
    backupCodes?: {
        codes: string[];
        generatedAt: Date;
        usedCodes: string[];
    };
    defaultMethod?: mfa_method;
    lastVerified?: Date;
}
export interface UserSession {
    id: string;
    sessionToken: string;
    userId: string;
    ipAddress: string;
    userAgent?: string;
    deviceFingerprint?: string;
    geolocation?: Record<string, any>;
    isActive: boolean;
    lastActivity: Date;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface NotificationPreferences {
    email: {
        events: boolean;
        reminders: boolean;
        offers: boolean;
        security: boolean;
        newsletter: boolean;
        frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
    };
    push: {
        events: boolean;
        reminders: boolean;
        offers: boolean;
        security: boolean;
        eventReminder: number;
    };
    sms: {
        critical: boolean;
        security: boolean;
        reminders: boolean;
    };
}
export interface UserExportData {
    basicInfo: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone?: string;
        createdAt: Date;
    };
    profile?: UserProfile;
    roleHistory: UserRoleAssignment[];
    groupHistory: UserGroupAssignment[];
    sessions: UserSession[];
    activities: UserActivity[];
    preferences: UserPreferences;
    exportedAt: Date;
}
export interface UserReport {
    period: {
        from: Date;
        to: Date;
    };
    statistics: UserStatistics;
    trends: {
        registration: Array<{
            date: Date;
            count: number;
        }>;
        activity: Array<{
            date: Date;
            active: number;
        }>;
        verification: Array<{
            date: Date;
            verified: number;
        }>;
    };
    topCities: Array<{
        city: string;
        count: number;
    }>;
    topCountries: Array<{
        country: string;
        count: number;
    }>;
    generatedAt: Date;
}
export interface BulkOperationFilter {
    userIds?: string[];
    criteria?: UserSearchCriteria;
    excludeIds?: string[];
}
export interface BulkOperation {
    type: 'activate' | 'deactivate' | 'delete' | 'assign_role' | 'remove_role' | 'add_group' | 'remove_group';
    filter: BulkOperationFilter;
    data?: Record<string, any>;
    executedBy: string;
    executedAt: Date;
}
export interface BulkOperationResult {
    totalProcessed: number;
    successful: number;
    failed: number;
    errors: Array<{
        userId: string;
        error: string;
    }>;
    duration: number;
}
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'deleted';
export type VerificationType = 'email' | 'phone' | 'identity' | 'address';
export type TrustLevel = 'low' | 'medium' | 'high' | 'verified';
export interface PaginationOptions {
    page: number;
    limit: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
