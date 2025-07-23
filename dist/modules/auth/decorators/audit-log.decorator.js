"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditAccess = exports.AuditSecurity = exports.AuditCritical = exports.AuditLog = exports.AUDIT_LEVEL_KEY = exports.AUDIT_LOG_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.AUDIT_LOG_KEY = 'auditLog';
exports.AUDIT_LEVEL_KEY = 'auditLevel';
const AuditLog = (config) => (0, common_1.SetMetadata)(exports.AUDIT_LOG_KEY, config);
exports.AuditLog = AuditLog;
const AuditCritical = (action) => (0, common_1.SetMetadata)(exports.AUDIT_LOG_KEY, {
    action,
    level: 'critical',
    includeBody: true,
    includeResponse: false,
    sensitiveFields: ['password', 'token', 'code']
});
exports.AuditCritical = AuditCritical;
const AuditSecurity = (action) => (0, common_1.SetMetadata)(exports.AUDIT_LOG_KEY, {
    action,
    level: 'warn',
    includeBody: false,
    includeResponse: false,
});
exports.AuditSecurity = AuditSecurity;
const AuditAccess = (action) => (0, common_1.SetMetadata)(exports.AUDIT_LOG_KEY, {
    action,
    level: 'info',
    includeBody: false,
    includeResponse: false,
});
exports.AuditAccess = AuditAccess;
//# sourceMappingURL=audit-log.decorator.js.map