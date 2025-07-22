// src/common/constants/roles.constants.ts
/**
 * Constantes des rôles système Entrix
 * 
 * Définit :
 * - Rôles prédéfinis avec codes et niveaux
 * - Hiérarchie des rôles
 * - Permissions par défaut de chaque rôle
 * - Configuration des rôles pour l'initialisation
 * 
 * Hiérarchie (niveau 0-100) :
 * - 100 : SUPER_ADMIN (accès total)
 * - 90 : ADMIN (administration plateforme)
 * - 80-70 : Rôles organisateurs (gestion événements)
 * - 60-50 : Rôles venues (gestion lieux)
 * - 40-30 : Rôles support et validation
 * - 20-10 : Rôles utilisateurs finaux
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { 
  ALL_PERMISSIONS, 
  USER_PERMISSIONS, 
  ROLE_PERMISSIONS, 
  AUTH_PERMISSIONS,
  ORGANIZER_PERMISSIONS,
  EVENT_PERMISSIONS,
  TICKETING_PERMISSIONS,
  VENUE_PERMISSIONS,
  FINANCE_PERMISSIONS,
  SYSTEM_PERMISSIONS
} from './permissions.constants';

/**
 * Codes des rôles système
 */
export const ROLE_CODES = {
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
} as const;

/**
 * Configuration complète des rôles système
 */
