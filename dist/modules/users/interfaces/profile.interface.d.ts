/// <reference types="node" />
import { UserProfile, ProfileResponse, ExtendedProfileResponse, PublicProfileResponse, ProfileUpdateData, UserProfilePreferences, AvatarData, ProfileCompletion as ProfileCompletionType, ProfileStats, ProfileBadge, ProfileExportData } from '../types/profile.types';
import { ValidationResult } from './user.interface';
export interface IProfileService {
    create(profileData: CreateProfileData): Promise<ProfileResponse>;
    findById(id: string): Promise<ProfileResponse | null>;
    findByUserId(userId: string): Promise<ProfileResponse | null>;
    update(id: string, updateData: ProfileUpdateData): Promise<ProfileResponse>;
    delete(id: string): Promise<void>;
    getExtended(id: string): Promise<ExtendedProfileResponse | null>;
    getPublicProfile(userId: string): Promise<PublicProfileResponse | null>;
    getCompletionStatus(userId: string): Promise<ProfileCompletionType>;
    calculateCompletionPercentage(profile: UserProfile): number;
    uploadAvatar(id: string, file: UploadedFile): Promise<AvatarData>;
    removeAvatar(id: string): Promise<void>;
    generateAvatarUrls(userId: string): Promise<AvatarData>;
    updatePreferences(userId: string, preferences: Partial<UserProfilePreferences>): Promise<ProfileResponse>;
    getPreferences(userId: string): Promise<UserProfilePreferences>;
    getProfileStats(id: string): Promise<ProfileStats>;
    getBadges(id: string): Promise<ProfileBadge[]>;
    awardBadge(id: string, badgeId: string): Promise<void>;
    exportProfile(id: string, format: 'JSON' | 'CSV' | 'PDF'): Promise<ProfileExportData>;
    anonymizeProfile(id: string): Promise<void>;
}
export interface IProfileRepository {
    create(profileData: CreateProfileDataWithUserId): Promise<UserProfile>;
    findById(id: string): Promise<UserProfile | null>;
    findByUserId(userId: string): Promise<UserProfile | null>;
    update(id: string, updateData: ProfileUpdateData): Promise<UserProfile>;
    delete(id: string): Promise<void>;
    findMany(filters: ProfileFilters): Promise<UserProfile[]>;
    count(filters?: ProfileFilters): Promise<number>;
}
export interface CreateProfileData {
    userId: string;
    dateOfBirth?: Date;
    gender?: 'M' | 'F' | 'OTHER' | 'PREFER_NOT_TO_SAY';
    city?: string;
    country: string;
    language: string;
    occupation?: string;
    educationLevel?: string;
    bio?: string;
    website?: string;
    favoriteTeamId?: string;
    supporterSince?: Date;
    fanId?: string;
    preferences?: UserProfilePreferences;
}
export interface CreateProfileDataWithUserId extends CreateProfileData {
    userId: string;
}
export interface PublicProfileInfo {
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
    fanId?: string;
}
export interface ProfileSuggestion {
    field: string;
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    incentive?: {
        type: string;
        value: number;
        description: string;
    };
}
export interface UploadedFile {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
}
export interface ProfileFilters {
    country?: string;
    city?: string;
    language?: string;
    gender?: string;
    ageMin?: number;
    ageMax?: number;
    hasAvatar?: boolean;
    isComplete?: boolean;
    favoriteTeamId?: string;
    fanId?: string;
    createdAfter?: Date;
    createdBefore?: Date;
}
export interface ProfileActivity {
    id: string;
    type: string;
    description: string;
    data?: Record<string, any>;
    createdAt: Date;
}
export interface IProfileValidator {
    validateCreateData(data: CreateProfileData): ValidationResult;
    validateUpdateData(data: ProfileUpdateData): ValidationResult;
    validateDateOfBirth(date: Date): boolean;
    validateCountry(country: string): boolean;
    validateLanguage(language: string): boolean;
    validateWebsite(url: string): boolean;
    validateBio(bio: string): boolean;
    validateFanId(fanId: string): boolean;
}
export interface ProfileEvent {
    type: 'PROFILE_CREATED' | 'PROFILE_UPDATED' | 'AVATAR_UPLOADED' | 'BADGE_EARNED' | 'COMPLETION_MILESTONE' | 'FAN_ID_ASSIGNED';
    profileId: string;
    userId: string;
    data: Record<string, any>;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface ProfileSearchParams {
    filters?: ProfileFilters;
    includeStats?: boolean;
    includeBadges?: boolean;
    limit?: number;
    offset?: number;
}
export interface FanIdSearchResult {
    profile: ProfileResponse | null;
    isValid: boolean;
    isUnique: boolean;
    errorMessage?: string;
}
