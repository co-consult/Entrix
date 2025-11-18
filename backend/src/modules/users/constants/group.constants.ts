// src/modules/users/constants/group.constants.ts

export const GROUP_CONSTANTS = {
    // Types de groupes selon le schema
    TYPES: {
      FAMILY: 'FAMILY',
      FRIENDS: 'FRIENDS', 
      CORPORATE: 'CORPORATE',
      ASSOCIATION: 'ASSOCIATION',
      TEMPORARY: 'TEMPORARY',
      EDUCATIONAL: 'EDUCATIONAL',
    } as const,
  
    // Rôles dans les groupes
    ROLES: {
      OWNER: 'OWNER',
      ADMIN: 'ADMIN',
      MANAGER: 'MANAGER',
      MEMBER: 'MEMBER',
    } as const,
  
    // Statuts de membre
    MEMBER_STATUS: {
      ACTIVE: 'ACTIVE',
      PENDING: 'PENDING',
      SUSPENDED: 'SUSPENDED',
      LEFT: 'LEFT',
    } as const,
  
    // Permissions dans les groupes
    PERMISSIONS: {
      CAN_INVITE: 'canInvite',
      CAN_PURCHASE: 'canPurchase',
      CAN_VIEW_ORDERS: 'canViewOrders',
      CAN_MANAGE_MEMBERS: 'canManageMembers',
      CAN_EDIT_GROUP: 'canEditGroup',
      CAN_DELETE_GROUP: 'canDeleteGroup',
    } as const,
  
    // Limites de validation
    VALIDATION: {
      NAME: {
        MIN_LENGTH: 3,
        MAX_LENGTH: 200,
        REGEX: /^[a-zA-Z0-9À-ÿ\s'-]+$/,
      },
      DESCRIPTION: {
        MAX_LENGTH: 1000,
      },
      CODE: {
        MIN_LENGTH: 3,
        MAX_LENGTH: 100,
        REGEX: /^[A-Z0-9_-]+$/,
      },
    },
  
    // Limites de membres
    MEMBER_LIMITS: {
      DEFAULT_MAX: 50,
      FAMILY_MAX: 10,
      FRIENDS_MAX: 50,
      CORPORATE_MAX: 500,
      ASSOCIATION_MAX: 1000,
      TEMPORARY_MAX: 100,
      EDUCATIONAL_MAX: 200,
    },
  
    // Configuration par défaut selon le type
    DEFAULT_SETTINGS: {
      FAMILY: {
        isPrivate: true,
        requireApproval: false,
        maxMembers: 10,
        allowInvites: true,
      },
      FRIENDS: {
        isPrivate: true,
        requireApproval: false,
        maxMembers: 50,
        allowInvites: true,
      },
      CORPORATE: {
        isPrivate: false,
        requireApproval: true,
        maxMembers: 500,
        allowInvites: false,
      },
      ASSOCIATION: {
        isPrivate: false,
        requireApproval: true,
        maxMembers: 1000,
        allowInvites: false,
      },
      TEMPORARY: {
        isPrivate: false,
        requireApproval: false,
        maxMembers: 100,
        allowInvites: true,
      },
      EDUCATIONAL: {
        isPrivate: false,
        requireApproval: true,
        maxMembers: 200,
        allowInvites: false,
      },
    },
  
    // Permissions par défaut selon le rôle
    DEFAULT_PERMISSIONS: {
      OWNER: {
        canInvite: true,
        canPurchase: true,
        canViewOrders: true,
        canManageMembers: true,
        canEditGroup: true,
        canDeleteGroup: true,
        spendingLimit: null, // Illimité
      },
      ADMIN: {
        canInvite: true,
        canPurchase: true,
        canViewOrders: true,
        canManageMembers: true,
        canEditGroup: true,
        canDeleteGroup: false,
        spendingLimit: null,
      },
      MANAGER: {
        canInvite: true,
        canPurchase: true,
        canViewOrders: true,
        canManageMembers: false,
        canEditGroup: false,
        canDeleteGroup: false,
        spendingLimit: 1000, // TND
      },
      MEMBER: {
        canInvite: false,
        canPurchase: true,
        canViewOrders: false,
        canManageMembers: false,
        canEditGroup: false,
        canDeleteGroup: false,
        spendingLimit: 500, // TND
      },
    },
  
    // Messages d'erreur
    ERRORS: {
      GROUP_NOT_FOUND: 'Groupe introuvable',
      ALREADY_MEMBER: 'Utilisateur déjà membre du groupe',
      GROUP_FULL: 'Groupe complet',
      INSUFFICIENT_PERMISSIONS: 'Permissions insuffisantes',
      CANNOT_LEAVE_AS_OWNER: 'Le propriétaire doit transférer la propriété avant de quitter',
      INVALID_ROLE: 'Rôle invalide',
      MEMBER_NOT_FOUND: 'Membre introuvable dans ce groupe',
    },
  
    // Paramètres de pagination
    PAGINATION: {
      DEFAULT_LIMIT: 20,
      MAX_LIMIT: 100,
    },
  
    // Champs de tri autorisés
    SORTABLE_FIELDS: [
      'name',
      'createdAt',
      'updatedAt',
      'currentMembers',
      'type',
    ] as const,
  } as const;
  
  export type GroupType = typeof GROUP_CONSTANTS.TYPES[keyof typeof GROUP_CONSTANTS.TYPES];
  export type GroupRole = typeof GROUP_CONSTANTS.ROLES[keyof typeof GROUP_CONSTANTS.ROLES];
  export type MemberStatus = typeof GROUP_CONSTANTS.MEMBER_STATUS[keyof typeof GROUP_CONSTANTS.MEMBER_STATUS];
  export type GroupPermission = typeof GROUP_CONSTANTS.PERMISSIONS[keyof typeof GROUP_CONSTANTS.PERMISSIONS];
  export type SortableGroupField = typeof GROUP_CONSTANTS.SORTABLE_FIELDS[number];