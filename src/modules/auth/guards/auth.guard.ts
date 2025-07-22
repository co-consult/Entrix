// src/modules/auth/guards/auth.guard.ts
/**
 * Guard d'authentification principal
 * 
 * Responsabilités :
 * - Vérification de l'authentification JWT
 * - Gestion des permissions utilisateur
 * - Integration avec Passport JWT Strategy
 * - Contexte d'authentification dans la requête
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';

// Services partagés
import { LoggerService } from '../../../shared/logger/logger.service';

// Décorateurs
import { getPermissionsConfig } from '../../../common/decorators/permissions.decorator';

// Types
import { AuthUser } from '../../../common/types/auth.types';

@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') implements CanActivate {
  private readonly logger: LoggerService;

  constructor(
    private reflector: Reflector,
    logger: LoggerService,
  ) {
    super();
    this.logger = logger.createChildLogger('AuthGuard');
  }

  /**
   * Déterminer si la requête peut continuer
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    try {
      // 1. Vérifier les métadonnées de permissions
      const permissionsConfig = getPermissionsConfig(
        context.getClass(),
        context.getHandler().name
      );

      // Si c'est une ressource publique, pas besoin d'auth
      if (permissionsConfig === 'public') {
        return true;
      }

      // 2. Exécuter l'authentification JWT via Passport
      const isAuthenticated = await super.canActivate(context) as boolean;
      
      if (!isAuthenticated) {
        this.logger.warn(`Authentification échouée pour ${request.url}`);
        return false;
      }

      // 3. L'utilisateur est maintenant disponible via request.user (set par JwtStrategy)
      const user: AuthUser = request.user;
      
      if (!user) {
        this.logger.warn('Utilisateur non trouvé après authentification JWT');
        throw new UnauthorizedException('Utilisateur non authentifié');
      }

      // 4. Vérifier les permissions si spécifiées
      if (permissionsConfig && typeof permissionsConfig === 'object') {
        const hasPermission = this.checkPermissions(user, permissionsConfig.permissions);
        
        if (!hasPermission) {
          this.logger.warn(`Permissions insuffisantes pour ${user.id} sur ${request.url}. Requis: ${permissionsConfig.permissions.join(', ')}, Disponibles: ${user.permissions.join(', ')}`);
          throw new UnauthorizedException('Permissions insuffisantes');
        }
      }

      // 5. Ajouter des informations supplémentaires au contexte
      request.authMeta = {
        authenticatedAt: new Date(),
        guardType: 'AuthGuard',
        userAgent: request.get('User-Agent'),
        ipAddress: request.ip,
      };

      this.logger.log(`Authentification réussie pour ${user.id} sur ${request.method} ${request.url}`);
      return true;

    } catch (error) {
      this.logger.error(`Erreur dans AuthGuard pour ${request.url}:`, error);
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new UnauthorizedException('Erreur d\'authentification');
    }
  }

  /**
   * Gestion personnalisée des erreurs d'authentification
   */
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    // Log des tentatives d'accès non autorisées
    if (err || !user) {
      this.logger.warn(`Accès refusé pour ${request.url}. Erreur: ${err?.message || 'Utilisateur non trouvé'}, Info: ${info?.message || 'Aucune info'}`);
      
      // Personnaliser le message d'erreur selon le type
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expiré');
      } else if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Token invalide');
      } else if (info?.name === 'NotBeforeError') {
        throw new UnauthorizedException('Token pas encore valide');
      }
      
      throw err || new UnauthorizedException('Token manquant ou invalide');
    }

    return user;
  }

  /**
   * Vérifier si l'utilisateur a les permissions requises
   */
  private checkPermissions(user: AuthUser, requiredPermissions: string[]): boolean {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Vérifier si l'utilisateur a toutes les permissions requises
    return requiredPermissions.every(permission => 
      user.permissions.includes(permission)
    );
  }

  /**
   * Vérifier les rôles (fonction utilitaire)
   */
  private checkRoles(user: AuthUser, requiredRoles: string[]): boolean {
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const userRoleCodes = user.roles.map(role => role.code);
    return requiredRoles.some(role => userRoleCodes.includes(role));
  }

  /**
   * Vérifier le niveau hiérarchique minimum
   */
  private checkMinimumLevel(user: AuthUser, minimumLevel: number): boolean {
    if (minimumLevel === undefined || minimumLevel === null) {
      return true;
    }

    const maxUserLevel = Math.max(...user.roles.map(role => role.level));
    return maxUserLevel >= minimumLevel;
  }
}