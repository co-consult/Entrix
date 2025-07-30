"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractShieldErrorContext = exports.isShieldException = exports.RateLimitExceededException = exports.SecurityViolationException = exports.RoleConflictException = exports.RoleAssignmentException = exports.PermissionNotFoundException = exports.RoleNotFoundException = exports.InvalidAccessRightException = exports.InsufficientPermissionsException = exports.AccessDeniedException = void 0;
var access_denied_exception_1 = require("./access-denied.exception");
Object.defineProperty(exports, "AccessDeniedException", { enumerable: true, get: function () { return access_denied_exception_1.AccessDeniedException; } });
var insufficient_permissions_exception_1 = require("./insufficient-permissions.exception");
Object.defineProperty(exports, "InsufficientPermissionsException", { enumerable: true, get: function () { return insufficient_permissions_exception_1.InsufficientPermissionsException; } });
var invalid_access_right_exception_1 = require("./invalid-access-right.exception");
Object.defineProperty(exports, "InvalidAccessRightException", { enumerable: true, get: function () { return invalid_access_right_exception_1.InvalidAccessRightException; } });
var role_not_found_exception_1 = require("./role-not-found.exception");
Object.defineProperty(exports, "RoleNotFoundException", { enumerable: true, get: function () { return role_not_found_exception_1.RoleNotFoundException; } });
var permission_not_found_exception_1 = require("./permission-not-found.exception");
Object.defineProperty(exports, "PermissionNotFoundException", { enumerable: true, get: function () { return permission_not_found_exception_1.PermissionNotFoundException; } });
var role_assignment_exception_1 = require("./role-assignment.exception");
Object.defineProperty(exports, "RoleAssignmentException", { enumerable: true, get: function () { return role_assignment_exception_1.RoleAssignmentException; } });
Object.defineProperty(exports, "RoleConflictException", { enumerable: true, get: function () { return role_assignment_exception_1.RoleConflictException; } });
var security_violation_exception_1 = require("./security-violation.exception");
Object.defineProperty(exports, "SecurityViolationException", { enumerable: true, get: function () { return security_violation_exception_1.SecurityViolationException; } });
var rate_limit_exceeded_exception_1 = require("./rate-limit-exceeded.exception");
Object.defineProperty(exports, "RateLimitExceededException", { enumerable: true, get: function () { return rate_limit_exceeded_exception_1.RateLimitExceededException; } });
function isShieldException(error) {
    return error instanceof AccessDeniedException ||
        error instanceof InsufficientPermissionsException ||
        error instanceof InvalidAccessRightException ||
        error instanceof RoleNotFoundException ||
        error instanceof PermissionNotFoundException ||
        error instanceof RoleAssignmentException ||
        error instanceof RoleConflictException ||
        error instanceof SecurityViolationException ||
        error instanceof RateLimitExceededException;
}
exports.isShieldException = isShieldException;
function extractShieldErrorContext(error) {
    if (error instanceof AccessDeniedException) {
        return error.context;
    }
    if (error instanceof InsufficientPermissionsException) {
        return error.context;
    }
    if (error instanceof InvalidAccessRightException) {
        return { access_code: error.accessCode, details: error.details };
    }
    if (error instanceof SecurityViolationException) {
        return error.securityContext;
    }
    if (error instanceof RateLimitExceededException) {
        return error.details;
    }
    return null;
}
exports.extractShieldErrorContext = extractShieldErrorContext;
//# sourceMappingURL=index.js.map