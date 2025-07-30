import { CreateUserDto } from '../dto/users/create-user.dto';
import { UpdateUserDto } from '../dto/users/update-user.dto';
import { UserSearchDto } from '../dto/users/user-search.dto';
import { UpdatePrivacyDto } from '../dto/users/update-privacy.dto';
import { UserPreferencesDto } from '../dto/users/user-preferences.dto';
import { UsersService } from '../services/users.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { UserResponse } from '../types/user.types';
import { UserFilters, UserStats, UserGroupInfo, UserRoleInfo } from '../interfaces/user.interface';
import { StandardResponse, PaginatedResponse, CreatedResponse, UpdatedResponse, DeletedResponse } from '../types/response.types';
export declare class UsersController {
    private readonly usersService;
    private readonly prisma;
    constructor(usersService: UsersService, prisma: PrismaService);
    createUser(dto: CreateUserDto): Promise<CreatedResponse<UserResponse>>;
    searchUsers(searchDto: UserSearchDto): Promise<PaginatedResponse<UserResponse>>;
    getMyProfile(user: UserResponse): Promise<StandardResponse<UserResponse>>;
    getUserStats(filters?: UserFilters): Promise<StandardResponse<UserStats>>;
    getAllRoles(): Promise<{
        success: boolean;
        data: {
            description: string;
            is_active: boolean;
            name: string;
            id: string;
            code: string;
        }[];
    }>;
    getUserById(id: string): Promise<StandardResponse<UserResponse>>;
    updateUser(id: string, dto: UpdateUserDto): Promise<UpdatedResponse<UserResponse>>;
    updateMyProfile(user: UserResponse, dto: UpdateUserDto): Promise<UpdatedResponse<UserResponse>>;
    updatePrivacySettings(user: UserResponse, dto: UpdatePrivacyDto): Promise<UpdatedResponse<UserResponse>>;
    updatePreferences(user: UserResponse, dto: UserPreferencesDto): Promise<UpdatedResponse<UserResponse>>;
    activateUser(id: string): Promise<UpdatedResponse<UserResponse>>;
    deactivateUser(id: string): Promise<UpdatedResponse<UserResponse>>;
    verifyUser(id: string): Promise<UpdatedResponse<UserResponse>>;
    getUserGroups(id: string): Promise<StandardResponse<UserGroupInfo[]>>;
    getUserRoles(id: string): Promise<StandardResponse<UserRoleInfo[]>>;
    changePassword(id: string, passwordData: {
        oldPassword: string;
        newPassword: string;
    }, currentUser: UserResponse): Promise<UpdatedResponse<UserResponse>>;
    deleteUser(id: string): Promise<DeletedResponse>;
}