export const SYSTEM_ROLES = {
  [ROLE_CODES.SUPER_ADMIN]: {
    code: ROLE_CODES.SUPER_ADMIN,
    name: 'Super Administrateur',
    description: 'Accès complet au système - Administration totale',
    level: 100,
    isActive: true,
    permissions: [
      // Toutes les permissions
      ...Object.values(USER_PERMISSIONS),
      ...Object.values(ROLE_PERMISSIONS),
      ...Object.values(AUTH_PERMISSIONS),
      ...Object.values(ORGANIZER_PERMISSIONS),
      ...Object.values(EVENT_PERMISSIONS),
      ...Object.values(TICKETING_PERMISSIONS),
      ...Object.values(VENUE_PERMISSIONS),
      ...Object.values(FINANCE_PERMISSIONS),
      ...Object.values(SYSTEM_PERMISSIONS),
    ],
  },

  [ROLE_CODES.ADMIN]: {
    code: ROLE_CODES.ADMIN,
    name: 'Administrateur',
    description: 'Administration de la plateforme - Gestion utilisateurs et organisateurs',
    level: 90,
    isActive: true,
    permissions: [
      // Utilisateurs
      ...Object.values(USER_PERMISSIONS),
      // Rôles (sauf création super admin)
      ROLE_PERMISSIONS.READ,
      ROLE_PERMISSIONS.UPDATE,
      ROLE_PERMISSIONS.VIEW_PERMISSIONS,
      ROLE_PERMISSIONS.ASSIGN_TO_USERS,
      ROLE_PERMISSIONS.READ_GROUP,
      ROLE_PERMISSIONS.UPDATE_GROUP,
      ROLE_PERMISSIONS.MANAGE_GROUP_MEMBERS,
      // Auth et sécurité
      ...Object.values(AUTH_PERMISSIONS),
      // Organisateurs
      ...Object.values(ORGANIZER_PERMISSIONS),
      // Événements (lecture/validation)
      EVENT_PERMISSIONS.READ,
      EVENT_PERMISSIONS.UPDATE,
      EVENT_PERMISSIONS.CANCEL,
      EVENT_PERMISSIONS.POSTPONE,
      // Venues (lecture/validation)
      VENUE_PERMISSIONS.READ,
      VENUE_PERMISSIONS.UPDATE,
      // Finance (vue d'ensemble)
      FINANCE_PERMISSIONS.VIEW_PAYMENTS,
      FINANCE_PERMISSIONS.VIEW_COMMISSIONS,
      FINANCE_PERMISSIONS.VIEW_FINANCIAL_REPORTS,
      // Système (configuration)
      SYSTEM_PERMISSIONS.MANAGE_SETTINGS,
      SYSTEM_PERMISSIONS.VIEW_AUDIT_LOGS,
      SYSTEM_PERMISSIONS.VIEW_METRICS,
    ],
  },

  [ROLE_CODES.ORGANIZER_ADMIN]: {
    code: ROLE_CODES.ORGANIZER_ADMIN,
    name: 'Administrateur Organisateur',
    description: 'Administration complète d\'une organisation - Gestion événements et équipe',
    level: 80,
    isActive: true,
    permissions: [
      // Utilisateurs (limité à son organisation)
      USER_PERMISSIONS.READ_SELF,
      USER_PERMISSIONS.UPDATE_SELF,
      USER_PERMISSIONS.VIEW_PROFILE,
      USER_PERMISSIONS.SEARCH,
      // Organisateurs (son organisation)
      ORGANIZER_PERMISSIONS.READ_OWN,
      ORGANIZER_PERMISSIONS.UPDATE_OWN,
      ORGANIZER_PERMISSIONS.MANAGE_OWN,
      ORGANIZER_PERMISSIONS.MANAGE_TEAM,
      ORGANIZER_PERMISSIONS.INVITE_MEMBERS,
      ORGANIZER_PERMISSIONS.REMOVE_MEMBERS,
      ORGANIZER_PERMISSIONS.MANAGE_VENUES,
      // Événements (complet pour son organisation)
      ...Object.values(EVENT_PERMISSIONS),
      // Billetterie (complet)
      ...Object.values(TICKETING_PERMISSIONS),
      // Venues (gestion des venues assignées)
      VENUE_PERMISSIONS.MANAGE_OWN,
      VENUE_PERMISSIONS.CONFIGURE_OWN,
      VENUE_PERMISSIONS.EDIT_MAPPINGS,
      VENUE_PERMISSIONS.MANAGE_ZONES,
      // Finance (vue de son organisation)
      FINANCE_PERMISSIONS.VIEW_PAYMENTS,
      FINANCE_PERMISSIONS.VIEW_COMMISSIONS,
      FINANCE_PERMISSIONS.VIEW_REVENUE,
      FINANCE_PERMISSIONS.VIEW_FINANCIAL_REPORTS,
      FINANCE_PERMISSIONS.INITIATE_REFUNDS,
    ],
  },

  [ROLE_CODES.ORGANIZER_MANAGER]: {
    code: ROLE_CODES.ORGANIZER_MANAGER,
    name: 'Manager Organisateur',
    description: 'Gestion opérationnelle des événements - Création et billetterie',
    level: 70,
    isActive: true,
    permissions: [
      // Utilisateurs (lecture seule)
      USER_PERMISSIONS.READ_SELF,
      USER_PERMISSIONS.UPDATE_SELF,
      USER_PERMISSIONS.VIEW_PROFILE,
      // Organisateurs (lecture de son organisation)
      ORGANIZER_PERMISSIONS.READ_OWN,
      ORGANIZER_PERMISSIONS.UPDATE_OWN,
      // Événements (création et gestion)
      EVENT_PERMISSIONS.CREATE_OWN,
      EVENT_PERMISSIONS.READ_OWN,
      EVENT_PERMISSIONS.UPDATE_OWN,
      EVENT_PERMISSIONS.PUBLISH,
      EVENT_PERMISSIONS.MANAGE_PARTICIPANTS,
      EVENT_PERMISSIONS.CONFIGURE_TICKETING,
      EVENT_PERMISSIONS.MANAGE_PRICING,
      // Billetterie
      TICKETING_PERMISSIONS.SELL_TICKETS,
      TICKETING_PERMISSIONS.CONFIGURE_PRICING,
      TICKETING_PERMISSIONS.CONFIGURE_ZONES,
      TICKETING_PERMISSIONS.VIEW_REFUNDS,
      TICKETING_PERMISSIONS.VIEW_SALES_REPORTS,
      // Venues (consultation)
      VENUE_PERMISSIONS.READ,
      VENUE_PERMISSIONS.MANAGE_OWN,
      // Finance (vue limitée)
      FINANCE_PERMISSIONS.VIEW_PAYMENTS,
      FINANCE_PERMISSIONS.VIEW_REVENUE,
    ],
  },

  [ROLE_CODES.VENUE_ADMIN]: {
    code: ROLE_CODES.VENUE_ADMIN,
    name: 'Administrateur Venue',
    description: 'Administration complète d\'un lieu - Configuration et gestion',
    level: 60,
    isActive: true,
    permissions: [
      // Utilisateurs (lecture)
      USER_PERMISSIONS.READ_SELF,
      USER_PERMISSIONS.UPDATE_SELF,
      USER_PERMISSIONS.VIEW_PROFILE,
      // Venues (complet pour ses venues)
      ...Object.values(VENUE_PERMISSIONS),
      // Événements (lecture des événements dans ses venues)
      EVENT_PERMISSIONS.READ,
      EVENT_PERMISSIONS.MANAGE_PARTICIPANTS,
      // Billetterie (contrôle d'accès)
      TICKETING_PERMISSIONS.SCAN_QR,
      TICKETING_PERMISSIONS.MANUAL_ENTRY,
      TICKETING_PERMISSIONS.VIEW_ACCESS_LOGS,
      TICKETING_PERMISSIONS.MANAGE_ACCESS_RIGHTS,
      TICKETING_PERMISSIONS.VIEW_ACCESS_REPORTS,
    ],
  },

  [ROLE_CODES.VENUE_MANAGER]: {
    code: ROLE_CODES.VENUE_MANAGER,
    name: 'Manager Venue',
    description: 'Gestion opérationnelle d\'un lieu - Événements et accès',
    level: 50,
    isActive: true,
    permissions: [
      // Utilisateurs (profil personnel)
      USER_PERMISSIONS.READ_SELF,
      USER_PERMISSIONS.UPDATE_SELF,
      // Venues (gestion opérationnelle)
      VENUE_PERMISSIONS.READ,
      VENUE_PERMISSIONS.MANAGE_OWN,
      VENUE_PERMISSIONS.MANAGE_ZONES,
      VENUE_PERMISSIONS.MANAGE_ACCESS_POINTS,
      // Événements (lecture)
      EVENT_PERMISSIONS.READ,
      // Billetterie (contrôle d'accès)
      TICKETING_PERMISSIONS.SCAN_QR,
      TICKETING_PERMISSIONS.MANUAL_ENTRY,
      TICKETING_PERMISSIONS.VIEW_ACCESS_LOGS,
    ],
  },

  [ROLE_CODES.SECURITY_MANAGER]: {
    code: ROLE_CODES.SECURITY_MANAGER,
    name: 'Responsable Sécurité',
    description: 'Gestion de la sécurité - Contrôle d\'accès et incidents',
    level: 52,
    isActive: true,
    permissions: [
      // Authentification et sécurité
      AUTH_PERMISSIONS.VIEW_LOGIN_ATTEMPTS,
      AUTH_PERMISSIONS.MANAGE_BLACKLIST,
      AUTH_PERMISSIONS.VIEW_SECURITY_EVENTS,
      AUTH_PERMISSIONS.VIEW_SESSIONS,
      // Contrôle d'accès
      TICKETING_PERMISSIONS.SCAN_QR,
      TICKETING_PERMISSIONS.MANUAL_ENTRY,
      TICKETING_PERMISSIONS.VIEW_ACCESS_LOGS,
      TICKETING_PERMISSIONS.MANAGE_ACCESS_RIGHTS,
      // Utilisateurs (consultation sécuritaire)
      USER_PERMISSIONS.READ,
      USER_PERMISSIONS.VIEW_PROFILE,
      USER_PERMISSIONS.SUSPEND,
      // Système (logs de sécurité)
      SYSTEM_PERMISSIONS.VIEW_AUDIT_LOGS,
    ],
  },

  [ROLE_CODES.SUPPORT_AGENT]: {
    code: ROLE_CODES.SUPPORT_AGENT,
    name: 'Agent Support',
    description: 'Support client - Assistance utilisateurs et résolution incidents',
    level: 40,
    isActive: true,
    permissions: [
      // Utilisateurs (assistance)
      USER_PERMISSIONS.READ,
      USER_PERMISSIONS.VIEW_PROFILE,
      USER_PERMISSIONS.RESET_PASSWORD,
      USER_PERMISSIONS.VERIFY_EMAIL,
      USER_PERMISSIONS.VERIFY_PHONE,
      USER_PERMISSIONS.SEARCH,
      // Billetterie (support)
      TICKETING_PERMISSIONS.VIEW_SALES_REPORTS,
      TICKETING_PERMISSIONS.VIEW_REFUNDS,
      TICKETING_PERMISSIONS.PROCESS_REFUNDS,
      // Événements (consultation)
      EVENT_PERMISSIONS.READ,
      // Finance (consultation remboursements)
      FINANCE_PERMISSIONS.VIEW_PAYMENTS,
      FINANCE_PERMISSIONS.INITIATE_REFUNDS,
    ],
  },

  [ROLE_CODES.VALIDATOR]: {
    code: ROLE_CODES.VALIDATOR,
    name: 'Validateur',
    description: 'Validation de contenus - Modération et approbation',
    level: 30,
    isActive: true,
    permissions: [
      // Organisateurs (validation)
      ORGANIZER_PERMISSIONS.READ,
      ORGANIZER_PERMISSIONS.VALIDATE,
      ORGANIZER_PERMISSIONS.APPROVE,
      ORGANIZER_PERMISSIONS.REJECT,
      // Événements (validation)
      EVENT_PERMISSIONS.READ,
      EVENT_PERMISSIONS.UPDATE,
      // Venues (validation)
      VENUE_PERMISSIONS.READ,
      VENUE_PERMISSIONS.UPDATE,
    ],
  },

  [ROLE_CODES.STAFF]: {
    code: ROLE_CODES.STAFF,
    name: 'Personnel',
    description: 'Personnel terrain - Accès aux outils opérationnels quotidiens',
    level: 28,
    isActive: true,
    permissions: [
      // Contrôle d'accès de base
      TICKETING_PERMISSIONS.SCAN_QR,
      TICKETING_PERMISSIONS.MANUAL_ENTRY,
      // Consultation événements
      EVENT_PERMISSIONS.READ,
      // Profil personnel
      USER_PERMISSIONS.READ_SELF,
      USER_PERMISSIONS.UPDATE_SELF,
    ],
  },

  [ROLE_CODES.VIP_GOLD]: {
    code: ROLE_CODES.VIP_GOLD,
    name: 'VIP Gold',
    description: 'Membres VIP premium - Accès privilèges et services exclusifs',
    level: 12,
    isActive: true,
    permissions: [
      // Utilisateur de base
      USER_PERMISSIONS.READ_SELF,
      USER_PERMISSIONS.UPDATE_SELF,
      USER_PERMISSIONS.UPDATE_PROFILE,
      // Accès privilégié aux événements
      EVENT_PERMISSIONS.READ,
      // Billetterie VIP
      TICKETING_PERMISSIONS.SELL_TICKETS,
    ],
  },

  [ROLE_CODES.SUBSCRIBER]: {
    code: ROLE_CODES.SUBSCRIBER,
    name: 'Abonné',
    description: 'Abonnés réguliers - Accès prioritaire billetterie et contenus',
    level: 11,
    isActive: true,
    permissions: [
      // Utilisateur de base
      USER_PERMISSIONS.READ_SELF,
      USER_PERMISSIONS.UPDATE_SELF,
      USER_PERMISSIONS.UPDATE_PROFILE,
      // Événements
      EVENT_PERMISSIONS.READ,
      // Billetterie
      TICKETING_PERMISSIONS.SELL_TICKETS,
    ],
  },

  [ROLE_CODES.USER]: {
    code: ROLE_CODES.USER,
    name: 'Utilisateur',
    description: 'Utilisateurs standards - Accès de base aux fonctionnalités publiques',
    level: 10,
    isActive: true,
    permissions: [
      // Utilisateur de base
      USER_PERMISSIONS.READ_SELF,
      USER_PERMISSIONS.UPDATE_SELF,
      USER_PERMISSIONS.UPDATE_PROFILE,
      // Événements publics
      EVENT_PERMISSIONS.READ,
      // Billetterie de base
      TICKETING_PERMISSIONS.SELL_TICKETS,
    ],
  },
} as const;

