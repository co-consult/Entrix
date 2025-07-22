import { CustomDecorator } from '@nestjs/common';
import { Permission } from '../constants/permissions.constants';
export declare const PERMISSIONS_KEY = "permissions";
export type PermissionOperator = 'AND' | 'OR';
export interface PermissionConfig {
    permissions: Permission[];
    operator?: PermissionOperator;
    own?: boolean;
    ownField?: string;
    conditional?: ConditionalPermission[];
    allowSuperAdmin?: boolean;
    errorMessage?: string;
}
export interface ConditionalPermission {
    condition: (context: any) => boolean;
    permissions: Permission[];
    errorMessage?: string;
}
export declare function Permissions(...permissions: Permission[]): CustomDecorator<string>;
export declare function Permissions(config: PermissionConfig): CustomDecorator<string>;
export declare const OwnResource: (permissions: Permission | Permission[], ownField?: string) => CustomDecorator<string>;
export declare const AnyPermission: (...permissions: Permission[]) => CustomDecorator<string>;
export declare const AdminOnly: (includeOrganizerAdmin?: boolean) => CustomDecorator<string>;
export declare const SuperAdminOnly: () => CustomDecorator<string>;
export declare const ConditionalPermissions: (basePermissions: Permission[], conditionalPermissions: ConditionalPermission[]) => CustomDecorator<string>;
export declare const BypassPermissions: () => CustomDecorator<string>;
export declare const PublicResource: () => CustomDecorator<string>;
export declare const OptionalAuth: (...permissions: Permission[]) => CustomDecorator<string>;
export declare function getPermissionsConfig(target: any, propertyKey?: string): Required<PermissionConfig> | 'public' | null;
export type PermissionsMetadata = Required<PermissionConfig> | 'public' | null;
