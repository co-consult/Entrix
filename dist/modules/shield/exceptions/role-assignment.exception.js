"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleConflictException = exports.RoleAssignmentException = void 0;
const common_1 = require("@nestjs/common");
class RoleAssignmentException extends common_1.BadRequestException {
    reason;
    details;
    constructor(reason, details) {
        super({
            error: 'ROLE_ASSIGNMENT_ERROR',
            message: reason,
            details,
            timestamp: new Date().toISOString(),
        });
        this.reason = reason;
        this.details = details;
    }
    static maxRolesExceeded(userId, maxLimit, currentCount) {
        return new RoleAssignmentException(`Limite de rôles atteinte (${currentCount}/${maxLimit})`, {
            user_id: userId,
            max_roles_limit: maxLimit,
            additional_info: { current_roles_count: currentCount },
        });
    }
    static roleAlreadyAssigned(userId, roleId, roleName) {
        return new RoleAssignmentException(`Le rôle '${roleName}' est déjà assigné à cet utilisateur`, {
            user_id: userId,
            role_id: roleId,
            role_name: roleName,
        });
    }
    static systemRoleProtected(roleId, roleName) {
        return new RoleAssignmentException(`Le rôle système '${roleName}' ne peut pas être modifié`, {
            role_id: roleId,
            role_name: roleName,
            additional_info: { is_system_role: true },
        });
    }
}
exports.RoleAssignmentException = RoleAssignmentException;
class RoleConflictException extends common_1.ConflictException {
    conflictType;
    reason;
    details;
    constructor(conflictType, reason, details) {
        super({
            error: 'ROLE_CONFLICT',
            conflict_type: conflictType,
            message: reason,
            details,
            timestamp: new Date().toISOString(),
        });
        this.conflictType = conflictType;
        this.reason = reason;
        this.details = details;
    }
    static hierarchyConflict(parentRole, childRole) {
        return new RoleConflictException('HIERARCHY', `Conflit hiérarchique entre les rôles '${parentRole}' et '${childRole}'`, {
            parent_role: parentRole,
            child_role: childRole,
        });
    }
    static scopeConflict(roleScope, requiredScope) {
        return new RoleConflictException('SCOPE', `Conflit de portée: le rôle a la portée '${roleScope}' mais '${requiredScope}' est requis`, {
            role_scope: roleScope,
            required_scope: requiredScope,
        });
    }
}
exports.RoleConflictException = RoleConflictException;
//# sourceMappingURL=role-assignment.exception.js.map