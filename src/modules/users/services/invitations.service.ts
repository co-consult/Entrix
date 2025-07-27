// src/modules/users/services/invitations.service.ts

import { 
  Injectable, 
  NotFoundException, 
  BadRequestException, 
  ForbiddenException, 
  ConflictException 
} from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { EmailService } from '../../../shared/email/email.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { BullmqService } from '../../../shared/bullmq/bullmq.service';
import { users, user_groups, groups } from '@prisma/client';
import { SendInvitationDto } from '../dto/invitations/send-invitation.dto';
import { RespondInvitationDto } from '../dto/invitations/respond-invitation.dto';
import { BulkInvitationDto } from '../dto/invitations/bulk-invitation.dto';
import { INVITATION_CONSTANTS, GROUP_CONSTANTS } from '../constants';
import { InvitationType, InvitationStatus, MembershipStatus } from '../types/enums';
import * as crypto from 'crypto';

// Types internes pour les invitations (stockées dans metadata)
interface StoredInvitation {
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
  proposedRole?: string;
  message?: string;
  createdAt: string;
  expiresAt: string;
  respondedAt?: string;
  remindersSent: number;
  lastReminderAt?: string;
  viewedAt?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface InvitationResult {
  id: string;
  token: string;
  type: InvitationType;
  status: InvitationStatus;
  contextId: string;
  contextName: string;
  invitedEmail?: string;
  invitedUserId?: string;
  expiresAt: Date;
  invitationUrl: string;
  emailSent: boolean;
  smsSent: boolean;
}

interface BulkInvitationResult {
  total: number;
  successful: InvitationResult[];
  failed: Array<{
    email?: string;
    userId?: string;
    name?: string;
    error: string;
    code: string;
  }>;
  duplicates?: Array<{
    email?: string;
    userId?: string;
    reason: string;
  }>;
  processingTime: number;
  warnings?: string[];
}

interface InvitationValidation {
  isValid: boolean;
  isExpired: boolean;
  isAlreadyMember: boolean;
  canAccept: boolean;
  errors: string[];
  warnings: string[];
  invitation?: StoredInvitation;
}

interface InvitationStats {
  total: number;
  pending: number;
  accepted: number;
  declined: number;
  expired: number;
  cancelled: number;
  acceptanceRate: number;
  averageResponseTime: number;
}

@Injectable()
export class InvitationsService {
  private readonly logger: LoggerService;
  private readonly CACHE_PREFIX = 'invitations:';
  private readonly TOKEN_LENGTH = 64;

  constructor(
    private readonly prisma: PrismaService,
    loggerService: LoggerService,
    private readonly email: EmailService,
    private readonly redis: RedisService,
    private readonly bullmq: BullmqService,
  ) {
    this.logger = loggerService.createChildLogger('InvitationsService');
  }

