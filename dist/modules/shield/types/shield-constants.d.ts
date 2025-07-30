export declare const SHIELD_CONSTANTS: {
    readonly CACHE: {
        readonly ACCESS_RIGHTS_TTL: 1800;
        readonly PERMISSIONS_TTL: 3600;
        readonly ROLES_TTL: 7200;
        readonly USER_PERMISSIONS_TTL: 1800;
        readonly HIERARCHY_TTL: 14400;
    };
    readonly REDIS_PREFIXES: {
        readonly ACCESS_RIGHT: "access_right:";
        readonly USER_PERMISSIONS: "user_perms:";
        readonly ROLE_PERMISSIONS: "role_perms:";
        readonly ROLE_HIERARCHY: "role_hierarchy:";
        readonly ACCESS_CONTROL: "access_control:";
        readonly AUDIT_LOG: "audit_log:";
    };
    readonly LIMITS: {
        readonly MAX_ROLES_PER_USER: 10;
        readonly MAX_PERMISSIONS_PER_ROLE: 100;
        readonly MAX_ACCESS_RIGHTS_PER_USER: 50;
        readonly MAX_HIERARCHY_DEPTH: 5;
        readonly MAX_AUDIT_RETENTION_DAYS: 90;
    };
    readonly DEFAULTS: {
        readonly ACCESS_RIGHT_MAX_USES: 1;
        readonly ROLE_CACHE_TTL: 3600;
        readonly PERMISSION_CHECK_TIMEOUT: 5000;
        readonly AUDIT_BATCH_SIZE: 100;
    };
    readonly ERROR_MESSAGES: {
        readonly ACCESS_DENIED: "Accès refusé - permissions insuffisantes";
        readonly INVALID_ACCESS_RIGHT: "Droit d'accès invalide ou expiré";
        readonly ROLE_NOT_FOUND: "Rôle introuvable";
        readonly PERMISSION_NOT_FOUND: "Permission introuvable";
        readonly HIERARCHY_LOOP: "Boucle détectée dans la hiérarchie des rôles";
        readonly MAX_ROLES_EXCEEDED: "Nombre maximum de rôles par utilisateur atteint";
        readonly RESOURCE_NOT_OWNED: "Vous n'êtes pas propriétaire de cette ressource";
        readonly ACCESS_RIGHT_EXPIRED: "Ce droit d'accès a expiré";
        readonly ACCESS_RIGHT_ALREADY_USED: "Ce droit d'accès a déjà été utilisé";
        readonly INSUFFICIENT_ROLE_LEVEL: "Niveau de rôle insuffisant pour cette action";
    };
    readonly VALIDATION_PATTERNS: {
        readonly ACCESS_CODE: RegExp;
        readonly ROLE_NAME: RegExp;
        readonly PERMISSION_NAME: RegExp;
    };
    readonly QUEUES: {
        readonly ACCESS_AUDIT: "shield:access:audit";
        readonly PERMISSION_SYNC: "shield:permission:sync";
        readonly ROLE_HIERARCHY: "shield:role:hierarchy";
    };
    readonly JOBS: {
        readonly LOG_ACCESS_EVENT: "log-access-event";
        readonly SYNC_USER_PERMISSIONS: "sync-user-permissions";
        readonly UPDATE_ROLE_HIERARCHY: "update-role-hierarchy";
        readonly CLEANUP_EXPIRED_RIGHTS: "cleanup-expired-rights";
        readonly AUDIT_PERMISSION_CHANGE: "audit-permission-change";
    };
    readonly JOB_PRIORITIES: {
        readonly CRITICAL: 10;
        readonly HIGH: 5;
        readonly NORMAL: 1;
        readonly LOW: -5;
    };
    readonly LOG_LEVELS: {
        readonly SECURITY: "security";
        readonly ACCESS: "access";
        readonly AUDIT: "audit";
        readonly PERMISSION: "permission";
    };
    readonly METRICS: {
        readonly ACCESS_CHECKS_TOTAL: "shield_access_checks_total";
        readonly ACCESS_DENIED_TOTAL: "shield_access_denied_total";
        readonly PERMISSION_CHECKS_TOTAL: "shield_permission_checks_total";
        readonly ROLE_ASSIGNMENTS_TOTAL: "shield_role_assignments_total";
        readonly CACHE_HITS_TOTAL: "shield_cache_hits_total";
        readonly CACHE_MISSES_TOTAL: "shield_cache_misses_total";
    };
};
export type ShieldQueue = typeof SHIELD_CONSTANTS.QUEUES[keyof typeof SHIELD_CONSTANTS.QUEUES];
export type ShieldJob = typeof SHIELD_CONSTANTS.JOBS[keyof typeof SHIELD_CONSTANTS.JOBS];
export type ShieldMetric = typeof SHIELD_CONSTANTS.METRICS[keyof typeof SHIELD_CONSTANTS.METRICS];
