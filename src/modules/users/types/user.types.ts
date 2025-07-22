// src/modules/users/types/user.types.ts

import { users, user_groups, user_roles } from '@prisma/client';
import { USER_CONSTANTS } from '../constants/user.constants';
import type { UserProfile } from './profile.types';

// Types de base depuis Prisma
export type User = users;
export type UserGroup = user_groups;
export type UserRole = user_roles;

// Types dérivés
export type UserStatus = keyof typeof USER_CONSTANTS.STATUS;
export type SortableUserField = typeof USER_CONSTANTS.SORTABLE_FIELDS[number];

// User avec relations optionnelles
export type UserWithRelations = User & {
  profile?: UserProfile | null;
  userGroups?: UserGroup[];
  userRoles?: UserRole[];
};

// NOUVEAU : Type de réponse transformé (ce que retourne le service)
// Sans password, avec camelCase, pour les réponses API
export interface UserResponse {
  id: string;
  email: string;
  firstName: string;  // camelCase
  lastName: string;   // camelCase
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

// User Response avec relations typées
export type UserResponseWithRelations = UserResponse & {
  profile?: UserProfile | null;
  userGroups?: UserGroup[];
  userRoles?: UserRole[];
};

// Données minimales d'un utilisateur
export type UserBasicInfo = Pick<User, 'id' | 'first_name' | 'last_name' | 'email' | 'avatar'>;

// Données minimales d'un utilisateur (version response)
export type UserBasicInfoResponse = Pick<UserResponse, 'id' | 'firstName' | 'lastName' | 'email' | 'avatar'>;

// Utilisateur public (données exposées)
export type PublicUser = Pick<User, 'id' | 'first_name' | 'last_name' | 'avatar'> & {
  isVerified: boolean;
  joinedAt: Date;
};

// Utilisateur public (version response)
export type PublicUserResponse = Pick<UserResponse, 'id' | 'firstName' | 'lastName' | 'avatar'> & {
  isVerified: boolean;
  joinedAt: Date;
};

// Paramètres de recherche utilisateur
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

// Résultat de recherche paginée (version Prisma brute)
export interface PaginatedUserResult {
  users: UserWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// NOUVEAU : Résultat de recherche paginée (version response)
export interface PaginatedUserResponseResult {
  data: UserResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Données d'un utilisateur anonyme
export interface AnonymousUserData {
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  onboardingKey?: string;
  incentiveType?: string;
  incentiveValue?: number;
  metadata?: Record<string, any>;
}

// Statistiques utilisateur
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

// Préférences utilisateur
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

// Configuration de sécurité
export interface UserSecuritySettings {
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  allowedIPs?: string[];
  sessionTimeout: number;
}

// Historique d'activité
export interface UserActivity {
  id: string;
  action: string;
  resource: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Conversion d'utilisateur anonyme
export interface UserConversionData {
  anonymousData: AnonymousUserData;
  userData: Partial<User>;
  profileData?: Partial<UserProfile>;
  incentiveApplied: boolean;
}

// Filtres pour les utilisateurs
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