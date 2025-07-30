// src/modules/users/interfaces/profile.interface.ts

import { 
  UserProfile, 
  ProfileResponse, 
  ExtendedProfileResponse, 
  PublicProfileResponse,
  ProfileUpdateData, 
  UserProfilePreferences, 
  AvatarData,
  ProfileCompletion as ProfileCompletionType,
  ProfileStats,
  ProfileBadge,
  ProfileExportData
} from '../types/profile.types';
import { ValidationResult } from './user.interface';

// Interface de service profil (utilise les types de réponse)
export interface IProfileService {
  // CRUD de base
  create(profileData: CreateProfileData): Promise<ProfileResponse>;
  findById(id: string): Promise<ProfileResponse | null>;
  findByUserId(userId: string): Promise<ProfileResponse | null>;
  update(id: string, updateData: ProfileUpdateData): Promise<ProfileResponse>;
  delete(id: string): Promise<void>;
  
  // Profil étendu avec calculs
  getExtended(id: string): Promise<ExtendedProfileResponse | null>;
  getPublicProfile(userId: string): Promise<PublicProfileResponse | null>;
  
  // Complétion et validation
  getCompletionStatus(userId: string): Promise<ProfileCompletionType>;
  calculateCompletionPercentage(profile: UserProfile): number;
  
  // Avatar et médias
  uploadAvatar(id: string, file: UploadedFile): Promise<AvatarData>;
  removeAvatar(id: string): Promise<void>; // Note: removeAvatar, pas deleteAvatar
  generateAvatarUrls(userId: string): Promise<AvatarData>;
  
  // Préférences
  updatePreferences(userId: string, preferences: Partial<UserProfilePreferences>): Promise<ProfileResponse>;
  getPreferences(userId: string): Promise<UserProfilePreferences>;
  
  // Analytics
  getProfileStats(id: string): Promise<ProfileStats>;
  getBadges(id: string): Promise<ProfileBadge[]>;
  awardBadge(id: string, badgeId: string): Promise<void>;
  
  // Export et privacy
  exportProfile(id: string, format: 'JSON' | 'CSV' | 'PDF'): Promise<ProfileExportData>;
  anonymizeProfile(id: string): Promise<void>;
}

// Interface de repository profil (utilise les types Prisma bruts)
export interface IProfileRepository {
  create(profileData: CreateProfileDataWithUserId): Promise<UserProfile>;
  findById(id: string): Promise<UserProfile | null>;
  findByUserId(userId: string): Promise<UserProfile | null>;
  update(id: string, updateData: ProfileUpdateData): Promise<UserProfile>;
  delete(id: string): Promise<void>;
  findMany(filters: ProfileFilters): Promise<UserProfile[]>;
  count(filters?: ProfileFilters): Promise<number>;
}

// Données de création de profil (pour l'API) - UPDATED avec fan_id
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
  fanId?: string; // ✅ NOUVEAU CHAMP OPTIONNEL
  preferences?: UserProfilePreferences;
}

// Données de création de profil (pour le repository - correspond au schema Prisma)
export interface CreateProfileDataWithUserId extends CreateProfileData {
  userId: string; // Obligatoire dans Prisma
}

// Profil public (données exposées) - renommé pour éviter les conflits
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
  fanId?: string; // ✅ AJOUTÉ pour visibilité publique si autorisé
}

// Suggestion pour améliorer le profil
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

// Fichier uploadé
export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

// Filtres de profil - UPDATED avec fan_id
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
  fanId?: string; // ✅ NOUVEAU FILTRE pour recherche par fan_id
  createdAfter?: Date;
  createdBefore?: Date;
}

// Activité du profil
export interface ProfileActivity {
  id: string;
  type: string;
  description: string;
  data?: Record<string, any>;
  createdAt: Date;
}

// Interface de validation profil
export interface IProfileValidator {
  validateCreateData(data: CreateProfileData): ValidationResult;
  validateUpdateData(data: ProfileUpdateData): ValidationResult;
  validateDateOfBirth(date: Date): boolean;
  validateCountry(country: string): boolean;
  validateLanguage(language: string): boolean;
  validateWebsite(url: string): boolean;
  validateBio(bio: string): boolean;
  validateFanId(fanId: string): boolean; // ✅ NOUVELLE VALIDATION pour fan_id
}

// Événement profil
export interface ProfileEvent {
  type: 'PROFILE_CREATED' | 'PROFILE_UPDATED' | 'AVATAR_UPLOADED' | 'BADGE_EARNED' | 'COMPLETION_MILESTONE' | 'FAN_ID_ASSIGNED';
  profileId: string;
  userId: string;
  data: Record<string, any>;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Paramètres de recherche de profils
export interface ProfileSearchParams {
  filters?: ProfileFilters;
  includeStats?: boolean;
  includeBadges?: boolean;
  limit?: number;
  offset?: number;
}

// Interface pour recherche par fan_id
export interface FanIdSearchResult {
  profile: ProfileResponse | null;
  isValid: boolean;
  isUnique: boolean;
  errorMessage?: string;
}