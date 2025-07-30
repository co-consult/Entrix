"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidAccessRightException = void 0;
const common_1 = require("@nestjs/common");
const access_enums_1 = require("../types/access-enums");
class InvalidAccessRightException extends common_1.BadRequestException {
    accessCode;
    reason;
    details;
    constructor(accessCode, reason, details) {
        super({
            error: 'INVALID_ACCESS_RIGHT',
            message: reason,
            access_code: accessCode,
            details,
            timestamp: new Date().toISOString(),
        });
        this.accessCode = accessCode;
        this.reason = reason;
        this.details = details;
    }
    static expired(accessCode, validUntil) {
        return new InvalidAccessRightException(accessCode, 'Ce droit d\'accès a expiré', {
            valid_until: validUntil,
        });
    }
    static alreadyUsed(accessCode, maxUses, currentUses) {
        return new InvalidAccessRightException(accessCode, 'Ce droit d\'accès a été utilisé le nombre maximum de fois', {
            max_uses: maxUses,
            current_uses: currentUses,
        });
    }
    static suspended(accessCode, reason) {
        return new InvalidAccessRightException(accessCode, 'Ce droit d\'accès a été suspendu', {
            current_status: access_enums_1.AccessRightStatus.SUSPENDED,
            additional_info: { suspension_reason: reason },
        });
    }
    static notYetValid(accessCode, validFrom) {
        return new InvalidAccessRightException(accessCode, 'Ce droit d\'accès n\'est pas encore valide', {
            valid_from: validFrom,
        });
    }
    static notFound(accessCode) {
        return new InvalidAccessRightException(accessCode, 'Code d\'accès invalide ou introuvable');
    }
}
exports.InvalidAccessRightException = InvalidAccessRightException;
//# sourceMappingURL=invalid-access-right.exception.js.map