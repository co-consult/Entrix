export declare const INVITATION_CONSTANTS: {
    readonly TYPES: {
        readonly GROUP: "GROUP";
        readonly EVENT: "EVENT";
        readonly FRIEND: "FRIEND";
    };
    readonly STATUS: {
        readonly PENDING: "PENDING";
        readonly ACCEPTED: "ACCEPTED";
        readonly DECLINED: "DECLINED";
        readonly EXPIRED: "EXPIRED";
        readonly CANCELLED: "CANCELLED";
    };
    readonly EXPIRATION: {
        readonly GROUP: 168;
        readonly EVENT: 48;
        readonly FRIEND: 720;
    };
    readonly LIMITS: {
        readonly MAX_PENDING_PER_USER: 50;
        readonly MAX_INVITES_PER_DAY: 20;
        readonly MAX_BULK_INVITES: 10;
        readonly MAX_MESSAGE_LENGTH: 500;
    };
    readonly EMAIL_CONFIG: {
        readonly REMINDER_HOURS: readonly [24, 72];
        readonly MAX_REMINDERS: 2;
    };
    readonly ERRORS: {
        readonly INVITATION_NOT_FOUND: "Invitation introuvable";
        readonly INVITATION_EXPIRED: "Invitation expirée";
        readonly INVITATION_ALREADY_RESPONDED: "Invitation déjà traitée";
        readonly TOO_MANY_PENDING: "Trop d'invitations en attente";
        readonly DAILY_LIMIT_EXCEEDED: "Limite quotidienne d'invitations atteinte";
        readonly CANNOT_INVITE_SELF: "Impossible de s'inviter soi-même";
        readonly ALREADY_MEMBER: "L'utilisateur est déjà membre";
        readonly GROUP_FULL: "Le groupe est complet";
        readonly INVALID_EMAIL: "Adresse email invalide";
    };
    readonly VALIDATION: {
        readonly EMAIL: {
            readonly REGEX: RegExp;
        };
        readonly MESSAGE: {
            readonly MIN_LENGTH: 0;
            readonly MAX_LENGTH: 500;
        };
    };
    readonly DEFAULT_MESSAGES: {
        readonly GROUP: {
            readonly FAMILY: "Rejoignez notre groupe familial sur Entrix pour acheter vos billets ensemble !";
            readonly FRIENDS: "Venez rejoindre notre groupe d'amis sur Entrix !";
            readonly CORPORATE: "Vous êtes invité(e) à rejoindre notre groupe corporate.";
            readonly ASSOCIATION: "Rejoignez notre association sur Entrix.";
            readonly TEMPORARY: "Invitation à un groupe temporaire pour cet événement.";
            readonly EDUCATIONAL: "Rejoignez notre groupe éducatif.";
        };
        readonly EVENT: "Vous êtes invité(e) à cet événement !";
        readonly FRIEND: "Connectons-nous sur Entrix !";
    };
    readonly ACTIONS: {
        readonly SEND: "send";
        readonly RESEND: "resend";
        readonly CANCEL: "cancel";
        readonly ACCEPT: "accept";
        readonly DECLINE: "decline";
    };
    readonly PAGINATION: {
        readonly DEFAULT_LIMIT: 20;
        readonly MAX_LIMIT: 50;
    };
    readonly SORTABLE_FIELDS: readonly ["createdAt", "expiresAt", "status", "type"];
};
export type InvitationType = typeof INVITATION_CONSTANTS.TYPES[keyof typeof INVITATION_CONSTANTS.TYPES];
export type InvitationStatus = typeof INVITATION_CONSTANTS.STATUS[keyof typeof INVITATION_CONSTANTS.STATUS];
export type InvitationAction = typeof INVITATION_CONSTANTS.ACTIONS[keyof typeof INVITATION_CONSTANTS.ACTIONS];
export type SortableInvitationField = typeof INVITATION_CONSTANTS.SORTABLE_FIELDS[number];
