"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INVITATION_CONSTANTS = void 0;
exports.INVITATION_CONSTANTS = {
    TYPES: {
        GROUP: 'GROUP',
        EVENT: 'EVENT',
        FRIEND: 'FRIEND',
    },
    STATUS: {
        PENDING: 'PENDING',
        ACCEPTED: 'ACCEPTED',
        DECLINED: 'DECLINED',
        EXPIRED: 'EXPIRED',
        CANCELLED: 'CANCELLED',
    },
    EXPIRATION: {
        GROUP: 168,
        EVENT: 48,
        FRIEND: 720,
    },
    LIMITS: {
        MAX_PENDING_PER_USER: 50,
        MAX_INVITES_PER_DAY: 20,
        MAX_BULK_INVITES: 10,
        MAX_MESSAGE_LENGTH: 500,
    },
    EMAIL_CONFIG: {
        REMINDER_HOURS: [24, 72],
        MAX_REMINDERS: 2,
    },
    ERRORS: {
        INVITATION_NOT_FOUND: 'Invitation introuvable',
        INVITATION_EXPIRED: 'Invitation expirée',
        INVITATION_ALREADY_RESPONDED: 'Invitation déjà traitée',
        TOO_MANY_PENDING: 'Trop d\'invitations en attente',
        DAILY_LIMIT_EXCEEDED: 'Limite quotidienne d\'invitations atteinte',
        CANNOT_INVITE_SELF: 'Impossible de s\'inviter soi-même',
        ALREADY_MEMBER: 'L\'utilisateur est déjà membre',
        GROUP_FULL: 'Le groupe est complet',
        INVALID_EMAIL: 'Adresse email invalide',
    },
    VALIDATION: {
        EMAIL: {
            REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        },
        MESSAGE: {
            MIN_LENGTH: 0,
            MAX_LENGTH: 500,
        },
    },
    DEFAULT_MESSAGES: {
        GROUP: {
            FAMILY: 'Rejoignez notre groupe familial sur Entrix pour acheter vos billets ensemble !',
            FRIENDS: 'Venez rejoindre notre groupe d\'amis sur Entrix !',
            CORPORATE: 'Vous êtes invité(e) à rejoindre notre groupe corporate.',
            ASSOCIATION: 'Rejoignez notre association sur Entrix.',
            TEMPORARY: 'Invitation à un groupe temporaire pour cet événement.',
            EDUCATIONAL: 'Rejoignez notre groupe éducatif.',
        },
        EVENT: 'Vous êtes invité(e) à cet événement !',
        FRIEND: 'Connectons-nous sur Entrix !',
    },
    ACTIONS: {
        SEND: 'send',
        RESEND: 'resend',
        CANCEL: 'cancel',
        ACCEPT: 'accept',
        DECLINE: 'decline',
    },
    PAGINATION: {
        DEFAULT_LIMIT: 20,
        MAX_LIMIT: 50,
    },
    SORTABLE_FIELDS: [
        'createdAt',
        'expiresAt',
        'status',
        'type',
    ],
};
//# sourceMappingURL=invitation.constants.js.map