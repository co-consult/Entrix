// src/common/constants/permissions.constants.ts
/**
 * Constantes des permissions système Entrix
 * 
 * Organisation :
 * - Permissions par domaine fonctionnel
 * - Actions CRUD + actions spécifiques
 * - Permissions hiérarchiques
 * - Permissions contextuelles
 * 
 * Utilisation :
 * - Avec le décorateur @Permissions()
 * - Dans les guards de permissions
 * - Pour la validation des droits utilisateur
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

/**
 * Permissions pour la gestion des utilisateurs
 */
export const USER_PERMISSIONS = {
  // CRUD de base
  CREATE: 'users.create',
  READ: 'users.read',
  UPDATE: 'users.update',
  DELETE: 'users.delete',
  
  // Actions spécifiques
  READ_SELF: 'users.read.self',
  UPDATE_SELF: 'users.update.self',
  READ_ALL: 'users.read.all',
  UPDATE_ALL: 'users.update.all',
  DELETE_ALL: 'users.delete.all',
  
  // Gestion des profils
  UPDATE_PROFILE: 'users.profile.update',
  VIEW_PROFILE: 'users.profile.view',
  VIEW_PROFILE_ALL: 'users.profile.view.all',
  
  // Gestion des comptes
  ACTIVATE: 'users.activate',
  DEACTIVATE: 'users.deactivate',
  SUSPEND: 'users.suspend',
  VERIFY_EMAIL: 'users.verify.email',
  VERIFY_PHONE: 'users.verify.phone',
  RESET_PASSWORD: 'users.password.reset',
  FORCE_PASSWORD_CHANGE: 'users.password.force_change',
  
  // Gestion des rôles utilisateur
  ASSIGN_ROLES: 'users.roles.assign',
  REMOVE_ROLES: 'users.roles.remove',
  VIEW_ROLES: 'users.roles.view',
  
  // Import/Export
  IMPORT: 'users.import',
  EXPORT: 'users.export',
  BULK_OPERATIONS: 'users.bulk',
  
  // Recherche et filtrage
  SEARCH: 'users.search',
  ADVANCED_SEARCH: 'users.search.advanced',
} as const;

/**
 * Permissions pour la gestion des rôles et groupes
 */
export const ROLE_PERMISSIONS = {
  // CRUD des rôles
  CREATE: 'roles.create',
  READ: 'roles.read',
  UPDATE: 'roles.update',
  DELETE: 'roles.delete',
  
  // Gestion des permissions
  MANAGE_PERMISSIONS: 'roles.permissions.manage',
  VIEW_PERMISSIONS: 'roles.permissions.view',
  ASSIGN_PERMISSIONS: 'roles.permissions.assign',
  
  // Gestion des groupes
  CREATE_GROUP: 'groups.create',
  READ_GROUP: 'groups.read',
  UPDATE_GROUP: 'groups.update',
  DELETE_GROUP: 'groups.delete',
  MANAGE_GROUP_MEMBERS: 'groups.members.manage',
  
  // Actions spéciales
  ASSIGN_TO_USERS: 'roles.assign.users',
  BULK_ASSIGN: 'roles.assign.bulk',
  HIERARCHY_MANAGE: 'roles.hierarchy.manage',
} as const;

/**
 * Permissions pour l'authentification et la sécurité
 */
export const AUTH_PERMISSIONS = {
  // Authentification de base
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
  REFRESH_TOKEN: 'auth.refresh',
  
  // MFA
  ENABLE_MFA: 'auth.mfa.enable',
  DISABLE_MFA: 'auth.mfa.disable',
  VERIFY_MFA: 'auth.mfa.verify',
  GENERATE_BACKUP_CODES: 'auth.mfa.backup_codes',
  
  // Sessions
  VIEW_SESSIONS: 'auth.sessions.view',
  MANAGE_SESSIONS: 'auth.sessions.manage',
  TERMINATE_SESSIONS: 'auth.sessions.terminate',
  TERMINATE_ALL_SESSIONS: 'auth.sessions.terminate.all',
  
  // Sécurité avancée
  VIEW_LOGIN_ATTEMPTS: 'auth.login_attempts.view',
  MANAGE_BLACKLIST: 'auth.blacklist.manage',
  VIEW_SECURITY_EVENTS: 'auth.security_events.view',
  MANAGE_SECURITY_POLICIES: 'auth.security_policies.manage',
} as const;

/**
 * Permissions pour les organisateurs
 */
