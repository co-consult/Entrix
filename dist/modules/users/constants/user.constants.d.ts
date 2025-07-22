export declare const USER_CONSTANTS: {
    readonly VALIDATION: {
        readonly FIRST_NAME: {
            readonly MIN_LENGTH: 2;
            readonly MAX_LENGTH: 100;
        };
        readonly LAST_NAME: {
            readonly MIN_LENGTH: 2;
            readonly MAX_LENGTH: 100;
        };
        readonly EMAIL: {
            readonly MAX_LENGTH: 255;
            readonly REGEX: RegExp;
        };
        readonly PHONE: {
            readonly MAX_LENGTH: 20;
            readonly REGEX: RegExp;
        };
        readonly PASSWORD: {
            readonly MIN_LENGTH: 8;
            readonly MAX_LENGTH: 128;
            readonly REQUIRE_UPPERCASE: true;
            readonly REQUIRE_LOWERCASE: true;
            readonly REQUIRE_NUMBERS: true;
            readonly REQUIRE_SYMBOLS: true;
        };
    };
    readonly STATUS: {
        readonly ACTIVE: "ACTIVE";
        readonly INACTIVE: "INACTIVE";
        readonly SUSPENDED: "SUSPENDED";
        readonly PENDING_VERIFICATION: "PENDING_VERIFICATION";
    };
    readonly SEARCH: {
        readonly DEFAULT_LIMIT: 20;
        readonly MAX_LIMIT: 100;
        readonly MIN_QUERY_LENGTH: 2;
    };
    readonly SESSION: {
        readonly DEFAULT_EXPIRES_HOURS: 24;
        readonly REMEMBER_ME_EXPIRES_DAYS: 30;
        readonly MAX_CONCURRENT_SESSIONS: 5;
    };
    readonly LOGIN_ATTEMPTS: {
        readonly MAX_ATTEMPTS: 5;
        readonly LOCKOUT_DURATION_MINUTES: 15;
        readonly RESET_WINDOW_MINUTES: 60;
    };
    readonly AVATAR: {
        readonly MAX_SIZE_MB: 5;
        readonly ALLOWED_FORMATS: readonly ["jpg", "jpeg", "png", "webp"];
        readonly DEFAULT_SIZES: readonly [50, 100, 200, 400];
    };
    readonly ERRORS: {
        readonly USER_NOT_FOUND: "Utilisateur introuvable";
        readonly EMAIL_ALREADY_EXISTS: "Cette adresse email est déjà utilisée";
        readonly PHONE_ALREADY_EXISTS: "Ce numéro de téléphone est déjà utilisé";
        readonly INVALID_CREDENTIALS: "Identifiants invalides";
        readonly ACCOUNT_SUSPENDED: "Compte suspendu";
        readonly EMAIL_NOT_VERIFIED: "Email non vérifié";
        readonly TOO_MANY_ATTEMPTS: "Trop de tentatives de connexion";
    };
    readonly PAGINATION: {
        readonly DEFAULT_PAGE: 1;
        readonly DEFAULT_LIMIT: 20;
        readonly MAX_LIMIT: 100;
    };
    readonly SORTABLE_FIELDS: readonly ["createdAt", "updatedAt", "firstName", "lastName", "email", "lastLogin"];
    readonly DEFAULT_INCLUDES: {
        readonly BASIC: readonly [];
        readonly WITH_PROFILE: readonly ["profile"];
        readonly WITH_GROUPS: readonly ["userGroups"];
        readonly FULL: readonly ["profile", "userGroups", "userRoles"];
    };
};
export type UserStatus = typeof USER_CONSTANTS.STATUS[keyof typeof USER_CONSTANTS.STATUS];
export type SortableUserField = typeof USER_CONSTANTS.SORTABLE_FIELDS[number];
