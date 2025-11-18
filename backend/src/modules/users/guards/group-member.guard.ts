// src/modules/users/guards/group-member.guard.ts

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RedisService } from '../../../shared/redis/redis.service';

// Interface pour l'utilisateur dans la requête (vient du module auth)
interface AuthenticatedUser {
  id: string;
  email: string;
  isActive: boolean;
}

// Interface pour la requête étendue
interface ExtendedRequest extends Request {
  user: AuthenticatedUser;
  groupMembership?: {
    id: string;
    joinedAt: Date;
    status: string;
    metadata: any;
  };
  group?: {
    id: string;
    name: string;
    type: string;
    isActive: boolean;
  };
}

@Injectable()
export class GroupMemberGuard implements CanActivate {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
    private readonly redis: RedisService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('GroupMemberGuard');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ExtendedRequest>();
    const user = request.user;
    
    // Extraire l'ID du groupe depuis les paramètres ou le body
    const groupId = this.extractGroupId(request);

    // Vérifications de base
    this.validateRequest(user, groupId, request);

    const operationId = this.logger.startOperation('group_member_check', {
      userId: user.id,
      groupId,
      path: request.path,
      method: request.method,
    });

    try {
      // Vérifier le cache Redis d'abord
      const cachedMembership = await this.getCachedMembership(user.id, groupId);
      if (cachedMembership) {
        this.attachMembershipToRequest(request, cachedMembership);
        this.logSuccessfulAccess(user.id, groupId, request.path, 'cached');
        this.logger.endOperation('group_member_check', operationId, true);
        return true;
      }

      // Vérifier l'existence et l'état du groupe
      const group = await this.validateGroup(groupId);
      
      // Vérifier l'appartenance au groupe
      const membership = await this.validateMembership(user.id, groupId);

      // Créer l'objet membership complet
      const membershipData = {
        id: membership.id,
        joinedAt: membership.joined_at,
        status: membership.status,
        metadata: membership.metadata || {},
        addedBy: membership.added_by,
      };

      const groupData = {
        id: group.id,
        name: group.name,
        type: group.type,
        isActive: group.is_active,
      };

      // Mettre en cache pour 5 minutes
      await this.cacheMembership(user.id, groupId, { membership: membershipData, group: groupData });

      // Attacher les données à la requête
      this.attachMembershipToRequest(request, { membership: membershipData, group: groupData });

      this.logSuccessfulAccess(user.id, groupId, request.path, 'database');
      this.logger.endOperation('group_member_check', operationId, true);

      return true;

    } catch (error) {
      this.handleError(error, user.id, groupId, request.path, operationId);
      throw error; // Re-throw l'erreur pour que NestJS la gère
    }
  }

  /**
   * Extrait l'ID du groupe depuis les paramètres ou le body de la requête
   */
  private extractGroupId(request: ExtendedRequest): string {
    return request.params?.groupId || 
           request.params?.group_id || 
           request.body?.groupId || 
           request.body?.group_id ||
           request.query?.groupId as string ||
           request.query?.group_id as string;
  }

  /**
   * Valide la requête de base
   */
  private validateRequest(user: AuthenticatedUser, groupId: string, request: ExtendedRequest): void {
    if (!user || !user.id) {
      this.logger.logSecurityEvent(
        'UNAUTHORIZED_GROUP_ACCESS_ATTEMPT',
        undefined,
        request.ip,
        request.headers['user-agent'] as string,
        {
          path: request.path,
          method: request.method,
          hasUser: !!user,
          reason: 'no_authenticated_user'
        }
      );
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    if (!user.isActive) {
      this.logger.logSecurityEvent(
        'INACTIVE_USER_GROUP_ACCESS_ATTEMPT',
        user.id,
        request.ip,
        request.headers['user-agent'] as string,
        {
          path: request.path,
          method: request.method,
          reason: 'inactive_user'
        }
      );
      throw new ForbiddenException('Compte utilisateur inactif');
    }

    if (!groupId) {
      this.logger.warn('GroupMemberGuard: No groupId found in request', JSON.stringify({
        userId: user.id,
        path: request.path,
        method: request.method,
        params: JSON.stringify(request.params),
        body: JSON.stringify(Object.keys(request.body || {})),
        query: JSON.stringify(request.query),
      }));
      throw new BadRequestException('ID du groupe requis');
    }

    // Validation format UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(groupId)) {
      throw new BadRequestException('Format d\'ID de groupe invalide');
    }
  }

  /**
   * Récupère l'appartenance depuis le cache Redis
   */
  private async getCachedMembership(userId: string, groupId: string): Promise<any> {
    try {
      const cacheKey = `group_membership:${userId}:${groupId}`;
      const cached = await this.redis.getCache(cacheKey);
      
      if (cached) {
        this.logger.logCacheEvent('hit', cacheKey);
        return cached;
      }
      
      this.logger.logCacheEvent('miss', cacheKey);
      return null;
    } catch (error) {
      // Si Redis échoue, on continue sans cache
      this.logger.warn('Redis cache error in GroupMemberGuard', JSON.stringify({
        error: error.message,
        userId,
        groupId,
      }));
      return null;
    }
  }

  /**
   * Met en cache l'appartenance au groupe
   */
  private async cacheMembership(userId: string, groupId: string, data: any): Promise<void> {
    try {
      const cacheKey = `group_membership:${userId}:${groupId}`;
      const ttl = 300; // 5 minutes
      
      await this.redis.setCache(cacheKey, data, ttl);
      this.logger.logCacheEvent('set', cacheKey, ttl);
    } catch (error) {
      // Si Redis échoue, on continue sans mettre en cache
      this.logger.warn('Redis cache set error in GroupMemberGuard', JSON.stringify({
        error: error.message,
        userId,
        groupId,
      }));
    }
  }

  /**
   * Valide l'existence et l'état du groupe
   */
  private async validateGroup(groupId: string) {
    const group = await this.prisma.groups.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        type: true,
        is_active: true,
        valid_from: true,
        valid_until: true,
      },
    });

    if (!group) {
      this.logger.logBusinessEvent('GROUP_ACCESS_DENIED', {
        groupId,
        reason: 'group_not_found',
      });
      throw new ForbiddenException('Groupe introuvable');
    }

    if (!group.is_active) {
      this.logger.logBusinessEvent('GROUP_ACCESS_DENIED', {
        groupId,
        groupName: group.name,
        reason: 'group_inactive',
      });
      throw new ForbiddenException('Groupe inactif');
    }

    // Vérifier la validité temporelle du groupe
    const now = new Date();
    if (group.valid_until && group.valid_until < now) {
      this.logger.logBusinessEvent('GROUP_ACCESS_DENIED', {
        groupId,
        groupName: group.name,
        reason: 'group_expired',
        expiredAt: group.valid_until,
      });
      throw new ForbiddenException('Groupe expiré');
    }

    return group;
  }

  /**
   * Valide l'appartenance de l'utilisateur au groupe
   */
  private async validateMembership(userId: string, groupId: string) {
    const membership = await this.prisma.user_groups.findFirst({
      where: {
        user_id: userId,
        group_id: groupId,
        status: 'ACTIVE', // Statut selon membership_status enum
      },
      select: {
        id: true,
        joined_at: true,
        valid_until: true,
        status: true,
        added_by: true,
        metadata: true,
      },
    });

    if (!membership) {
      this.logger.logSecurityEvent(
        'UNAUTHORIZED_GROUP_ACCESS',
        userId,
        undefined,
        undefined,
        {
          groupId,
          reason: 'not_a_member',
        }
      );
      throw new ForbiddenException('Vous n\'êtes pas membre de ce groupe');
    }

    // Vérifier la validité temporelle de l'appartenance
    const now = new Date();
    if (membership.valid_until && membership.valid_until < now) {
      this.logger.logBusinessEvent('GROUP_ACCESS_DENIED', {
        userId,
        groupId,
        reason: 'membership_expired',
        expiredAt: membership.valid_until,
      });
      throw new ForbiddenException('Votre appartenance à ce groupe a expiré');
    }

    return membership;
  }

  /**
   * Attache les données d'appartenance à la requête
   */
  private attachMembershipToRequest(request: ExtendedRequest, data: any): void {
    request.groupMembership = data.membership;
    request.group = data.group;
  }

  /**
   * Log un accès réussi
   */
  private logSuccessfulAccess(userId: string, groupId: string, path: string, source: 'cached' | 'database'): void {
    this.logger.logBusinessEvent('GROUP_ACCESS_GRANTED', {
      userId,
      groupId,
      path,
      source,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Gère les erreurs et logs appropriés
   */
  private handleError(error: any, userId: string, groupId: string, path: string, operationId: string): void {
    if (error instanceof ForbiddenException || 
        error instanceof BadRequestException || 
        error instanceof UnauthorizedException) {
      // Erreurs métier attendues - log en info
      this.logger.endOperation('group_member_check', operationId, false);
      return;
    }

    // Erreurs techniques inattendues - log en erreur
    this.logger.logErrorEvent(error, 'GroupMemberGuard.canActivate', userId, {
      groupId,
      path,
      errorType: error.constructor.name,
      errorMessage: error.message,
    });
    
    this.logger.endOperation('group_member_check', operationId, false);
    
    // Convertir en erreur générique pour ne pas exposer les détails techniques
    throw new ForbiddenException('Erreur lors de la vérification des permissions de groupe');
  }
}