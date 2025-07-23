export declare const ERROR_CONSTANTS: {
    readonly AUTH_ERRORS: {
        readonly INVALID_CREDENTIALS: {
            readonly code: "INVALID_CREDENTIALS";
            readonly httpStatus: 401;
            readonly message: "Email ou mot de passe incorrect";
            readonly details: "Vérifiez vos identifiants et réessayez";
        };
        readonly ACCOUNT_LOCKED: {
            readonly code: "ACCOUNT_LOCKED";
            readonly httpStatus: 423;
            readonly message: "Compte verrouillé pour sécurité";
            readonly details: "Contactez le support pour débloquer votre compte";
        };
        readonly EMAIL_NOT_VERIFIED: {
            readonly code: "EMAIL_NOT_VERIFIED";
            readonly httpStatus: 403;
            readonly message: "Email non vérifié";
            readonly details: "Vérifiez votre boîte email et cliquez sur le lien de confirmation";
        };
        readonly MFA_REQUIRED: {
            readonly code: "MFA_REQUIRED";
            readonly httpStatus: 428;
            readonly message: "Authentification multifacteur requise";
            readonly details: "Complétez la vérification en deux étapes";
        };
        readonly INVALID_MFA_CODE: {
            readonly code: "INVALID_MFA_CODE";
            readonly httpStatus: 401;
            readonly message: "Code MFA incorrect";
            readonly details: "Vérifiez le code et réessayez";
        };
        readonly DEVICE_NOT_TRUSTED: {
            readonly code: "DEVICE_NOT_TRUSTED";
            readonly httpStatus: 428;
            readonly message: "Appareil non reconnu";
            readonly details: "Vérifiez votre email pour autoriser cet appareil";
        };
        readonly SESSION_EXPIRED: {
            readonly code: "SESSION_EXPIRED";
            readonly httpStatus: 401;
            readonly message: "Session expirée";
            readonly details: "Reconnectez-vous pour continuer";
        };
        readonly INVALID_REFRESH_TOKEN: {
            readonly code: "INVALID_REFRESH_TOKEN";
            readonly httpStatus: 401;
            readonly message: "Token de rafraîchissement invalide";
            readonly details: "Reconnectez-vous pour obtenir un nouveau token";
        };
        readonly RATE_LIMITED: {
            readonly code: "RATE_LIMITED";
            readonly httpStatus: 429;
            readonly message: "Trop de tentatives";
            readonly details: "Patientez avant de réessayer";
        };
        readonly WEAK_PASSWORD: {
            readonly code: "WEAK_PASSWORD";
            readonly httpStatus: 400;
            readonly message: "Mot de passe trop faible";
            readonly details: "Le mot de passe doit contenir au moins 8 caractères avec majuscules, minuscules, chiffres et symboles";
        };
        readonly EMAIL_ALREADY_EXISTS: {
            readonly code: "EMAIL_ALREADY_EXISTS";
            readonly httpStatus: 409;
            readonly message: "Un compte avec cet email existe déjà";
            readonly details: "Utilisez un autre email ou connectez-vous";
        };
        readonly INVALID_RESET_TOKEN: {
            readonly code: "INVALID_RESET_TOKEN";
            readonly httpStatus: 400;
            readonly message: "Token de réinitialisation invalide ou expiré";
            readonly details: "Demandez un nouveau lien de réinitialisation";
        };
    };
};