  /**
   * Envoie une invitation unique
   */
  async send(invitationData: SendInvitationDto, invitedBy: string): Promise<InvitationResult> {
    this.logger.info('Sending invitation', JSON.stringify({
      type: invitationData.type,
      contextId: invitationData.contextId,
      invitedEmail: invitationData.invitedEmail,
      invitedUserId: invitationData.invitedUserId,
      invitedBy
    }));

    const startTime = Date.now();

    try {
      // Vérifier que l'inviteur existe et a les permissions
      await this.validateInviterPermissions(invitedBy, invitationData.contextId, invitationData.type);

      // Vérifier les limites d'invitation
      await this.checkInvitationLimits(invitedBy);

      // Vérifier si l'invitation n'existe pas déjà
      await this.checkExistingInvitation(invitationData, invitedBy);

      // Générer le token et l'ID unique
      const invitationId = crypto.randomUUID();
      const token = crypto.randomBytes(this.TOKEN_LENGTH / 2).toString('hex');

      // Obtenir les informations du contexte et de l'inviteur
      const contextName = await this.getContextName(invitationData.contextId, invitationData.type);
      const inviterName = await this.getInviterName(invitedBy);

      // Créer l'objet invitation
      const invitation: StoredInvitation = {
        id: invitationId,
        type: invitationData.type as InvitationType,
        status: InvitationStatus.PENDING,
        token,
        contextId: invitationData.contextId,
        contextName,
        invitedBy,
        inviterName,
        invitedEmail: invitationData.invitedEmail,
        invitedUserId: invitationData.invitedUserId,
        invitedName: invitationData.invitedName,
        proposedRole: invitationData.proposedRole || GROUP_CONSTANTS.ROLES.MEMBER,
        message: invitationData.message,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + (invitationData.expiresInHours || INVITATION_CONSTANTS.EXPIRATION.GROUP) * 60 * 60 * 1000).toISOString(),
        remindersSent: 0,
      };

      // Stocker l'invitation dans les métadonnées de user_groups
      await this.storeInvitation(invitation);

      // Mettre en cache l'invitation pour un accès rapide
      await this.cacheInvitation(invitation);

      // Envoyer l'email d'invitation si demandé
      let emailSent = false;
      if (invitationData.sendEmail !== false && invitationData.invitedEmail) {
        emailSent = await this.sendInvitationEmail(invitation);
      }

      // Envoyer SMS si demandé (fonctionnalité future)
      let smsSent = false;
      if (invitationData.sendSms === true) {
        smsSent = await this.sendInvitationSms(invitation);
      }

      // Programmer les rappels automatiques
      if (emailSent) {
        await this.scheduleReminders(invitation);
      }

      const result: InvitationResult = {
        id: invitationId,
        token,
        type: invitation.type,
        status: invitation.status,
        contextId: invitation.contextId,
        contextName: invitation.contextName,
        invitedEmail: invitation.invitedEmail,
        invitedUserId: invitation.invitedUserId,
        expiresAt: new Date(invitation.expiresAt),
        invitationUrl: `${process.env.FRONTEND_URL}/invitations/${token}`,
        emailSent,
        smsSent,
      };

      this.logger.info('Invitation sent successfully', JSON.stringify({
        invitationId,
        type: invitation.type,
        invitedEmail: invitation.invitedEmail,
        processingTime: Date.now() - startTime
      }));

      return result;

    } catch (error) {
      this.logger.logErrorEvent(error, 'InvitationsService.send', JSON.stringify({
        contextId: invitationData.contextId,
        invitedEmail: invitationData.invitedEmail,
        invitedBy
      }));
      throw error;
    }
  }

  /**
   * Envoie des invitations en masse
   */
  async sendBulk(bulkData: BulkInvitationDto, invitedBy: string): Promise<BulkInvitationResult> {
    this.logger.info('Sending bulk invitations', JSON.stringify({
      type: bulkData.type,
      contextId: bulkData.contextId,
      count: bulkData.invitations.length,
      invitedBy
    }));

    const startTime = Date.now();
    const result: BulkInvitationResult = {
      total: bulkData.invitations.length,
      successful: [],
      failed: [],
      duplicates: [],
      processingTime: 0,
      warnings: [],
    };

    try {
      // Vérifier les permissions une seule fois
      await this.validateInviterPermissions(invitedBy, bulkData.contextId, bulkData.type);

      // Vérifier les limites globales
      await this.checkBulkInvitationLimits(invitedBy, bulkData.invitations.length);

      // Traiter chaque invitation
      for (let i = 0; i < bulkData.invitations.length; i++) {
        const inviteData = bulkData.invitations[i];
        
        try {
          // Délai entre les envois pour éviter le spam
          if (i > 0 && bulkData.batchSend !== false) {
            await new Promise(resolve => setTimeout(resolve, (bulkData.sendDelay || 2) * 1000));
          }

          const singleInvitation: SendInvitationDto = {
            type: bulkData.type,
            contextId: bulkData.contextId,
            invitedEmail: inviteData.email,
            invitedUserId: inviteData.userId,
            invitedName: inviteData.name,
            proposedRole: inviteData.role || bulkData.defaultRole,
            message: inviteData.personalMessage || bulkData.message,
            expiresInHours: bulkData.expiresInHours,
            sendEmail: bulkData.sendEmail,
            sendSms: bulkData.sendSms
          };

          const invitation = await this.send(singleInvitation, invitedBy);
          result.successful.push(invitation);

        } catch (error) {
          this.logger.logErrorEvent(error, 'InvitationsService.sendBulk.individual', JSON.stringify({
            email: inviteData.email,
            userId: inviteData.userId,
            name: inviteData.name
          }));

          result.failed.push({
            email: inviteData.email,
            userId: inviteData.userId,
            name: inviteData.name,
            error: error.message,
            code: 'SEND_FAILED'
          });

          // Arrêter si continueOnError est false
          if (bulkData.continueOnError === false) {
            break;
          }
        }
      }

      result.processingTime = Date.now() - startTime;

      this.logger.info('Bulk invitations completed', JSON.stringify({
        total: result.total,
        successful: result.successful.length,
        failed: result.failed.length,
        processingTime: result.processingTime
      }));

      return result;

    } catch (error) {
      this.logger.logErrorEvent(error, 'InvitationsService.sendBulk', JSON.stringify({
        contextId: bulkData.contextId,
        type: bulkData.type,
        count: bulkData.invitations.length
      }));
      throw error;
    }
  }

