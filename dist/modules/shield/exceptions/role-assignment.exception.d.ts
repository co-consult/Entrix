import { BadRequestException, ConflictException } from '@nestjs/common';
export declare class RoleAssignmentException extends BadRequestException {
    readonly reason: string;
    readonly details?: {
        user_id?: string;
        role_id?: string;
        role_name?: string;
        current_roles?: string[];
        max_roles_limit?: number;
        additional_info?: any;
    };
    constructor(reason: string, details?: {
        user_id?: string;
        role_id?: string;
        role_name?: string;
        current_roles?: string[];
        max_roles_limit?: number;
        additional_info?: any;
    });
    static maxRolesExceeded(userId: string, maxLimit: number, currentCount: number): RoleAssignmentException;
    static roleAlreadyAssigned(userId: string, roleId: string, roleName: string): RoleAssignmentException;
    static systemRoleProtected(roleId: string, roleName: string): RoleAssignmentException;
}
export declare class RoleConflictException extends ConflictException {
    readonly conflictType: 'HIERARCHY' | 'SCOPE' | 'DUPLICATE';
    readonly reason: string;
    readonly details?: any;
    constructor(conflictType: 'HIERARCHY' | 'SCOPE' | 'DUPLICATE', reason: string, details?: any);
    static hierarchyConflict(parentRole: string, childRole: string): RoleConflictException;
    static scopeConflict(roleScope: string, requiredScope: string): RoleConflictException;
}