/**
 * Hiérarchie des rôles par niveau (décroissant)
 */
export const ROLE_HIERARCHY = Object.values(SYSTEM_ROLES)
  .sort((a, b) => b.level - a.level)
  .map(role => role.code);

/**
 * Rôles d'administration (niveau >= 50)
 */
export const ADMIN_ROLES = Object.values(SYSTEM_ROLES)
  .filter(role => role.level >= 50)
  .map(role => role.code);

/**
 * Rôles d'organisateurs (niveaux 70-80)
 */
export const ORGANIZER_ROLES = [
  ROLE_CODES.ORGANIZER_ADMIN,
  ROLE_CODES.ORGANIZER_MANAGER,
];

/**
 * Rôles de venues (niveaux 50-60)
 */
export const VENUE_ROLES = [
  ROLE_CODES.VENUE_ADMIN,
  ROLE_CODES.VENUE_MANAGER,
];

/**
 * Rôles utilisateurs finaux (niveau <= 20)
 */
export const END_USER_ROLES = [
  ROLE_CODES.VIP_GOLD,
  ROLE_CODES.SUBSCRIBER,
  ROLE_CODES.USER,
];

/**
 * Vérification si un rôle peut assigner un autre rôle
 * (peut assigner un rôle de niveau inférieur ou égal)
 */
export const canAssignRole = (assignerRoleCode: string, targetRoleCode: string): boolean => {
  const assignerRole = SYSTEM_ROLES[assignerRoleCode as keyof typeof SYSTEM_ROLES];
  const targetRole = SYSTEM_ROLES[targetRoleCode as keyof typeof SYSTEM_ROLES];
  
  if (!assignerRole || !targetRole) return false;
  
  return assignerRole.level >= targetRole.level;
};

/**
 * Obtenir tous les rôles qu'un rôle peut assigner
 */
export const getAssignableRoles = (roleCode: string): string[] => {
  const role = SYSTEM_ROLES[roleCode as keyof typeof SYSTEM_ROLES];
  if (!role) return [];
  
  return Object.values(SYSTEM_ROLES)
    .filter(targetRole => targetRole.level <= role.level)
    .map(targetRole => targetRole.code);
};

/**
 * Type pour l'autocomplétion des codes de rôles
 */
export type RoleCode = keyof typeof SYSTEM_ROLES;