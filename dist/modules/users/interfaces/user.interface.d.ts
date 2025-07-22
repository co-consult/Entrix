import { User, UserResponse, PaginatedUserResponseResult } from '../types/user.types';
import { GroupRole } from '../types/group.types';
export interface IUserService {
    create(userData: CreateUserData): Promise<UserResponse>;
    findById(id: string): Promise<UserResponse | null>;
    findByEmail(email: string): Promise<UserResponse | null>;
    findByPhone(phone: string): Promise<UserResponse | null>;
    update(id: string, updateData: UpdateUserData): Promise<UserResponse>;
    delete(id: string): Promise<void>;
    search(params: UserSearchParams): Promise<PaginatedUserResponseResult>;
    findMany(filters: UserFilters): Promise<UserResponse[]>;
    count(filters?: UserFilters): Promise<number>;
    activate(id: string): Promise<UserResponse>;
    deactivate(id: string): Promise<UserResponse>;
    suspend(id: string, reason: string): Promise<UserResponse>;
    verify(id: string): Promise<UserResponse>;
    getUserGroups(userId: string): Promise<UserGroupInfo[]>;
    getUserRoles(userId: string): Promise<UserRoleInfo[]>;
    getStats(filters?: UserFilters): Promise<UserStats>;
    changePassword?(id: string, oldPassword: string, newPassword: string): Promise<UserResponse>;
    verifyPassword?(userId: string, password: string): Promise<boolean>;
}
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
export interface CreateUserDataWithPassword extends CreateUserData {
    password: string;
}
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
export interface UpdateUserDataWithPassword extends UpdateUserData {
    password?: string;
}
export interface UserSearchParams {
    query?: string;
    filters?: UserFilters;
    pagination?: PaginationParams;
    sorting?: SortingParams;
    include?: UserInclude;
}
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
export interface PaginationParams {
    page?: number;
    limit?: number;
    offset?: number;
}
export interface SortingParams {
    field: string;
    order: 'asc' | 'desc';
}
export interface UserInclude {
    profile?: boolean;
    userGroups?: boolean;
    userRoles?: boolean;
    sessions?: boolean;
}
export interface UserGroupInfo {
    groupId: string;
    groupName: string;
    groupType: string;
    role: GroupRole;
    joinedAt: Date;
    isActive: boolean;
}
export interface UserRoleInfo {
    roleId: string;
    roleName: string;
    roleCode: string;
    assignedAt: Date;
    validUntil?: Date;
    isActive: boolean;
}
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
export interface CountryStats {
    country: string;
    count: number;
    percentage: number;
}
export interface LanguageStats {
    language: string;
    count: number;
    percentage: number;
}
export interface TrendData {
    date: string;
    count: number;
}
export interface IUserValidator {
    validateCreateData(data: CreateUserData): ValidationResult;
    validateUpdateData(data: UpdateUserData): ValidationResult;
    validateEmail(email: string): boolean;
    validatePhone(phone: string): boolean;
    validateName(name: string): boolean;
}
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}
export interface ValidationError {
    field: string;
    message: string;
    code: string;
    value?: any;
}
export interface UserEvent {
    type: 'USER_CREATED' | 'USER_UPDATED' | 'USER_ACTIVATED' | 'USER_DEACTIVATED' | 'USER_VERIFIED';
    userId: string;
    data: Record<string, any>;
    timestamp: Date;
    metadata?: Record<string, any>;
}
