"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityViolationException = void 0;
const common_1 = require("@nestjs/common");
class SecurityViolationException extends common_1.ForbiddenException {
    violationType;
    reason;
    securityContext;
    constructor(violationType, reason, securityContext) {
        super({
            error: 'SECURITY_VIOLATION',
            violation_type: violationType,
            message: reason,
            security_context: securityContext,
            timestamp: new Date().toISOString(),
            requires_investigation: true,
        });
        this.violationType = violationType;
        this.reason = reason;
        this.securityContext = securityContext;
    }
    static privilegeEscalation(userId, attemptedAction, currentRole, requiredRole) {
        return new SecurityViolationException('PRIVILEGE_ESCALATION', 'Tentative d\'escalade de privilèges détectée', {
            user_id: userId,
            attempted_action: attemptedAction,
            threat_level: 'HIGH',
            additional_info: {
                current_role: currentRole,
                required_role: requiredRole,
            },
        });
    }
    static suspiciousIPAccess(userId, ipAddress, reason) {
        return new SecurityViolationException('SUSPICIOUS_IP_ACCESS', `Accès depuis IP suspecte: ${reason}`, {
            user_id: userId,
            ip_address: ipAddress,
            threat_level: 'MEDIUM',
            additional_info: { reason },
        });
    }
    static repeatedUnauthorizedAttempts(ipAddress, attemptCount, timeWindow) {
        return new SecurityViolationException('REPEATED_UNAUTHORIZED_ATTEMPTS', `${attemptCount} tentatives d'accès non autorisées en ${timeWindow}`, {
            ip_address: ipAddress,
            threat_level: attemptCount > 10 ? 'CRITICAL' : 'HIGH',
            additional_info: {
                attempt_count: attemptCount,
                time_window: timeWindow,
            },
        });
    }
    static tokenManipulation(userId, manipulationType) {
        return new SecurityViolationException('TOKEN_MANIPULATION', 'Tentative de manipulation de token détectée', {
            user_id: userId,
            threat_level: 'CRITICAL',
            additional_info: {
                manipulation_type: manipulationType,
            },
        });
    }
}
exports.SecurityViolationException = SecurityViolationException;
//# sourceMappingURL=security-violation.exception.js.map