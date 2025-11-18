// src/modules/users/constants/invitation.constants.ts

export const INVITATION_CONSTANTS = {
    // Types d'invitations
    TYPES: {
      GROUP: 'GROUP',
      EVENT: 'EVENT',
      FRIEND: 'FRIEND',
    } as const,
  
    // Statuts d'invitation
    STATUS: {
      PENDING: 'PENDING',
      ACCEPTED: 'ACCEPTED', 
      DECLINED: 'DECLINED',
      EXPIRED: 'EXPIRED',
      CANCELLED: 'CANCELLED',
    } as const,
  
    // Durées d'expiration (en heures)
    EXPIRATION: {
      GROUP: 168, // 7 jours
      EVENT: 48, // 2 jours
      FRIEND: 720, // 30 jours
    },
  
    // Limites d'invitations
    LIMITS: {
      MAX_PENDING_PER_USER: 50,
      MAX_INVITES_PER_DAY: 20,
      MAX_BULK_INVITES: 10,
      MAX_MESSAGE_LENGTH: 500,
    },
  
    // Configuration email
    EMAIL_CONFIG: {
      REMINDER_HOURS: [24, 72], // Rappels après 24h et 72h
      MAX_REMINDERS: 2,
    },
  
    // Messages d'erreur
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
  
    // Validation
    VALIDATION: {
      EMAIL: {
        REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      },
      MESSAGE: {
        MIN_LENGTH: 0,
        MAX_LENGTH: 500,
      },
    },
  
    // Templates par défaut
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
  
    // Actions disponibles
    ACTIONS: {
      SEND: 'send',
      RESEND: 'resend',
      CANCEL: 'cancel',
      ACCEPT: 'accept',
      DECLINE: 'decline',
    } as const,
  
    // Paramètres de pagination
    PAGINATION: {
      DEFAULT_LIMIT: 20,
      MAX_LIMIT: 50,
    },
  
    // Champs de tri autorisés
    SORTABLE_FIELDS: [
      'createdAt',
      'expiresAt',
      'status',
      'type',
    ] as const,
  } as const;
  
  export type InvitationType = typeof INVITATION_CONSTANTS.TYPES[keyof typeof INVITATION_CONSTANTS.TYPES];
  export type InvitationStatus = typeof INVITATION_CONSTANTS.STATUS[keyof typeof INVITATION_CONSTANTS.STATUS];
  export type InvitationAction = typeof INVITATION_CONSTANTS.ACTIONS[keyof typeof INVITATION_CONSTANTS.ACTIONS];
  export type SortableInvitationField = typeof INVITATION_CONSTANTS.SORTABLE_FIELDS[number];