import { ForbiddenException } from '@nestjs/common';
export declare class InsufficientPermissionsException extends ForbiddenException {
    readonly missingPermissions: string[];
    readonly context?: {
        user_id?: string;
        resource_type?: string;
        resource_id?: string;
        current_permissions?: string[];
        conditions_failed?: string[];
    };
    constructor(missingPermissions: string[], context?: {
        user_id?: string;
        resource_type?: string;
        resource_id?: string;
        current_permissions?: string[];
        conditions_failed?: string[];
    });
    static conditionsNotMet(userId: string, permission: string, failedConditions: string[]): InsufficientPermissionsException;
    static multiplePermissionsMissing(userId: string, missingPermissions: string[], currentPermissions: string[]): InsufficientPermissionsException;
}