  /**
   * Accepte une invitation
   */
  async accept(token: string, userId: string, ipAddress?: string, userAgent?: string): Promise<any> {
    this.logger.info('Accepting invitation', JSON.stringify({ token, userId }));

    try {
      // Récupérer et valider l'invitation
      const invitation = await this.findByToken(token);
      if (!invitation) {
        throw new NotFoundException(INVITATION_CONSTANTS.ERRORS.INVITATION_NOT_FOUND);
      }

      // Valider l'invitation
      const validation = await this.validateInvitation(invitation);
      if (!validation.canAccept) {
        throw new BadRequestException(validation.errors.join(', '));
      }

      let result: any = {};

      await this.prisma.$transaction(async (tx) => {
        // Marquer l'invitation comme acceptée
        await this.updateInvitationStatus(
          invitation,
          InvitationStatus.ACCEPTED,
          userId,
          undefined,
          ipAddress,
          userAgent
        );

        // Traiter l'acceptation selon le type
        switch (invitation.type) {
          case InvitationType.GROUP:
            result.groupMember = await this.processGroupInvitationAcceptance(
              tx,
              invitation,
              userId
            );
            break;

          case InvitationType.EVENT:
            result.eventParticipant = await this.processEventInvitationAcceptance(
              tx,
              invitation,
              userId
            );
            break;

          case InvitationType.FRIEND:
            result.friendship = await this.processFriendInvitationAcceptance(
              tx,
              invitation,
              userId
            );
            break;

          default:
            throw new BadRequestException('Type d\'invitation non supporté');
        }

        // Envoyer les notifications de confirmation
        await this.sendAcceptanceNotifications(invitation, userId);
      });

      // Supprimer l'invitation du cache
      await this.removeFromCache(invitation.token);

      this.logger.info('Invitation accepted successfully', JSON.stringify({
        invitationId: invitation.id,
        userId,
        type: invitation.type
      }));

      return {
        invitation,
        result,
        additionalActions: this.getPostAcceptanceActions(invitation)
      };

    } catch (error) {
      this.logger.logErrorEvent(error, 'InvitationsService.accept', JSON.stringify({ token, userId }));
      throw error;
    }
  }

  /**
   * Refuse une invitation
   */
  async decline(token: string, userId: string, reason?: string, ipAddress?: string, userAgent?: string): Promise<void> {
    this.logger.info('Declining invitation', JSON.stringify({ token, userId, reason }));

    try {
      const invitation = await this.findByToken(token);
      if (!invitation) {
        throw new NotFoundException(INVITATION_CONSTANTS.ERRORS.INVITATION_NOT_FOUND);
      }

      if (invitation.status !== InvitationStatus.PENDING) {
        throw new BadRequestException(INVITATION_CONSTANTS.ERRORS.INVITATION_ALREADY_RESPONDED);
      }

      await this.updateInvitationStatus(
        invitation,
        InvitationStatus.DECLINED,
        userId,
        reason,
        ipAddress,
        userAgent
      );

      // Notifier l'inviteur
      await this.sendDeclineNotification(invitation, userId, reason);

      // Supprimer du cache
      await this.removeFromCache(invitation.token);

      this.logger.info('Invitation declined successfully', JSON.stringify({
        invitationId: invitation.id,
        userId
      }));

    } catch (error) {
      this.logger.logErrorEvent(error, 'InvitationsService.decline', JSON.stringify({ token, userId }));
      throw error;
    }
  }

