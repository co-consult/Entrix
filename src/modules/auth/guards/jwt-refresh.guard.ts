// src/modules/auth/guards/jwt-refresh.guard.ts

import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LoggerService } from '../../../shared/logger/logger.service';

/**
 * JWT Refresh Guard Entrix V3.0
 * Protège les endpoints de refresh token
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
   */
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const operationId = this.logger.startOperation('jwtRefreshGuard', {
      path: request.url,
    });

    try {
      if (err || !user) {
        this.logger.warn('JWT refresh authentication failed', JSON.stringify({
          error: err?.message || info?.message || 'No user found',
          path: request.url,
        }));

        this.logger.logBusinessEvent('REFRESH_AUTH_FAILED', {
          error: err?.message || 'authentication_failed',
          ipAddress: request.ip,
        });

        this.logger.endOperation(operationId, 'unauthorized', false);
        throw new UnauthorizedException('Token de rafraîchissement invalide');
      }

      this.logger.endOperation(operationId, 'success', true);
      return user;

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }
}