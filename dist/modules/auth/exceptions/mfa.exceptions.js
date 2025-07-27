"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MfaDeviceNotTrustedException = exports.MfaBackupCodesExhaustedException = exports.MfaSetupIncompleteException = exports.MfaProviderNotSupportedException = exports.MfaRateLimitException = exports.MfaCodeInvalidException = exports.MfaAlreadyConfiguredException = exports.MfaNotConfiguredException = exports.MfaChallengeExpiredException = void 0;
const common_1 = require("@nestjs/common");
class MfaChallengeExpiredException extends common_1.HttpException {
    constructor() {
        super({
            message: 'Challenge MFA expiré. Veuillez recommencer l\'authentification.',
            error: 'MFA_CHALLENGE_EXPIRED',
            statusCode: common_1.HttpStatus.PRECONDITION_REQUIRED
        }, common_1.HttpStatus.PRECONDITION_REQUIRED);
    }
}
exports.MfaChallengeExpiredException = MfaChallengeExpiredException;
class MfaNotConfiguredException extends common_1.HttpException {
    constructor(provider) {
        const message = provider
            ? `Méthode MFA ${provider} non configurée pour cet utilisateur`
            : 'Aucune méthode MFA configurée pour cet utilisateur';
        super({
            message,
            error: 'MFA_NOT_CONFIGURED',
            statusCode: common_1.HttpStatus.PRECONDITION_REQUIRED,
            provider
        }, common_1.HttpStatus.PRECONDITION_REQUIRED);
    }
}
exports.MfaNotConfiguredException = MfaNotConfiguredException;
class MfaAlreadyConfiguredException extends common_1.HttpException {
    constructor(provider) {
        super({
            message: `Méthode MFA ${provider} déjà configurée pour cet utilisateur`,
            error: 'MFA_ALREADY_CONFIGURED',
            statusCode: common_1.HttpStatus.CONFLICT,
            provider
        }, common_1.HttpStatus.CONFLICT);
    }
}
exports.MfaAlreadyConfiguredException = MfaAlreadyConfiguredException;
class MfaCodeInvalidException extends common_1.HttpException {
    constructor() {
        super({
            message: 'Code MFA invalide ou expiré',
            error: 'MFA_CODE_INVALID',
            statusCode: common_1.HttpStatus.UNAUTHORIZED
        }, common_1.HttpStatus.UNAUTHORIZED);
    }
}
exports.MfaCodeInvalidException = MfaCodeInvalidException;
class MfaRateLimitException extends common_1.HttpException {
    constructor(remainingTime) {
        super({
            message: `Trop de tentatives MFA. Réessayez dans ${Math.ceil(remainingTime / 60)} minutes.`,
            error: 'MFA_RATE_LIMITED',
            statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
            remainingTime
        }, common_1.HttpStatus.TOO_MANY_REQUESTS);
    }
}
exports.MfaRateLimitException = MfaRateLimitException;
class MfaProviderNotSupportedException extends common_1.HttpException {
    constructor(provider) {
        super({
            message: `Provider MFA non supporté: ${provider}`,
            error: 'MFA_PROVIDER_NOT_SUPPORTED',
            statusCode: common_1.HttpStatus.BAD_REQUEST,
            provider
        }, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.MfaProviderNotSupportedException = MfaProviderNotSupportedException;
class MfaSetupIncompleteException extends common_1.HttpException {
    constructor(provider) {
        super({
            message: `Configuration MFA ${provider} incomplète. Veuillez finaliser le setup.`,
            error: 'MFA_SETUP_INCOMPLETE',
            statusCode: common_1.HttpStatus.PRECONDITION_REQUIRED,
            provider
        }, common_1.HttpStatus.PRECONDITION_REQUIRED);
    }
}
exports.MfaSetupIncompleteException = MfaSetupIncompleteException;
class MfaBackupCodesExhaustedException extends common_1.HttpException {
    constructor() {
        super({
            message: 'Tous les codes de récupération ont été utilisés. Configurez une nouvelle méthode MFA.',
            error: 'MFA_BACKUP_CODES_EXHAUSTED',
            statusCode: common_1.HttpStatus.PRECONDITION_REQUIRED
        }, common_1.HttpStatus.PRECONDITION_REQUIRED);
    }
}
exports.MfaBackupCodesExhaustedException = MfaBackupCodesExhaustedException;
class MfaDeviceNotTrustedException extends common_1.HttpException {
    constructor() {
        super({
            message: 'Appareil non reconnu. Authentification MFA requise.',
            error: 'MFA_DEVICE_NOT_TRUSTED',
            statusCode: common_1.HttpStatus.PRECONDITION_REQUIRED
        }, common_1.HttpStatus.PRECONDITION_REQUIRED);
    }
}
exports.MfaDeviceNotTrustedException = MfaDeviceNotTrustedException;
//# sourceMappingURL=mfa.exceptions.js.map