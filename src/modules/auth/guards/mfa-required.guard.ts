// src/modules/auth/guards/mfa-required.guard.ts

import { 
  Injectable, 
  CanActivate, 
  ExecutionContext, 
  UnauthorizedException 
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { MfaRequiredException } from '../exceptions/auth.exceptions';
import { REQUIRE_MFA_KEY } from '../decorators/require-mfa.decorator';

/**
 * MFA Required Guard Entrix V3.0
 * Force l'authentification multifacteur si requise
 */

@Injectable()
export class MfaRequiredGuard implements CanActivate {
  private readonly logger: LoggerService;

  constructor(
    private readonly reflector: Reflector,
    private readonly redis: RedisService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('MfaRequiredGuard');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Vérifier si MFA requis pour cette route
    const requireMfa = this.reflector.getAllAndOverride<boolean>(REQUIRE_MFA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requireMfa || !user) {
      return true;
    }

    const operationId = this.logger.startOperation('mfaRequiredGuard', {
      userId: user.id,
      path: request.url,
    });

    try {
      // Vérifier si MFA déjà validé dans cette session
      const mfaValidated = await this.isMfaValidatedInSession(user.id, request.sessionId);
      
      if (mfaValidated) {
        this.logger.endOperation(operationId, 'success', true);
        return true;
      }

      // MFA requis mais pas validé
      this.logger.warn('MFA required but not validated', JSON.stringify({
        userId: user.id,
        path: request.url,
      }));

      // Générer challenge MFA
      const challengeToken = await this.generateMfaChallenge(user.id);
      const availableMethods = await this.getAvailableMfaMethods(user.id);

      this.logger.logBusinessEvent('MFA_CHALLENGE_REQUIRED', {
        userId: user.id,
        path: request.url,
        methods: availableMethods,
      }, user.id);

      this.logger.endOperation(operationId, 'mfa_required', false);

      throw new MfaRequiredException(challengeToken, availableMethods, 300);

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * Vérifie si MFA validé dans session Redis
   */
  private async isMfaValidatedInSession(userId: string, sessionId: string): Promise<boolean> {
    try {
      const mfaKey = `mfa_validated:${userId}:${sessionId}`;
      const isValidated = await this.redis.exists(mfaKey);
      return isValidated;
    } catch (error) {
      this.logger.error('Error checking MFA validation status', error.stack);
      return false;
    }
  }

  /**
   * Génère challenge token MFA
   */
  private async generateMfaChallenge(userId: string): Promise<string> {
    try {
      const challengeToken = `mfa_challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const challengeKey = `mfa_challenge:${challengeToken}`;
      
      await this.redis.setCache(challengeKey, userId, 300); // 5 minutes
      return challengeToken;
    } catch (error) {
      this.logger.error('Error generating MFA challenge', error.stack);
      throw new UnauthorizedException('Erreur génération challenge MFA');
    }
  }

  /**
   * Récupère méthodes MFA disponibles pour utilisateur
   */
  private async getAvailableMfaMethods(userId: string): Promise<string[]> {
    // Logique simplifiée - dans un vrai système, vérifier config MFA utilisateur
    return ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP'];
  }
}