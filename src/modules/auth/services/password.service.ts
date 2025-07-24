// src/modules/auth/services/password.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { EmailService } from '../../../shared/email/email.service';
import { IPasswordService, IPasswordReset } from '../interfaces';
import { CryptoUtil } from '../utils/crypto.util';
import { SecurityUtil } from '../utils/security.util';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { SECURITY_CONSTANTS } from '../constants/security.constants';
import { 
  InvalidResetTokenException,
  WeakPasswordException
} from '../exceptions/auth.exceptions';

/**
 * Password Service Entrix V3.0 - Grade A+
 * Gestion sécurisée des mots de passe et réinitialisations
 * Respecte standards sécurité OWASP et services partagés Entrix
 */

@Injectable()
export class PasswordService implements IPasswordService {
  private readonly logger: LoggerService;
  private readonly RESET_TOKEN_PREFIX = 'password_reset:';
  private readonly RESET_ATTEMPTS_PREFIX = 'reset_attempts:';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly email: EmailService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('PasswordService');
  }

  /**
   * Hash un mot de passe avec bcrypt
   * Utilise salt rounds sécurisés
   */
  async hashPassword(password: string): Promise<string> {
    const operationId = this.logger.startOperation('hashPassword');

    try {
      const hashedPassword = await CryptoUtil.hashPassword(password);
      this.logger.endOperation('hashPassword', operationId, true);
      return hashedPassword;
    } catch (error) {
      this.logger.endOperation('hashPassword', operationId, false, undefined, { errorMessage: error.message });
      this.logger.error('Password hashing failed', error.stack, 'PasswordService.hashPassword');
      throw new Error('Erreur hachage mot de passe');
    }
  }

  /**
   * Vérifie mot de passe contre hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const operationId = this.logger.startOperation('verifyPassword');

    try {
      const isValid = await CryptoUtil.verifyPassword(password, hash);
      this.logger.endOperation('verifyPassword', operationId, true);
      return isValid;
    } catch (error) {
      this.logger.endOperation('verifyPassword', operationId, false, undefined, { errorMessage: error.message });
      this.logger.error('Password verification failed', error.stack, 'PasswordService.verifyPassword');
      return false;
    }
  }

  /**
   * Génère token de réinitialisation mot de passe
   * Respecte api_specs_auth_session.md
   */
  async generateResetToken(email: string): Promise<string> {
    const operationId = this.logger.startOperation('generateResetToken', { email });

    try {
      // 1. Vérifier utilisateur existe selon schema.prisma exact
      const user = await this.prisma.users.findUnique({
        where: { email },
        select: { 
          id: true, 
          email: true,
          first_name: true,
          last_name: true,
          is_active: true 
        }
      });

      if (!user) {
        // Ne pas révéler si l'email existe (sécurité)
        this.logger.warn('Password reset requested for non-existent email', undefined, 'PasswordService.generateResetToken', JSON.stringify({ email }));
        // Retourner token factice pour éviter l'énumération d'emails
        return 'fake-token-' + Date.now();
      }

      if (!user.is_active) {
        this.logger.warn('Password reset requested for inactive user', undefined, 'PasswordService.generateResetToken', JSON.stringify({ userId: user.id, email }));
        throw new BadRequestException('Compte utilisateur inactif');
      }

      // 2. Vérifier rate limiting selon AUTH_CONSTANTS
      await this.checkResetRateLimit(email);

      // 3. Générer token sécurisé
      const resetToken = CryptoUtil.generateSecureToken(32);
      const tokenHash = CryptoUtil.sha256Hash(resetToken);

      // 4. Stocker token dans Redis avec TTL
      const resetData: IPasswordReset = {
        email: user.email,
        token: tokenHash,
        expiresAt: new Date(Date.now() + AUTH_CONSTANTS.JWT.PASSWORD_RESET_TOKEN_EXPIRY * 1000),
        used: false,
      };

      await this.redis.setCache(
        `${this.RESET_TOKEN_PREFIX}${resetToken}`, 
        resetData, 
        AUTH_CONSTANTS.JWT.PASSWORD_RESET_TOKEN_EXPIRY
      );

      // 5. Envoyer email de réinitialisation avec bonne méthode EmailService
      await this.email.sendPasswordResetEmail(user.email, resetToken);

      // 6. Incrémenter compteur tentatives
      await this.incrementResetAttempts(email);

      // 7. Logger événement sécurité
      this.logger.logSecurityEvent(
        'PASSWORD_RESET_REQUESTED',
        user.id,
        undefined,
        undefined,
        { email, tokenGenerated: true }
      );

      this.logger.endOperation('generateResetToken', operationId, true);
      return resetToken;

    } catch (error) {
      this.logger.endOperation('generateResetToken', operationId, false, undefined, { 
        errorMessage: error.message,
        email 
      });
      
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error('Failed to generate reset token', error.stack, 'PasswordService.generateResetToken', JSON.stringify({ email }));
      throw new Error('Erreur génération token réinitialisation');
    }
  }

  /**
   * Valide token de réinitialisation
   */
  async validateResetToken(token: string): Promise<IPasswordReset | null> {
    const operationId = this.logger.startOperation('validateResetToken');

    try {
      if (!token || typeof token !== 'string') {
        this.logger.endOperation('validateResetToken', operationId, false, undefined, { error: 'Invalid token format' });
        return null;
      }

      // Récupérer données depuis Redis
      const resetData = await this.redis.getCache<IPasswordReset>(`${this.RESET_TOKEN_PREFIX}${token}`);

      if (!resetData) {
        this.logger.warn('Reset token not found or expired', undefined, 'PasswordService.validateResetToken', JSON.stringify({ tokenPrefix: token.substring(0, 8) }));
        this.logger.endOperation('validateResetToken', operationId, false, undefined, { error: 'Token not found' });
        return null;
      }

      // Vérifier si déjà utilisé
      if (resetData.used) {
        this.logger.warn('Reset token already used', undefined, 'PasswordService.validateResetToken', JSON.stringify({ email: resetData.email }));
        this.logger.endOperation('validateResetToken', operationId, false, undefined, { error: 'Token already used' });
        return null;
      }

      // Vérifier expiration
      if (new Date() > new Date(resetData.expiresAt)) {
        this.logger.warn('Reset token expired', undefined, 'PasswordService.validateResetToken', JSON.stringify({ email: resetData.email }));
        await this.redis.delCache(`${this.RESET_TOKEN_PREFIX}${token}`);
        this.logger.endOperation('validateResetToken', operationId, false, undefined, { error: 'Token expired' });
        return null;
      }

      this.logger.endOperation('validateResetToken', operationId, true);
      return resetData;

    } catch (error) {
      this.logger.endOperation('validateResetToken', operationId, false, undefined, { errorMessage: error.message });
      this.logger.error('Failed to validate reset token', error.stack, 'PasswordService.validateResetToken');
      return null;
    }
  }

  /**
   * Réinitialise mot de passe avec token
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const operationId = this.logger.startOperation('resetPassword');

    try {
      // 1. Valider token
      const resetData = await this.validateResetToken(token);
      if (!resetData) {
        throw new InvalidResetTokenException();
      }

      // 2. Valider force mot de passe
      const passwordValidation = await this.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new WeakPasswordException(passwordValidation.suggestions);
      }

      // 3. Vérifier utilisateur existe selon schema.prisma
      const user = await this.prisma.users.findUnique({
        where: { email: resetData.email },
        select: { id: true, email: true, first_name: true, last_name: true }
      });

      if (!user) {
        this.logger.error('User not found during password reset', undefined, 'PasswordService.resetPassword', JSON.stringify({ email: resetData.email }));
        throw new NotFoundException('Utilisateur introuvable');
      }

      // 4. Hasher nouveau mot de passe
      const hashedPassword = await this.hashPassword(newPassword);

      // 5. Mettre à jour mot de passe dans la base selon schema.prisma exact
      await this.prisma.users.update({
        where: { id: user.id },
        data: { 
          password: hashedPassword,
          updated_at: new Date() // Champ exact du schema
        }
      });

      // 6. Marquer token comme utilisé
      await this.redis.setCache(
        `${this.RESET_TOKEN_PREFIX}${token}`,
        { ...resetData, used: true },
        300 // 5 minutes pour éviter réutilisation immédiate
      );

      // 7. Nettoyer tentatives de reset
      await this.redis.delCache(`${this.RESET_ATTEMPTS_PREFIX}${resetData.email}`);

      // 8. Logger événement sécurité
      this.logger.logSecurityEvent(
        'PASSWORD_RESET_COMPLETED',
        user.id,
        undefined,
        undefined,
        { email: user.email, tokenUsed: true }
      );

      // 9. Envoyer notification de changement réussi
      await this.email.sendMail({
        to: user.email,
        subject: 'Mot de passe modifié avec succès',
        template: 'password-changed',
        context: {
          firstName: user.first_name,
          lastName: user.last_name,
          changedAt: new Date().toLocaleString('fr-TN'),
          supportUrl: `${process.env.FRONTEND_URL}/support`
        }
      });

      this.logger.endOperation('resetPassword', operationId, true);
      return true;

    } catch (error) {
      this.logger.endOperation('resetPassword', operationId, false, undefined, { errorMessage: error.message });
      
      if (error instanceof InvalidResetTokenException || 
          error instanceof WeakPasswordException ||
          error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error('Failed to reset password', error.stack, 'PasswordService.resetPassword');
      throw new Error('Erreur lors de la réinitialisation');
    }
  }

  /**
   * Change mot de passe utilisateur connecté
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    const operationId = this.logger.startOperation('changePassword', { userId });

    try {
      // 1. Récupérer utilisateur selon schema.prisma exact
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          email: true, 
          password: true,
          first_name: true,
          last_name: true,
          is_active: true 
        }
      });

      if (!user) {
        throw new NotFoundException('Utilisateur introuvable');
      }

      if (!user.is_active) {
        throw new BadRequestException('Compte utilisateur inactif');
      }

      // 2. Vérifier ancien mot de passe
      const isValidOldPassword = await this.verifyPassword(oldPassword, user.password);
      if (!isValidOldPassword) {
        this.logger.warn('Invalid old password during change', undefined, 'PasswordService.changePassword', JSON.stringify({ userId }));
        throw new BadRequestException('Ancien mot de passe incorrect');
      }

      // 3. Valider nouveau mot de passe
      const passwordValidation = await this.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new WeakPasswordException(passwordValidation.suggestions);
      }

      // 4. Vérifier que nouveau mot de passe est différent
      const isSamePassword = await this.verifyPassword(newPassword, user.password);
      if (isSamePassword) {
        throw new BadRequestException('Le nouveau mot de passe doit être différent de l\'ancien');
      }

      // 5. Hasher et sauvegarder nouveau mot de passe
      const hashedNewPassword = await this.hashPassword(newPassword);

      await this.prisma.users.update({
        where: { id: userId },
        data: { 
          password: hashedNewPassword,
          updated_at: new Date()
        }
      });

      // 6. Logger événement sécurité
      this.logger.logSecurityEvent(
        'PASSWORD_CHANGED',
        userId,
        undefined,
        undefined,
        { 
          email: user.email,
          changedAt: new Date().toISOString()
        }
      );

      // 7. Envoyer notification email
      await this.email.sendMail({
        to: user.email,
        subject: 'Mot de passe modifié',
        template: 'password-changed',
        context: {
          firstName: user.first_name,
          lastName: user.last_name,
          changedAt: new Date().toLocaleString('fr-TN'),
          ipAddress: 'Non disponible', // TODO: récupérer IP depuis contexte
          supportUrl: `${process.env.FRONTEND_URL}/support`
        }
      });

      this.logger.endOperation('changePassword', operationId, true);
      return true;

    } catch (error) {
      this.logger.endOperation('changePassword', operationId, false, undefined, { errorMessage: error.message });
      
      if (error instanceof NotFoundException ||
          error instanceof BadRequestException ||
          error instanceof WeakPasswordException) {
        throw error;
      }

      this.logger.error('Failed to change password', error.stack, 'PasswordService.changePassword', JSON.stringify({ userId }));
      throw new Error('Erreur lors du changement de mot de passe');
    }
  }

  /**
   * Valide la force d'un mot de passe selon OWASP
   */
  async validatePasswordStrength(password: string): Promise<{ 
    isValid: boolean; 
    score: number; 
    suggestions: string[] 
  }> {
    const operationId = this.logger.startOperation('validatePasswordStrength');

    try {
      const result = CryptoUtil.validatePasswordStrength(password);
      this.logger.endOperation('validatePasswordStrength', operationId, true);
      return result;
    } catch (error) {
      this.logger.endOperation('validatePasswordStrength', operationId, false, undefined, { errorMessage: error.message });
      this.logger.error('Failed to validate password strength', error.stack, 'PasswordService.validatePasswordStrength');
      return {
        isValid: false,
        score: 0,
        suggestions: ['Erreur validation mot de passe']
      };
    }
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  /**
   * Vérifie rate limiting pour reset password
   */
  private async checkResetRateLimit(email: string): Promise<void> {
    const key = `${this.RESET_ATTEMPTS_PREFIX}${email}`;
    const attempts = await this.redis.get(key);
    const currentAttempts = attempts ? parseInt(attempts, 10) : 0;

    if (currentAttempts >= SECURITY_CONSTANTS.RATE_LIMITS.PASSWORD_RESET.MAX_ATTEMPTS) {
      this.logger.warn('Password reset rate limit exceeded', undefined, 'PasswordService.checkResetRateLimit', JSON.stringify({ email, attempts: currentAttempts }));
      throw new BadRequestException(
        `Trop de tentatives de réinitialisation. Réessayez dans ${SECURITY_CONSTANTS.RATE_LIMITS.PASSWORD_RESET.WINDOW_MS / (60 * 1000)} minutes.`
      );
    }
  }

  /**
   * Incrémente compteur tentatives reset
   */
  private async incrementResetAttempts(email: string): Promise<void> {
    const key = `${this.RESET_ATTEMPTS_PREFIX}${email}`;
    await this.redis.increment(key, SECURITY_CONSTANTS.RATE_LIMITS.PASSWORD_RESET.WINDOW_MS / 1000);
  }
}