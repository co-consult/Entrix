import { PermissionsService } from '../services/permissions.service';
import { RbacService } from '../services/rbac.service';
import { CreatePermissionDto, CheckPermissionDto, BulkAssignPermissionsDto } from '../dto/permissions';
import { Permission as PermissionEntity, PermissionsListResponse, PermissionResult } from '../interfaces/rbac.interface';
import { ResourceType, PermissionAction } from '../types/access-enums';
export declare class PermissionsController {
    private readonly permissionsService;
    private readonly rbacService;
    constructor(permissionsService: PermissionsService, rbacService: RbacService);
    createPermission(createData: CreatePermissionDto): Promise<{
        success: boolean;
        data: PermissionEntity;
        message: string;
    }>;
    listPermissions(resourceType?: ResourceType, action?: PermissionAction, isActive?: boolean, isSystem?: boolean): Promise<{
        success: boolean;
        data: PermissionsListResponse;
    }>;
    getPermission(id: string): Promise<{
        success: boolean;
        data: PermissionEntity;
    }>;
    updatePermission(id: string, updateData: Partial<CreatePermissionDto>): Promise<{
        success: boolean;
        data: PermissionEntity;
        message: string;
    }>;
    bulkAssignPermissions(bulkData: BulkAssignPermissionsDto): Promise<{
        success: boolean;
        data: {
            assignments_processed: number;
            permissions_assigned: number;
            roles_affected: number;
            duplicates_skipped: number;
        };
        message: string;
    }>;
    assignPermissionToRole(roleId: string, permissionId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    removePermissionFromRole(roleId: string, permissionId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    checkPermission(checkData: CheckPermissionDto): Promise<{
        success: boolean;
        data: PermissionResult;
    }>;
    getRolePermissions(roleId: string): Promise<{
        success: boolean;
        data: {
            role: any;
            permissions: PermissionEntity[];
            grouped_by_resource: Record<ResourceType, PermissionEntity[]>;
            total: number;
        };
    }>;
    getUserEffectivePermissions(userId: string): Promise<{
        success: boolean;
        data: any;
    }>;
    initializeSystemPermissions(): Promise<{
        success: boolean;
        data: {
            permissions_created: number;
            permissions_updated: number;
            permissions_skipped: number;
        };
        message: string;
    }>;
}
