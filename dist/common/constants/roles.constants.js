"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssignableRoles = exports.canAssignRole = exports.END_USER_ROLES = exports.VENUE_ROLES = exports.ORGANIZER_ROLES = exports.ADMIN_ROLES = exports.ROLE_HIERARCHY = exports.SYSTEM_ROLES = exports.ROLE_CODES = void 0;
const permissions_constants_1 = require("./permissions.constants");
exports.ROLE_CODES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    ORGANIZER_ADMIN: 'ORGANIZER_ADMIN',
    ORGANIZER_MANAGER: 'ORGANIZER_MANAGER',
    VENUE_ADMIN: 'VENUE_ADMIN',
    VENUE_MANAGER: 'VENUE_MANAGER',
    SECURITY_MANAGER: 'SECURITY_MANAGER',
    SUPPORT_AGENT: 'SUPPORT_AGENT',
    VALIDATOR: 'VALIDATOR',
    STAFF: 'STAFF',
    VIP_GOLD: 'VIP_GOLD',
    SUBSCRIBER: 'SUBSCRIBER',
    USER: 'USER',
};
exports.SYSTEM_ROLES = {
    [exports.ROLE_CODES.SUPER_ADMIN]: {
        code: exports.ROLE_CODES.SUPER_ADMIN,
        name: 'Super Administrateur',
        description: 'Accès complet au système - Administration totale',
        level: 100,
        isActive: true,
        permissions: [
            ...Object.values(permissions_constants_1.USER_PERMISSIONS),
            ...Object.values(permissions_constants_1.ROLE_PERMISSIONS),
            ...Object.values(permissions_constants_1.AUTH_PERMISSIONS),
            ...Object.values(permissions_constants_1.ORGANIZER_PERMISSIONS),
            ...Object.values(permissions_constants_1.EVENT_PERMISSIONS),
            ...Object.values(permissions_constants_1.TICKETING_PERMISSIONS),
            ...Object.values(permissions_constants_1.VENUE_PERMISSIONS),
            ...Object.values(permissions_constants_1.FINANCE_PERMISSIONS),
            ...Object.values(permissions_constants_1.SYSTEM_PERMISSIONS),
        ],
    },
    [exports.ROLE_CODES.ADMIN]: {
        code: exports.ROLE_CODES.ADMIN,
        name: 'Administrateur',
        description: 'Administration de la plateforme - Gestion utilisateurs et organisateurs',
        level: 90,
        isActive: true,
        permissions: [
            ...Object.values(permissions_constants_1.USER_PERMISSIONS),
            permissions_constants_1.ROLE_PERMISSIONS.READ,
            permissions_constants_1.ROLE_PERMISSIONS.UPDATE,
            permissions_constants_1.ROLE_PERMISSIONS.VIEW_PERMISSIONS,
            permissions_constants_1.ROLE_PERMISSIONS.ASSIGN_TO_USERS,
            permissions_constants_1.ROLE_PERMISSIONS.READ_GROUP,
            permissions_constants_1.ROLE_PERMISSIONS.UPDATE_GROUP,
            permissions_constants_1.ROLE_PERMISSIONS.MANAGE_GROUP_MEMBERS,
            ...Object.values(permissions_constants_1.AUTH_PERMISSIONS),
            ...Object.values(permissions_constants_1.ORGANIZER_PERMISSIONS),
            permissions_constants_1.EVENT_PERMISSIONS.READ,
            permissions_constants_1.EVENT_PERMISSIONS.UPDATE,
            permissions_constants_1.EVENT_PERMISSIONS.CANCEL,
            permissions_constants_1.EVENT_PERMISSIONS.POSTPONE,
            permissions_constants_1.VENUE_PERMISSIONS.READ,
            permissions_constants_1.VENUE_PERMISSIONS.UPDATE,
            permissions_constants_1.FINANCE_PERMISSIONS.VIEW_PAYMENTS,
            permissions_constants_1.FINANCE_PERMISSIONS.VIEW_COMMISSIONS,
            permissions_constants_1.FINANCE_PERMISSIONS.VIEW_FINANCIAL_REPORTS,
            permissions_constants_1.SYSTEM_PERMISSIONS.MANAGE_SETTINGS,
            permissions_constants_1.SYSTEM_PERMISSIONS.VIEW_AUDIT_LOGS,
            permissions_constants_1.SYSTEM_PERMISSIONS.VIEW_METRICS,
        ],
    },
    [exports.ROLE_CODES.ORGANIZER_ADMIN]: {
        code: exports.ROLE_CODES.ORGANIZER_ADMIN,
        name: 'Administrateur Organisateur',
        description: 'Administration complète d\'une organisation - Gestion événements et équipe',
        level: 80,
        isActive: true,
        permissions: [
            permissions_constants_1.USER_PERMISSIONS.READ_SELF,
            permissions_constants_1.USER_PERMISSIONS.UPDATE_SELF,
            permissions_constants_1.USER_PERMISSIONS.VIEW_PROFILE,
            permissions_constants_1.USER_PERMISSIONS.SEARCH,
            permissions_constants_1.ORGANIZER_PERMISSIONS.READ_OWN,
            permissions_constants_1.ORGANIZER_PERMISSIONS.UPDATE_OWN,
            permissions_constants_1.ORGANIZER_PERMISSIONS.MANAGE_OWN,
            permissions_constants_1.ORGANIZER_PERMISSIONS.MANAGE_TEAM,
            permissions_constants_1.ORGANIZER_PERMISSIONS.INVITE_MEMBERS,
            permissions_constants_1.ORGANIZER_PERMISSIONS.REMOVE_MEMBERS,
            permissions_constants_1.ORGANIZER_PERMISSIONS.MANAGE_VENUES,
            ...Object.values(permissions_constants_1.EVENT_PERMISSIONS),
            ...Object.values(permissions_constants_1.TICKETING_PERMISSIONS),
            permissions_constants_1.VENUE_PERMISSIONS.MANAGE_OWN,
            permissions_constants_1.VENUE_PERMISSIONS.CONFIGURE_OWN,
            permissions_constants_1.VENUE_PERMISSIONS.EDIT_MAPPINGS,
            permissions_constants_1.VENUE_PERMISSIONS.MANAGE_ZONES,
            permissions_constants_1.FINANCE_PERMISSIONS.VIEW_PAYMENTS,
            permissions_constants_1.FINANCE_PERMISSIONS.VIEW_COMMISSIONS,
            permissions_constants_1.FINANCE_PERMISSIONS.VIEW_REVENUE,
            permissions_constants_1.FINANCE_PERMISSIONS.VIEW_FINANCIAL_REPORTS,
            permissions_constants_1.FINANCE_PERMISSIONS.INITIATE_REFUNDS,
        ],
    },
    [exports.ROLE_CODES.ORGANIZER_MANAGER]: {
        code: exports.ROLE_CODES.ORGANIZER_MANAGER,
        name: 'Manager Organisateur',
        description: 'Gestion opérationnelle des événements - Création et billetterie',
        level: 70,
        isActive: true,
        permissions: [
            permissions_constants_1.USER_PERMISSIONS.READ_SELF,
            permissions_constants_1.USER_PERMISSIONS.UPDATE_SELF,
            permissions_constants_1.USER_PERMISSIONS.VIEW_PROFILE,
            permissions_constants_1.ORGANIZER_PERMISSIONS.READ_OWN,
            permissions_constants_1.ORGANIZER_PERMISSIONS.UPDATE_OWN,
            permissions_constants_1.EVENT_PERMISSIONS.CREATE_OWN,
            permissions_constants_1.EVENT_PERMISSIONS.READ_OWN,
            permissions_constants_1.EVENT_PERMISSIONS.UPDATE_OWN,
            permissions_constants_1.EVENT_PERMISSIONS.PUBLISH,
            permissions_constants_1.EVENT_PERMISSIONS.MANAGE_PARTICIPANTS,
            permissions_constants_1.EVENT_PERMISSIONS.CONFIGURE_TICKETING,
            permissions_constants_1.EVENT_PERMISSIONS.MANAGE_PRICING,
            permissions_constants_1.TICKETING_PERMISSIONS.SELL_TICKETS,
            permissions_constants_1.TICKETING_PERMISSIONS.CONFIGURE_PRICING,
            permissions_constants_1.TICKETING_PERMISSIONS.CONFIGURE_ZONES,
            permissions_constants_1.TICKETING_PERMISSIONS.VIEW_REFUNDS,
            permissions_constants_1.TICKETING_PERMISSIONS.VIEW_SALES_REPORTS,
            permissions_constants_1.VENUE_PERMISSIONS.READ,
            permissions_constants_1.VENUE_PERMISSIONS.MANAGE_OWN,
            permissions_constants_1.FINANCE_PERMISSIONS.VIEW_PAYMENTS,
            permissions_constants_1.FINANCE_PERMISSIONS.VIEW_REVENUE,
        ],
    },
    [exports.ROLE_CODES.VENUE_ADMIN]: {
        code: exports.ROLE_CODES.VENUE_ADMIN,
        name: 'Administrateur Venue',
        description: 'Administration complète d\'un lieu - Configuration et gestion',
        level: 60,
        isActive: true,
        permissions: [
            permissions_constants_1.USER_PERMISSIONS.READ_SELF,
            permissions_constants_1.USER_PERMISSIONS.UPDATE_SELF,
            permissions_constants_1.USER_PERMISSIONS.VIEW_PROFILE,
            ...Object.values(permissions_constants_1.VENUE_PERMISSIONS),
            permissions_constants_1.EVENT_PERMISSIONS.READ,
            permissions_constants_1.EVENT_PERMISSIONS.MANAGE_PARTICIPANTS,
            permissions_constants_1.TICKETING_PERMISSIONS.SCAN_QR,
            permissions_constants_1.TICKETING_PERMISSIONS.MANUAL_ENTRY,
            permissions_constants_1.TICKETING_PERMISSIONS.VIEW_ACCESS_LOGS,
            permissions_constants_1.TICKETING_PERMISSIONS.MANAGE_ACCESS_RIGHTS,
            permissions_constants_1.TICKETING_PERMISSIONS.VIEW_ACCESS_REPORTS,
        ],
    },
    [exports.ROLE_CODES.VENUE_MANAGER]: {
        code: exports.ROLE_CODES.VENUE_MANAGER,
        name: 'Manager Venue',
        description: 'Gestion opérationnelle d\'un lieu - Événements et accès',
        level: 50,
        isActive: true,
        permissions: [
            permissions_constants_1.USER_PERMISSIONS.READ_SELF,
            permissions_constants_1.USER_PERMISSIONS.UPDATE_SELF,
            permissions_constants_1.VENUE_PERMISSIONS.READ,
            permissions_constants_1.VENUE_PERMISSIONS.MANAGE_OWN,
            permissions_constants_1.VENUE_PERMISSIONS.MANAGE_ZONES,
            permissions_constants_1.VENUE_PERMISSIONS.MANAGE_ACCESS_POINTS,
            permissions_constants_1.EVENT_PERMISSIONS.READ,
            permissions_constants_1.TICKETING_PERMISSIONS.SCAN_QR,
            permissions_constants_1.TICKETING_PERMISSIONS.MANUAL_ENTRY,
            permissions_constants_1.TICKETING_PERMISSIONS.VIEW_ACCESS_LOGS,
        ],
    },
    [exports.ROLE_CODES.SECURITY_MANAGER]: {
        code: exports.ROLE_CODES.SECURITY_MANAGER,
        name: 'Responsable Sécurité',
        description: 'Gestion de la sécurité - Contrôle d\'accès et incidents',
        level: 52,
        isActive: true,
        permissions: [
            permissions_constants_1.AUTH_PERMISSIONS.VIEW_LOGIN_ATTEMPTS,
            permissions_constants_1.AUTH_PERMISSIONS.MANAGE_BLACKLIST,
            permissions_constants_1.AUTH_PERMISSIONS.VIEW_SECURITY_EVENTS,
            permissions_constants_1.AUTH_PERMISSIONS.VIEW_SESSIONS,
            permissions_constants_1.TICKETING_PERMISSIONS.SCAN_QR,
            permissions_constants_1.TICKETING_PERMISSIONS.MANUAL_ENTRY,
            permissions_constants_1.TICKETING_PERMISSIONS.VIEW_ACCESS_LOGS,
            permissions_constants_1.TICKETING_PERMISSIONS.MANAGE_ACCESS_RIGHTS,
            permissions_constants_1.USER_PERMISSIONS.READ,
            permissions_constants_1.USER_PERMISSIONS.VIEW_PROFILE,
            permissions_constants_1.USER_PERMISSIONS.SUSPEND,
            permissions_constants_1.SYSTEM_PERMISSIONS.VIEW_AUDIT_LOGS,
        ],
    },
    [exports.ROLE_CODES.SUPPORT_AGENT]: {
        code: exports.ROLE_CODES.SUPPORT_AGENT,
        name: 'Agent Support',
        description: 'Support client - Assistance utilisateurs et résolution incidents',
        level: 40,
        isActive: true,
        permissions: [
            permissions_constants_1.USER_PERMISSIONS.READ,
            permissions_constants_1.USER_PERMISSIONS.VIEW_PROFILE,
            permissions_constants_1.USER_PERMISSIONS.RESET_PASSWORD,
            permissions_constants_1.USER_PERMISSIONS.VERIFY_EMAIL,
            permissions_constants_1.USER_PERMISSIONS.VERIFY_PHONE,
            permissions_constants_1.USER_PERMISSIONS.SEARCH,
            permissions_constants_1.TICKETING_PERMISSIONS.VIEW_SALES_REPORTS,
            permissions_constants_1.TICKETING_PERMISSIONS.VIEW_REFUNDS,
            permissions_constants_1.TICKETING_PERMISSIONS.PROCESS_REFUNDS,
            permissions_constants_1.EVENT_PERMISSIONS.READ,
            permissions_constants_1.FINANCE_PERMISSIONS.VIEW_PAYMENTS,
            permissions_constants_1.FINANCE_PERMISSIONS.INITIATE_REFUNDS,
        ],
    },
    [exports.ROLE_CODES.VALIDATOR]: {
        code: exports.ROLE_CODES.VALIDATOR,
        name: 'Validateur',
        description: 'Validation de contenus - Modération et approbation',
        level: 30,
        isActive: true,
        permissions: [
            permissions_constants_1.ORGANIZER_PERMISSIONS.READ,
            permissions_constants_1.ORGANIZER_PERMISSIONS.VALIDATE,
            permissions_constants_1.ORGANIZER_PERMISSIONS.APPROVE,
            permissions_constants_1.ORGANIZER_PERMISSIONS.REJECT,
            permissions_constants_1.EVENT_PERMISSIONS.READ,
            permissions_constants_1.EVENT_PERMISSIONS.UPDATE,
            permissions_constants_1.VENUE_PERMISSIONS.READ,
            permissions_constants_1.VENUE_PERMISSIONS.UPDATE,
        ],
    },
    [exports.ROLE_CODES.STAFF]: {
        code: exports.ROLE_CODES.STAFF,
        name: 'Personnel',
        description: 'Personnel terrain - Accès aux outils opérationnels quotidiens',
        level: 28,
        isActive: true,
        permissions: [
            permissions_constants_1.TICKETING_PERMISSIONS.SCAN_QR,
            permissions_constants_1.TICKETING_PERMISSIONS.MANUAL_ENTRY,
            permissions_constants_1.EVENT_PERMISSIONS.READ,
            permissions_constants_1.USER_PERMISSIONS.READ_SELF,
            permissions_constants_1.USER_PERMISSIONS.UPDATE_SELF,
        ],
    },
    [exports.ROLE_CODES.VIP_GOLD]: {
        code: exports.ROLE_CODES.VIP_GOLD,
        name: 'VIP Gold',
        description: 'Membres VIP premium - Accès privilèges et services exclusifs',
        level: 12,
        isActive: true,
        permissions: [
            permissions_constants_1.USER_PERMISSIONS.READ_SELF,
            permissions_constants_1.USER_PERMISSIONS.UPDATE_SELF,
            permissions_constants_1.USER_PERMISSIONS.UPDATE_PROFILE,
            permissions_constants_1.EVENT_PERMISSIONS.READ,
            permissions_constants_1.TICKETING_PERMISSIONS.SELL_TICKETS,
        ],
    },
    [exports.ROLE_CODES.SUBSCRIBER]: {
        code: exports.ROLE_CODES.SUBSCRIBER,
        name: 'Abonné',
        description: 'Abonnés réguliers - Accès prioritaire billetterie et contenus',
        level: 11,
        isActive: true,
        permissions: [
            permissions_constants_1.USER_PERMISSIONS.READ_SELF,
            permissions_constants_1.USER_PERMISSIONS.UPDATE_SELF,
            permissions_constants_1.USER_PERMISSIONS.UPDATE_PROFILE,
            permissions_constants_1.EVENT_PERMISSIONS.READ,
            permissions_constants_1.TICKETING_PERMISSIONS.SELL_TICKETS,
        ],
    },
    [exports.ROLE_CODES.USER]: {
        code: exports.ROLE_CODES.USER,
        name: 'Utilisateur',
        description: 'Utilisateurs standards - Accès de base aux fonctionnalités publiques',
        level: 10,
        isActive: true,
        permissions: [
            permissions_constants_1.USER_PERMISSIONS.READ_SELF,
            permissions_constants_1.USER_PERMISSIONS.UPDATE_SELF,
            permissions_constants_1.USER_PERMISSIONS.UPDATE_PROFILE,
            permissions_constants_1.EVENT_PERMISSIONS.READ,
            permissions_constants_1.TICKETING_PERMISSIONS.SELL_TICKETS,
        ],
    },
};
exports.ROLE_HIERARCHY = Object.values(exports.SYSTEM_ROLES)
    .sort((a, b) => b.level - a.level)
    .map(role => role.code);
