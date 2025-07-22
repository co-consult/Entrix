export declare const GROUP_CONSTANTS: {
    readonly TYPES: {
        readonly FAMILY: "FAMILY";
        readonly FRIENDS: "FRIENDS";
        readonly CORPORATE: "CORPORATE";
        readonly ASSOCIATION: "ASSOCIATION";
        readonly TEMPORARY: "TEMPORARY";
        readonly EDUCATIONAL: "EDUCATIONAL";
    };
    readonly ROLES: {
        readonly OWNER: "OWNER";
        readonly ADMIN: "ADMIN";
        readonly MANAGER: "MANAGER";
        readonly MEMBER: "MEMBER";
    };
    readonly MEMBER_STATUS: {
        readonly ACTIVE: "ACTIVE";
        readonly PENDING: "PENDING";
        readonly SUSPENDED: "SUSPENDED";
        readonly LEFT: "LEFT";
    };
    readonly PERMISSIONS: {
        readonly CAN_INVITE: "canInvite";
        readonly CAN_PURCHASE: "canPurchase";
        readonly CAN_VIEW_ORDERS: "canViewOrders";
        readonly CAN_MANAGE_MEMBERS: "canManageMembers";
        readonly CAN_EDIT_GROUP: "canEditGroup";
        readonly CAN_DELETE_GROUP: "canDeleteGroup";
    };
    readonly VALIDATION: {
        readonly NAME: {
            readonly MIN_LENGTH: 3;
            readonly MAX_LENGTH: 200;
            readonly REGEX: RegExp;
        };
        readonly DESCRIPTION: {
            readonly MAX_LENGTH: 1000;
        };
        readonly CODE: {
            readonly MIN_LENGTH: 3;
            readonly MAX_LENGTH: 100;
            readonly REGEX: RegExp;
        };
    };
    readonly MEMBER_LIMITS: {
        readonly DEFAULT_MAX: 50;
        readonly FAMILY_MAX: 10;
        readonly FRIENDS_MAX: 50;
        readonly CORPORATE_MAX: 500;
        readonly ASSOCIATION_MAX: 1000;
        readonly TEMPORARY_MAX: 100;
        readonly EDUCATIONAL_MAX: 200;
    };
    readonly DEFAULT_SETTINGS: {
        readonly FAMILY: {
            readonly isPrivate: true;
            readonly requireApproval: false;
            readonly maxMembers: 10;
            readonly allowInvites: true;
        };
        readonly FRIENDS: {
            readonly isPrivate: true;
            readonly requireApproval: false;
            readonly maxMembers: 50;
            readonly allowInvites: true;
        };
        readonly CORPORATE: {
            readonly isPrivate: false;
            readonly requireApproval: true;
            readonly maxMembers: 500;
            readonly allowInvites: false;
        };
        readonly ASSOCIATION: {
            readonly isPrivate: false;
            readonly requireApproval: true;
            readonly maxMembers: 1000;
            readonly allowInvites: false;
        };
        readonly TEMPORARY: {
            readonly isPrivate: false;
            readonly requireApproval: false;
            readonly maxMembers: 100;
            readonly allowInvites: true;
        };
        readonly EDUCATIONAL: {
            readonly isPrivate: false;
            readonly requireApproval: true;
            readonly maxMembers: 200;
            readonly allowInvites: false;
        };
    };
    readonly DEFAULT_PERMISSIONS: {
        readonly OWNER: {
            readonly canInvite: true;
            readonly canPurchase: true;
            readonly canViewOrders: true;
            readonly canManageMembers: true;
            readonly canEditGroup: true;
            readonly canDeleteGroup: true;
            readonly spendingLimit: any;
        };
        readonly ADMIN: {
            readonly canInvite: true;
            readonly canPurchase: true;
            readonly canViewOrders: true;
            readonly canManageMembers: true;
            readonly canEditGroup: true;
            readonly canDeleteGroup: false;
            readonly spendingLimit: any;
        };
        readonly MANAGER: {
            readonly canInvite: true;
            readonly canPurchase: true;
            readonly canViewOrders: true;
            readonly canManageMembers: false;
            readonly canEditGroup: false;
            readonly canDeleteGroup: false;
            readonly spendingLimit: 1000;
        };
        readonly MEMBER: {
            readonly canInvite: false;
            readonly canPurchase: true;
            readonly canViewOrders: false;
            readonly canManageMembers: false;
            readonly canEditGroup: false;
            readonly canDeleteGroup: false;
            readonly spendingLimit: 500;
        };
    };
    readonly ERRORS: {
        readonly GROUP_NOT_FOUND: "Groupe introuvable";
        readonly ALREADY_MEMBER: "Utilisateur déjà membre du groupe";
        readonly GROUP_FULL: "Groupe complet";
        readonly INSUFFICIENT_PERMISSIONS: "Permissions insuffisantes";
        readonly CANNOT_LEAVE_AS_OWNER: "Le propriétaire doit transférer la propriété avant de quitter";
        readonly INVALID_ROLE: "Rôle invalide";
        readonly MEMBER_NOT_FOUND: "Membre introuvable dans ce groupe";
    };
    readonly PAGINATION: {
        readonly DEFAULT_LIMIT: 20;
        readonly MAX_LIMIT: 100;
    };
    readonly SORTABLE_FIELDS: readonly ["name", "createdAt", "updatedAt", "currentMembers", "type"];
};
export type GroupType = typeof GROUP_CONSTANTS.TYPES[keyof typeof GROUP_CONSTANTS.TYPES];
export type GroupRole = typeof GROUP_CONSTANTS.ROLES[keyof typeof GROUP_CONSTANTS.ROLES];
export type MemberStatus = typeof GROUP_CONSTANTS.MEMBER_STATUS[keyof typeof GROUP_CONSTANTS.MEMBER_STATUS];
export type GroupPermission = typeof GROUP_CONSTANTS.PERMISSIONS[keyof typeof GROUP_CONSTANTS.PERMISSIONS];
export type SortableGroupField = typeof GROUP_CONSTANTS.SORTABLE_FIELDS[number];
