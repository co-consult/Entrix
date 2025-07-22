export declare enum DtoVerificationTypeEnum {
    EMAIL = "email",
    PHONE = "phone",
    IDENTITY = "identity",
    ADDRESS = "address"
}
export declare enum DtoDeliveryMethodEnum {
    EMAIL = "email",
    SMS = "sms",
    CALL = "call",
    PUSH = "push"
}
export declare enum DtoSecurityLevelEnum {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum DtoAuthenticationTypeEnum {
    PASSWORD = "password",
    MFA = "mfa",
    BIOMETRIC = "biometric",
    TOKEN = "token",
    SOCIAL = "social"
}
export declare enum DtoSessionStatusEnum {
    ACTIVE = "active",
    EXPIRED = "expired",
    TERMINATED = "terminated",
    SUSPENDED = "suspended"
}
export declare enum DtoSecurityEventTypeEnum {
    LOGIN_SUCCESS = "login_success",
    LOGIN_FAILED = "login_failed",
    LOGOUT = "logout",
    PASSWORD_CHANGED = "password_changed",
    MFA_ENABLED = "mfa_enabled",
    MFA_DISABLED = "mfa_disabled",
    SUSPICIOUS_ACTIVITY = "suspicious_activity",
    ACCOUNT_LOCKED = "account_locked",
    SESSION_TERMINATED = "session_terminated"
}
export interface DtoBaseResponse {
    success: boolean;
    message: string;
    timestamp: string;
}
export interface DtoDataResponse<T> extends DtoBaseResponse {
    data: T;
}
export interface DtoErrorResponse extends DtoBaseResponse {
    error: {
        code: string;
        details?: any;
        field?: string;
    };
}
export interface DtoPaginatedResponse<T> extends DtoBaseResponse {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface DtoRequestMetadata {
    ipAddress: string;
    userAgent?: string;
    deviceFingerprint?: string;
    geolocation?: {
        country?: string;
        region?: string;
        city?: string;
        coordinates?: {
            latitude: number;
            longitude: number;
        };
    };
    timestamp: Date;
}
export interface DtoSecurityInfo {
    riskScore: number;
    threatLevel: DtoSecurityLevelEnum;
    isSuspicious: boolean;
    requiresAdditionalVerification: boolean;
    restrictions?: {
        type: string;
        reason: string;
        expiresAt?: Date;
    }[];
}
export interface DtoSecurityPolicyConfig {
    minPasswordLength: number;
    requireSpecialChars: boolean;
    requireUppercase: boolean;
    requireNumbers: boolean;
    maxLoginAttempts: number;
    lockoutDuration: number;
    sessionTimeout: number;
    requireMFA: boolean;
    allowedCountries?: string[];
}
export interface DtoValidationOptions {
    skipEmailValidation?: boolean;
    skipPhoneValidation?: boolean;
    allowWeakPasswords?: boolean;
    bypassRateLimit?: boolean;
}
export interface DtoAuthContext {
    userId?: string;
    sessionId?: string;
    ipAddress: string;
    userAgent?: string;
    timestamp: Date;
    securityLevel: DtoSecurityLevelEnum;
}
export type DtoVerificationType = keyof typeof DtoVerificationTypeEnum;
export type DtoDeliveryMethod = keyof typeof DtoDeliveryMethodEnum;
export type DtoSecurityLevel = keyof typeof DtoSecurityLevelEnum;
export type DtoAuthenticationType = keyof typeof DtoAuthenticationTypeEnum;
export type DtoSessionStatus = keyof typeof DtoSessionStatusEnum;
export type DtoSecurityEventType = keyof typeof DtoSecurityEventTypeEnum;
export type DtoTransformToLowercase<T> = T extends string ? Lowercase<T> : T;
export type DtoTransformToUppercase<T> = T extends string ? Uppercase<T> : T;
export type DtoConditionalRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DtoConditionalOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type DtoCreateType<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type DtoUpdateType<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;
export type DtoResponseType<T> = T & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
};
export declare const DTO_DEFAULT_CONFIG: {
    readonly pagination: {
        readonly defaultPage: 1;
        readonly defaultLimit: 20;
        readonly maxLimit: 100;
    };
    readonly validation: {
        readonly minPasswordLength: 8;
        readonly maxPasswordLength: 128;
        readonly emailMaxLength: 255;
        readonly phoneMaxLength: 20;
    };
    readonly security: {
        readonly maxLoginAttempts: 5;
        readonly lockoutDuration: 900;
        readonly tokenExpiry: 900;
        readonly refreshTokenExpiry: 604800;
    };
};
export declare const DTO_ERROR_MESSAGES: {
    readonly INVALID_EMAIL: "Adresse email invalide";
    readonly INVALID_PHONE: "Numéro de téléphone invalide";
    readonly WEAK_PASSWORD: "Mot de passe trop faible";
    readonly PASSWORDS_DONT_MATCH: "Les mots de passe ne correspondent pas";
    readonly REQUIRED_FIELD: "Ce champ est requis";
    readonly INVALID_TOKEN: "Token invalide ou expiré";
    readonly RATE_LIMIT_EXCEEDED: "Trop de tentatives, réessayez plus tard";
    readonly UNAUTHORIZED: "Accès non autorisé";
    readonly FORBIDDEN: "Accès interdit";
    readonly NOT_FOUND: "Ressource non trouvée";
    readonly INTERNAL_ERROR: "Erreur interne du serveur";
};
export declare const DTO_CUSTOM_STATUS_CODES: {
    readonly MFA_REQUIRED: 240;
    readonly EMAIL_VERIFICATION_REQUIRED: 241;
    readonly PHONE_VERIFICATION_REQUIRED: 242;
    readonly PASSWORD_CHANGE_REQUIRED: 243;
    readonly ACCOUNT_SUSPENDED: 244;
};
