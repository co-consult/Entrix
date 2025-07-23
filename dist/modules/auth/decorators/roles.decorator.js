"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModeratorOrAdmin = exports.SuperAdminOnly = exports.OrganizerOnly = exports.AdminOnly = exports.RequireAllPermissions = exports.RequireAllRoles = exports.Permissions = exports.Roles = exports.REQUIRE_ALL_PERMISSIONS_KEY = exports.REQUIRE_ALL_ROLES_KEY = exports.PERMISSIONS_KEY = exports.ROLES_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.ROLES_KEY = 'roles';
exports.PERMISSIONS_KEY = 'permissions';
exports.REQUIRE_ALL_ROLES_KEY = 'requireAllRoles';
exports.REQUIRE_ALL_PERMISSIONS_KEY = 'requireAllPermissions';
const Roles = (...roles) => (0, common_1.SetMetadata)(exports.ROLES_KEY, roles);
exports.Roles = Roles;
const Permissions = (...permissions) => (0, common_1.SetMetadata)(exports.PERMISSIONS_KEY, permissions);
exports.Permissions = Permissions;
const RequireAllRoles = (...roles) => {
    (0, common_1.SetMetadata)(exports.ROLES_KEY, roles);
    (0, common_1.SetMetadata)(exports.REQUIRE_ALL_ROLES_KEY, true);
};
exports.RequireAllRoles = RequireAllRoles;
const RequireAllPermissions = (...permissions) => {
    (0, common_1.SetMetadata)(exports.PERMISSIONS_KEY, permissions);
    (0, common_1.SetMetadata)(exports.REQUIRE_ALL_PERMISSIONS_KEY, true);
};
exports.RequireAllPermissions = RequireAllPermissions;
const AdminOnly = () => (0, common_1.SetMetadata)(exports.ROLES_KEY, ['admin']);
exports.AdminOnly = AdminOnly;
const OrganizerOnly = () => (0, common_1.SetMetadata)(exports.ROLES_KEY, ['organizer']);
exports.OrganizerOnly = OrganizerOnly;
const SuperAdminOnly = () => (0, common_1.SetMetadata)(exports.ROLES_KEY, ['super_admin']);
exports.SuperAdminOnly = SuperAdminOnly;
const ModeratorOrAdmin = () => (0, common_1.SetMetadata)(exports.ROLES_KEY, ['moderator', 'admin']);
exports.ModeratorOrAdmin = ModeratorOrAdmin;
//# sourceMappingURL=roles.decorator.js.map