exports.ADMIN_ROLES = Object.values(exports.SYSTEM_ROLES)
    .filter(role => role.level >= 50)
    .map(role => role.code);
exports.ORGANIZER_ROLES = [
    exports.ROLE_CODES.ORGANIZER_ADMIN,
    exports.ROLE_CODES.ORGANIZER_MANAGER,
];
exports.VENUE_ROLES = [
    exports.ROLE_CODES.VENUE_ADMIN,
    exports.ROLE_CODES.VENUE_MANAGER,
];
exports.END_USER_ROLES = [
    exports.ROLE_CODES.VIP_GOLD,
    exports.ROLE_CODES.SUBSCRIBER,
    exports.ROLE_CODES.USER,
];
const canAssignRole = (assignerRoleCode, targetRoleCode) => {
    const assignerRole = exports.SYSTEM_ROLES[assignerRoleCode];
    const targetRole = exports.SYSTEM_ROLES[targetRoleCode];
    if (!assignerRole || !targetRole)
        return false;
    return assignerRole.level >= targetRole.level;
};
exports.canAssignRole = canAssignRole;
const getAssignableRoles = (roleCode) => {
    const role = exports.SYSTEM_ROLES[roleCode];
    if (!role)
        return [];
    return Object.values(exports.SYSTEM_ROLES)
        .filter(targetRole => targetRole.level <= role.level)
        .map(targetRole => targetRole.code);
};
exports.getAssignableRoles = getAssignableRoles;
//# sourceMappingURL=roles.constants.js.map