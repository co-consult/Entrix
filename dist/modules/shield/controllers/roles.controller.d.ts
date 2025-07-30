import { RolesService } from '../services/roles.service';
import { CreateRoleDto, UpdateRoleDto, AssignRoleDto } from '../dto/roles';
import { Role, UserRole, RolesListResponse } from '../interfaces/rbac.interface';
import { RoleScope } from '../types/access-enums';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    createRole(createData: CreateRoleDto): Promise<{
        success: boolean;
        data: Role;
        message: string;
    }>;
    listRoles(scope?: RoleScope, isActive?: boolean, isSystem?: boolean, levelMin?: number, levelMax?: number): Promise<{
        success: boolean;
        data: RolesListResponse;
    }>;
    getRole(id: string): Promise<{
        success: boolean;
        data: Role;
    }>;
    updateRole(id: string, updateData: UpdateRoleDto): Promise<{
        success: boolean;
        data: Role;
        message: string;
    }>;
    assignRole(assignData: AssignRoleDto): Promise<{
        success: boolean;
        data: UserRole;
        message: string;
    }>;
    removeRole(userId: string, roleId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getUserRoles(userId: string): Promise<{
        success: boolean;
        data: {
            user_roles: UserRole[];
            summary: {
                total_roles: number;
                highest_level: number;
                scopes: string[];
                permissions_count: number;
            };
        };
    }>;
    getRoleUsers(roleId: string): Promise<{
        success: boolean;
        data: {
            role: Role;
            users: UserRole[];
            total: number;
        };
    }>;
}
