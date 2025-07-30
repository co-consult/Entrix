import { ForbiddenException } from '@nestjs/common';
export declare class AccessDeniedException extends ForbiddenException {
    readonly reason: string;
    readonly context?: {
        user_id?: string;
        resource_type?: string;
        resource_id?: string;
        required_permission?: string;
        missing_permissions?: string[];
        additional_info?: any;
    };
    constructor(reason: string, context?: {
        user_id?: string;
        resource_type?: string;
        resource_id?: string;
        required_permission?: string;
        missing_permissions?: string[];
        additional_info?: any;
    });
    static insufficientPermissions(userId: string, requiredPermission: string, resourceType?: string, resourceId?: string): AccessDeniedException;
    static insufficientRole(userId: string, requiredRoles: string[], userRoles: string[]): AccessDeniedException;
    static notResourceOwner(userId: string, resourceType: string, resourceId: string): AccessDeniedException;
}
