// src/modules/users/types/profile.types.ts

import { user_profiles } from '@prisma/client';

// Type de base depuis Prisma
export type UserProfile = user_profiles;

// Genres supportés
export type Gender = 'M' | 'F' | 'OTHER' | 'PREFER_NOT_TO_SAY';

// NOUVEAU : Type de réponse transformé pour les profils (ce que retourne le service)
// Sans données sensibles, avec camelCase, pour les réponses API
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
  preferences?: any; // JSONB
  createdAt: Date;
  updatedAt: Date;
  completionPercentage?: number;
}

// Profil étendu de réponse avec relations et calculs
export interface ExtendedProfileResponse extends ProfileResponse {
  age?: number;
  badges: ProfileBadge[];
  stats: ProfileStats;
  completionPercentage: number;
  completionStatus?: ProfileCompletion;
}

// Profil public (version response)
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

// Données démographiques
export interface DemographicData {
  dateOfBirth?: Date;
  gender?: Gender;
  city?: string;
  country: string;
  language: string;
  occupation?: string;
  educationLevel?: string;
}

// Préférences utilisateur stockées en JSONB
export interface UserProfilePreferences {
  // Préférences d'événements
  eventTypes?: string[];
  favoriteVenues?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  
  // Préférences de communication
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    marketing: boolean;
    eventUpdates: boolean;
    groupInvitations: boolean;
  };
  
  // Préférences de privacy
  privacy: {
    profileVisible: boolean;
    showActivity: boolean;
    allowFriendRequests: boolean;
    showPurchaseHistory: boolean;
  };
  
  // Préférences techniques
  language: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  
  // Accessibilité
  accessibility?: {
    largeText: boolean;
    highContrast: boolean;
    screenReader: boolean;
    wheelchairAccess: boolean;
  };
}

// Profil complet avec données calculées (type Prisma brut)
export interface ExtendedUserProfile extends UserProfile {
  age?: number;
  completionPercentage: number;
  badges?: ProfileBadge[];
  stats?: ProfileStats;
}

// Badges de profil
export interface ProfileBadge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  earnedAt: Date;
  category: 'ACTIVITY' | 'SOCIAL' | 'PURCHASE' | 'LOYALTY' | 'SPECIAL';
}

// Statistiques du profil
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

// Données d'avatar
export interface AvatarData {
  originalUrl?: string;
  thumbnailUrl?: string;
  sizes?: {
    small: string;   // 50x50
    medium: string;  // 100x100
    large: string;   // 200x200
    xlarge: string;  // 400x400
  };
  uploadedAt?: Date;
  fileSize?: number;
  mimeType?: string;
}

// Informations de supporter (équipe favorite)
export interface SupporterInfo {
  favoriteTeamId?: string;
  supporterSince?: Date;
  supporterLevel?: 'CASUAL' | 'REGULAR' | 'DEDICATED' | 'ULTRA';
  seasonTicketHolder?: boolean;
}

// Données de complétion du profil
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

// Paramètres de mise à jour du profil
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

// Validation du profil
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

// Données d'export du profil (GDPR)
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