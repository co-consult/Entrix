"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DTO_CUSTOM_STATUS_CODES = exports.DTO_ERROR_MESSAGES = exports.DTO_DEFAULT_CONFIG = exports.DtoSecurityEventTypeEnum = exports.DtoSessionStatusEnum = exports.DtoAuthenticationTypeEnum = exports.DtoSecurityLevelEnum = exports.DtoDeliveryMethodEnum = exports.DtoVerificationTypeEnum = void 0;
var DtoVerificationTypeEnum;
(function (DtoVerificationTypeEnum) {
    DtoVerificationTypeEnum["EMAIL"] = "email";
    DtoVerificationTypeEnum["PHONE"] = "phone";
    DtoVerificationTypeEnum["IDENTITY"] = "identity";
    DtoVerificationTypeEnum["ADDRESS"] = "address";
})(DtoVerificationTypeEnum || (exports.DtoVerificationTypeEnum = DtoVerificationTypeEnum = {}));
var DtoDeliveryMethodEnum;
(function (DtoDeliveryMethodEnum) {
    DtoDeliveryMethodEnum["EMAIL"] = "email";
    DtoDeliveryMethodEnum["SMS"] = "sms";
    DtoDeliveryMethodEnum["CALL"] = "call";
    DtoDeliveryMethodEnum["PUSH"] = "push";
})(DtoDeliveryMethodEnum || (exports.DtoDeliveryMethodEnum = DtoDeliveryMethodEnum = {}));
var DtoSecurityLevelEnum;
(function (DtoSecurityLevelEnum) {
    DtoSecurityLevelEnum["LOW"] = "low";
    DtoSecurityLevelEnum["MEDIUM"] = "medium";
    DtoSecurityLevelEnum["HIGH"] = "high";
    DtoSecurityLevelEnum["CRITICAL"] = "critical";
})(DtoSecurityLevelEnum || (exports.DtoSecurityLevelEnum = DtoSecurityLevelEnum = {}));
var DtoAuthenticationTypeEnum;
(function (DtoAuthenticationTypeEnum) {
    DtoAuthenticationTypeEnum["PASSWORD"] = "password";
    DtoAuthenticationTypeEnum["MFA"] = "mfa";
    DtoAuthenticationTypeEnum["BIOMETRIC"] = "biometric";
    DtoAuthenticationTypeEnum["TOKEN"] = "token";
    DtoAuthenticationTypeEnum["SOCIAL"] = "social";
})(DtoAuthenticationTypeEnum || (exports.DtoAuthenticationTypeEnum = DtoAuthenticationTypeEnum = {}));
var DtoSessionStatusEnum;
(function (DtoSessionStatusEnum) {
    DtoSessionStatusEnum["ACTIVE"] = "active";
    DtoSessionStatusEnum["EXPIRED"] = "expired";
    DtoSessionStatusEnum["TERMINATED"] = "terminated";
    DtoSessionStatusEnum["SUSPENDED"] = "suspended";
})(DtoSessionStatusEnum || (exports.DtoSessionStatusEnum = DtoSessionStatusEnum = {}));
var DtoSecurityEventTypeEnum;
(function (DtoSecurityEventTypeEnum) {
    DtoSecurityEventTypeEnum["LOGIN_SUCCESS"] = "login_success";
    DtoSecurityEventTypeEnum["LOGIN_FAILED"] = "login_failed";
    DtoSecurityEventTypeEnum["LOGOUT"] = "logout";
    DtoSecurityEventTypeEnum["PASSWORD_CHANGED"] = "password_changed";
    DtoSecurityEventTypeEnum["MFA_ENABLED"] = "mfa_enabled";
    DtoSecurityEventTypeEnum["MFA_DISABLED"] = "mfa_disabled";
    DtoSecurityEventTypeEnum["SUSPICIOUS_ACTIVITY"] = "suspicious_activity";
    DtoSecurityEventTypeEnum["ACCOUNT_LOCKED"] = "account_locked";
    DtoSecurityEventTypeEnum["SESSION_TERMINATED"] = "session_terminated";
})(DtoSecurityEventTypeEnum || (exports.DtoSecurityEventTypeEnum = DtoSecurityEventTypeEnum = {}));
exports.DTO_DEFAULT_CONFIG = {
    pagination: {
        defaultPage: 1,
        defaultLimit: 20,
        maxLimit: 100,
    },
    validation: {
        minPasswordLength: 8,
        maxPasswordLength: 128,
        emailMaxLength: 255,
        phoneMaxLength: 20,
    },
    security: {
        maxLoginAttempts: 5,
        lockoutDuration: 900,
        tokenExpiry: 900,
        refreshTokenExpiry: 604800,
    },
};
exports.DTO_ERROR_MESSAGES = {
    INVALID_EMAIL: 'Adresse email invalide',
    INVALID_PHONE: 'Numéro de téléphone invalide',
    WEAK_PASSWORD: 'Mot de passe trop faible',
    PASSWORDS_DONT_MATCH: 'Les mots de passe ne correspondent pas',
    REQUIRED_FIELD: 'Ce champ est requis',
    INVALID_TOKEN: 'Token invalide ou expiré',
    RATE_LIMIT_EXCEEDED: 'Trop de tentatives, réessayez plus tard',
    UNAUTHORIZED: 'Accès non autorisé',
    FORBIDDEN: 'Accès interdit',
    NOT_FOUND: 'Ressource non trouvée',
    INTERNAL_ERROR: 'Erreur interne du serveur',
};
exports.DTO_CUSTOM_STATUS_CODES = {
    MFA_REQUIRED: 240,
    EMAIL_VERIFICATION_REQUIRED: 241,
    PHONE_VERIFICATION_REQUIRED: 242,
    PASSWORD_CHANGE_REQUIRED: 243,
    ACCOUNT_SUSPENDED: 244,
};
//# sourceMappingURL=auth.types.js.map