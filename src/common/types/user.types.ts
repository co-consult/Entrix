// src/common/types/user.types.ts
/**
 * Types et interfaces pour les utilisateurs Entrix
 * 
 * Contient :
 * - Types pour les utilisateurs et profils
 * - Types pour les recherches et filtres
 * - Types pour les opérations CRUD
 * - Types pour la validation et vérification
 * - Types pour les préférences utilisateur
 * 
 * Basé sur le schema Prisma et les tables users/user_profiles
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { 
  gender, 
  membership_status,
  mfa_method 
} from '@prisma/client';

/**
 * Utilisateur complet avec profil et relations
 */
export interface User {
  /** ID utilisateur */
  id: string;
  /** Email */
  email: string;
  /** Téléphone */
  phone?: string;
  /** Prénom */
  firstName: string;
  /** Nom de famille */
  lastName: string;
  /** Avatar URL */
  avatar?: string;
  /** Compte actif */
  isActive: boolean;
  /** Email vérifié */
  emailVerified?: Date;
  /** Téléphone vérifié */
  phoneVerified?: Date;
  /** Type de document d'identité */
  identityDocumentType?: 'CIN' | 'PASSPORT' | 'DRIVING_LICENSE' | 'RESIDENCE_PERMIT' | 'MILITARY_ID' | 'STUDENT_ID' | 'PROFESSIONAL_ID' | 'OTHER';
  /** Numéro du document d'identité */
  identityDocumentNumber?: string;
  /** Identité vérifiée */
  identityVerified: boolean;
  /** Date vérification identité */
  identityVerifiedAt?: Date;
  /** Date création */
  createdAt: Date;
  /** Dernière modification */
  updatedAt: Date;
  /** Dernière connexion */
  lastLogin?: Date;
  /** Profil étendu */
  profile?: UserProfile;
  /** Rôles */
  roles?: UserRoleAssignment[];
  /** Groupes */
  groups?: UserGroupAssignment[];
}

/**
 * Profil utilisateur étendu
 */
export interface UserProfile {
  /** ID profil */
  id: string;
  /** ID utilisateur */
  userId: string;
  /** Date naissance */
  dateOfBirth?: Date;
  /** Genre */
  gender?: gender;
  /** Adresse */
  address?: string;
  /** Ville */
  city?: string;
  /** Pays (code ISO) */
  country: string;
  /** Code postal */
  postalCode?: string;
  /** Langue (code ISO) */
  language: string;
  /** Fuseau horaire */
  timezone: string;
  /** Notifications activées */
  notifications: boolean;
  /** Newsletter activée */
  newsletter: boolean;
  /** Supporter depuis */
  supporterSince?: Date;
  /** Joueur favori */
  favoritePlayer?: string;
  /** Équipe favorite ID */
  favoriteTeamId?: string;
  /** Préférences JSON */
  preferences?: UserPreferences;
  /** Contact d'urgence */
  emergencyContact?: EmergencyContact;
  /** Identité vérifiée */
  identityVerified?: boolean;
  /** Date création */
  createdAt: Date;
  /** Dernière modification */
  updatedAt: Date;
}

/**
 * Préférences utilisateur
 */
export interface UserPreferences {
  /** Thème interface */
  theme?: 'light' | 'dark' | 'auto';
  /** Notifications push */
  pushNotifications?: {
    events: boolean;
    reminders: boolean;
    offers: boolean;
    security: boolean;
  };
  /** Préférences email */
  emailNotifications?: {
    marketing: boolean;
    transactional: boolean;
    security: boolean;
    newsletters: boolean;
  };
  /** Préférences événements */
  eventPreferences?: {
    categories: string[];
    venues: string[];
    priceRange: {
      min: number;
      max: number;
    };
    daysAdvance: number;
  };
  /** Accessibilité */
  accessibility?: {
    largeText: boolean;
    highContrast: boolean;
    screenReader: boolean;
    reducedMotion: boolean;
  };
  /** Préférences de confidentialité */
  privacy?: {
    profileVisible: boolean;
    activityVisible: boolean;
    contactVisible: boolean;
  };
}

/**
 * Contact d'urgence
 */
export interface EmergencyContact {
  /** Nom complet */
  fullName: string;
  /** Relation */
  relationship: string;
  /** Téléphone */
  phone: string;
  /** Email */
  email?: string;
  /** Adresse */
  address?: string;
}

/**
 * Assignation de rôle à un utilisateur
 */