export const ORGANIZER_PERMISSIONS = {
  // CRUD organisateurs
  CREATE: 'organizers.create',
  READ: 'organizers.read',
  UPDATE: 'organizers.update',
  DELETE: 'organizers.delete',
  
  // Gestion propre organisation
  READ_OWN: 'organizers.read.own',
  UPDATE_OWN: 'organizers.update.own',
  MANAGE_OWN: 'organizers.manage.own',
  
  // Validation et statut
  VALIDATE: 'organizers.validate',
  SUSPEND: 'organizers.suspend',
  ACTIVATE: 'organizers.activate',
  APPROVE: 'organizers.approve',
  REJECT: 'organizers.reject',
  
  // Gestion des venues
  MANAGE_VENUES: 'organizers.venues.manage',
  ASSIGN_VENUES: 'organizers.venues.assign',
  
  // Gestion des équipes
  MANAGE_TEAM: 'organizers.team.manage',
  INVITE_MEMBERS: 'organizers.team.invite',
  REMOVE_MEMBERS: 'organizers.team.remove',
} as const;

/**
 * Permissions pour les événements
 */
export const EVENT_PERMISSIONS = {
  // CRUD événements
  CREATE: 'events.create',
  READ: 'events.read',
  UPDATE: 'events.update',
  DELETE: 'events.delete',
  
  // Gestion propres événements
  CREATE_OWN: 'events.create.own',
  READ_OWN: 'events.read.own',
  UPDATE_OWN: 'events.update.own',
  DELETE_OWN: 'events.delete.own',
  
  // Statut des événements
  PUBLISH: 'events.publish',
  CANCEL: 'events.cancel',
  POSTPONE: 'events.postpone',
  RESCHEDULE: 'events.reschedule',
  
  // Gestion des participants
  MANAGE_PARTICIPANTS: 'events.participants.manage',
  ADD_PARTICIPANTS: 'events.participants.add',
  REMOVE_PARTICIPANTS: 'events.participants.remove',
  
  // Configuration billetterie
  CONFIGURE_TICKETING: 'events.ticketing.configure',
  MANAGE_PRICING: 'events.pricing.manage',
  MANAGE_ZONES: 'events.zones.manage',
} as const;

/**
 * Permissions pour la billetterie et les accès
 */
export const TICKETING_PERMISSIONS = {
  // Ventes
  SELL_TICKETS: 'ticketing.sell',
  MANUAL_SALES: 'ticketing.manual_sales',
  BULK_SALES: 'ticketing.bulk_sales',
  
  // Configuration
  CONFIGURE_PRICING: 'ticketing.pricing.configure',
  MANAGE_TEMPLATES: 'ticketing.templates.manage',
  CONFIGURE_ZONES: 'ticketing.zones.configure',
  
  // Remboursements
  PROCESS_REFUNDS: 'ticketing.refunds.process',
  APPROVE_REFUNDS: 'ticketing.refunds.approve',
  VIEW_REFUNDS: 'ticketing.refunds.view',
  
  // Contrôle d'accès
  SCAN_QR: 'access.scan_qr',
  MANUAL_ENTRY: 'access.manual_entry',
  VIEW_ACCESS_LOGS: 'access.logs.view',
  MANAGE_ACCESS_RIGHTS: 'access.rights.manage',
  
  // Rapports
  VIEW_SALES_REPORTS: 'ticketing.reports.sales',
  VIEW_ACCESS_REPORTS: 'ticketing.reports.access',
  EXPORT_REPORTS: 'ticketing.reports.export',
} as const;

/**
 * Permissions pour les venues
 */
export const VENUE_PERMISSIONS = {
  // CRUD venues
  CREATE: 'venues.create',
  READ: 'venues.read',
  UPDATE: 'venues.update',
  DELETE: 'venues.delete',
  
  // Gestion propres venues
  MANAGE_OWN: 'venues.manage.own',
  CONFIGURE_OWN: 'venues.configure.own',
  
  // Configuration
  EDIT_MAPPINGS: 'venues.mappings.edit',
  MANAGE_ZONES: 'venues.zones.manage',
  CONFIGURE_SEATING: 'venues.seating.configure',
  MANAGE_ACCESS_POINTS: 'venues.access_points.manage',
  
  // Équipements et médias
  MANAGE_AMENITIES: 'venues.amenities.manage',
  UPLOAD_MEDIA: 'venues.media.upload',
  MANAGE_MEDIA: 'venues.media.manage',
} as const;

/**
 * Permissions pour la gestion financière
 */
