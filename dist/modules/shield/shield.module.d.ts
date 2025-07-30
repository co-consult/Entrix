import { OnModuleInit } from '@nestjs/common';
import { RbacService } from './services/rbac.service';
import { PermissionsService } from './services/permissions.service';
export declare class ShieldModule implements OnModuleInit {
    private readonly permissionsService;
    private readonly rbacService;
    constructor(permissionsService: PermissionsService, rbacService: RbacService);
    onModuleInit(): Promise<void>;
    private initializeSystemPermissions;
    private validateCacheIntegrity;
    private displayInitializationStats;
}
export { RbacService } from './services/rbac.service';
export { AccessRightsService } from './services/access-rights.service';
export { RolesService } from './services/roles.service';
export { PermissionsService } from './services/permissions.service';
export { PermissionsGuard, RequirePermissions, Permission } from './guards/permissions.guard';
export * from './types/access-enums';
export * from './types/shield-constants';
export * from './interfaces/rbac.interface';
export * from './dto/access-rights';
export * from './dto/roles';
export * from './dto/permissions';
export declare const SHIELD_CONFIG: {
    readonly CACHE: {
        readonly DEFAULT_TTL: 3600;
        readonly ACCESS_RIGHTS_TTL: 1800;
        readonly PERMISSIONS_TTL: 3600;
        readonly ROLES_TTL: 7200;
    };
    readonly LIMITS: {
        readonly MAX_ROLES_PER_USER: 10;
        readonly MAX_PERMISSIONS_PER_ROLE: 100;
        readonly MAX_ACCESS_RIGHTS_PER_USER: 50;
    };
    readonly AUDIT: {
        readonly ENABLED: true;
        readonly RETENTION_DAYS: 90;
        readonly BATCH_SIZE: 100;
    };
    readonly QUEUES: {
        readonly CONCURRENCY: 5;
        readonly RETRY_ATTEMPTS: 3;
        readonly RETRY_DELAY: 1000;
    };
};
export interface ShieldModuleConfig {
    cache?: {
        ttl?: number;
        access_rights_ttl?: number;
        permissions_ttl?: number;
        roles_ttl?: number;
    };
    limits?: {
        max_roles_per_user?: number;
        max_permissions_per_role?: number;
        max_access_rights_per_user?: number;
    };
    audit?: {
        enabled?: boolean;
        retention_days?: number;
        batch_size?: number;
    };
    queues?: {
        concurrency?: number;
        retry_attempts?: number;
        retry_delay?: number;
    };
}
export declare function createShieldModule(config?: ShieldModuleConfig): typeof ShieldModule;