export interface UserRoleAssignment {
  /** ID assignation */
  id: string;
  /** ID utilisateur */
  userId: string;
  /** ID rôle */
  roleId: string;
  /** Date assignation */
  assignedAt: Date;
  /** Valide jusqu'à */
  validUntil?: Date;
  /** Statut */
  status: membership_status;
  /** Assigné par */
  assignedBy?: string;
  /** Notes */
  notes?: string;
  /** Rôle complet */
  role?: UserRole;
}

/**
 * Rôle utilisateur simplifié
 */
export interface UserRole {
  /** ID rôle */
  id: string;
  /** Code rôle */
  code: string;
  /** Nom rôle */
  name: string;
  /** Description */
  description?: string;
  /** Niveau hiérarchique */
  level: number;
  /** Actif */
  isActive: boolean;
  /** Permissions */
  permissions?: Record<string, any>;
}

/**
 * Assignation de groupe à un utilisateur
 */
export interface UserGroupAssignment {
  /** ID assignation */
  id: string;
  /** ID utilisateur */
  userId: string;
  /** ID groupe */
  groupId: string;
  /** Date adhésion */
  joinedAt: Date;
  /** Valide jusqu'à */
  validUntil?: Date;
  /** Statut */
  status: membership_status;
  /** Ajouté par */
  addedBy?: string;
  /** Métadonnées */
  metadata?: Record<string, any>;
  /** Groupe complet */
  group?: UserGroup;
}

/**
 * Groupe utilisateur
 */
export interface UserGroup {
  /** ID groupe */
  id: string;
  /** Code groupe */
  code: string;
  /** Nom groupe */
  name: string;
  /** Description */
  description?: string;
  /** Type de groupe */
  type: string;
  /** Actif */
  isActive: boolean;
  /** Membres maximum */
  maxMembers?: number;
  /** Métadonnées */
  metadata?: Record<string, any>;
}

/**
 * Critères de recherche utilisateur
 */
export interface UserSearchCriteria {
  /** Terme de recherche */
  search?: string;
  /** Email */
  email?: string;
  /** Prénom */
  firstName?: string;
  /** Nom */
  lastName?: string;
  /** Téléphone */
  phone?: string;
  /** Statut actif */
  isActive?: boolean;
  /** Email vérifié */
  emailVerified?: boolean;
  /** Téléphone vérifié */
  phoneVerified?: boolean;
  /** Rôles */
  roles?: string[];
  /** Groupes */
  groups?: string[];
  /** Ville */
  city?: string;
  /** Pays */
  country?: string;
  /** Genre */
  gender?: gender;
  /** Type de document d'identité */
  identityDocumentType?: 'CIN' | 'PASSPORT' | 'DRIVING_LICENSE' | 'RESIDENCE_PERMIT' | 'MILITARY_ID' | 'STUDENT_ID' | 'PROFESSIONAL_ID' | 'OTHER';
  /** Numéro du document d'identité */
  identityDocumentNumber?: string;
  /** Identité vérifiée */
  identityVerified?: boolean;
  /** Date vérification identité */
  identityVerifiedAt?: Date;
  /** Âge minimum */
  minAge?: number;
  /** Âge maximum */
  maxAge?: number;
  /** Supporter depuis */
  supporterSince?: Date;
  /** Créé après */
  createdAfter?: Date;
  /** Créé avant */
  createdBefore?: Date;
  /** Dernière connexion après */
  lastLoginAfter?: Date;
  /** Dernière connexion avant */
  lastLoginBefore?: Date;
}

/**
 * Options de pagination et tri
 */
export interface UserSearchOptions {
  /** Page */
  page?: number;
  /** Limite par page */
  limit?: number;
  /** Tri */
  orderBy?: {
    field: keyof User | keyof UserProfile;
    direction: 'asc' | 'desc';
  };
  /** Inclure profil */
  includeProfile?: boolean;
  /** Inclure rôles */
  includeRoles?: boolean;
  /** Inclure groupes */
  includeGroups?: boolean;
}

/**
 * Résultat de recherche paginé
 */
export interface UserSearchResult {
  /** Utilisateurs trouvés */
  users: User[];
  /** Total */
  total: number;
  /** Page courante */
  page: number;
  /** Limite par page */
  limit: number;
  /** Total pages */
  totalPages: number;
  /** Page suivante */
  hasNext: boolean;
  /** Page précédente */
  hasPrev: boolean;
}

/**
 * Données pour création utilisateur
 */
export interface CreateUserData {
  /** Email */
  email: string;
  /** Mot de passe */
  password: string;
  /** Prénom */
  firstName: string;
  /** Nom */
  lastName: string;
  /** Téléphone */
  phone?: string;
  /** Avatar */
  avatar?: string;
  /** Profil initial */
  profile?: Partial<CreateUserProfileData>;
  /** Rôles initiaux */
  roles?: string[];
  /** Groupes initiaux */
  groups?: string[];
}

