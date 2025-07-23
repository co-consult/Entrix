"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_CONSTANTS = void 0;
exports.ERROR_CONSTANTS = {
    AUTH_ERRORS: {
        INVALID_CREDENTIALS: {
            code: 'INVALID_CREDENTIALS',
            httpStatus: 401,
            message: 'Email ou mot de passe incorrect',
            details: 'Vérifiez vos identifiants et réessayez',
        },
        ACCOUNT_LOCKED: {
            code: 'ACCOUNT_LOCKED',
            httpStatus: 423,
            message: 'Compte verrouillé pour sécurité',
            details: 'Contactez le support pour débloquer votre compte',
        },
        EMAIL_NOT_VERIFIED: {
            code: 'EMAIL_NOT_VERIFIED',
            httpStatus: 403,
            message: 'Email non vérifié',
            details: 'Vérifiez votre boîte email et cliquez sur le lien de confirmation',
        },
        MFA_REQUIRED: {
            code: 'MFA_REQUIRED',
            httpStatus: 428,
            message: 'Authentification multifacteur requise',
            details: 'Complétez la vérification en deux étapes',
        },
        INVALID_MFA_CODE: {
            code: 'INVALID_MFA_CODE',
            httpStatus: 401,
            message: 'Code MFA incorrect',
            details: 'Vérifiez le code et réessayez',
        },
        DEVICE_NOT_TRUSTED: {
            code: 'DEVICE_NOT_TRUSTED',
            httpStatus: 428,
            message: 'Appareil non reconnu',
            details: 'Vérifiez votre email pour autoriser cet appareil',
        },
        SESSION_EXPIRED: {
            code: 'SESSION_EXPIRED',
            httpStatus: 401,
            message: 'Session expirée',
            details: 'Reconnectez-vous pour continuer',
        },
        INVALID_REFRESH_TOKEN: {
            code: 'INVALID_REFRESH_TOKEN',
            httpStatus: 401,
            message: 'Token de rafraîchissement invalide',
            details: 'Reconnectez-vous pour obtenir un nouveau token',
        },
        RATE_LIMITED: {
            code: 'RATE_LIMITED',
            httpStatus: 429,
            message: 'Trop de tentatives',
            details: 'Patientez avant de réessayer',
        },
        WEAK_PASSWORD: {
            code: 'WEAK_PASSWORD',
            httpStatus: 400,
            message: 'Mot de passe trop faible',
            details: 'Le mot de passe doit contenir au moins 8 caractères avec majuscules, minuscules, chiffres et symboles',
        },
        EMAIL_ALREADY_EXISTS: {
            code: 'EMAIL_ALREADY_EXISTS',
            httpStatus: 409,
            message: 'Un compte avec cet email existe déjà',
            details: 'Utilisez un autre email ou connectez-vous',
        },
        INVALID_RESET_TOKEN: {
            code: 'INVALID_RESET_TOKEN',
            httpStatus: 400,
            message: 'Token de réinitialisation invalide ou expiré',
            details: 'Demandez un nouveau lien de réinitialisation',
        },
    },
};
//# sourceMappingURL=error.constants.js.map