import { AccessRightStatus, AccessSourceType, AccessStatus, AccessAction, PermissionAction, ResourceType, RoleScope, AuditEventType, MembershipStatus } from '../types/access-enums';
export interface AccessRight {
    id: string;
    user_id: string | null;
    event_id: string | null;
    organizer_id: string | null;
    subscription_id: string | null;
    ticket_id: string | null;
    zone_id: string | null;
    seat_id: string | null;
    status: AccessRightStatus;
    source_type: AccessSourceType;
    access_code: string;
    valid_from: Date;
    valid_until: Date;
    max_uses: number;
    current_uses: number;
    used_at: Date | null;
    used_at_access_point: string | null;
    access_metadata: any;
    special_permissions: any;
    created_at: Date;
    updated_at: Date;
}
export interface CreateAccessRightData {
    user_id?: string;
    event_id?: string;
    organizer_id?: string;
    subscription_id?: string;
    ticket_id?: string;
    zone_id?: string;
    seat_id?: string;
    source_type: AccessSourceType;
    valid_from: Date;
    valid_until: Date;
    max_uses?: number;
    access_metadata?: any;
    special_permissions?: any;
}
export interface ValidateAccessData {
    access_code: string;
    access_point?: string;
    action: AccessAction;
    context?: AccessContext;
}
export interface AccessContext {
    ip_address?: string;
    user_agent?: string;
    geolocation?: {
        latitude: number;
        longitude: number;
    };
    device_fingerprint?: string;
    venue_zone?: string;
    additional_data?: Record<string, any>;
}
export interface AccessValidationResult {
    isValid: boolean;
    access_right?: AccessRight;
    status: AccessStatus;
    message: string;
    metadata?: {
        remaining_uses?: number;
        zone_access?: string[];
        special_permissions?: any;
        restrictions?: any;
    };
    audit_data: AccessAuditData;
}
export interface Role {
    id: string;
    name: string;
    display_name: string;
    description: string | null;
    scope: RoleScope;
    level: number;
    is_system: boolean;
    is_active: boolean;
    metadata: any;
    created_at: Date;
    updated_at: Date;
}
export interface CreateRoleData {
    name: string;
    display_name: string;
    description?: string;
    scope: RoleScope;
    level: number;
    metadata?: any;
}
export interface UserRole {
    id: string;
    user_id: string;
    role_id: string;
    assigned_at: Date;
    valid_until: Date | null;
    status: MembershipStatus;
    assigned_by: string | null;
    notes: string | null;
    created_at: Date;
    updated_at: Date;
}
export interface AssignRoleData {
    user_id: string;
    role_id: string;
    valid_until?: Date;
    assigned_by: string;
    notes?: string;
}
export interface Permission {
    id: string;
    name: string;
    display_name: string;
    description: string | null;
    resource_type: ResourceType;
    action: PermissionAction;
    conditions: any;
    is_system: boolean;
    is_active: boolean;
    metadata: any;
    created_at: Date;
    updated_at: Date;
}
export interface PermissionCheck {
    user_id: string;
    permission: string;
    resource_type: ResourceType;
    resource_id?: string;
    context?: PermissionContext;
}
export interface PermissionContext {
    organizer_id?: string;
    venue_id?: string;
    event_id?: string;
    group_id?: string;
    owner_id?: string;
    additional_context?: Record<string, any>;
}
export interface PermissionResult {
    granted: boolean;
    reason: string;
    computed_permissions: string[];
    effective_roles: string[];
    conditions_met: boolean;
    cache_hit: boolean;
    checked_at: Date;
}
export interface AccessAuditData {
    user_id: string | null;
    event_type: AuditEventType;
    resource_type: ResourceType;
    resource_id: string | null;
    action: AccessAction | PermissionAction;
    status: AccessStatus;
    ip_address: string | null;
    user_agent: string | null;
    details: any;
    timestamp: Date;
}
export interface AuditLogEntry {
    id: string;
    user_id: string | null;
    event_type: AuditEventType;
    resource_type: ResourceType;
    resource_id: string | null;
    action: string;
    status: AccessStatus;
    ip_address: string | null;
    user_agent: string | null;
    details: any;
    created_at: Date;
}
export interface RoleHierarchy {
    parent_role_id: string;
    child_role_id: string;
    depth: number;
    created_at: Date;
}
export interface EffectivePermissions {
    user_id: string;
    direct_permissions: Permission[];
    inherited_permissions: Permission[];
    effective_permissions: Permission[];
    roles: Role[];
    computed_at: Date;
    expires_at: Date;
}
export interface AccessRightsListResponse {
    access_rights: AccessRight[];
    total: number;
    page: number;
    limit: number;
    has_next: boolean;
}
export interface RolesListResponse {
    roles: Role[];
    hierarchy: RoleHierarchy[];
    total: number;
}
export interface PermissionsListResponse {
    permissions: Permission[];
    grouped_by_resource: Record<ResourceType, Permission[]>;
    total: number;
}
export interface UserPermissionsResponse {
    user_id: string;
    effective_permissions: EffectivePermissions;
    access_rights: AccessRight[];
    roles: UserRole[];
    computed_at: Date;
}
export interface AccessRightsFilters {
    user_id?: string;
    event_id?: string;
    organizer_id?: string;
    status?: AccessRightStatus;
    source_type?: AccessSourceType;
    valid_from?: Date;
    valid_until?: Date;
    zone_id?: string;
}
export interface RoleFilters {
    scope?: RoleScope;
    is_active?: boolean;
    is_system?: boolean;
    level_min?: number;
    level_max?: number;
}
export interface PermissionFilters {
    resource_type?: ResourceType;
    action?: PermissionAction;
    is_active?: boolean;
    is_system?: boolean;
}
export interface AuditFilters {
    user_id?: string;
    event_type?: AuditEventType;
    resource_type?: ResourceType;
    status?: AccessStatus;
    date_from?: Date;
    date_until?: Date;
}
export interface ShieldConfiguration {
    cache_ttl: {
        access_rights: number;
        permissions: number;
        roles: number;
        hierarchy: number;
    };
    limits: {
        max_roles_per_user: number;
        max_permissions_per_role: number;
        max_access_rights_per_user: number;
    };
    audit: {
        enabled: boolean;
        retention_days: number;
        batch_size: number;
    };
    security: {
        require_mfa_for_admin: boolean;
        ip_whitelist: string[];
        max_failed_attempts: number;
    };
}
