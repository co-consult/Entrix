import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { BullmqService } from '../../../shared/bullmq/bullmq.service';
import { EmailService } from '../../../shared/email/email.service';
import { HashingService } from '../../../shared/hashing/hashing.service';
import { UserSearchParams, UserFilters, UserGroupInfo, UserRoleInfo, UserStats } from '../interfaces/user.interface';
interface CreateUserData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    isActive?: boolean;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    metadata?: Record<string, any>;
}
interface UpdateUserData {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
    isActive?: boolean;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    lastLogin?: Date;
    metadata?: Record<string, any>;
    password?: string;
}
interface User {
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
interface PaginatedUserResult {
    data: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
interface IUserService {
    create(userData: CreateUserData): Promise<User>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByPhone(phone: string): Promise<User | null>;
    update(id: string, updateData: UpdateUserData): Promise<User>;
    delete(id: string): Promise<void>;
    search(params: UserSearchParams): Promise<PaginatedUserResult>;
    findMany(filters: UserFilters): Promise<User[]>;
    count(filters?: UserFilters): Promise<number>;
    activate(id: string): Promise<User>;
    deactivate(id: string): Promise<User>;
    suspend(id: string, reason: string): Promise<User>;
    verify(id: string): Promise<User>;
    getUserGroups(userId: string): Promise<UserGroupInfo[]>;
    getUserRoles(userId: string): Promise<UserRoleInfo[]>;
    getStats(filters?: UserFilters): Promise<UserStats>;
    changePassword?(id: string, oldPassword: string, newPassword: string): Promise<User>;
    verifyPassword?(email: string, password: string): Promise<boolean>;
}
export declare class UsersService implements IUserService {
    private readonly prisma;
    private readonly redis;
    private readonly bullmq;
    private readonly email;
    private readonly hashingService;
    private readonly logger;
    private readonly CACHE_PREFIX;
    private readonly SEARCH_CACHE_PREFIX;
    private readonly CACHE_TTL;
    private readonly SEARCH_CACHE_TTL;
    constructor(prisma: PrismaService, redis: RedisService, bullmq: BullmqService, email: EmailService, hashingService: HashingService, loggerService: LoggerService);
    create(userData: CreateUserData): Promise<User>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByPhone(phone: string): Promise<User | null>;
    update(id: string, updateData: UpdateUserData): Promise<User>;
    delete(id: string): Promise<void>;
    search(params: UserSearchParams): Promise<PaginatedUserResult>;
    findMany(filters: UserFilters): Promise<User[]>;
    count(filters?: UserFilters): Promise<number>;
    activate(id: string): Promise<User>;
    deactivate(id: string): Promise<User>;
    suspend(id: string, reason: string): Promise<User>;
    verify(id: string): Promise<User>;
    getUserGroups(userId: string): Promise<UserGroupInfo[]>;
    getUserRoles(userId: string): Promise<UserRoleInfo[]>;
    getStats(filters?: UserFilters): Promise<UserStats>;
    private transformUserFromPrisma;
    private buildWhereConditions;
    private buildIncludeConditions;
    private invalidateUserCache;
    private validateCreateData;
    private isValidEmail;
    private isValidPhone;
    verifyPassword(userId: string, password: string): Promise<boolean>;
    verifyPasswordByEmail(email: string, password: string): Promise<boolean>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<User>;
}
export {};
