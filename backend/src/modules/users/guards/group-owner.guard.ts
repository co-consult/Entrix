// src/modules/users/guards/group-owner.guard.ts

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { GROUP_CONSTANTS } from '../constants/group.constants';

// Interface pour la requête étendue
interface ExtendedRequest {
  user: {
    id: string;
    isActive: boolean;
    email: string;
  };
  params: {
    groupId?: string;
    [key: string]: string;
  };
  body: {
    groupId?: string;
    [key: string]: any;
  };
  query: Record<string, any>;
  path: string;
  method: string;
  ip: string;
  headers: Record<string, any>;
  groupMembership?: any;
  group?: any;
}

// Metadata key pour spécifier les rôles autorisés
export const REQUIRED_GROUP_ROLES = 'requiredGroupRoles';

@Injectable()
export class GroupOwnerGuard implements CanActivate {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly reflector: Reflector,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('GroupOwnerGuard');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ExtendedRequest>();
    const handler = context.getHandler();
    
    // Démarrer l'opération de monitoring
    const operationId = this.logger.startOperation('group_owner_check', {
      path: request.path,
      method: request.method,
    });

    try {
      // Récupérer les rôles requis depuis les métadonnées du décorateur
      const requiredRoles = this.reflector.get<string[]>(
        REQUIRED_GROUP_ROLES,
        handler,
      ) || ['OWNER']; // Par défaut, seul OWNER est autorisé

      // Validation des paramètres d'entrée
      this.validateRequestInputs(request);

      const user = request.user;
      const groupId = this.extractGroupId(request);

      // Vérifier d'abord le cache pour les données du groupe et de membership
      const cacheKey = `group_membership:${user.id}:${groupId}`;
      let cachedData = await this.getCachedMembership(cacheKey);

      if (cachedData) {
        // Vérifier les permissions depuis le cache
        const hasPermission = this.checkPermissionsFromCache(
          cachedData,
          requiredRoles,
          user.id,
          groupId,
        );

        if (hasPermission) {
          this.attachMembershipToRequest(request, cachedData);
          this.logSuccessfulAccess(user.id, groupId, request.path, 'cached');
          this.logger.endOperation('group_owner_check', operationId, true);
          return true;
        }
      }

      // Si pas en cache ou permissions insuffisantes, vérifier en base
      const membershipData = await this.validateMembershipFromDatabase(
        user.id,
        groupId,
        requiredRoles,
      );

      // Mettre en cache pour les prochaines requêtes (TTL 5 minutes)
      await this.redis.setCache(cacheKey, membershipData, 300);
      this.logger.logCacheEvent('set', cacheKey, 300);

      // Attacher les données à la requête
      this.attachMembershipToRequest(request, membershipData);

      // Log de succès
      this.logSuccessfulAccess(user.id, groupId, request.path, 'database');

      this.logger.endOperation('group_owner_check', operationId, true);
      return true;

    } catch (error) {
      this.handleError(error, request.user?.id, this.extractGroupId(request), request.path, operationId);
      throw error; // Re-throw après logging
    }
  }

  /**
   * Valide les paramètres d'entrée de la requête
   */
  private validateRequestInputs(request: ExtendedRequest): void {
    const user = request.user;

    if (!user || !user.id) {
      this.logger.logSecurityEvent(
        'UNAUTHENTICATED_GROUP_ACCESS_ATTEMPT',
        null,
        request.ip,
        request.headers['user-agent'],
        {
          path: request.path,
          method: request.method,
          reason: 'no_authenticated_user',
        },
      );
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    if (!user.isActive) {
      this.logger.logSecurityEvent(
        'INACTIVE_USER_GROUP_ACCESS_ATTEMPT',
        user.id,
        request.ip,
        request.headers['user-agent'],
        {
          path: request.path,
          method: request.method,
          reason: 'inactive_user',
        },
      );
      throw new ForbiddenException('Compte utilisateur inactif');
    }
  }

  /**
   * Extrait l'ID du groupe depuis la requête
   */
  private extractGroupId(request: ExtendedRequest): string {
    const groupId = request.params.groupId || request.body.groupId;

    if (!groupId) {
      this.logger.logErrorEvent(
        new Error('Missing groupId parameter'),
        'GroupOwnerGuard.extractGroupId',
        request.user?.id,
        {
          path: request.path,
          method: request.method,
          params: JSON.stringify(request.params),
          bodyKeys: JSON.stringify(Object.keys(request.body || {})),
        },
      );
      throw new BadRequestException('ID du groupe requis');
    }

    // Validation format UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(groupId)) {
      throw new BadRequestException('Format d\'ID de groupe invalide');
    }

    return groupId;
  }

  /**
   * Extrait le rôle depuis les métadonnées JSON
   */
  private extractRoleFromMetadata(metadata: any): string | null {
    if (!metadata || typeof metadata !== 'object') {
      return 'MEMBER'; // Rôle par défaut si pas de métadonnées
    }

    // Le rôle peut être stocké dans metadata.role
    if (metadata.role && typeof metadata.role === 'string') {
      const validRoles = ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER'];
      if (validRoles.includes(metadata.role)) {
        return metadata.role;
      }
    }

    // Si pas de rôle valide trouvé, retourner MEMBER par défaut
    return 'MEMBER';
  }

  /**
   * Récupère les données de membership depuis le cache Redis
   */
  private async getCachedMembership(cacheKey: string): Promise<any> {
    try {
      const cached = await this.redis.getCache(cacheKey);
      
      if (cached) {
        this.logger.logCacheEvent('hit', cacheKey);
        return cached;
      }
      
      this.logger.logCacheEvent('miss', cacheKey);
      return null;
    } catch (error) {
      this.logger.logErrorEvent(
        error,
        'GroupOwnerGuard.getCachedMembership',
        undefined,
        { cacheKey },
      );
      return null; // En cas d'erreur cache, continuer sans cache
    }
  }

  /**
   * Vérifie les permissions depuis les données en cache
   */
  private checkPermissionsFromCache(
    cachedData: any,
    requiredRoles: string[],
    userId: string,
    groupId: string,
  ): boolean {
    if (!cachedData.membership || !cachedData.group) {
      return false;
    }

    const membership = cachedData.membership;
    const group = cachedData.group;

    // Vérifier que le groupe est toujours actif
    if (!group.is_active) {
      return false;
    }

    // Vérifier que le membership est toujours actif
    if (membership.status !== GROUP_CONSTANTS.MEMBER_STATUS.ACTIVE) {
      return false;
    }

    // Vérifier la validité temporelle du membership
    if (membership.valid_until && new Date(membership.valid_until) < new Date()) {
      return false;
    }

    // Extraire le rôle depuis les métadonnées ou utiliser le rôle déjà extrait
    const memberRole = membership.role || this.extractRoleFromMetadata(membership.metadata);
    
    // Vérifier les rôles requis
    return requiredRoles.includes(memberRole);
  }

  /**
   * Valide le membership depuis la base de données
   */
  private async validateMembershipFromDatabase(
    userId: string,
    groupId: string,
    requiredRoles: string[],
  ): Promise<any> {
    // Vérifier que le groupe existe et est actif
    const group = await this.prisma.groups.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        type: true,
        is_active: true,
        max_members: true,
      },
    });

    if (!group) {
      throw new ForbiddenException('Groupe introuvable');
    }

    if (!group.is_active) {
      throw new ForbiddenException('Groupe inactif');
    }

    // Vérifier le membership de l'utilisateur
    const membership = await this.prisma.user_groups.findFirst({
      where: {
        user_id: userId,
        group_id: groupId,
        status: GROUP_CONSTANTS.MEMBER_STATUS.ACTIVE,
      },
      select: {
        id: true,
        joined_at: true,
        valid_until: true,
        metadata: true,
        status: true,
        added_by: true,
      },
    });

    if (!membership) {
      this.logger.logBusinessEvent(
        'GROUP_ACCESS_DENIED_NOT_MEMBER',
        {
          userId,
          groupId,
          groupName: group.name,
          requiredRoles: JSON.stringify(requiredRoles),
        },
        userId,
      );
      throw new ForbiddenException('Vous n\'êtes pas membre de ce groupe');
    }

    // Extraire le rôle depuis les métadonnées JSON
    const memberRole = this.extractRoleFromMetadata(membership.metadata);
    if (!memberRole) {
      throw new ForbiddenException('Rôle utilisateur introuvable dans ce groupe');
    }

    // Vérifier la validité temporelle du membership
    if (membership.valid_until && membership.valid_until < new Date()) {
      this.logger.logBusinessEvent(
        'GROUP_ACCESS_DENIED_MEMBERSHIP_EXPIRED',
        {
          userId,
          groupId,
          expiredAt: membership.valid_until.toISOString(),
        },
        userId,
      );
      throw new ForbiddenException('Votre appartenance à ce groupe a expiré');
    }

    // Vérifier si l'utilisateur a l'un des rôles requis
    if (!requiredRoles.includes(memberRole)) {
      this.logger.logBusinessEvent(
        'GROUP_ACCESS_DENIED_INSUFFICIENT_ROLE',
        {
          userId,
          groupId,
          groupName: group.name,
          userRole: memberRole,
          requiredRoles: JSON.stringify(requiredRoles),
        },
        userId,
      );

      const roleNames = {
        OWNER: 'propriétaire',
        ADMIN: 'administrateur',
        MANAGER: 'gestionnaire',
        MEMBER: 'membre',
      };

      const requiredRoleNames = requiredRoles
        .map(role => roleNames[role] || role)
        .join(' ou ');
      
      throw new ForbiddenException(
        `Cette action nécessite d'être ${requiredRoleNames} du groupe`,
      );
    }

    return {
      membership: {
        ...membership,
        role: memberRole, // Ajouter le rôle extrait
      },
      group,
    };
  }

  /**
   * Attache les données d'appartenance à la requête
   */
  private attachMembershipToRequest(request: ExtendedRequest, data: any): void {
    const { membership, group } = data;

    request.groupMembership = {
      id: membership.id,
      role: membership.role,
      joinedAt: membership.joined_at,
      validUntil: membership.valid_until,
      metadata: membership.metadata,
      isOwner: membership.role === 'OWNER',
      isAdmin: ['OWNER', 'ADMIN'].includes(membership.role),
      isManager: ['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role),
    };

    request.group = {
      id: group.id,
      name: group.name,
      type: group.type,
      isActive: group.is_active,
      maxMembers: group.max_members,
    };
  }

  /**
   * Log un accès réussi
   */
  private logSuccessfulAccess(
    userId: string,
    groupId: string,
    path: string,
    source: 'cached' | 'database',
  ): void {
    this.logger.logBusinessEvent(
      'GROUP_ACCESS_GRANTED',
      {
        userId,
        groupId,
        path,
        source,
        timestamp: new Date().toISOString(),
      },
      userId,
    );
  }

  /**
   * Gère les erreurs et logs appropriés
   */
  private handleError(
    error: any,
    userId: string,
    groupId: string,
    path: string,
    operationId: string,
  ): void {
    if (
      error instanceof ForbiddenException ||
      error instanceof BadRequestException ||
      error instanceof UnauthorizedException
    ) {
      // Erreurs métier attendues - log en info seulement
      this.logger.endOperation('group_owner_check', operationId, false);
      return;
    }

    // Erreurs techniques inattendues - log en erreur avec stack trace
    this.logger.logErrorEvent(
      error,
      'GroupOwnerGuard.canActivate',
      userId,
      {
        groupId,
        path,
        errorType: error.constructor.name,
        errorMessage: error.message,
        stack: error.stack,
      },
    );

    this.logger.endOperation('group_owner_check', operationId, false);

    // Convertir en erreur générique pour ne pas exposer les détails techniques
    throw new ForbiddenException('Erreur lors de la vérification des permissions de groupe');
  }
}

// Décorateur pour spécifier les rôles requis
export const RequireGroupRoles = (...roles: string[]) =>
  SetMetadata(REQUIRED_GROUP_ROLES, roles);