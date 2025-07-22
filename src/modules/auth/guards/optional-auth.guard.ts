// src/modules/auth/guards/optional-auth.guard.ts
/**
 * Guard d'authentification optionnelle
 * 
 * Responsabilités :
 * - Authentification si token présent, sinon continue
 * - Permet l'accès aux ressources publiques avec contexte user enrichi
 * - Gestion des permissions conditionnelles
 * - Utile pour les endpoints hybrides public/privé
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
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
export class OptionalAuthGuard extends PassportAuthGuard('jwt') implements CanActivate {
  private readonly logger: LoggerService;

  constructor(
    private reflector: Reflector,
    logger: LoggerService,
  ) {
    super();
    this.logger = logger.createChildLogger('OptionalAuthGuard');
  }

  /**
   * Déterminer si la requête peut continuer
   * Toujours retourne true, mais enrichit le contexte si auth disponible
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    try {
      // 1. Vérifier les métadonnées de permissions
      const permissionsConfig = getPermissionsConfig(
        context.getClass(),
        context.getHandler().name
      );

      // 2. Vérifier si un token est présent
      const authHeader = request.headers.authorization;
      const hasToken = authHeader && authHeader.startsWith('Bearer ');

      if (!hasToken) {
        // Pas de token = utilisateur anonyme
        this.logger.log(`Accès anonyme autorisé pour ${request.method} ${request.url}`);
        
        request.user = null;
        request.isAuthenticated = false;
        request.authMeta = {
          guardType: 'OptionalAuthGuard',
          isAnonymous: true,
          accessedAt: new Date(),
        };
        
        return true;
      }

      // 3. Token présent, tenter l'authentification
      try {
        const isAuthenticated = await super.canActivate(context) as boolean;
        
        if (isAuthenticated) {
          const user: AuthUser = request.user;
          
          this.logger.log(`Authentification optionnelle réussie pour ${user.id} sur ${request.method} ${request.url}`);
          
          // 4. Vérifier les permissions si l'utilisateur est connecté et que des permissions sont requises
          if (permissionsConfig && typeof permissionsConfig === 'object') {
            const hasPermission = this.checkPermissions(user, permissionsConfig.permissions || []);
            
            // Marquer si l'utilisateur a accès aux fonctionnalités premium
            request.hasPremiumAccess = hasPermission;
          }
          
          request.isAuthenticated = true;
          request.authMeta = {
            guardType: 'OptionalAuthGuard',
            isAnonymous: false,
            authenticatedAt: new Date(),
            userAgent: request.get('User-Agent'),
            ipAddress: request.ip,
          };
        } else {
          // Authentification échouée mais on continue quand même
          this.logger.warn(`Authentification optionnelle échouée pour ${request.url}, continuation en mode anonyme`);
          
          request.user = null;
          request.isAuthenticated = false;
          request.authMeta = {
            guardType: 'OptionalAuthGuard',
            isAnonymous: true,
            authFailed: true,
          };
        }
      } catch (authError) {
        // Erreur d'authentification mais on continue en mode anonyme
        this.logger.warn(`Erreur authentification optionnelle pour ${request.url}:`, authError);
        
        request.user = null;
        request.isAuthenticated = false;
        request.authMeta = {
          guardType: 'OptionalAuthGuard',
          isAnonymous: true,
          authError: authError.message,
        };
      }

      return true; // Toujours autoriser l'accès

    } catch (error) {
      this.logger.error(`Erreur inattendue dans OptionalAuthGuard pour ${request.url}:`, error);
      
      // Même en cas d'erreur, continuer en mode anonyme
      request.user = null;
      request.isAuthenticated = false;
      request.authMeta = {
        guardType: 'OptionalAuthGuard',
        isAnonymous: true,
        systemError: true,
      };
      
      return true;
    }
  }

  /**
   * Gestion personnalisée des erreurs (ne jamais lancer d'exception)
   */
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    // En cas d'erreur, retourner null au lieu de lancer une exception
    if (err || !user) {
      this.logger.debug(`Auth optionnelle non réussie pour ${request.url}. Erreur: ${err?.message || 'Utilisateur non trouvé'}`);
      return null; // Pas d'exception, juste null
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

    if (!user || !user.permissions) {
      return false;
    }

    // Vérifier si l'utilisateur a toutes les permissions requises
    return requiredPermissions.every(permission => 
      user.permissions.includes(permission)
    );
  }

  /**
   * Méthode utilitaire pour vérifier si l'utilisateur a accès premium
   * Peut être utilisée dans les controllers
   */
  static hasUserPremiumAccess(request: any): boolean {
    return Boolean(request.hasPremiumAccess);
  }

  /**
   * Méthode utilitaire pour vérifier si l'utilisateur est authentifié
   */
  static isUserAuthenticated(request: any): boolean {
    return Boolean(request.isAuthenticated);
  }

  /**
   * Méthode utilitaire pour obtenir l'utilisateur ou null
   */
  static getOptionalUser(request: any): AuthUser | null {
    return request.user || null;
  }
}