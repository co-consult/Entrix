"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHIELD_CONSTANTS = void 0;
exports.SHIELD_CONSTANTS = {
    CACHE: {
        ACCESS_RIGHTS_TTL: 1800,
        PERMISSIONS_TTL: 3600,
        ROLES_TTL: 7200,
        USER_PERMISSIONS_TTL: 1800,
        HIERARCHY_TTL: 14400,
    },
    REDIS_PREFIXES: {
        ACCESS_RIGHT: 'access_right:',
        USER_PERMISSIONS: 'user_perms:',
        ROLE_PERMISSIONS: 'role_perms:',
        ROLE_HIERARCHY: 'role_hierarchy:',
        ACCESS_CONTROL: 'access_control:',
        AUDIT_LOG: 'audit_log:',
    },
    LIMITS: {
        MAX_ROLES_PER_USER: 10,
        MAX_PERMISSIONS_PER_ROLE: 100,
        MAX_ACCESS_RIGHTS_PER_USER: 50,
        MAX_HIERARCHY_DEPTH: 5,
        MAX_AUDIT_RETENTION_DAYS: 90,
    },
    DEFAULTS: {
        ACCESS_RIGHT_MAX_USES: 1,
        ROLE_CACHE_TTL: 3600,
        PERMISSION_CHECK_TIMEOUT: 5000,
        AUDIT_BATCH_SIZE: 100,
    },
    ERROR_MESSAGES: {
        ACCESS_DENIED: 'Accès refusé - permissions insuffisantes',
        INVALID_ACCESS_RIGHT: 'Droit d\'accès invalide ou expiré',
        ROLE_NOT_FOUND: 'Rôle introuvable',
        PERMISSION_NOT_FOUND: 'Permission introuvable',
        HIERARCHY_LOOP: 'Boucle détectée dans la hiérarchie des rôles',
        MAX_ROLES_EXCEEDED: 'Nombre maximum de rôles par utilisateur atteint',
        RESOURCE_NOT_OWNED: 'Vous n\'êtes pas propriétaire de cette ressource',
        ACCESS_RIGHT_EXPIRED: 'Ce droit d\'accès a expiré',
        ACCESS_RIGHT_ALREADY_USED: 'Ce droit d\'accès a déjà été utilisé',
        INSUFFICIENT_ROLE_LEVEL: 'Niveau de rôle insuffisant pour cette action',
    },
    VALIDATION_PATTERNS: {
        ACCESS_CODE: /^[A-Z0-9]{8,20}$/,
        ROLE_NAME: /^[a-z_][a-z0-9_]*$/,
        PERMISSION_NAME: /^[a-z_][a-z0-9_:]*$/,
    },
    QUEUES: {
        ACCESS_AUDIT: 'shield:access:audit',
        PERMISSION_SYNC: 'shield:permission:sync',
        ROLE_HIERARCHY: 'shield:role:hierarchy',
    },
    JOBS: {
        LOG_ACCESS_EVENT: 'log-access-event',
        SYNC_USER_PERMISSIONS: 'sync-user-permissions',
        UPDATE_ROLE_HIERARCHY: 'update-role-hierarchy',
        CLEANUP_EXPIRED_RIGHTS: 'cleanup-expired-rights',
        AUDIT_PERMISSION_CHANGE: 'audit-permission-change',
    },
    JOB_PRIORITIES: {
        CRITICAL: 10,
        HIGH: 5,
        NORMAL: 1,
        LOW: -5,
    },
    LOG_LEVELS: {
        SECURITY: 'security',
        ACCESS: 'access',
        AUDIT: 'audit',
        PERMISSION: 'permission',
    },
    METRICS: {
        ACCESS_CHECKS_TOTAL: 'shield_access_checks_total',
        ACCESS_DENIED_TOTAL: 'shield_access_denied_total',
        PERMISSION_CHECKS_TOTAL: 'shield_permission_checks_total',
        ROLE_ASSIGNMENTS_TOTAL: 'shield_role_assignments_total',
        CACHE_HITS_TOTAL: 'shield_cache_hits_total',
        CACHE_MISSES_TOTAL: 'shield_cache_misses_total',
    },
};
//# sourceMappingURL=shield-constants.js.map