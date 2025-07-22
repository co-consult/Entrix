// src/modules/users/constants/user.constants.ts

export const USER_CONSTANTS = {
    // Limites de validation
    VALIDATION: {
      FIRST_NAME: {
        MIN_LENGTH: 2,
        MAX_LENGTH: 100,
      },
      LAST_NAME: {
        MIN_LENGTH: 2,
        MAX_LENGTH: 100,
      },
      EMAIL: {
        MAX_LENGTH: 255,
        REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      },
      PHONE: {
        MAX_LENGTH: 20,
        REGEX: /^[+]?[1-9][0-9]{7,14}$/,
      },
      PASSWORD: {
        MIN_LENGTH: 8,
        MAX_LENGTH: 128,
        REQUIRE_UPPERCASE: true,
        REQUIRE_LOWERCASE: true,
        REQUIRE_NUMBERS: true,
        REQUIRE_SYMBOLS: true,
      },
    },
  
    // Statuts utilisateur
    STATUS: {
      ACTIVE: 'ACTIVE',
      INACTIVE: 'INACTIVE',
      SUSPENDED: 'SUSPENDED',
      PENDING_VERIFICATION: 'PENDING_VERIFICATION',
    } as const,
  
    // Paramètres de recherche
    SEARCH: {
      DEFAULT_LIMIT: 20,
      MAX_LIMIT: 100,
      MIN_QUERY_LENGTH: 2,
    },
  
    // Configuration sessions
    SESSION: {
      DEFAULT_EXPIRES_HOURS: 24,
      REMEMBER_ME_EXPIRES_DAYS: 30,
      MAX_CONCURRENT_SESSIONS: 5,
    },
  
    // Tentatives de connexion
    LOGIN_ATTEMPTS: {
      MAX_ATTEMPTS: 5,
      LOCKOUT_DURATION_MINUTES: 15,
      RESET_WINDOW_MINUTES: 60,
    },
  
    // Configuration avatar
    AVATAR: {
      MAX_SIZE_MB: 5,
      ALLOWED_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
      DEFAULT_SIZES: [50, 100, 200, 400],
    },
  
    // Messages d'erreur
    ERRORS: {
      USER_NOT_FOUND: 'Utilisateur introuvable',
      EMAIL_ALREADY_EXISTS: 'Cette adresse email est déjà utilisée',
      PHONE_ALREADY_EXISTS: 'Ce numéro de téléphone est déjà utilisé',
      INVALID_CREDENTIALS: 'Identifiants invalides',
      ACCOUNT_SUSPENDED: 'Compte suspendu',
      EMAIL_NOT_VERIFIED: 'Email non vérifié',
      TOO_MANY_ATTEMPTS: 'Trop de tentatives de connexion',
    },
  
    // Configuration pagination par défaut
    PAGINATION: {
      DEFAULT_PAGE: 1,
      DEFAULT_LIMIT: 20,
      MAX_LIMIT: 100,
    },
  
    // Champs de tri autorisés
    SORTABLE_FIELDS: [
      'createdAt',
      'updatedAt', 
      'firstName',
      'lastName',
      'email',
      'lastLogin',
    ] as const,
  
    // Incluables par défaut
    DEFAULT_INCLUDES: {
      BASIC: [],
      WITH_PROFILE: ['profile'],
      WITH_GROUPS: ['userGroups'],
      FULL: ['profile', 'userGroups', 'userRoles'],
    },
  } as const;
  
  export type UserStatus = typeof USER_CONSTANTS.STATUS[keyof typeof USER_CONSTANTS.STATUS];
  export type SortableUserField = typeof USER_CONSTANTS.SORTABLE_FIELDS[number];