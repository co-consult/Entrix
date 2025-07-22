"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnonymousUserException = void 0;
const common_1 = require("@nestjs/common");
class AnonymousUserException extends common_1.HttpException {
    constructor(type, identifier, details) {
        const messages = {
            NOT_FOUND: 'Utilisateur anonyme introuvable',
            INVALID_KEY: 'Clé d\'onboarding invalide ou inexistante',
            EXPIRED_KEY: 'Clé d\'onboarding expirée',
            ALREADY_CONVERTED: 'Cet utilisateur anonyme a déjà été converti',
            CONVERSION_FAILED: 'Échec de la conversion vers utilisateur enregistré',
            SESSION_EXPIRED: 'Session anonyme expirée',
        };
        const statusCodes = {
            NOT_FOUND: common_1.HttpStatus.NOT_FOUND,
            INVALID_KEY: common_1.HttpStatus.BAD_REQUEST,
            EXPIRED_KEY: common_1.HttpStatus.GONE,
            ALREADY_CONVERTED: common_1.HttpStatus.CONFLICT,
            CONVERSION_FAILED: common_1.HttpStatus.UNPROCESSABLE_ENTITY,
            SESSION_EXPIRED: common_1.HttpStatus.UNAUTHORIZED,
        };
        const suggestions = {
            NOT_FOUND: [
                'Vérifiez l\'ID de l\'utilisateur anonyme',
                'L\'utilisateur a peut-être déjà été supprimé',
                'Contactez le support si le problème persiste',
            ],
            INVALID_KEY: [
                'Vérifiez la clé d\'onboarding saisie',
                'La clé doit être exactement comme reçue dans l\'email',
                'Demandez un nouveau lien d\'onboarding',
            ],
            EXPIRED_KEY: [
                'Demandez une nouvelle clé d\'onboarding',
                'Contactez le support pour réactiver votre incentive',
                'Inscrivez-vous normalement sans incentive',
            ],
            ALREADY_CONVERTED: [
                'Connectez-vous avec vos identifiants existants',
                'Utilisez la fonction "Mot de passe oublié" si nécessaire',
                'Contactez le support si vous ne trouvez pas votre compte',
            ],
            CONVERSION_FAILED: [
                'Vérifiez que l\'email correspond à celui utilisé pour l\'achat anonyme',
                'Assurez-vous que tous les champs obligatoires sont remplis',
                'Réessayez avec un mot de passe différent',
                'Contactez le support si le problème persiste',
            ],
            SESSION_EXPIRED: [
                'Reconnectez-vous ou créez une nouvelle session',
                'Vos données sont conservées et peuvent être récupérées',
                'Utilisez votre clé d\'onboarding pour finaliser l\'inscription',
            ],
        };
        const errorCodes = {
            NOT_FOUND: 'ANONYMOUS_USER_NOT_FOUND',
            INVALID_KEY: 'INVALID_ONBOARDING_KEY',
            EXPIRED_KEY: 'EXPIRED_ONBOARDING_KEY',
            ALREADY_CONVERTED: 'ANONYMOUS_ALREADY_CONVERTED',
            CONVERSION_FAILED: 'ANONYMOUS_CONVERSION_FAILED',
            SESSION_EXPIRED: 'ANONYMOUS_SESSION_EXPIRED',
        };
        const errorResponse = {
            statusCode: statusCodes[type],
            error: Object.keys(common_1.HttpStatus)[Object.values(common_1.HttpStatus).indexOf(statusCodes[type])],
            message: messages[type],
            code: errorCodes[type],
            type,
            identifier,
            details,
            timestamp: new Date().toISOString(),
            suggestions: suggestions[type],
        };
        super(errorResponse, statusCodes[type]);
    }
    static notFound(anonymousUserId) {
        return new AnonymousUserException('NOT_FOUND', anonymousUserId);
    }
    static invalidKey(onboardingKey) {
        return new AnonymousUserException('INVALID_KEY', onboardingKey);
    }
    static expiredKey(onboardingKey, expiredAt) {
        return new AnonymousUserException('EXPIRED_KEY', onboardingKey, {
            expiredAt: expiredAt?.toISOString(),
            expiredDaysAgo: expiredAt ? Math.floor((Date.now() - expiredAt.getTime()) / (1000 * 60 * 60 * 24)) : undefined,
        });
    }
    static alreadyConverted(anonymousUserId, convertedUserId, convertedAt) {
        return new AnonymousUserException('ALREADY_CONVERTED', anonymousUserId, {
            convertedUserId,
            convertedAt: convertedAt?.toISOString(),
        });
    }
    static conversionFailed(anonymousUserId, errors) {
        return new AnonymousUserException('CONVERSION_FAILED', anonymousUserId, {
            errors,
            errorCount: errors.length,
        });
    }
    static sessionExpired(sessionId, expiredAt) {
        return new AnonymousUserException('SESSION_EXPIRED', sessionId, {
            expiredAt: expiredAt?.toISOString(),
            expiredMinutesAgo: expiredAt ? Math.floor((Date.now() - expiredAt.getTime()) / (1000 * 60)) : undefined,
        });
    }
}
exports.AnonymousUserException = AnonymousUserException;
//# sourceMappingURL=anonymous-user.exception.js.map