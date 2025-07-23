// src/modules/auth/guards/jwt-auth.guard.ts

import { 
  Injectable, 
  ExecutionContext, 
  UnauthorizedException,
  CanActivate 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { LoggerService } from '../../../shared/logger/logger.service';
import { IS_PUBLIC_KEY } from '../decorators/current-user.decorator';
import { SecurityUtil } from '../utils/security.util';

/**
 * JWT Authentication Guard Entrix V3.0
 * Protège les routes avec authentification JWT obligatoire
 */

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  private readonly logger: LoggerService;

  constructor(
    private readonly reflector: Reflector,
    loggerService: LoggerService,
  ) {
    super();
    this.logger = loggerService.createChildLogger('JwtAuthGuard');
  }

  /**
   * Détermine si la requête peut passer
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Vérifier si route marquée comme publique
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Déléguer à Passport JWT
    return super.canActivate(context);
  }

  /**
   * Gestion personnalisée des erreurs d'authentification
   */
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const operationId = this.logger.startOperation('jwtAuthGuard', {
      path: request.url,
      method: request.method,
    });

    try {
      // Si erreur JWT ou utilisateur inexistant
      if (err || !user) {
        const token = this.extractTokenFromRequest(request);
        const error = err || info;

        this.logger.warn('JWT authentication failed', JSON.stringify({
          path: request.url,
          method: request.method,
          error: error?.message || 'No user found',
          hasToken: !!token,
          tokenValid: token ? SecurityUtil.isValidJwtFormat(token) : false,
        }));

        // Logger échec auth pour analytics
        this.logger.logBusinessEvent('JWT_AUTH_FAILED', {
          path: request.url,
          method: request.method,
          error: error?.message || 'authentication_failed',
          userAgent: request.headers?.['user-agent'],
          ipAddress: request.ip,
        });

        this.logger.endOperation(operationId, 'unauthorized', false);
        throw new UnauthorizedException('Token d\'authentification requis');
      }

      // Ajouter headers de sécurité
      const response = context.switchToHttp().getResponse();
      this.addSecurityHeaders(response);

      // Logger succès auth
      this.logger.logBusinessEvent('JWT_AUTH_SUCCESS', {
        userId: user.id,
        path: request.url,
        method: request.method,
      }, user.id);

      this.logger.endOperation(operationId, 'success', true);
      return user;

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * Extrait token de la requête
   */
  private extractTokenFromRequest(request: any): string | null {
    const authHeader = request.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Ajoute headers de sécurité à la réponse
   */
  private addSecurityHeaders(response: any): void {
    const securityHeaders = SecurityUtil.generateSecurityHeaders();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.setHeader(key, value);
    });
  }
}