"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsufficientPermissionsException = void 0;
const common_1 = require("@nestjs/common");
class InsufficientPermissionsException extends common_1.ForbiddenException {
    missingPermissions;
    context;
    constructor(missingPermissions, context) {
        super({
            error: 'INSUFFICIENT_PERMISSIONS',
            message: `Permissions manquantes: ${missingPermissions.join(', ')}`,
            missing_permissions: missingPermissions,
            context,
            timestamp: new Date().toISOString(),
        });
        this.missingPermissions = missingPermissions;
        this.context = context;
    }
    static conditionsNotMet(userId, permission, failedConditions) {
        return new InsufficientPermissionsException([permission], {
            user_id: userId,
            conditions_failed: failedConditions,
        });
    }
    static multiplePermissionsMissing(userId, missingPermissions, currentPermissions) {
        return new InsufficientPermissionsException(missingPermissions, {
            user_id: userId,
            current_permissions: currentPermissions,
        });
    }
}
exports.InsufficientPermissionsException = InsufficientPermissionsException;
//# sourceMappingURL=insufficient-permissions.exception.js.map