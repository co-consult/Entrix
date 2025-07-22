// src/modules/users/interfaces/invitation.interface.ts

import { InvitationType, InvitationStatus } from '../types/enums';
import { GroupRole } from '../types/group.types';
import { ValidationResult, PaginationParams } from './user.interface';

// Interface de service invitations
export interface IInvitationService {
  // CRUD de base
  create(invitationData: CreateInvitationData): Promise<Invitation>;
  findById(id: string): Promise<Invitation | null>;
  findByToken(token: string): Promise<Invitation | null>;
  update(id: string, updateData: UpdateInvitationData): Promise<Invitation>;
  delete(id: string): Promise<void>;
  
  // Gestion des invitations
  send(invitationData: SendInvitationData): Promise<Invitation>;
  sendBulk(bulkData: BulkInvitationData): Promise<BulkInvitationResult>;
  resend(id: string): Promise<Invitation>;
  cancel(id: string, cancelledBy: string): Promise<void>;
  
  // Réponses aux invitations
  accept(id: string, userId: string): Promise<InvitationResponse>;
  decline(id: string, userId: string, reason?: string): Promise<void>;
  
  // Recherche et listing
  findUserInvitations(userId: string, filters?: InvitationFilters): Promise<Invitation[]>;
  findPendingInvitations(contextId: string, type: InvitationType): Promise<Invitation[]>;
  findExpiredInvitations(): Promise<Invitation[]>;
  
  // Validation et vérification
  validateInvitation(id: string): Promise<InvitationValidation>;
  canInvite(inviterId: string, contextId: string, type: InvitationType): Promise<boolean>;
  
  // Nettoyage et maintenance
  cleanupExpired(): Promise<number>;
  sendReminders(): Promise<number>;
  
  // Statistiques
  getInvitationStats(contextId?: string, type?: InvitationType): Promise<InvitationStats>;
}

// Interface de repository invitations
export interface IInvitationRepository {
  create(data: CreateInvitationData): Promise<Invitation>;
  findById(id: string): Promise<Invitation | null>;
  findByToken(token: string): Promise<Invitation | null>;
  findMany(filters: InvitationFilters, pagination?: PaginationParams): Promise<Invitation[]>;
  update(id: string, data: UpdateInvitationData): Promise<Invitation>;
  delete(id: string): Promise<void>;
  count(filters?: InvitationFilters): Promise<number>;
  findExpired(): Promise<Invitation[]>;
}

// Invitation
export interface Invitation {
  id: string;
  type: InvitationType;
  status: InvitationStatus;
  token: string;
  
  // Contexte de l'invitation
  contextId: string; // ID du groupe, événement, etc.
  contextName: string;
  
  // Inviteur
  invitedBy: string;
  inviterName: string;
  
  // Invité
  invitedEmail?: string;
  invitedUserId?: string;
  invitedName?: string;
  
  // Détails de l'invitation
  proposedRole?: GroupRole;
  message?: string;
  metadata?: Record<string, any>;
  
  // Dates
  createdAt: Date;
  expiresAt: Date;
  respondedAt?: Date;
  
  // Suivi
  remindersSent: number;
  lastReminderAt?: Date;
  viewedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
}

// Données de création d'invitation
export interface CreateInvitationData {
  type: InvitationType;
  contextId: string;
  contextName: string;
  invitedBy: string;
  inviterName: string;
  invitedEmail?: string;
  invitedUserId?: string;
  invitedName?: string;
  proposedRole?: GroupRole;
  message?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

// Données de mise à jour d'invitation
export interface UpdateInvitationData {
  status?: InvitationStatus;
  respondedAt?: Date;
  remindersSent?: number;
  lastReminderAt?: Date;
  viewedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

// Données d'envoi d'invitation
export interface SendInvitationData {
  type: InvitationType;
  contextId: string;
  invitedEmail?: string;
  invitedUserId?: string;
  proposedRole?: GroupRole;
  message?: string;
  expiresInHours?: number;
  sendEmail?: boolean;
  sendSms?: boolean;
}

// Données d'invitation en masse
export interface BulkInvitationData {
  type: InvitationType;
  contextId: string;
  invitations: Array<{
    email?: string;
    userId?: string;
    name?: string;
    role?: GroupRole;
  }>;
  message?: string;
  expiresInHours?: number;
  sendEmail?: boolean;
}

// Résultat d'invitation en masse
export interface BulkInvitationResult {
  total: number;
  successful: Invitation[];
  failed: Array<{
    email?: string;
    userId?: string;
    error: string;
  }>;
}

// Réponse à une invitation
export interface InvitationResponse {
  invitation: Invitation;
  result?: {
    groupMember?: any;
    eventParticipant?: any;
    friendship?: any;
  };
  additionalActions?: string[];
}

// Filtres d'invitation
export interface InvitationFilters {
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
}

// Validation d'invitation
export interface InvitationValidation {
  isValid: boolean;
  isExpired: boolean;
  isAlreadyMember: boolean;
  canAccept: boolean;
  errors: string[];
  warnings: string[];
  invitation?: Invitation;
}

// Statistiques d'invitations
export interface InvitationStats {
  total: number;
  pending: number;
  accepted: number;
  declined: number;
  expired: number;
  cancelled: number;
  acceptanceRate: number;
  averageResponseTime: number; // en heures
  byType: Array<{
    type: InvitationType;
    count: number;
    acceptanceRate: number;
  }>;
  trend: Array<{
    date: string;
    sent: number;
    accepted: number;
    declined: number;
  }>;
}

// Interface de validation invitation
export interface IInvitationValidator {
  validateCreateData(data: CreateInvitationData): ValidationResult;
  validateSendData(data: SendInvitationData): ValidationResult;
  validateBulkData(data: BulkInvitationData): ValidationResult;
  validateEmail(email: string): boolean;
  validateMessage(message: string): boolean;
  validateExpiration(expiresAt: Date): boolean;
}

// Événement invitation
export interface InvitationEvent {
  type: 'INVITATION_SENT' | 'INVITATION_VIEWED' | 'INVITATION_ACCEPTED' | 'INVITATION_DECLINED' | 'INVITATION_EXPIRED' | 'REMINDER_SENT';
  invitationId: string;
  userId?: string;
  data: Record<string, any>;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Configuration d'email d'invitation
export interface InvitationEmailConfig {
  template: string;
  subject: string;
  variables: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

// Configuration de rappels
export interface ReminderConfig {
  enabled: boolean;
  intervals: number[]; // en heures [24, 72, 168]
  maxReminders: number;
  templates: {
    first: string;
    followUp: string;
    final: string;
  };
}