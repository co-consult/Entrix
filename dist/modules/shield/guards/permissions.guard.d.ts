/// <reference types="node" />
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RbacService } from '../services/rbac.service';
import { PermissionAction, ResourceType } from '../types/access-enums';
interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
        roles?: string[];
        permissions?: string[];
    };
    params: {
        [key: string]: string;
    };
    body: any;
    query: Record<string, any>;
    path: string;
    method: string;
    ip: string;
    headers: Record<string, any>;
}
interface PermissionRequirement {
    permission: string;
    resource_type: ResourceType;
    action: PermissionAction;
    resource_id_param?: string;
    context_builder?: (req: AuthenticatedRequest) => Record<string, any>;
    allow_owner_override?: boolean;
}
export declare const PERMISSIONS_KEY = "permissions";
export declare class PermissionsGuard implements CanActivate {
    private readonly reflector;
    private readonly rbacService;
    private readonly logger;
    constructor(reflector: Reflector, rbacService: RbacService, loggerService: LoggerService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private checkSinglePermission;
    private checkResourceOwnership;
    private getRequiredPermissions;
    private extractResourceId;
    private buildPermissionContext;
    private validateAuthentication;
    private logPermissionGranted;
    private logPermissionDenied;
    private handleError;
}
export declare const RequirePermissions: (...permissions: PermissionRequirement[]) => import("@nestjs/common").CustomDecorator<string>;
export declare const Permission: (permission: string, resourceType: ResourceType, action: PermissionAction, options?: {
    resource_id_param?: string;
    allow_owner_override?: boolean;
    context_builder?: (req: any) => Record<string, any>;
}) => PermissionRequirement;
export {};
