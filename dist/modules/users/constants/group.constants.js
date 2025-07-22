"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GROUP_CONSTANTS = void 0;
exports.GROUP_CONSTANTS = {
    TYPES: {
        FAMILY: 'FAMILY',
        FRIENDS: 'FRIENDS',
        CORPORATE: 'CORPORATE',
        ASSOCIATION: 'ASSOCIATION',
        TEMPORARY: 'TEMPORARY',
        EDUCATIONAL: 'EDUCATIONAL',
    },
    ROLES: {
        OWNER: 'OWNER',
        ADMIN: 'ADMIN',
        MANAGER: 'MANAGER',
        MEMBER: 'MEMBER',
    },
    MEMBER_STATUS: {
        ACTIVE: 'ACTIVE',
        PENDING: 'PENDING',
        SUSPENDED: 'SUSPENDED',
        LEFT: 'LEFT',
    },
    PERMISSIONS: {
        CAN_INVITE: 'canInvite',
        CAN_PURCHASE: 'canPurchase',
        CAN_VIEW_ORDERS: 'canViewOrders',
        CAN_MANAGE_MEMBERS: 'canManageMembers',
        CAN_EDIT_GROUP: 'canEditGroup',
        CAN_DELETE_GROUP: 'canDeleteGroup',
    },
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
    MEMBER_LIMITS: {
        DEFAULT_MAX: 50,
        FAMILY_MAX: 10,
        FRIENDS_MAX: 50,
        CORPORATE_MAX: 500,
        ASSOCIATION_MAX: 1000,
        TEMPORARY_MAX: 100,
        EDUCATIONAL_MAX: 200,
    },
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
    DEFAULT_PERMISSIONS: {
        OWNER: {
            canInvite: true,
            canPurchase: true,
            canViewOrders: true,
            canManageMembers: true,
            canEditGroup: true,
            canDeleteGroup: true,
            spendingLimit: null,
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
            spendingLimit: 1000,
        },
        MEMBER: {
            canInvite: false,
            canPurchase: true,
            canViewOrders: false,
            canManageMembers: false,
            canEditGroup: false,
            canDeleteGroup: false,
            spendingLimit: 500,
        },
    },
    ERRORS: {
        GROUP_NOT_FOUND: 'Groupe introuvable',
        ALREADY_MEMBER: 'Utilisateur déjà membre du groupe',
        GROUP_FULL: 'Groupe complet',
        INSUFFICIENT_PERMISSIONS: 'Permissions insuffisantes',
        CANNOT_LEAVE_AS_OWNER: 'Le propriétaire doit transférer la propriété avant de quitter',
        INVALID_ROLE: 'Rôle invalide',
        MEMBER_NOT_FOUND: 'Membre introuvable dans ce groupe',
    },
    PAGINATION: {
        DEFAULT_LIMIT: 20,
        MAX_LIMIT: 100,
    },
    SORTABLE_FIELDS: [
        'name',
        'createdAt',
        'updatedAt',
        'currentMembers',
        'type',
    ],
};
//# sourceMappingURL=group.constants.js.map