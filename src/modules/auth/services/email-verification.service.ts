// src/modules/auth/services/email-verification.service.ts

import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../shared/logger/logger.service';
import { ValidationTokenService } from './validation-token.service';

/**
 * Email Verification Service Entrix V3.0 REFACTORISÉ - Grade A+
 * ✅ DÉLÈGUE toute la gestion des tokens au ValidationTokenService
 * Devient un wrapper/facade pour la vérification email
 */

@Injectable()
export class EmailVerificationService {
  private readonly logger: LoggerService;

  constructor(
    private readonly validationTokenService: ValidationTokenService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('EmailVerificationService');
  }

  // ============================================================================
  // MÉTHODES REFACTORISÉES - DÉLÈGUES AU VALIDATION TOKEN SERVICE
  // ============================================================================

  /**
   * ✅ REFACTORISÉ : Délègue au ValidationTokenService
   */
  async sendVerificationEmail(email: string, userId?: string): Promise<{
    success: boolean;
    tokenId: string;
    expiresAt: Date;
  }> {
    const operationId = this.logger.startOperation('sendVerificationEmail', { email });

    try {
      const tokenData = await this.validationTokenService.createEmailVerificationToken(
        email,
        userId,
        'registration'
      );

      this.logger.endOperation('sendVerificationEmail', operationId, true);

      return {
        success: true,
        tokenId: tokenData.id,
        expiresAt: tokenData.expires_at,
      };

    } catch (error) {
      this.logger.endOperation('sendVerificationEmail', operationId, false);
      this.logger.error(
        'Failed to send verification email',
        error.stack,
        'EmailVerificationService.sendVerificationEmail',
        JSON.stringify({ errorMessage: error.message, email })
      );
      
      return {
        success: false,
        tokenId: '',
        expiresAt: new Date(),
      };
    }
  }

  /**
   * ✅ REFACTORISÉ : Délègue au ValidationTokenService
   */
  async verifyEmail(token: string): Promise<{
    success: boolean;
    userId?: string;
    email?: string;
  }> {
    const operationId = this.logger.startOperation('verifyEmail');

    try {
      const result = await this.validationTokenService.verifyEmailWithToken(token);

      this.logger.endOperation('verifyEmail', operationId, result.success);

      return {
        success: result.success,
        userId: result.user_id,
        email: result.email,
      };

    } catch (error) {
      this.logger.endOperation('verifyEmail', operationId, false);
      this.logger.error(
        'Failed to verify email',
        error.stack,
        'EmailVerificationService.verifyEmail',
        JSON.stringify({ errorMessage: error.message })
      );

      return {
        success: false,
      };
    }
  }

  /**
   * ✅ REFACTORISÉ : Délègue au ValidationTokenService
   */
  async resendVerificationEmail(email: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const operationId = this.logger.startOperation('resendVerificationEmail', { email });

    try {
      // Trouver le dernier token de vérification email pour cet email
      const existingTokens = await this.validationTokenService.getEmailTokens(
        email,
        'EMAIL_VERIFICATION'
      );

      if (!existingTokens.length) {
        // Créer un nouveau token si aucun n'existe
        await this.validationTokenService.createEmailVerificationToken(email);
      } else {
        // Renvoyer le dernier token
        const latestToken = existingTokens[0];
        await this.validationTokenService.resendToken(latestToken.id);
      }

      this.logger.endOperation('resendVerificationEmail', operationId, true);

      return {
        success: true,
        message: 'Email de vérification renvoyé avec succès',
      };

    } catch (error) {
      this.logger.endOperation('resendVerificationEmail', operationId, false);
      this.logger.error(
        'Failed to resend verification email',
        error.stack,
        'EmailVerificationService.resendVerificationEmail',
        JSON.stringify({ errorMessage: error.message, email })
      );

      return {
        success: false,
        message: 'Échec du renvoi de l\'email de vérification',
      };
    }
  }

  /**
   * ✅ NOUVEAU : Vérifier si un token de vérification est valide
   */
  async isTokenValid(token: string): Promise<boolean> {
    try {
      const validation = await this.validationTokenService.validateToken(token);
      return validation.isValid && validation.token?.token_type === 'EMAIL_VERIFICATION';
    } catch (error) {
      this.logger.error('Error checking token validity', error.stack);
      return false;
    }
  }

  /**
   * ✅ NOUVEAU : Obtenir le statut de vérification d'un email
   */
  async getVerificationStatus(email: string): Promise<{
    hasActiveToken: boolean;
    canResend: boolean;
    attemptsRemaining?: number;
  }> {
    try {
      const activeTokens = await this.validationTokenService.getEmailTokens(
        email,
        'EMAIL_VERIFICATION'
      );

      const hasActiveToken = activeTokens.some(token => 
        !token.is_used && 
        !token.is_blocked && 
        token.expires_at > new Date()
      );

      const canResend = await this.validationTokenService.canResendToken(
        email,
        'EMAIL_VERIFICATION'
      );

      return {
        hasActiveToken,
        canResend,
        attemptsRemaining: hasActiveToken ? 
          activeTokens[0]?.max_attempts - activeTokens[0]?.attempt_count : 
          undefined,
      };

    } catch (error) {
      this.logger.error('Error getting verification status', error.stack);
      return {
        hasActiveToken: false,
        canResend: false,
      };
    }
  }
}