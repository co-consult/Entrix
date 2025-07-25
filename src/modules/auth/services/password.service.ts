// src/modules/auth/services/password.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { EmailService } from '../../../shared/email/email.service';
import { IPasswordService, IPasswordReset, IPasswordValidation } from '../interfaces/password.interface';
import { CryptoUtil } from '../utils/crypto.util';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

/**
 * ✅ NOUVEAU : Password Service Entrix V3.0 - Grade A+
 * Service centralisé pour toutes les opérations de mots de passe
 * - Hash/vérification standardisée avec CryptoUtil uniquement
 * - Réinitialisation sécurisée
 * - Validation force cohérente
 * - Rate limiting et audit complet
 * 
 * OBJECTIF : Résoudre le problème critique de double hashage dans UsersService
 */

@Injectable()
export class PasswordService implements IPasswordService {
  private readonly logger: LoggerService;
  private readonly RESET_TOKEN_PREFIX = 'password_reset:';
  private readonly RATE_LIMIT_PREFIX = 'password_reset_attempts:';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly email: EmailService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('PasswordService');
  }

  /**
   * ✅ STANDARDISÉ : Hash d'un mot de passe avec CryptoUtil uniquement
   */
  async hashPassword(password: string): Promise<string> {
    const operationId = this.logger.startOperation('hashPassword');

    try {
      if (!password || typeof password !== 'string') {
        throw new BadRequestException('Le mot de passe doit être une chaîne non vide');
      }

      // ✅ Utilisation exclusive de CryptoUtil pour cohérence
      const hash = await CryptoUtil.hashPassword(password);
      
      this.logger.endOperation('hashPassword', operationId, true);
      return hash;

    } catch (error) {
      this.logger.endOperation('hashPassword', operationId, false, undefined, { errorMessage: error.message });
      this.logger.error('Password hashing failed', error.stack, 'PasswordService.hashPassword');
      throw new Error('Erreur hachage mot de passe');
    }
  }

  /**
   * ✅ STANDARDISÉ : Vérification mot de passe avec CryptoUtil uniquement
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const operationId = this.logger.startOperation('verifyPassword');

    try {
      if (!password || !hash) {
        this.logger.endOperation('verifyPassword', operationId, false, undefined, { reason: 'missing_parameters' });
        return false;
      }

      // ✅ Utilisation exclusive de CryptoUtil pour cohérence
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
   * ✅ NOUVELLE MÉTHODE : Vérification mot de passe par ID utilisateur
   * Méthode centralisée pour éviter la duplication dans UsersService
   * RÉSOUT LE PROBLÈME CRITIQUE de double hashage
   */
  async verifyUserPassword(userId: string, password: string): Promise<boolean> {
    const operationId = this.logger.startOperation('verifyUserPassword', { userId });

    try {
      console.log('🔍 DEBUG verifyUserPassword - Vérification pour user:', userId);

      // Récupérer l'utilisateur avec le password depuis Prisma
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          password: true, 
          is_active: true,
          email: true
        }
      });

      if (!user) {
        console.log('🔍 DEBUG verifyUserPassword - User not found:', userId);
        this.logger.endOperation('verifyUserPassword', operationId, false, undefined, { reason: 'user_not_found' });
        return false;
      }

      if (!user.is_active) {
        console.log('🔍 DEBUG verifyUserPassword - User inactive:', userId);
        this.logger.endOperation('verifyUserPassword', operationId, false, undefined, { reason: 'user_inactive' });
        return false;
      }

      console.log('🔍 DEBUG verifyUserPassword - User trouvé, vérification password');
      console.log('🔍 DEBUG verifyUserPassword - Password input length:', password.length);
      console.log('🔍 DEBUG verifyUserPassword - Hash from DB length:', user.password.length);

      // ✅ Vérification avec CryptoUtil standardisé (PAS DE DOUBLE HASHAGE !)
      const isValid = await CryptoUtil.verifyPassword(password, user.password);
      
      console.log('🔍 DEBUG verifyUserPassword - Résultat verification:', isValid);

      this.logger.logBusinessEvent('PASSWORD_VERIFICATION', {
        userId: user.id,
        email: user.email,
        success: isValid,
      }, user.id);

      this.logger.endOperation('verifyUserPassword', operationId, true);
      return isValid;

    } catch (error) {
      console.log('🔍 DEBUG verifyUserPassword - Erreur:', error.message);
      this.logger.endOperation('verifyUserPassword', operationId, false, undefined, { error: error.message });
      this.logger.error(`Error verifying password for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * ✅ NOUVELLE MÉTHODE : Vérification mot de passe par email
   * Méthode centralisée pour éviter la duplication dans UsersService
   * RÉSOUT LE PROBLÈME CRITIQUE de double hashage
   */
  async verifyUserPasswordByEmail(email: string, password: string): Promise<boolean> {
    const operationId = this.logger.startOperation('verifyUserPasswordByEmail', { email });

    try {
      console.log('🔍 DEBUG verifyUserPasswordByEmail - Vérification pour email:', email);

      // Récupérer l'utilisateur avec le password depuis Prisma
      const user = await this.prisma.users.findUnique({
        where: { email: email.toLowerCase() },
        select: { 
          id: true, 
          email: true,
          password: true, 
          is_active: true 
        }
      });

      if (!user) {
        console.log('🔍 DEBUG verifyUserPasswordByEmail - User not found for email:', email);
        this.logger.endOperation('verifyUserPasswordByEmail', operationId, false, undefined, { reason: 'user_not_found' });
        return false;
      }

      if (!user.is_active) {
        console.log('🔍 DEBUG verifyUserPasswordByEmail - User inactive for email:', email);
        this.logger.endOperation('verifyUserPasswordByEmail', operationId, false, undefined, { reason: 'user_inactive' });
        return false;
      }

      console.log('🔍 DEBUG verifyUserPasswordByEmail - User trouvé, vérification password');
      console.log('🔍 DEBUG verifyUserPasswordByEmail - Password input:', password);
      console.log('🔍 DEBUG verifyUserPasswordByEmail - Password length:', password.length);
      console.log('🔍 DEBUG verifyUserPasswordByEmail - Hash from DB length:', user.password.length);

      // ✅ CORRECTION CRITIQUE : Supprimer le double hashage !
      // ❌ ANCIEN CODE BUGGÉ dans UsersService :
      // const hashedPassword = await this.hashingService.hashPassword(password);
      // const isValid = await this.hashingService.compare(password, user.password);

      // ✅ NOUVEAU CODE CORRECT : 
      const isValid = await CryptoUtil.verifyPassword(password, user.password);
      
      console.log('🔍 DEBUG verifyUserPasswordByEmail - bcrypt.compare result:', isValid);

      this.logger.logBusinessEvent('PASSWORD_VERIFICATION_BY_EMAIL', {
        userId: user.id,
        email: user.email,
        success: isValid,
      }, user.id);

      this.logger.endOperation('verifyUserPasswordByEmail', operationId, true);
      return isValid;

    } catch (error) {
      console.log('🔍 DEBUG verifyUserPasswordByEmail - Erreur:', error.message);
      this.logger.endOperation('verifyUserPasswordByEmail', operationId, false, undefined, { error: error.message });
      this.logger.error(`Error verifying password for email ${email}:`, error);
      return false;
    }
  }

  /**
   * ✅ STANDARDISÉ : Validation force mot de passe cohérente
   */
  async validatePasswordStrength(password: string): Promise<IPasswordValidation> {
    const operationId = this.logger.startOperation('validatePasswordStrength');

    try {
      // Utiliser CryptoUtil pour cohérence
      const validation = CryptoUtil.validatePasswordStrength(password);

      this.logger.endOperation('validatePasswordStrength', operationId, true);
      return {
        isValid: validation.isValid,
        score: validation.score,
        strength: validation.score >= 80 ? 'strong' : validation.score >= 50 ? 'medium' : 'weak',
        suggestions: validation.suggestions
      };

    } catch (error) {
      this.logger.endOperation('validatePasswordStrength', operationId, false, undefined, { error: error.message });
      this.logger.error('Password strength validation failed', error.stack);
      
      return {
        isValid: false,
        score: 0,
        strength: 'weak',
        suggestions: ['Erreur lors de la validation du mot de passe']
      };
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

      // 5. Envoyer email de réinitialisation
      await this.email.sendPasswordResetEmail(user.email, resetToken);

      // 6. Incrémenter compteur tentatives
      await this.incrementResetAttempts(email);

      // 7. Logger événement
      this.logger.logBusinessEvent('PASSWORD_RESET_REQUESTED', {
        userId: user.id,
        email: user.email,
      }, user.id);

      this.logger.endOperation('generateResetToken', operationId, true);
      return resetToken;

    } catch (error) {
      this.logger.endOperation('generateResetToken', operationId, false, undefined, { error: error.message });
      
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error('Reset token generation failed', error.stack, 'PasswordService.generateResetToken');
      throw new Error('Erreur lors de la génération du token de réinitialisation');
    }
  }

  /**
   * Valide token de réinitialisation
   */
  async validateResetToken(token: string): Promise<IPasswordReset | null> {
    const operationId = this.logger.startOperation('validateResetToken');

    try {
      const resetDataRaw = await this.redis.getCache(`${this.RESET_TOKEN_PREFIX}${token}`);

      if (!resetDataRaw) {
        this.logger.endOperation('validateResetToken', operationId, true);
        return null;
      }

      // ✅ CORRIGÉ : Typage et validation de la structure
      const resetData = resetDataRaw as IPasswordReset;
      
      // Vérifier la structure des données
      if (!resetData.email || !resetData.token || !resetData.expiresAt) {
        this.logger.warn('Invalid reset data structure', JSON.stringify({ 
          hasEmail: !!resetData.email,
          hasToken: !!resetData.token, 
          hasExpiresAt: !!resetData.expiresAt 
        }));
        this.logger.endOperation('validateResetToken', operationId, true);
        return null;
      }

      // ✅ CORRIGÉ : Gestion correcte des dates
      const expirationDate = new Date(resetData.expiresAt);
      if (resetData.used || expirationDate < new Date()) {
        this.logger.endOperation('validateResetToken', operationId, true);
        return null;
      }

      this.logger.endOperation('validateResetToken', operationId, true);
      return resetData;

    } catch (error) {
      this.logger.endOperation('validateResetToken', operationId, false, undefined, { error: error.message });
      this.logger.error('Reset token validation failed', error.stack);
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
        throw new BadRequestException('Token de réinitialisation invalide ou expiré');
      }

      // 2. Valider force nouveau mot de passe
      const validation = await this.validatePasswordStrength(newPassword);
      if (!validation.isValid) {
        throw new BadRequestException(`Mot de passe trop faible: ${validation.suggestions.join(', ')}`);
      }

      // 3. Hash nouveau mot de passe
      const hashedPassword = await this.hashPassword(newPassword);

      // 4. Mettre à jour en base
      const user = await this.prisma.users.update({
        where: { email: resetData.email },
        data: { 
          password: hashedPassword,
          updated_at: new Date(),
        },
        select: { id: true, email: true }
      });

      // 5. Marquer token comme utilisé
      const updatedResetData: IPasswordReset = {
        ...resetData,
        used: true,
      };
      
      await this.redis.setCache(
        `${this.RESET_TOKEN_PREFIX}${token}`,
        updatedResetData,
        300 // Garder 5 minutes pour audit
      );

      // 6. Logger succès
      this.logger.logBusinessEvent('PASSWORD_RESET_COMPLETED', {
        userId: user.id,
        email: user.email,
      }, user.id);

      this.logger.endOperation('resetPassword', operationId, true);
      return true;

    } catch (error) {
      this.logger.endOperation('resetPassword', operationId, false, undefined, { error: error.message });
      
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error('Password reset failed', error.stack);
      throw new Error('Erreur lors de la réinitialisation du mot de passe');
    }
  }

  /**
   * ✅ STANDARDISÉ : Change mot de passe utilisateur
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    const operationId = this.logger.startOperation('changePassword', { userId });

    try {
      // 1. Vérifier mot de passe actuel avec méthode standardisée
      const isCurrentPasswordValid = await this.verifyUserPassword(userId, oldPassword);
      if (!isCurrentPasswordValid) {
        throw new BadRequestException('Mot de passe actuel incorrect');
      }

      // 2. Valider force nouveau mot de passe
      const validation = await this.validatePasswordStrength(newPassword);
      if (!validation.isValid) {
        throw new BadRequestException(`Nouveau mot de passe trop faible: ${validation.suggestions.join(', ')}`);
      }

      // 3. Vérifier que le nouveau mot de passe est différent
      const isSamePassword = await this.verifyUserPassword(userId, newPassword);
      if (isSamePassword) {
        throw new BadRequestException('Le nouveau mot de passe doit être différent de l\'ancien');
      }

      // 4. Hash nouveau mot de passe
      const hashedNewPassword = await this.hashPassword(newPassword);

      // 5. Mettre à jour en base
      const user = await this.prisma.users.update({
        where: { id: userId },
        data: { 
          password: hashedNewPassword,
          updated_at: new Date(),
        },
        select: { id: true, email: true }
      });

      // 6. Logger succès
      this.logger.logBusinessEvent('PASSWORD_CHANGED', {
        userId: user.id,
        email: user.email,
      }, user.id);

      this.logger.endOperation('changePassword', operationId, true);
      return true;

    } catch (error) {
      this.logger.endOperation('changePassword', operationId, false, undefined, { error: error.message });
      
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error('Password change failed', error.stack);
      throw new Error('Erreur lors du changement de mot de passe');
    }
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  private async checkResetRateLimit(email: string): Promise<void> {
    const key = `${this.RATE_LIMIT_PREFIX}${email}`;
    const attemptsRaw = await this.redis.getCache(key);
    
    // ✅ CORRIGÉ : Typage et valeur par défaut
    const attempts = typeof attemptsRaw === 'number' ? attemptsRaw : 0;
    
    // ✅ CORRIGÉ : Utilisation de constante de sécurité existante ou valeur par défaut
    const maxAttempts = 3; // 3 tentatives par heure (défaut sécurisé)
    
    if (attempts >= maxAttempts) {
      throw new BadRequestException('Trop de tentatives de réinitialisation. Réessayez plus tard.');
    }
  }

  private async incrementResetAttempts(email: string): Promise<void> {
    const key = `${this.RATE_LIMIT_PREFIX}${email}`;
    const attemptsRaw = await this.redis.getCache(key);
    
    // ✅ CORRIGÉ : Typage et gestion sécurisée
    const attempts = typeof attemptsRaw === 'number' ? attemptsRaw : 0;
    await this.redis.setCache(key, attempts + 1, 3600); // 1 heure
  }
}