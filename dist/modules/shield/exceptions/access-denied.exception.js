"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessDeniedException = void 0;
const common_1 = require("@nestjs/common");
class AccessDeniedException extends common_1.ForbiddenException {
    reason;
    context;
    constructor(reason, context) {
        super({
            error: 'ACCESS_DENIED',
            message: reason,
            context,
            timestamp: new Date().toISOString(),
        });
        this.reason = reason;
        this.context = context;
    }
    static insufficientPermissions(userId, requiredPermission, resourceType, resourceId) {
        return new AccessDeniedException(`Permission '${requiredPermission}' requise pour accéder à cette ressource`, {
            user_id: userId,
            resource_type: resourceType,
            resource_id: resourceId,
            required_permission: requiredPermission,
        });
    }
    static insufficientRole(userId, requiredRoles, userRoles) {
        return new AccessDeniedException(`Rôles insuffisants. Requis: ${requiredRoles.join(' ou ')}`, {
            user_id: userId,
            additional_info: {
                required_roles: requiredRoles,
                user_roles: userRoles,
            }
        });
    }
    static notResourceOwner(userId, resourceType, resourceId) {
        return new AccessDeniedException('Vous n\'êtes pas propriétaire de cette ressource', {
            user_id: userId,
            resource_type: resourceType,
            resource_id: resourceId,
        });
    }
}
exports.AccessDeniedException = AccessDeniedException;
//# sourceMappingURL=access-denied.exception.js.map