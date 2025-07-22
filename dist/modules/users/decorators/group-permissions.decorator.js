"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isActiveMembership = exports.canManageMember = exports.getDefaultPermissionsForRole = exports.hasMinimumRole = exports.GroupSpendingLimit = exports.IsGroupAdmin = exports.IsGroupOwner = exports.HasGroupPermission = exports.GroupPermissions = exports.GroupRole = exports.GroupMembership = exports.RequireGroupOwner = exports.RequireGroupRole = exports.RequireGroupPermissions = exports.GROUP_PERMISSIONS_KEY = exports.DEFAULT_ROLE_PERMISSIONS = void 0;
const common_1 = require("@nestjs/common");
exports.DEFAULT_ROLE_PERMISSIONS = {
    OWNER: [
        'canInvite',
        'canPurchase',
        'canViewOrders',
        'canManageMembers',
        'canEditGroup',
        'canDeleteGroup',
        'canViewFinances',
        'canApproveJoins'
    ],
    ADMIN: [
        'canInvite',
        'canPurchase',
        'canViewOrders',
        'canManageMembers',
        'canEditGroup',
        'canViewFinances',
        'canApproveJoins'
    ],
    MANAGER: [
        'canInvite',
        'canPurchase',
        'canViewOrders',
        'canViewFinances'
    ],
    MEMBER: [
        'canPurchase'
    ]
};
exports.GROUP_PERMISSIONS_KEY = 'group_permissions';
const RequireGroupPermissions = (permissions, minimumRole) => {
    return (0, common_1.SetMetadata)(exports.GROUP_PERMISSIONS_KEY, { permissions, minimumRole });
};
exports.RequireGroupPermissions = RequireGroupPermissions;
const RequireGroupRole = (minimumRole) => {
    return (0, common_1.SetMetadata)(exports.GROUP_PERMISSIONS_KEY, { minimumRole, permissions: [] });
};
exports.RequireGroupRole = RequireGroupRole;
const RequireGroupOwner = () => {
    return (0, exports.RequireGroupRole)('OWNER');
};
exports.RequireGroupOwner = RequireGroupOwner;
exports.GroupMembership = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const membership = request.groupMembership;
    if (!membership) {
        return null;
    }
    if (data) {
        return membership[data];
    }
    return membership;
});
exports.GroupRole = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const membership = request.groupMembership;
    return membership?.role || null;
});
exports.GroupPermissions = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const membership = request.groupMembership;
    return membership?.permissions || [];
});
const HasGroupPermission = (permission) => (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const membership = request.groupMembership;
    const permissions = membership?.permissions || [];
    return permissions.includes(permission);
});
exports.HasGroupPermission = HasGroupPermission;
exports.IsGroupOwner = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const membership = request.groupMembership;
    return membership?.role === 'OWNER';
});
exports.IsGroupAdmin = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const membership = request.groupMembership;
    const role = membership?.role;
    return role === 'OWNER' || role === 'ADMIN';
});
exports.GroupSpendingLimit = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const membership = request.groupMembership;
    return membership?.spendingLimit || null;
});
function hasMinimumRole(userRole, minimumRole) {
    const roleHierarchy = {
        MEMBER: 1,
        MANAGER: 2,
        ADMIN: 3,
        OWNER: 4
    };
    return roleHierarchy[userRole] >= roleHierarchy[minimumRole];
}
exports.hasMinimumRole = hasMinimumRole;
function getDefaultPermissionsForRole(role) {
    return exports.DEFAULT_ROLE_PERMISSIONS[role] || [];
}
exports.getDefaultPermissionsForRole = getDefaultPermissionsForRole;
function canManageMember(managerRole, targetRole) {
    if (managerRole === 'OWNER')
        return true;
    if (managerRole === 'ADMIN') {
        return targetRole === 'MANAGER' || targetRole === 'MEMBER';
    }
    if (managerRole === 'MANAGER') {
        return targetRole === 'MEMBER';
    }
    return false;
}
exports.canManageMember = canManageMember;
function isActiveMembership(membership) {
    if (membership.status !== 'ACTIVE')
        return false;
    if (!membership.isActive)
        return false;
    if (membership.validUntil && membership.validUntil < new Date())
        return false;
    return true;
}
exports.isActiveMembership = isActiveMembership;
//# sourceMappingURL=group-permissions.decorator.js.map