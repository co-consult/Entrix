// src/modules/auth/guards/mfa-required.guard.ts
/**
 * Guard pour vérifier que l'authentification MFA est validée
 * 
 * Responsabilités :
 * - Vérifier que l'utilisateur a validé son MFA
 * - Bloquer l'accès aux ressources sensibles sans MFA
 * - Integration avec les tokens JWT (mfaVerified flag)
 * - Gestion des exceptions pour actions critiques
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Services partagés
import { LoggerService } from '../../../shared/logger/logger.service';

// Services du module auth
import { MfaService } from '../services/mfa.service';

// Types
import { AuthUser } from '../../../common/types/auth.types';

@Injectable()
export class MfaRequiredGuard implements CanActivate {
  private readonly logger: LoggerService;

  constructor(
    private reflector: Reflector,
    private mfaService: MfaService,
    logger: LoggerService,
  ) {
    this.logger = logger.createChildLogger('MfaRequiredGuard');
  }

  /**
   * Déterminer si la requête peut continuer
   * L'utilisateur doit être authentifié ET avoir validé son MFA
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    try {
      // 1. Vérifier que l'utilisateur est authentifié
      const user: AuthUser = request.user;
      
      if (!user) {
        this.logger.warn(`Tentative d'accès à une ressource MFA sans authentification sur ${request.url}`);
        throw new UnauthorizedException('Authentification requise');
      }

      // 2. Vérifier les métadonnées pour savoir si MFA est vraiment requis
      const isMfaRequired = this.reflector.get<boolean>('mfa-required', context.getHandler()) ||
                           this.reflector.get<boolean>('mfa-required', context.getClass());

      // Si MFA pas explicitement requis sur cette route, laisser passer
      if (isMfaRequired === false) {
        return true;
      }

      // 3. Récupérer le contexte d'authentification
      const authContext = request.authContext;
      
      if (!authContext) {
        this.logger.warn(`Contexte d'authentification manquant pour ${user.id} sur ${request.url}`);
        throw new UnauthorizedException('Contexte d\'authentification invalide');
      }

      // 4. Vérifier si MFA a été validé dans le token
      if (authContext.mfaVerified) {
        this.logger.log(`Accès MFA autorisé pour ${user.id} sur ${request.url}`);
        return true;
      }

      // 5. Vérifier si l'utilisateur a MFA configuré
      const mfaConfig = await this.mfaService.getUserMfaConfig(user.id);
      
      if (!mfaConfig || !mfaConfig.enabled) {
        // MFA pas configuré mais requis pour cette ressource
        this.logger.warn(`MFA requis mais non configuré pour ${user.id} sur ${request.url}`);
        
        throw new ForbiddenException({
          error: 'MFA_REQUIRED',
          message: 'L\'authentification multi-facteurs est requise pour accéder à cette ressource',
          action: 'SETUP_MFA',
          user: {
            id: user.id,
            email: user.email,
          }
        });
      }

      // 6. MFA configuré mais pas validé dans cette session
      this.logger.warn(`MFA configuré mais non validé pour ${user.id} sur ${request.url}`);
      
      throw new ForbiddenException({
        error: 'MFA_VERIFICATION_REQUIRED',
        message: 'Veuillez valider votre authentification multi-facteurs',
        action: 'VERIFY_MFA',
        mfaMethod: mfaConfig.method,
        user: {
          id: user.id,
          email: user.email,
        }
      });

    } catch (error) {
      this.logger.error(`Erreur dans MfaRequiredGuard pour ${request.url}:`, error);
      
      // Rethrow les exceptions connues
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      
      // Autres erreurs = Accès refusé
      throw new ForbiddenException('Vérification MFA échouée');
    }
  }

  /**
   * Vérifier si une route nécessite MFA de manière conditionnelle
   * Basé sur le type d'action ou la sensibilité des données
   */
  private isHighSensitivityRoute(request: any): boolean {
    const url = request.url;
    const method = request.method;

    // Routes critiques qui nécessitent toujours MFA
    const criticalPatterns = [
      /\/admin\/.*/, // Toutes les routes admin
      /\/users\/.*\/delete/, // Suppression d'utilisateurs
      /\/payments\/.*/, // Transactions financières
      /\/sensitive\/.*/, // Données sensibles
      /\/export\/.*/, // Export de données
    ];

    // Actions critiques
    const criticalActions = ['DELETE', 'PUT'];
    
    // Vérifier les patterns d'URL
    if (criticalPatterns.some(pattern => pattern.test(url))) {
      return true;
    }

    // Vérifier les actions HTTP critiques sur certaines routes
    if (criticalActions.includes(method) && url.includes('/users/')) {
      return true;
    }

    return false;
  }

  /**
   * Vérifier si l'utilisateur a un rôle qui nécessite MFA
   */
  private doesUserRoleRequireMfa(user: AuthUser): boolean {
    const mfaRequiredRoles = ['ADMIN', 'SUPER_ADMIN', 'FINANCIAL_MANAGER', 'ORGANIZER_ADMIN'];
    
    return user.roles.some(role => mfaRequiredRoles.includes(role.code));
  }

  /**
   * Vérifier la fraîcheur de la validation MFA
   * Si MFA validé il y a plus de X temps, redemander
   */
  private isMfaValidationFresh(authContext: any): boolean {
    if (!authContext.mfaVerifiedAt) {
      return false;
    }

    const maxMfaAge = 2 * 60 * 60 * 1000; // 2 heures
    const mfaAge = Date.now() - new Date(authContext.mfaVerifiedAt).getTime();
    
    return mfaAge <= maxMfaAge;
  }

  /**
   * Obtenir les méthodes MFA disponibles pour l'utilisateur
   */
  private async getAvailableMfaMethods(userId: string): Promise<string[]> {
    try {
      const mfaConfig = await this.mfaService.getUserMfaConfig(userId);
      return mfaConfig ? [mfaConfig.method] : ['SMS', 'EMAIL'];
    } catch (error) {
      this.logger.error(`Erreur récupération méthodes MFA pour ${userId}:`, error);
      return ['SMS'];
    }
  }
}