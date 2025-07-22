import { user_profiles } from '@prisma/client';
export type UserProfile = user_profiles;
export type Gender = 'M' | 'F' | 'OTHER' | 'PREFER_NOT_TO_SAY';
export interface ProfileResponse {
    id: string;
    userId: string;
    dateOfBirth?: Date | null;
    gender?: string | null;
    city?: string | null;
    country: string;
    language: string;
    occupation?: string | null;
    educationLevel?: string | null;
    bio?: string | null;
    website?: string | null;
    favoriteTeamId?: string | null;
    supporterSince?: Date | null;
    preferences?: any;
    createdAt: Date;
    updatedAt: Date;
    completionPercentage?: number;
}
export interface ExtendedProfileResponse extends ProfileResponse {
    age?: number;
    badges: ProfileBadge[];
    stats: ProfileStats;
    completionPercentage: number;
    completionStatus?: ProfileCompletion;
}
export interface PublicProfileResponse {
    userId: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    bio?: string;
    city?: string;
    country?: string;
    memberSince: Date;
    badges: ProfileBadge[];
    stats?: {
        eventsAttended?: number;
        groupsJoined?: number;
        reviewsWritten?: number;
    };
    isVerified: boolean;
}
export interface DemographicData {
    dateOfBirth?: Date;
    gender?: Gender;
    city?: string;
    country: string;
    language: string;
    occupation?: string;
    educationLevel?: string;
}
export interface UserProfilePreferences {
    eventTypes?: string[];
    favoriteVenues?: string[];
    priceRange?: {
        min: number;
        max: number;
    };
    notifications: {
        email: boolean;
        sms: boolean;
        push: boolean;
        marketing: boolean;
        eventUpdates: boolean;
        groupInvitations: boolean;
    };
    privacy: {
        profileVisible: boolean;
        showActivity: boolean;
        allowFriendRequests: boolean;
        showPurchaseHistory: boolean;
    };
    language: string;
    timezone: string;
    currency: string;
    dateFormat: string;
    accessibility?: {
        largeText: boolean;
        highContrast: boolean;
        screenReader: boolean;
        wheelchairAccess: boolean;
    };
}
export interface ExtendedUserProfile extends UserProfile {
    age?: number;
    completionPercentage: number;
    badges?: ProfileBadge[];
    stats?: ProfileStats;
}
export interface ProfileBadge {
    id: string;
    name: string;
    description: string;
    iconUrl: string;
    earnedAt: Date;
    category: 'ACTIVITY' | 'SOCIAL' | 'PURCHASE' | 'LOYALTY' | 'SPECIAL';
}
export interface ProfileStats {
    eventsAttended: number;
    totalSpent: number;
    groupsJoined: number;
    friendsCount: number;
    reviewsWritten: number;
    averageRating: number;
    memberSince: Date;
    lastActivity: Date;
}
export interface AvatarData {
    originalUrl?: string;
    thumbnailUrl?: string;
    sizes?: {
        small: string;
        medium: string;
        large: string;
        xlarge: string;
    };
    uploadedAt?: Date;
    fileSize?: number;
    mimeType?: string;
}
export interface SupporterInfo {
    favoriteTeamId?: string;
    supporterSince?: Date;
    supporterLevel?: 'CASUAL' | 'REGULAR' | 'DEDICATED' | 'ULTRA';
    seasonTicketHolder?: boolean;
}
export interface ProfileCompletion {
    percentage: number;
    missingFields: string[];
    suggestions: string[];
    incentives?: {
        type: string;
        value: number;
        description: string;
    }[];
}
export interface ProfileUpdateData {
    dateOfBirth?: Date;
    gender?: Gender;
    city?: string;
    country?: string;
    language?: string;
    occupation?: string;
    educationLevel?: string;
    bio?: string;
    website?: string;
    favoriteTeamId?: string;
    supporterSince?: Date;
    preferences?: Partial<UserProfilePreferences>;
}
export interface ProfileValidation {
    isValid: boolean;
    errors: Array<{
        field: string;
        message: string;
        code: string;
    }>;
    warnings: Array<{
        field: string;
        message: string;
        suggestion?: string;
    }>;
}
export interface ProfileExportData {
    personalInfo: Partial<UserProfile>;
    preferences: UserProfilePreferences;
    stats: ProfileStats;
    activityHistory: Array<{
        date: Date;
        action: string;
        details: Record<string, any>;
    }>;
    badges: ProfileBadge[];
    exportedAt: Date;
    format: 'JSON' | 'CSV' | 'PDF';
}
