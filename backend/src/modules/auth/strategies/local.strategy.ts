// src/modules/auth/strategies/local.strategy.ts

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { LoggerService } from '../../../shared/logger/logger.service';
import { AuthService } from '../services/auth.service';
import { IUserProfile } from '../interfaces/user.interface';
import { InvalidCredentialsException } from '../exceptions/auth.exceptions';

/**
 * Local Strategy pour authentification email/password Entrix V3.0
 * Utilisée pour validation initiale des identifiants
 */

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  private readonly logger: LoggerService;

  constructor(
    private readonly authService: AuthService,
    loggerService: LoggerService,
  ) {
    super({
      usernameField: 'email', // Utiliser email au lieu de username
      passwordField: 'password',
      passReqToCallback: true, // Pour accéder aux infos de requête
    });

    this.logger = loggerService.createChildLogger('LocalStrategy');
  }

  /**
   * Validation des identifiants utilisateur
   * Respecte processus_authentification.md
   */
  async validate(req: any, email: string, password: string): Promise<IUserProfile> {
    const operationId = this.logger.startOperation('validateCredentials', { email });

    try {
      // Extraire infos contextuelles de la requête
      const ipAddress = this.extractIpAddress(req);
      const userAgent = req.headers?.['user-agent'] || '';
      const deviceFingerprint = req.headers?.['x-device-fingerprint'];

      this.logger.info('Local authentication attempt', JSON.stringify({
        email,
        ipAddress,
        hasDeviceFingerprint: !!deviceFingerprint,
      }));

      // Valider identifiants via AuthService
      const user = await this.authService.validateUser(email, password, {
        ipAddress,
        userAgent,
        deviceFingerprint,
      });

      if (!user) {
        this.logger.warn('Invalid credentials provided', JSON.stringify({ 
          email,
          ipAddress 
        }));
        
        // Logger tentative échec
        this.logger.logBusinessEvent('LOGIN_FAILED', {
          email,
          ipAddress,
          userAgent,
          reason: 'invalid_credentials',
        });

        throw new InvalidCredentialsException();
      }

      // Logger succès validation
      this.logger.logBusinessEvent('CREDENTIALS_VALIDATED', {
        userId: user.id,
        email: user.email,
        ipAddress,
        userAgent,
      }, user.id);

      this.logger.endOperation(operationId, 'success', true);

      return user;

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);

      // Logger échec authentication
      this.logger.logBusinessEvent('LOCAL_AUTH_FAILED', {
        email,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Extrait adresse IP de la requête
   */
  private extractIpAddress(req: any): string {
    return req.ip || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           req.headers?.['x-forwarded-for']?.split(',')[0] ||
           req.headers?.['x-real-ip'] ||
           'unknown';
  }
}