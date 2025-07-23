"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidBackupCodeException = exports.MfaChallengeExpiredException = exports.MfaAlreadySetupException = exports.UnsupportedMfaProviderException = void 0;
const common_1 = require("@nestjs/common");
class UnsupportedMfaProviderException extends common_1.BadRequestException {
    constructor(provider) {
        super({
            success: false,
            error: {
                code: 'UNSUPPORTED_MFA_PROVIDER',
                message: 'Provider MFA non supporté',
                details: `Le provider "${provider}" n'est pas supporté`,
                supportedProviders: ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP', 'BACKUP_CODE'],
                timestamp: new Date().toISOString(),
            },
        });
    }
}
exports.UnsupportedMfaProviderException = UnsupportedMfaProviderException;
class MfaAlreadySetupException extends common_1.ConflictException {
    constructor(provider) {
        super({
            success: false,
            error: {
                code: 'MFA_ALREADY_SETUP',
                message: 'MFA déjà configuré',
                details: `Le provider "${provider}" est déjà configuré pour cet utilisateur`,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
exports.MfaAlreadySetupException = MfaAlreadySetupException;
class MfaChallengeExpiredException extends common_1.UnauthorizedException {
    constructor() {
        super({
            success: false,
            error: {
                code: 'MFA_CHALLENGE_EXPIRED',
                message: 'Challenge MFA expiré',
                details: 'Veuillez demander un nouveau code',
                timestamp: new Date().toISOString(),
            },
        });
    }
}
exports.MfaChallengeExpiredException = MfaChallengeExpiredException;
class InvalidBackupCodeException extends common_1.UnauthorizedException {
    constructor() {
        super({
            success: false,
            error: {
                code: 'INVALID_BACKUP_CODE',
                message: 'Code de récupération invalide',
                details: 'Ce code a déjà été utilisé ou n\'existe pas',
                timestamp: new Date().toISOString(),
            },
        });
    }
}
exports.InvalidBackupCodeException = InvalidBackupCodeException;
//# sourceMappingURL=mfa.exceptions.js.map