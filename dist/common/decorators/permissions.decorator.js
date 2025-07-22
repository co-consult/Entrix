"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPermissionsConfig = exports.OptionalAuth = exports.PublicResource = exports.BypassPermissions = exports.ConditionalPermissions = exports.SuperAdminOnly = exports.AdminOnly = exports.AnyPermission = exports.OwnResource = exports.Permissions = exports.PERMISSIONS_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.PERMISSIONS_KEY = 'permissions';
function Permissions(...args) {
    if (args.length === 1 && typeof args[0] === 'object' && 'permissions' in args[0]) {
        const config = args[0];
        const finalConfig = {
            permissions: config.permissions,
            operator: config.operator || 'AND',
            own: config.own || false,
            ownField: config.ownField || 'userId',
            conditional: config.conditional || [],
            allowSuperAdmin: config.allowSuperAdmin !== false,
            errorMessage: config.errorMessage || 'Permissions insuffisantes',
        };
        return (0, common_1.SetMetadata)(exports.PERMISSIONS_KEY, finalConfig);
    }
    const permissions = args;
    const config = {
        permissions,
        operator: 'AND',
        own: false,
        ownField: 'userId',
        conditional: [],
        allowSuperAdmin: true,
        errorMessage: 'Permissions insuffisantes',
    };
    return (0, common_1.SetMetadata)(exports.PERMISSIONS_KEY, config);
}
exports.Permissions = Permissions;
const OwnResource = (permissions, ownField = 'userId') => {
    return Permissions({
        permissions: Array.isArray(permissions) ? permissions : [permissions],
        own: true,
        ownField,
    });
};
exports.OwnResource = OwnResource;
const AnyPermission = (...permissions) => {
    return Permissions({
        permissions,
        operator: 'OR',
    });
};
exports.AnyPermission = AnyPermission;
const AdminOnly = (includeOrganizerAdmin = false) => {
    const permissions = ['system.settings.manage'];
    if (includeOrganizerAdmin) {
        permissions.push('organizers.manage.own');
    }
    return Permissions({
        permissions,
        operator: 'OR',
    });
};
exports.AdminOnly = AdminOnly;
const SuperAdminOnly = () => {
    return Permissions({
        permissions: ['system.settings.manage'],
        allowSuperAdmin: true,
        errorMessage: 'Accès réservé aux super administrateurs',
    });
};
exports.SuperAdminOnly = SuperAdminOnly;
const ConditionalPermissions = (basePermissions, conditionalPermissions) => {
    return Permissions({
        permissions: basePermissions,
        conditional: conditionalPermissions,
    });
};
exports.ConditionalPermissions = ConditionalPermissions;
const BypassPermissions = () => {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('BypassPermissions ne peut pas être utilisé en production');
    }
    return (0, common_1.SetMetadata)(exports.PERMISSIONS_KEY, null);
};
exports.BypassPermissions = BypassPermissions;
const PublicResource = () => {
    return (0, common_1.SetMetadata)(exports.PERMISSIONS_KEY, 'public');
};
exports.PublicResource = PublicResource;
const OptionalAuth = (...permissions) => {
    return (0, common_1.SetMetadata)(exports.PERMISSIONS_KEY, {
        permissions,
        optional: true,
    });
};
exports.OptionalAuth = OptionalAuth;
function getPermissionsConfig(target, propertyKey) {
    const { Reflector } = require('@nestjs/core');
    const reflector = new Reflector();
    if (propertyKey) {
        const methodPermissions = reflector.get(exports.PERMISSIONS_KEY, target[propertyKey]);
        if (methodPermissions !== undefined) {
            return methodPermissions;
        }
    }
    const classPermissions = reflector.get(exports.PERMISSIONS_KEY, target);
    return classPermissions || null;
}
exports.getPermissionsConfig = getPermissionsConfig;
//# sourceMappingURL=permissions.decorator.js.map