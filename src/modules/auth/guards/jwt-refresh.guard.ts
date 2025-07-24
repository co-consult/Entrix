// src/modules/auth/guards/jwt-refresh.guard.ts

import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LoggerService } from '../../../shared/logger/logger.service';

/**
 * JWT Refresh Guard Entrix V3.0
 * Protège les endpoints de refresh token
 * 
 * ✅ CORRIGÉ : Signature logger.endOperation() avec paramètres dans le bon ordre
 */

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  private readonly logger: LoggerService;

  constructor(loggerService: LoggerService) {
    super();
    this.logger = loggerService.createChildLogger('JwtRefreshGuard');
  }

  /**
   * Gestion des erreurs refresh token
   * ✅ CORRIGÉ : Paramètres endOperation dans le bon ordre
   */
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const operationId = this.logger.startOperation('jwtRefreshGuard', {
      path: request.url,
      method: request.method,
    });

    try {
      if (err || !user) {
        // Logger les détails de l'échec de validation
        this.logger.warn('JWT refresh authentication failed', JSON.stringify({
          error: err?.message || info?.message || 'No user found',
          path: request.url,
          method: request.method,
          hasAuthHeader: !!request.headers?.authorization,
          authHeaderFormat: request.headers?.authorization?.startsWith('Bearer ') ? 'Bearer' : 'Invalid',
        }));

        // Logger événement business pour analytics
        this.logger.logBusinessEvent('REFRESH_AUTH_FAILED', {
          error: err?.message || info?.message || 'authentication_failed',
          ipAddress: request.ip,
          userAgent: request.headers?.['user-agent'],
          path: request.url,
        });

        // ✅ CORRIGÉ : Signature correcte (operationName, operationId, success, duration?, metadata?)
        this.logger.endOperation('jwtRefreshGuard', operationId, false, undefined, { 
          reason: 'authentication_failed',
          error: err?.message || info?.message 
        });
        
        throw new UnauthorizedException('Token de rafraîchissement invalide');
      }

      // Succès de l'authentification
      this.logger.logBusinessEvent('REFRESH_AUTH_SUCCESS', {
        userId: user.userId,
        sessionId: user.sessionId,
        ipAddress: request.ip,
      }, user.userId);

      // ✅ CORRIGÉ : Signature correcte
      this.logger.endOperation('jwtRefreshGuard', operationId, true);
      return user;

    } catch (error) {
      // ✅ CORRIGÉ : Signature correcte et gestion d'erreur appropriée
      this.logger.endOperation('jwtRefreshGuard', operationId, false, undefined, { 
        error: error.message 
      });
      throw error;
    }
  }
}