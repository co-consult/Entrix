// src/modules/users/types/invitation.types.ts

import { InvitationType, InvitationStatus } from './enums';
import { GroupRole } from './group.types';
import { UserBasicInfoResponse } from './user.types';

// Type de base pour invitation (version Prisma-like)
export interface InvitationBase {
  id: string;
  type: InvitationType;
  status: InvitationStatus;
  token: string;
  contextId: string;
  contextName: string;
  invitedBy: string;
  inviterName: string;
  invitedEmail?: string;
  invitedUserId?: string;
  invitedName?: string;
  proposedRole?: GroupRole;
  message?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  expiresAt: Date;
  respondedAt?: Date;
  remindersSent: number;
  lastReminderAt?: Date;
  viewedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
}

// Type de réponse pour invitation (ce que retourne l'API)
export interface InvitationResponse {
  id: string;
  type: InvitationType;
  status: InvitationStatus;
  token: string;
  contextId: string;
  contextName: string;
  inviter: UserBasicInfoResponse;
  invitedEmail?: string;
  invitedUserId?: string;
  invitedName?: string;
  proposedRole?: GroupRole;
  message?: string;
  createdAt: Date;
  expiresAt: Date;
  respondedAt?: Date;
  isExpired: boolean;
  daysUntilExpiry: number;
  invitationUrl: string;
  canAccept: boolean;
  canDecline: boolean;
  viewedAt?: Date;
  remindersSent: number;
}

// Type pour le résultat d'envoi d'invitation
export interface InvitationSendResponse {
  id: string;
  token: string;
  type: InvitationType;
  status: InvitationStatus;
  contextId: string;
  contextName: string;
  invitedEmail?: string;
  invitedUserId?: string;
  invitedName?: string;
  proposedRole?: GroupRole;
  expiresAt: Date;
  invitationUrl: string;
  emailSent: boolean;
  smsSent: boolean;
  message: string;
}

// Type pour le résultat d'invitation en masse
export interface BulkInvitationResponse {
  total: number;
  successful: number;
  failed: number;
  duplicates: number;
  processingTime: number;
  successfulInvitations: InvitationSendResponse[];
  failedInvitations: Array<{
    email?: string;
    userId?: string;
    name?: string;
    error: string;
    code: string;
  }>;
  duplicateInvitations?: Array<{
    email?: string;
    userId?: string;
    reason: string;
  }>;
  warnings?: string[];
  sendingStats?: {
    emailsSent: number;
    smsSent: number;
    batchesSent: number;
    averageDelayMs: number;
  };
}

// Type pour la réponse d'acceptation/refus
export interface InvitationActionResponse {
  invitation: InvitationResponse;
  action: 'ACCEPTED' | 'DECLINED';
  result?: {
    groupMember?: {
      id: string;
      role: GroupRole;
      joinedAt: Date;
    };
    eventParticipant?: {
      id: string;
      status: string;
      registeredAt: Date;
    };
    friendship?: {
      id: string;
      status: string;
      createdAt: Date;
    };
  };
  additionalActions?: Array<{
    type: string;
    description: string;
    completed: boolean;
  }>;
  redirectUrl?: string;
  welcomeMessage?: string;
}

// Type pour la validation d'invitation
export interface InvitationValidationResponse {
  isValid: boolean;
  isExpired: boolean;
  isAlreadyMember: boolean;
  isAlreadyResponded: boolean;
  canAccept: boolean;
  canDecline: boolean;
  errors: Array<{
    code: string;
    message: string;
  }>;
  warnings: Array<{
    code: string;
    message: string;
  }>;
  invitation?: InvitationResponse;
  contextInfo?: {
    name: string;
    type: string;
    memberCount?: number;
    isPrivate?: boolean;
    requiresApproval?: boolean;
  };
}

// Type pour les statistiques d'invitation
export interface InvitationStatsResponse {
  total: number;
  pending: number;
  accepted: number;
  declined: number;
  expired: number;
  cancelled: number;
  acceptanceRate: number;
  declineRate: number;
  expirationRate: number;
  averageResponseTime: number; // en heures
  byType: Array<{
    type: InvitationType;
    count: number;
    acceptanceRate: number;
    averageResponseTime: number;
  }>;
  byPeriod: Array<{
    period: string; // 'YYYY-MM-DD'
    sent: number;
    accepted: number;
    declined: number;
    expired: number;
  }>;
  topInviters: Array<{
    userId: string;
    userName: string;
    invitationsSent: number;
    acceptanceRate: number;
  }>;
}

// Type pour le résultat de recherche paginée d'invitations
export interface PaginatedInvitationResponse {
  data: InvitationResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Type pour les filtres de recherche d'invitations
export interface InvitationSearchFilters {
  type?: InvitationType;
  status?: InvitationStatus;
  contextId?: string;
  invitedBy?: string;
  invitedEmail?: string;
  invitedUserId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  expiresAfter?: Date;
  expiresBefore?: Date;
  hasViewed?: boolean;
  search?: string; // Recherche globale dans nom, email, contexte
}

// Type pour les données d'invitation minimales (pour listings)
export type InvitationSummary = Pick<InvitationResponse, 
  'id' | 'type' | 'status' | 'contextName' | 'invitedEmail' | 'invitedName' | 'createdAt' | 'expiresAt' | 'isExpired'
>;

// Type pour les invitations d'un utilisateur
export interface UserInvitationsResponse {
  received: InvitationResponse[];
  sent: InvitationResponse[];
  summary: {
    receivedCount: number;
    sentCount: number;
    pendingReceived: number;
    pendingSent: number;
    acceptedReceived: number;
    acceptedSent: number;
  };
}