// src/modules/users/interfaces/user.interface.ts

import { User, UserResponse, PaginatedUserResponseResult } from '../types/user.types';
import { GroupRole } from '../types/group.types';

// Interface de service utilisateur (utilise les types de réponse)
export interface IUserService {
  // CRUD de base
  create(userData: CreateUserData): Promise<UserResponse>;
  findById(id: string): Promise<UserResponse | null>;
  findByEmail(email: string): Promise<UserResponse | null>;
  findByPhone(phone: string): Promise<UserResponse | null>;
  update(id: string, updateData: UpdateUserData): Promise<UserResponse>;
  delete(id: string): Promise<void>;
  
  // Recherche et listing
  search(params: UserSearchParams): Promise<PaginatedUserResponseResult>;
  findMany(filters: UserFilters): Promise<UserResponse[]>;
  count(filters?: UserFilters): Promise<number>;
  
  // Opérations métier
  activate(id: string): Promise<UserResponse>;
  deactivate(id: string): Promise<UserResponse>;
  suspend(id: string, reason: string): Promise<UserResponse>;
  verify(id: string): Promise<UserResponse>;
  
  // Relations
  getUserGroups(userId: string): Promise<UserGroupInfo[]>;
  getUserRoles(userId: string): Promise<UserRoleInfo[]>;
  
  // Statistiques
  getStats(filters?: UserFilters): Promise<UserStats>;
  
  // Authentification
  changePassword?(id: string, oldPassword: string, newPassword: string): Promise<UserResponse>;
  verifyPassword?(userId: string, password: string): Promise<boolean>;
}

// Interface de repository utilisateur (utilise les types Prisma bruts)
export interface IUserRepository {
  create(userData: CreateUserDataWithPassword): Promise<User>;
  findById(id: string, include?: UserInclude): Promise<User | null>;
  findByEmail(email: string, include?: UserInclude): Promise<User | null>;
  findByPhone(phone: string, include?: UserInclude): Promise<User | null>;
  findMany(filters: UserFilters, pagination?: PaginationParams): Promise<User[]>;
  update(id: string, updateData: UpdateUserDataWithPassword): Promise<User>;
  delete(id: string): Promise<void>;
  count(filters?: UserFilters): Promise<number>;
  exists(email: string): Promise<boolean>;
}

// Données de création d'utilisateur (pour l'API - sans password)
export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  metadata?: Record<string, any>;
}

// Données de création d'utilisateur (pour le repository - avec password)
export interface CreateUserDataWithPassword extends CreateUserData {
  password: string;  // Requis pour Prisma
}

// Données de mise à jour d'utilisateur (pour l'API)
export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  lastLogin?: Date;
  metadata?: Record<string, any>;
}

// Données de mise à jour d'utilisateur (pour le repository - avec password optionnel)
export interface UpdateUserDataWithPassword extends UpdateUserData {
  password?: string; // Optionnel pour changement de mot de passe
}

// Paramètres de recherche
export interface UserSearchParams {
  query?: string;
  filters?: UserFilters;
  pagination?: PaginationParams;
  sorting?: SortingParams;
  include?: UserInclude;
}

// Filtres utilisateur
export interface UserFilters {
  isActive?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  country?: string;
  city?: string;
  language?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  lastLoginAfter?: Date;
  lastLoginBefore?: Date;
}

// Paramètres de pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

// Paramètres de tri
export interface SortingParams {
  field: string;
  order: 'asc' | 'desc';
}

// Relations à inclure
export interface UserInclude {
  profile?: boolean;
  userGroups?: boolean;
  userRoles?: boolean;
  sessions?: boolean;
}

// Information de groupe utilisateur
export interface UserGroupInfo {
  groupId: string;
  groupName: string;
  groupType: string;
  role: GroupRole;
  joinedAt: Date;
  isActive: boolean;
}

// Information de rôle utilisateur
export interface UserRoleInfo {
  roleId: string;
  roleName: string;
  roleCode: string;
  assignedAt: Date;
  validUntil?: Date;
  isActive: boolean;
}

// Statistiques utilisateur
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  usersByCountry: CountryStats[];
  usersByLanguage: LanguageStats[];
  registrationTrend: TrendData[];
}

// Statistiques par pays
export interface CountryStats {
  country: string;
  count: number;
  percentage: number;
}

// Statistiques par langue
export interface LanguageStats {
  language: string;
  count: number;
  percentage: number;
}

// Données de tendance
export interface TrendData {
  date: string;
  count: number;
}

// Interface de validation
export interface IUserValidator {
  validateCreateData(data: CreateUserData): ValidationResult;
  validateUpdateData(data: UpdateUserData): ValidationResult;
  validateEmail(email: string): boolean;
  validatePhone(phone: string): boolean;
  validateName(name: string): boolean;
}

// Résultat de validation
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Erreur de validation
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

// Événement utilisateur
export interface UserEvent {
  type: 'USER_CREATED' | 'USER_UPDATED' | 'USER_ACTIVATED' | 'USER_DEACTIVATED' | 'USER_VERIFIED';
  userId: string;
  data: Record<string, any>;
  timestamp: Date;
  metadata?: Record<string, any>;
}