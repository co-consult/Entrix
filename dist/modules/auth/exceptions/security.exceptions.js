"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoneypotTriggeredException = exports.BotDetectedException = exports.SuspiciousConcurrentAccessException = exports.CompromisedSessionException = exports.AttackPatternException = exports.VelocityAnomalyException = exports.SuspiciousDeviceException = exports.UnauthorizedLocationException = exports.BlockedIpException = exports.SuspiciousActivityException = void 0;
const common_1 = require("@nestjs/common");
class SuspiciousActivityException extends common_1.ForbiddenException {
    constructor(riskScore, factors) {
        super({
            success: false,
            error: {
                code: 'SUSPICIOUS_ACTIVITY',
                message: 'Activité suspecte détectée',
                details: 'Votre compte a été temporairement protégé',
                riskScore,
                factors,
                contactSupport: true,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
exports.SuspiciousActivityException = SuspiciousActivityException;
class BlockedIpException extends common_1.ForbiddenException {
    constructor(ip, reason) {
        super({
            success: false,
            error: {
                code: 'BLOCKED_IP',
                message: 'Adresse IP bloquée',
                details: `L'adresse IP ${ip} a été bloquée: ${reason}`,
                contactSupport: true,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
exports.BlockedIpException = BlockedIpException;
class UnauthorizedLocationException extends common_1.ForbiddenException {
    constructor(country) {
        super({
            success: false,
            error: {
                code: 'UNAUTHORIZED_LOCATION',
                message: 'Localisation non autorisée',
                details: `L'accès depuis ${country} n'est pas autorisé`,
                verification: 'email',
                timestamp: new Date().toISOString(),
            },
        });
    }
}
exports.UnauthorizedLocationException = UnauthorizedLocationException;
class SuspiciousDeviceException extends common_1.ForbiddenException {
    constructor(deviceFingerprint, reason) {
        super({
            success: false,
            error: {
                code: 'SUSPICIOUS_DEVICE',
                message: 'Appareil suspect détecté',
                details: `Appareil ${deviceFingerprint.substring(0, 8)}... signalé: ${reason}`,
                requiresVerification: true,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
exports.SuspiciousDeviceException = SuspiciousDeviceException;
class VelocityAnomalyException extends common_1.ForbiddenException {
    constructor(previousLocation, currentLocation, timeSpan) {
        super({
            success: false,
            error: {
                code: 'VELOCITY_ANOMALY',
                message: 'Déplacement géographique impossible',
                details: `Connexion de ${previousLocation} vers ${currentLocation} en ${timeSpan} minutes est physiquement impossible`,
                requiresVerification: true,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
exports.VelocityAnomalyException = VelocityAnomalyException;
class AttackPatternException extends common_1.ForbiddenException {
    constructor(patternType, confidence) {
        super({
            success: false,
            error: {
                code: 'ATTACK_PATTERN_DETECTED',
                message: 'Pattern d\'attaque détecté',
                details: `Pattern ${patternType} détecté avec ${confidence}% de confiance`,
                blocked: true,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
exports.AttackPatternException = AttackPatternException;
class CompromisedSessionException extends common_1.UnauthorizedException {
    constructor(sessionId, reason) {
        super({
            success: false,
            error: {
                code: 'COMPROMISED_SESSION',
                message: 'Session compromise détectée',
                details: `Session ${sessionId.substring(0, 8)}... compromise: ${reason}`,
                forceLogout: true,
                changePasswordRequired: true,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
exports.CompromisedSessionException = CompromisedSessionException;
class SuspiciousConcurrentAccessException extends common_1.ForbiddenException {
    constructor(sessionCount, ipAddresses) {
        super({
            success: false,
            error: {
                code: 'SUSPICIOUS_CONCURRENT_ACCESS',
                message: 'Accès concurrent suspect',
                details: `${sessionCount} sessions simultanées depuis ${ipAddresses.length} IPs différentes`,
                activeIpAddresses: ipAddresses.map(ip => `${ip.substring(0, 7)}...`),
                requiresVerification: true,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
exports.SuspiciousConcurrentAccessException = SuspiciousConcurrentAccessException;
class BotDetectedException extends common_1.ForbiddenException {
    constructor(detectionMethod, confidence) {
        super({
            success: false,
            error: {
                code: 'BOT_DETECTED',
                message: 'Automation détectée',
                details: `Bot détecté via ${detectionMethod} (confiance: ${confidence}%)`,
                requiresCaptcha: true,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
exports.BotDetectedException = BotDetectedException;
class HoneypotTriggeredException extends common_1.ForbiddenException {
    constructor(honeypotType) {
        super({
            success: false,
            error: {
                code: 'HONEYPOT_TRIGGERED',
                message: 'Tentative d\'accès non autorisé',
                details: `Honeypot ${honeypotType} déclenché`,
                blocked: true,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
exports.HoneypotTriggeredException = HoneypotTriggeredException;
//# sourceMappingURL=security.exceptions.js.map