  /**
   * Recherche une invitation par token
   */
  async findByToken(token: string): Promise<StoredInvitation | null> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.redis.getCache<StoredInvitation>(`${this.CACHE_PREFIX}token:${token}`);
      if (cached) {
        return cached;
      }

      // Rechercher dans les métadonnées de user_groups
      const userGroup = await this.prisma.user_groups.findFirst({
        where: {
          metadata: {
            path: ['invitation', 'token'],
            equals: token
          }
        },
        include: {
          users_user_groups_user_idTousers: true,
          groups: true
        }
      });

      if (!userGroup?.metadata) {
        return null;
      }

      const invitation = (userGroup.metadata as any).invitation as StoredInvitation;
      
      // Mettre en cache pour les prochaines requêtes
      await this.cacheInvitation(invitation);

      return invitation;

    } catch (error) {
      this.logger.logErrorEvent(error, 'InvitationsService.findByToken', JSON.stringify({ token }));
      return null;
    }
  }

  /**
   * Nettoie les invitations expirées
   */
  async cleanupExpired(): Promise<number> {
    this.logger.info('Starting cleanup of expired invitations');

    try {
      const now = new Date().toISOString();
      
      // Mettre à jour les invitations expirées dans les métadonnées
      const result = await this.prisma.user_groups.updateMany({
        where: {
          metadata: {
            path: ['invitation', 'expiresAt'],
            lt: now
          },
          AND: {
            metadata: {
              path: ['invitation', 'status'],
              equals: InvitationStatus.PENDING
            }
          }
        },
        data: {
          metadata: {
            invitation: {
              status: InvitationStatus.EXPIRED,
              expiredAt: now
            }
          }
        }
      });

      // Nettoyer le cache des invitations expirées
      await this.cleanExpiredFromCache();

      this.logger.info('Expired invitations cleanup completed', JSON.stringify({
        expiredCount: result.count
      }));

      return result.count;

    } catch (error) {
      this.logger.logErrorEvent(error, 'InvitationsService.cleanupExpired');
      throw new Error('Erreur lors du nettoyage des invitations expirées');
    }
  }

  /**
   * Récupère les statistiques d'invitations
   */
  async getStats(contextId?: string, type?: InvitationType): Promise<InvitationStats> {
    try {
      const where: any = {
        metadata: {
          path: ['invitation'],
          not: null
        }
      };

      if (contextId) {
        where.metadata = {
          ...where.metadata,
          path: ['invitation', 'contextId'],
          equals: contextId
        };
      }

      if (type) {
        where.metadata = {
          ...where.metadata,
          path: ['invitation', 'type'],
          equals: type
        };
      }

      // Cette requête nécessiterait des opérations complexes sur JSON
      // Pour l'instant, retourner des stats basiques
      const totalInvitations = await this.prisma.user_groups.count({
        where: {
          metadata: {
            path: ['invitation'],
            not: null
          }
        }
      });

      // Les stats détaillées nécessiteraient une approche différente
      // ou l'utilisation d'une table dédiée pour les invitations
      return {
        total: totalInvitations,
        pending: 0,
        accepted: 0,
        declined: 0,
        expired: 0,
        cancelled: 0,
        acceptanceRate: 0,
        averageResponseTime: 0
      };

    } catch (error) {
      this.logger.logErrorEvent(error, 'InvitationsService.getStats', JSON.stringify({ contextId, type }));
      throw error;
    }
  }

  // === MÉTHODES PRIVÉES ===

  /**
   * Valide les permissions de l'inviteur
   */
  private async validateInviterPermissions(inviterId: string, contextId: string, type: string): Promise<void> {
    const user = await this.prisma.users.findUnique({
      where: { id: inviterId },
      select: { id: true, is_active: true }
    });

    if (!user || !user.is_active) {
      throw new ForbiddenException('Utilisateur non autorisé à envoyer des invitations');
    }

    // Vérifier les permissions selon le type d'invitation
    switch (type) {
      case InvitationType.GROUP:
        await this.validateGroupInvitePermissions(inviterId, contextId);
        break;
      case InvitationType.EVENT:
        await this.validateEventInvitePermissions(inviterId, contextId);
        break;
      case InvitationType.FRIEND:
        // Pas de validation spéciale pour les invitations d'amis
        break;
      default:
        throw new BadRequestException('Type d\'invitation non supporté');
    }
  }

  /**
   * Valide les permissions pour inviter dans un groupe
   */
  private async validateGroupInvitePermissions(inviterId: string, groupId: string): Promise<void> {
    const membership = await this.prisma.user_groups.findFirst({
      where: {
        user_id: inviterId,
        group_id: groupId,
        status: MembershipStatus.ACTIVE
      },
      include: {
        groups: true
      }
    });

    if (!membership) {
      throw new ForbiddenException('Vous devez être membre du groupe pour inviter');
    }

    // Vérifier si le membre a le droit d'inviter selon les métadonnées
    const metadata = membership.metadata as any;
    const canInvite = metadata?.permissions?.canInvite !== false;

    if (!canInvite) {
      throw new ForbiddenException('Vous n\'avez pas le droit d\'inviter dans ce groupe');
    }
  }

  /**
   * Valide les permissions pour inviter à un événement
   */
  private async validateEventInvitePermissions(inviterId: string, eventId: string): Promise<void> {
    // Vérifier que l'utilisateur a le droit d'inviter à cet événement
    // Cette logique dépendra du module événements
    // Pour l'instant, autoriser tous les utilisateurs actifs
  }

  /**
   * Vérifie les limites d'invitation
   */
  private async checkInvitationLimits(inviterId: string): Promise<void> {
    // Vérifier le nombre d'invitations en attente
    const pendingCount = await this.countPendingInvitations(inviterId);
    if (pendingCount >= INVITATION_CONSTANTS.LIMITS.MAX_PENDING_PER_USER) {
      throw new BadRequestException(INVITATION_CONSTANTS.ERRORS.TOO_MANY_PENDING);
    }

    // Vérifier la limite quotidienne
    const dailyCount = await this.countDailyInvitations(inviterId);
    if (dailyCount >= INVITATION_CONSTANTS.LIMITS.MAX_INVITES_PER_DAY) {
      throw new BadRequestException(INVITATION_CONSTANTS.ERRORS.DAILY_LIMIT_EXCEEDED);
    }
  }

  /**
   * Vérifie les limites pour les invitations en masse
   */
  private async checkBulkInvitationLimits(inviterId: string, count: number): Promise<void> {
    if (count > INVITATION_CONSTANTS.LIMITS.MAX_BULK_INVITES) {
      throw new BadRequestException(`Vous ne pouvez pas inviter plus de ${INVITATION_CONSTANTS.LIMITS.MAX_BULK_INVITES} personnes à la fois`);
    }

    await this.checkInvitationLimits(inviterId);
  }

  /**
   * Vérifie si une invitation existe déjà
   */
  private async checkExistingInvitation(invitationData: SendInvitationDto, invitedBy: string): Promise<void> {
    const existing = await this.findExistingInvitation(
      invitationData.contextId,
      invitationData.invitedEmail,
      invitationData.invitedUserId
    );

    if (existing && existing.status === InvitationStatus.PENDING) {
      throw new ConflictException('Une invitation en attente existe déjà pour cette personne');
    }
  }

  /**
   * Recherche une invitation existante
   */
  private async findExistingInvitation(contextId: string, email?: string, userId?: string): Promise<StoredInvitation | null> {
    const where: any = {
      metadata: {
        path: ['invitation', 'contextId'],
        equals: contextId
      }
    };

    if (email) {
      where.metadata = {
        ...where.metadata,
        path: ['invitation', 'invitedEmail'],
        equals: email
      };
    } else if (userId) {
      where.metadata = {
        ...where.metadata,
        path: ['invitation', 'invitedUserId'],
        equals: userId
      };
    }

    const userGroup = await this.prisma.user_groups.findFirst({ where });
    
    if (!userGroup?.metadata) {
      return null;
    }

    return (userGroup.metadata as any).invitation as StoredInvitation;
  }

  /**
   * Obtient le nom du contexte selon le type
   */
  private async getContextName(contextId: string, type: string): Promise<string> {
    switch (type) {
      case InvitationType.GROUP:
        const group = await this.prisma.groups.findUnique({
          where: { id: contextId },
          select: { name: true }
        });
        return group?.name || 'Groupe inconnu';

      case InvitationType.EVENT:
        // Récupérer depuis le module événements
        return 'Événement'; // Placeholder

      default:
        return 'Contexte inconnu';
    }
  }

  /**
   * Obtient le nom de l'inviteur
   */
  private async getInviterName(inviterId: string): Promise<string> {
    const user = await this.prisma.users.findUnique({
      where: { id: inviterId },
      select: { first_name: true, last_name: true }
    });

    if (!user) {
      return 'Utilisateur inconnu';
    }

    return `${user.first_name} ${user.last_name}`;
  }

  /**
   * Stocke une invitation dans les métadonnées
   */
  private async storeInvitation(invitation: StoredInvitation): Promise<void> {
    // Créer un enregistrement user_groups temporaire avec l'invitation dans metadata
    // L'user_id sera mis à jour lors de l'acceptation
    await this.prisma.user_groups.create({
      data: {
        id: invitation.id,
        user_id: invitation.invitedUserId || '00000000-0000-0000-0000-000000000000', // Placeholder UUID
        group_id: invitation.contextId,
        status: MembershipStatus.PENDING,
        metadata: {
          invitation: invitation as any
        }
      }
    });
  }

  /**
   * Met à jour le statut d'une invitation
   */
  private async updateInvitationStatus(
    invitation: StoredInvitation,
    status: InvitationStatus,
    userId?: string,
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const updates: Partial<StoredInvitation> = {
      status,
      respondedAt: new Date().toISOString(),
      ipAddress,
      userAgent
    };

    if (reason) {
      (updates as any).declineReason = reason;
    }

    await this.prisma.user_groups.updateMany({
      where: {
        metadata: {
          path: ['invitation', 'id'],
          equals: invitation.id
        }
      },
      data: {
        metadata: {
          invitation: {
            ...invitation,
            ...updates
          }
        }
      }
    });
  }

  /**
   * Traite l'acceptation d'une invitation de groupe
   */
  private async processGroupInvitationAcceptance(tx: any, invitation: StoredInvitation, userId: string): Promise<any> {
    // Mettre à jour l'enregistrement user_groups
    const member = await tx.user_groups.update({
      where: { id: invitation.id },
      data: {
        user_id: userId,
        status: MembershipStatus.ACTIVE,
        joined_at: new Date(),
        metadata: {
          role: invitation.proposedRole,
          permissions: {
            canInvite: true,
            canPurchase: true,
            canViewOrders: true
          },
          joinedViaInvitation: true,
          invitationId: invitation.id
        }
      },
      include: {
        users_user_groups_user_idTousers: true,
        groups: true
      }
    });

    return member;
  }

  /**
   * Traite l'acceptation d'une invitation d'événement
   */
  private async processEventInvitationAcceptance(tx: any, invitation: StoredInvitation, userId: string): Promise<any> {
    // Logique spécifique aux événements
    return { eventId: invitation.contextId, userId };
  }

  /**
   * Traite l'acceptation d'une invitation d'ami
   */
  private async processFriendInvitationAcceptance(tx: any, invitation: StoredInvitation, userId: string): Promise<any> {
    // Logique spécifique aux amitiés
    return { friendshipCreated: true };
  }

  /**
   * Valide une invitation
   */
  private async validateInvitation(invitation: StoredInvitation): Promise<InvitationValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Vérifier l'expiration
    const isExpired = new Date(invitation.expiresAt) < new Date();
    if (isExpired) {
      errors.push(INVITATION_CONSTANTS.ERRORS.INVITATION_EXPIRED);
    }

    // Vérifier si déjà traité
    if (invitation.status !== InvitationStatus.PENDING) {
      errors.push(INVITATION_CONSTANTS.ERRORS.INVITATION_ALREADY_RESPONDED);
    }

    // Vérifier si l'utilisateur est déjà membre
    const isAlreadyMember = await this.checkIfAlreadyMember(invitation);
    if (isAlreadyMember) {
      errors.push(INVITATION_CONSTANTS.ERRORS.ALREADY_MEMBER);
    }

    return {
      isValid: errors.length === 0,
      isExpired,
      isAlreadyMember,
      canAccept: errors.length === 0,
      errors,
      warnings,
      invitation
    };
  }

  /**
   * Vérifie si l'utilisateur est déjà membre
   */
  private async checkIfAlreadyMember(invitation: StoredInvitation): Promise<boolean> {
    if (!invitation.invitedUserId) {
      return false;
    }

    const existing = await this.prisma.user_groups.findFirst({
      where: {
        user_id: invitation.invitedUserId,
        group_id: invitation.contextId,
        status: MembershipStatus.ACTIVE
      }
    });

    return !!existing;
  }

  /**
   * Met en cache une invitation
   */
  private async cacheInvitation(invitation: StoredInvitation): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}token:${invitation.token}`;
    await this.redis.setCache(cacheKey, invitation, 3600); // 1 heure
  }

  /**
   * Supprime une invitation du cache
   */
  private async removeFromCache(token: string): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}token:${token}`;
    await this.redis.del(cacheKey);
  }

  /**
   * Nettoie les invitations expirées du cache
   */
  private async cleanExpiredFromCache(): Promise<void> {
    const pattern = `${this.CACHE_PREFIX}token:*`;
    const keys = await this.redis.keys(pattern);
    
    for (const key of keys) {
      const invitation = await this.redis.getCache<StoredInvitation>(key);
      if (invitation && new Date(invitation.expiresAt) < new Date()) {
        await this.redis.del(key);
      }
    }
  }

  /**
   * Compte les invitations en attente d'un utilisateur
   */
  private async countPendingInvitations(inviterId: string): Promise<number> {
    return this.prisma.user_groups.count({
      where: {
        metadata: {
          path: ['invitation', 'invitedBy'],
          equals: inviterId
        },
        AND: {
          metadata: {
            path: ['invitation', 'status'],
            equals: InvitationStatus.PENDING
          }
        }
      }
    });
  }

  /**
   * Compte les invitations envoyées aujourd'hui
   */
  private async countDailyInvitations(inviterId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.prisma.user_groups.count({
      where: {
        metadata: {
          path: ['invitation', 'invitedBy'],
          equals: inviterId
        },
        AND: {
          metadata: {
            path: ['invitation', 'createdAt'],
            gte: today.toISOString()
          }
        }
      }
    });
  }

  /**
   * Envoie l'email d'invitation
   */
  private async sendInvitationEmail(invitation: StoredInvitation): Promise<boolean> {
    try {
      if (!invitation.invitedEmail) {
        return false;
      }

      const templateData = {
        inviterName: invitation.inviterName,
        contextName: invitation.contextName,
        message: invitation.message || INVITATION_CONSTANTS.DEFAULT_MESSAGES[invitation.type as keyof typeof INVITATION_CONSTANTS.DEFAULT_MESSAGES],
        invitationUrl: `${process.env.FRONTEND_URL}/invitations/${invitation.token}`,
        expiresAt: new Date(invitation.expiresAt).toLocaleDateString('fr-TN'),
        type: invitation.type
      };

      await this.email.sendEmail({
        to: invitation.invitedEmail,
        subject: `Invitation - ${invitation.contextName}`,
        template: 'group-invitation',
        context: templateData
      });

      return true;
    } catch (error) {
      this.logger.logErrorEvent(error, 'InvitationsService.sendInvitationEmail', JSON.stringify({
        invitationId: invitation.id,
        email: invitation.invitedEmail
      }));
      return false;
    }
  }

  /**
   * Envoie un SMS d'invitation (future fonctionnalité)
   */
  private async sendInvitationSms(invitation: StoredInvitation): Promise<boolean> {
    // À implémenter avec un service SMS
    return false;
  }

  /**
   * Programme les rappels automatiques
   */
  private async scheduleReminders(invitation: StoredInvitation): Promise<void> {
    try {
      for (const hours of INVITATION_CONSTANTS.EMAIL_CONFIG.REMINDER_HOURS) {
        const delayMs = hours * 60 * 60 * 1000;
        
        await this.bullmq.addDelayedJob(
          'EMAIL',
          'SEND_INVITATION_REMINDER',
          {
            invitationId: invitation.id,
            token: invitation.token,
            reminderNumber: INVITATION_CONSTANTS.EMAIL_CONFIG.REMINDER_HOURS.indexOf(hours) + 1
          },
          delayMs
        );
      }
    } catch (error) {
      this.logger.logErrorEvent(error, 'InvitationsService.scheduleReminders', JSON.stringify({
        invitationId: invitation.id
      }));
    }
  }

  /**
   * Envoie les notifications d'acceptation
   */
  private async sendAcceptanceNotifications(invitation: StoredInvitation, userId: string): Promise<void> {
    try {
      // Notifier l'inviteur
      const inviter = await this.prisma.users.findUnique({
        where: { id: invitation.invitedBy },
        select: { email: true, first_name: true }
      });

      const accepter = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { first_name: true, last_name: true }
      });

      if (inviter?.email) {
        await this.email.sendEmail({
          to: inviter.email,
          subject: `Invitation acceptée - ${invitation.contextName}`,
          template: 'invitation-accepted',
          context: {
            inviterName: inviter.first_name,
            accepterName: `${accepter?.first_name} ${accepter?.last_name}`,
            contextName: invitation.contextName,
            type: invitation.type
          }
        });
      }
    } catch (error) {
      this.logger.logErrorEvent(error, 'InvitationsService.sendAcceptanceNotifications', JSON.stringify({
        invitationId: invitation.id,
        userId
      }));
    }
  }

  /**
   * Envoie les notifications de refus
   */
  private async sendDeclineNotification(invitation: StoredInvitation, userId: string, reason?: string): Promise<void> {
    try {
      const inviter = await this.prisma.users.findUnique({
        where: { id: invitation.invitedBy },
        select: { email: true, first_name: true }
      });

      if (inviter?.email) {
        await this.email.sendEmail({
          to: inviter.email,
          subject: `Invitation refusée - ${invitation.contextName}`,
          template: 'invitation-declined',
          context: {
            inviterName: inviter.first_name,
            contextName: invitation.contextName,
            reason: reason || 'Aucune raison fournie',
            type: invitation.type
          }
        });
      }
    } catch (error) {
      this.logger.logErrorEvent(error, 'InvitationsService.sendDeclineNotification', JSON.stringify({
        invitationId: invitation.id,
        userId
      }));
    }
  }

  /**
   * Retourne les actions post-acceptation
   */
  private getPostAcceptanceActions(invitation: StoredInvitation): string[] {
    const actions: string[] = [];

    switch (invitation.type) {
      case InvitationType.GROUP:
        actions.push('SETUP_PROFILE');
        actions.push('EXPLORE_GROUP');
        break;
      case InvitationType.EVENT:
        actions.push('VIEW_EVENT_DETAILS');
        actions.push('ADD_TO_CALENDAR');
        break;
      case InvitationType.FRIEND:
        actions.push('VIEW_PROFILE');
        actions.push('START_CONVERSATION');
        break;
    }

    return actions;
  }
}