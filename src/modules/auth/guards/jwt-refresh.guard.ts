// src/modules/auth/guards/jwt-refresh.guard.ts

import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LoggerService } from '../../../shared/logger/logger.service';

/**
 * JWT Refresh Guard Entrix V3.0 - Grade A+
 * ✅ CORRIGÉ : Diagnostic amélioré des erreurs de refresh token
 * Protège les endpoints de refresh token avec validation renforcée
 */

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  private readonly logger: LoggerService;

  constructor(loggerService: LoggerService) {
    super();
    this.logger = loggerService.createChildLogger('JwtRefreshGuard');
  }

  /**
   * ✅ CORRIGÉ : Gestion des erreurs refresh token avec diagnostic détaillé
   */
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const operationId = this.logger.startOperation('jwtRefreshGuard', {
      path: request.url,
      method: request.method,
    });

    try {
      // ✅ DIAGNOSTIC DÉTAILLÉ DES ERREURS
      const authHeader = request.headers?.authorization;
      const hasAuthHeader = !!authHeader;
      const isValidFormat = authHeader?.startsWith('Bearer ');
      const tokenPresent = isValidFormat && authHeader?.length > 7;
      
      // ✅ LOGGING DIAGNOSTIC COMPLET
      this.logger.info('Refresh token validation attempt', JSON.stringify({
        hasAuthHeader,
        isValidFormat,
        tokenPresent,
        authHeaderLength: authHeader?.length || 0,
        authHeaderPreview: authHeader?.substring(0, 20) + '...' || 'none',
        errorType: err?.name || 'none',
        errorMessage: err?.message || info?.message || 'none',
        userPresent: !!user,
        path: request.url,
      }));

      if (err || !user) {
        // ✅ MESSAGES D'ERREUR SPÉCIFIQUES SELON LE CAS
        let errorMessage = 'Token de rafraîchissement invalide';
        let errorCode = 'INVALID_REFRESH_TOKEN';

        if (!hasAuthHeader) {
          errorMessage = 'En-tête Authorization manquant pour le refresh token';
          errorCode = 'MISSING_AUTH_HEADER';
        } else if (!isValidFormat) {
          errorMessage = 'Format d\'en-tête Authorization invalide (Bearer token requis)';
          errorCode = 'INVALID_AUTH_FORMAT';
        } else if (!tokenPresent) {
          errorMessage = 'Token de rafraîchissement vide';
          errorCode = 'EMPTY_REFRESH_TOKEN';
        } else if (err?.message?.includes('expired') || info?.message?.includes('expired')) {
          errorMessage = 'Token de rafraîchissement expiré';
          errorCode = 'EXPIRED_REFRESH_TOKEN';
        } else if (err?.message?.includes('invalid') || info?.message?.includes('invalid')) {
          errorMessage = 'Token de rafraîchissement invalide ou corrompu';
          errorCode = 'CORRUPTED_REFRESH_TOKEN';
        }

        // ✅ LOGGING STRUCTURÉ POUR DEBUG
        this.logger.warn('JWT refresh authentication failed', JSON.stringify({
          errorCode,
          errorMessage,
          originalError: err?.message || info?.message,
          path: request.url,
          method: request.method,
          hasAuthHeader,
          isValidFormat,
          tokenPresent,
          ipAddress: request.ip,
          userAgent: request.headers?.['user-agent'],
        }));

        // ✅ ÉVÉNEMENT BUSINESS POUR ANALYTICS
        this.logger.logBusinessEvent('REFRESH_AUTH_FAILED', {
          errorCode,
          error: err?.message || info?.message || errorCode,
          ipAddress: request.ip,
          userAgent: request.headers?.['user-agent'],
          path: request.url,
          hasAuthHeader,
          isValidFormat,
        });

        // ✅ CORRIGÉ : Paramètres endOperation corrects
        this.logger.endOperation('jwtRefreshGuard', operationId, false, undefined, { 
          reason: errorCode,
          error: errorMessage 
        });
        
        throw new UnauthorizedException(errorMessage);
      }

      // ✅ SUCCÈS DE L'AUTHENTIFICATION
      this.logger.info('Refresh token validation successful', JSON.stringify({
        userId: user.userId,
        sessionId: user.sessionId,
        tokenId: user.tokenId,
      }));

      this.logger.logBusinessEvent('REFRESH_AUTH_SUCCESS', {
        userId: user.userId,
        sessionId: user.sessionId,
        tokenId: user.tokenId,
        ipAddress: request.ip,
      }, user.userId);

      this.logger.endOperation('jwtRefreshGuard', operationId, true);
      return user;

    } catch (error) {
      // ✅ GESTION D'ERREUR AVEC DIAGNOSTIC
      this.logger.error('Unexpected error in refresh guard', error.stack, 'JwtRefreshGuard.handleRequest', JSON.stringify({
        errorMessage: error.message,
        path: request.url,
        hasAuthHeader: !!request.headers?.authorization,
      }));

      this.logger.endOperation('jwtRefreshGuard', operationId, false, undefined, { 
        error: error.message 
      });
      throw error;
    }
  }
}