/**
 * Données pour mise à jour utilisateur
 */
export interface UpdateUserData {
  /** Email */
  email?: string;
  /** Prénom */
  firstName?: string;
  /** Nom */
  lastName?: string;
  /** Téléphone */
  phone?: string;
  /** Avatar */
  avatar?: string;
  /** Statut actif */
  isActive?: boolean;
}

/**
 * Données pour création profil utilisateur
 */
export interface CreateUserProfileData {
  /** Date naissance */
  dateOfBirth?: Date;
  /** Genre */
  gender?: gender;
  /** Adresse */
  address?: string;
  /** Ville */
  city?: string;
  /** Pays */
  country?: string;
  /** Code postal */
  postalCode?: string;
  /** Langue */
  language?: string;
  /** Fuseau horaire */
  timezone?: string;
  /** Notifications */
  notifications?: boolean;
  /** Newsletter */
  newsletter?: boolean;
  /** Supporter depuis */
  supporterSince?: Date;
  /** Joueur favori */
  favoritePlayer?: string;
  /** Équipe favorite */
  favoriteTeamId?: string;
  /** Type de document d'identité */
  identityDocumentType?: 'CIN' | 'PASSPORT' | 'DRIVING_LICENSE' | 'RESIDENCE_PERMIT' | 'MILITARY_ID' | 'STUDENT_ID' | 'PROFESSIONAL_ID' | 'OTHER';
  /** Numéro du document d'identité */
  identityDocumentNumber?: string;
  /** Identité vérifiée */
  identityVerified?: boolean;
  /** Date vérification identité */
  identityVerifiedAt?: Date;
  /** Préférences */
  preferences?: UserPreferences;
  /** Contact d'urgence */
  emergencyContact?: EmergencyContact;
}

/**
 * Données pour mise à jour profil
 */
export interface UpdateUserProfileData extends Partial<CreateUserProfileData> {}

/**
 * Statistiques utilisateur
 */
export interface UserStatistics {
  /** Total utilisateurs */
  totalUsers: number;
  /** Utilisateurs actifs */
  activeUsers: number;
  /** Utilisateurs vérifiés */
  verifiedUsers: number;
  /** Nouveaux utilisateurs (30j) */
  newUsers: number;
  /** Répartition par genre */
  genderDistribution: Record<string, number>;
  /** Répartition par pays */
  countryDistribution: Record<string, number>;
  /** Répartition par âge */
  ageDistribution: Record<string, number>;
  /** Utilisateurs par rôle */
  roleDistribution: Record<string, number>;
}

/**
 * Activité utilisateur
 */
export interface UserActivity {
  /** ID activité */
  id: string;
  /** ID utilisateur */
  userId: string;
  /** Type d'activité */
  type: string;
  /** Description */
  description: string;
  /** Données activité */
  data?: Record<string, any>;
  /** Adresse IP */
  ipAddress?: string;
  /** User agent */
  userAgent?: string;
  /** Date */
  createdAt: Date;
}

/**
 * Validation utilisateur
 */
export interface UserValidation {
  /** Email valide */
  emailValid: boolean;
  /** Téléphone valide */
  phoneValid: boolean;
  /** Identité vérifiée */
  identityVerified: boolean;
  /** Profil complet */
  profileComplete: boolean;
  /** Documents fournis */
  documentsProvided: boolean;
  /** Score de confiance */
  trustScore: number;
  /** Dernière validation */
  lastValidated: Date;
}

/**
 * Statut de vérification KYC
 */
export interface KycStatus {
  /** Niveau de vérification */
  level: 'UNVERIFIED' | 'PARTIALLY_VERIFIED' | 'FULLY_VERIFIED';
  /** Email vérifié */
  emailVerified: boolean;
  /** Téléphone vérifié */
  phoneVerified: boolean;
  /** Identité vérifiée */
  identityVerified: boolean;
  /** Document fourni */
  documentProvided: boolean;
  /** Type de document */
  documentType?: 'CIN' | 'PASSPORT' | 'DRIVING_LICENSE' | 'RESIDENCE_PERMIT' | 'MILITARY_ID' | 'STUDENT_ID' | 'PROFESSIONAL_ID' | 'OTHER';
  /** Date dernière vérification */
  lastVerifiedAt?: Date;
  /** Score de confiance (0-100) */
  trustScore: number;
}

/**
 * Configuration MFA utilisateur
 */