export const FINANCE_PERMISSIONS = {
  // Paiements
  PROCESS_PAYMENTS: 'finance.payments.process',
  VIEW_PAYMENTS: 'finance.payments.view',
  REFUND_PAYMENTS: 'finance.payments.refund',
  
  // Commissions
  VIEW_COMMISSIONS: 'finance.commissions.view',
  CALCULATE_COMMISSIONS: 'finance.commissions.calculate',
  APPROVE_COMMISSIONS: 'finance.commissions.approve',
  
  // Rapports financiers
  VIEW_FINANCIAL_REPORTS: 'finance.reports.view',
  EXPORT_FINANCIAL_DATA: 'finance.reports.export',
  VIEW_REVENUE: 'finance.revenue.view',
  
  // Remboursements
  INITIATE_REFUNDS: 'finance.refunds.initiate',
  APPROVE_REFUNDS: 'finance.refunds.approve',
  PROCESS_REFUNDS: 'finance.refunds.process',
} as const;

/**
 * Permissions système et administration
 */
export const SYSTEM_PERMISSIONS = {
  // Configuration système
  MANAGE_SETTINGS: 'system.settings.manage',
  VIEW_SETTINGS: 'system.settings.view',
  CONFIGURE_INTEGRATIONS: 'system.integrations.configure',
  
  // Audit et logs
  VIEW_AUDIT_LOGS: 'system.audit.view',
  EXPORT_AUDIT_LOGS: 'system.audit.export',
  MANAGE_AUDIT_SETTINGS: 'system.audit.settings',
  
  // Monitoring
  VIEW_METRICS: 'system.metrics.view',
  VIEW_HEALTH_STATUS: 'system.health.view',
  MANAGE_MONITORING: 'system.monitoring.manage',
  
  // Sauvegardes
  CREATE_BACKUP: 'system.backup.create',
  RESTORE_BACKUP: 'system.backup.restore',
  MANAGE_BACKUPS: 'system.backup.manage',
  
  // APIs et webhooks
  MANAGE_APIS: 'system.apis.manage',
  CONFIGURE_WEBHOOKS: 'system.webhooks.configure',
  VIEW_API_LOGS: 'system.apis.logs',
} as const;

/**
 * Toutes les permissions regroupées
 */
export const ALL_PERMISSIONS = {
  USERS: USER_PERMISSIONS,
  ROLES: ROLE_PERMISSIONS,
  AUTH: AUTH_PERMISSIONS,
  ORGANIZERS: ORGANIZER_PERMISSIONS,
  EVENTS: EVENT_PERMISSIONS,
  TICKETING: TICKETING_PERMISSIONS,
  VENUES: VENUE_PERMISSIONS,
  FINANCE: FINANCE_PERMISSIONS,
  SYSTEM: SYSTEM_PERMISSIONS,
} as const;

/**
 * Array de toutes les permissions pour validation
 */
export const PERMISSION_LIST = Object.values(ALL_PERMISSIONS)
  .flatMap(category => Object.values(category)) as string[];

/**
 * Type pour l'autocomplétion des permissions
 */
export type Permission = typeof PERMISSION_LIST[number];

/**
 * Permissions par catégorie pour l'interface utilisateur
 */
export const PERMISSION_CATEGORIES = [
  {
    name: 'Utilisateurs',
    key: 'USERS',
    description: 'Gestion des comptes utilisateurs et profils',
    permissions: USER_PERMISSIONS,
  },
  {
    name: 'Rôles & Groupes',
    key: 'ROLES', 
    description: 'Administration des rôles et permissions',
    permissions: ROLE_PERMISSIONS,
  },
  {
    name: 'Authentification',
    key: 'AUTH',
    description: 'Sécurité et authentification',
    permissions: AUTH_PERMISSIONS,
  },
  {
    name: 'Organisateurs',
    key: 'ORGANIZERS',
    description: 'Gestion des organisateurs d\'événements',
    permissions: ORGANIZER_PERMISSIONS,
  },
  {
    name: 'Événements',
    key: 'EVENTS',
    description: 'Création et gestion des événements',
    permissions: EVENT_PERMISSIONS,
  },
  {
    name: 'Billetterie',
    key: 'TICKETING',
    description: 'Vente de billets et contrôle d\'accès',
    permissions: TICKETING_PERMISSIONS,
  },
  {
    name: 'Venues',
    key: 'VENUES',
    description: 'Gestion des lieux et espaces',
    permissions: VENUE_PERMISSIONS,
  },
  {
    name: 'Finance',
    key: 'FINANCE',
    description: 'Gestion financière et paiements',
    permissions: FINANCE_PERMISSIONS,
  },
  {
    name: 'Système',
    key: 'SYSTEM',
    description: 'Administration système',
    permissions: SYSTEM_PERMISSIONS,
  },
] as const;