export interface UserMfaConfig {
  /** MFA activé */
  enabled: boolean;
  /** Méthodes configurées */
  methods: {
    [K in mfa_method]?: {
      enabled: boolean;
      verified: boolean;
      configuredAt: Date;
      lastUsed?: Date;
    };
  };
  /** Codes de secours */
  backupCodes?: {
    codes: string[];
    generatedAt: Date;
    usedCodes: string[];
  };
  /** Méthode par défaut */
  defaultMethod?: mfa_method;
  /** Dernière vérification */
  lastVerified?: Date;
}

/**
 * Session utilisateur
 */
export interface UserSession {
  /** ID session */
  id: string;
  /** Token session */
  sessionToken: string;
  /** ID utilisateur */
  userId: string;
  /** Adresse IP */
  ipAddress: string;
  /** User agent */
  userAgent?: string;
  /** Empreinte device */
  deviceFingerprint?: string;
  /** Géolocalisation */
  geolocation?: Record<string, any>;
  /** Session active */
  isActive: boolean;
  /** Dernière activité */
  lastActivity: Date;
  /** Expiration */
  expiresAt: Date;
  /** Date création */
  createdAt: Date;
  /** Dernière modification */
  updatedAt: Date;
}

/**
 * Préférences de notification
 */
export interface NotificationPreferences {
  /** Email */
  email: {
    /** Événements */
    events: boolean;
    /** Rappels */
    reminders: boolean;
    /** Offres */
    offers: boolean;
    /** Sécurité */
    security: boolean;
    /** Newsletter */
    newsletter: boolean;
    /** Fréquence */
    frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
  };
  /** Push */
  push: {
    /** Événements */
    events: boolean;
    /** Rappels */
    reminders: boolean;
    /** Offres */
    offers: boolean;
    /** Sécurité */
    security: boolean;
    /** Temps avant événement (heures) */
    eventReminder: number;
  };
  /** SMS */
  sms: {
    /** Événements critiques */
    critical: boolean;
    /** Sécurité */
    security: boolean;
    /** Rappels */
    reminders: boolean;
  };
}

/**
 * Données d'export utilisateur
 */
export interface UserExportData {
  /** Informations de base */
  basicInfo: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    createdAt: Date;
  };
  /** Profil */
  profile?: UserProfile;
  /** Historique des rôles */
  roleHistory: UserRoleAssignment[];
  /** Historique des groupes */
  groupHistory: UserGroupAssignment[];
  /** Sessions */
  sessions: UserSession[];
  /** Activités */
  activities: UserActivity[];
  /** Préférences */
  preferences: UserPreferences;
  /** Date export */
  exportedAt: Date;
}

/**
 * Rapport utilisateur
 */
export interface UserReport {
  /** Période */
  period: {
    from: Date;
    to: Date;
  };
  /** Statistiques */
  statistics: UserStatistics;
  /** Tendances */
  trends: {
    registration: Array<{ date: Date; count: number }>;
    activity: Array<{ date: Date; active: number }>;
    verification: Array<{ date: Date; verified: number }>;
  };
  /** Top villes */
  topCities: Array<{ city: string; count: number }>;
  /** Top pays */
  topCountries: Array<{ country: string; count: number }>;
  /** Date génération */
  generatedAt: Date;
}

/**
 * Filtre pour opérations en lot
 */
export interface BulkOperationFilter {
  /** IDs spécifiques */
  userIds?: string[];
  /** Critères de recherche */
  criteria?: UserSearchCriteria;
  /** Exclure IDs */
  excludeIds?: string[];
}

/**
 * Opération en lot
 */
export interface BulkOperation {
  /** Type d'opération */
  type: 'activate' | 'deactivate' | 'delete' | 'assign_role' | 'remove_role' | 'add_group' | 'remove_group';
  /** Filtre */
  filter: BulkOperationFilter;
  /** Données spécifiques */
  data?: Record<string, any>;
  /** Utilisateur exécutant */
  executedBy: string;
  /** Date exécution */
  executedAt: Date;
}

/**
 * Résultat opération en lot
 */
export interface BulkOperationResult {
  /** Succès total */
  totalProcessed: number;
  /** Succès */
  successful: number;
  /** Échecs */
  failed: number;
  /** Erreurs détaillées */
  errors: Array<{
    userId: string;
    error: string;
  }>;
  /** Durée */
  duration: number;
}

/**
 * Type union pour les statuts utilisateur
 */
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'deleted';

/**
 * Type union pour les types de vérification
 */
export type VerificationType = 'email' | 'phone' | 'identity' | 'address';

/**
 * Type union pour les niveaux de confiance
 */
export type TrustLevel = 'low' | 'medium' | 'high' | 'verified';

/**
 * Interface pour la pagination générique
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Interface pour la réponse paginée générique
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}