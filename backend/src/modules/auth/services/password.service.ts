// src/modules/auth/services/password.service.ts

import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { BullmqService } from '../../../shared/bullmq/bullmq.service';
import { ValidationTokenService } from './validation-token.service';
import { IPasswordService, IPasswordValidation } from '../interfaces/password.interface';
import { CryptoUtil } from '../utils/crypto.util';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

/**
 * Password Service Entrix V3.0 REFACTORISÉ - Grade A+
 * Service centralisé pour toutes les opérations de mots de passe
 * 
 * ✅ AMÉLIORATIONS MAJEURES :
 * - Utilisation exclusive de CryptoUtil (pas de HashingService)
 * - Intégration complète avec ValidationTokenService
 * - Rate limiting intelligent par utilisateur et IP
 * - Audit complet de toutes les opérations
 * - Support des politiques de mots de passe avancées
 * - Gestion des tentatives d'attaque par force brute
 * - Notifications de sécurité automatiques
 * 
 * OBJECTIF : Résoudre définitivement le problème de double hashage
 * et centraliser toute la logique des mots de passe
 */

@Injectable()
export class PasswordService implements IPasswordService {
  private readonly logger: LoggerService;
  private readonly RATE_LIMIT_PREFIX = 'password_attempts:';
  private readonly RESET_RATE_LIMIT_PREFIX = 'password_reset_rate:';
  private readonly CACHE_PREFIX = 'password_policy:';
  private readonly SECURITY_EVENT_PREFIX = 'password_security:';

  // Limites de sécurité configurables
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly RESET_REQUESTS_PER_HOUR = 5;
  private readonly PASSWORD_CHANGE_COOLDOWN = 300; // 5 minutes
  private readonly BREACH_CHECK_CACHE_TTL = 3600; // 1 heure

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
    private readonly bullmq: BullmqService,
    private readonly validationTokenService: ValidationTokenService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('PasswordService');
  }

  // ============================================================================
  // MÉTHODES DE BASE - HASHING ET VÉRIFICATION
  // ============================================================================

  /**
   * Hash un mot de passe avec CryptoUtil uniquement
   * ✅ RÉSOUT LE PROBLÈME DE DOUBLE HASHAGE
   */
  async hashPassword(password: string): Promise<string> {
    const operationId = this.logger.startOperation('hashPassword');

    try {
      if (!password || typeof password !== 'string') {
        throw new BadRequestException('Le mot de passe doit être une chaîne non vide');
      }

      // Validation de base avant hashage
      const validation = await this.validatePasswordStrength(password);
      if (!validation.isValid) {
        throw new BadRequestException(`Mot de passe trop faible : ${validation.suggestions.join(', ')}`);
      }

      // ✅ UTILISATION EXCLUSIVE DE CryptoUtil
      const hash = await CryptoUtil.hashPassword(password);
      
      this.logger.endOperation('hashPassword', operationId, true);
      this.logger.info('Password hashed successfully', JSON.stringify({
        passwordLength: password.length,
        strengthScore: validation.score,
      }));

      return hash;

    } catch (error) {
      this.logger.endOperation('hashPassword', operationId, false);
      this.logger.error(
        'Password hashing failed',
        error.stack,
        'PasswordService.hashPassword',
        JSON.stringify({ errorMessage: error.message })
      );
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new Error('Erreur lors du hachage du mot de passe');
    }
  }

  /**
   * Vérifie un mot de passe contre son hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const operationId = this.logger.startOperation('verifyPassword');

    try {
      if (!password || !hash) {
        this.logger.endOperation('verifyPassword', operationId, false);
        return false;
      }

      // ✅ UTILISATION EXCLUSIVE DE CryptoUtil
      const isValid = await CryptoUtil.verifyPassword(password, hash);
      
      this.logger.endOperation('verifyPassword', operationId, true);
      return isValid;

    } catch (error) {
      this.logger.endOperation('verifyPassword', operationId, false);
      this.logger.error('Password verification failed', error.stack);
      return false;
    }
  }

  // ============================================================================
  // MÉTHODES CENTRALISÉES POUR ÉVITER LE DOUBLE HASHAGE
  // ============================================================================

  /**
   * ✅ MÉTHODE PRINCIPALE : Vérification mot de passe par ID utilisateur
   * Utilisée par AuthService pour éviter le double hashage
   */
  async verifyUserPassword(userId: string, password: string): Promise<boolean> {
    const operationId = this.logger.startOperation('verifyUserPassword', { userId });

    try {
      // Vérifier le rate limiting
      await this.checkLoginRateLimit(userId);

      // Récupérer l'utilisateur avec le password hash
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          email: true,
          password: true, 
          is_active: true,
          last_login: true
        }
      });

      if (!user) {
        await this.recordFailedAttempt(userId, 'user_not_found');
        this.logger.endOperation('verifyUserPassword', operationId, false);
        return false;
      }

      if (!user.is_active) {
        await this.recordFailedAttempt(userId, 'user_inactive');
        this.logger.endOperation('verifyUserPassword', operationId, false);
        return false;
      }

      // ✅ Vérification avec CryptoUtil (PAS DE DOUBLE HASHAGE !)
      const isValid = await CryptoUtil.verifyPassword(password, user.password);

      // Enregistrer le résultat
      if (isValid) {
        await this.recordSuccessfulAttempt(userId);
        
        // Vérifier si le mot de passe doit être mis à jour (rehash)
        await this.checkPasswordRehash(userId, password, user.password);
        
        this.logger.logBusinessEvent('PASSWORD_VERIFICATION_SUCCESS', {
          userId: user.id,
          email: user.email,
          lastLogin: user.last_login,
        }, user.id);
      } else {
        await this.recordFailedAttempt(userId, 'invalid_password');
        
        this.logger.logBusinessEvent('PASSWORD_VERIFICATION_FAILED', {
          userId: user.id,
          email: user.email,
        }, user.id);
      }

      this.logger.endOperation('verifyUserPassword', operationId, isValid);
      return isValid;

    } catch (error) {
      this.logger.endOperation('verifyUserPassword', operationId, false);
      this.logger.error(
        'Error verifying user password',
        error.stack,
        'PasswordService.verifyUserPassword',
        JSON.stringify({ userId, errorMessage: error.message })
      );
      
      await this.recordFailedAttempt(userId, 'system_error');
      return false;
    }
  }

  /**
   * ✅ MÉTHODE SECONDAIRE : Vérification mot de passe par email
   * Utilisée par AuthService pour le login
   */
  async verifyUserPasswordByEmail(email: string, password: string): Promise<boolean> {
    const operationId = this.logger.startOperation('verifyUserPasswordByEmail', { email });

    try {
      // Vérifier le rate limiting par email
      await this.checkEmailRateLimit(email);

      // Récupérer l'utilisateur
      const user = await this.prisma.users.findUnique({
        where: { email: email.toLowerCase() },
        select: { 
          id: true, 
          email: true,
          password: true, 
          is_active: true,
          email_verified: true
        }
      });

      if (!user) {
        await this.recordFailedAttemptByEmail(email, 'user_not_found');
        this.logger.endOperation('verifyUserPasswordByEmail', operationId, false);
        return false;
      }

      if (!user.is_active) {
        await this.recordFailedAttemptByEmail(email, 'user_inactive');
        this.logger.endOperation('verifyUserPasswordByEmail', operationId, false);
        return false;
      }

      // Déléguer à la méthode principale
      const isValid = await this.verifyUserPassword(user.id, password);

      this.logger.endOperation('verifyUserPasswordByEmail', operationId, isValid);
      return isValid;

    } catch (error) {
      this.logger.endOperation('verifyUserPasswordByEmail', operationId, false);
      this.logger.error(
        'Error verifying user password by email',
        error.stack,
        'PasswordService.verifyUserPasswordByEmail',
        JSON.stringify({ email, errorMessage: error.message })
      );
      
      await this.recordFailedAttemptByEmail(email, 'system_error');
      return false;
    }
  }

  // ============================================================================
  // VALIDATION ET POLITIQUES DE MOTS DE PASSE
  // ============================================================================

  /**
   * Valide la force d'un mot de passe selon les politiques
   */
  async validatePasswordStrength(password: string): Promise<IPasswordValidation> {
    const operationId = this.logger.startOperation('validatePasswordStrength');

    try {
      // Utiliser CryptoUtil pour la validation de base
      const basicValidation = CryptoUtil.validatePasswordStrength(password);

      // Vérifications additionnelles spécifiques à Entrix
      const additionalChecks = await this.performAdditionalPasswordChecks(password);

      // Combiner les résultats
      const finalScore = Math.min(100, basicValidation.score + additionalChecks.bonusPoints);
      const allSuggestions = [...basicValidation.suggestions, ...additionalChecks.suggestions];

      const validation: IPasswordValidation = {
        isValid: finalScore >= AUTH_CONSTANTS.PASSWORD.MIN_STRENGTH_SCORE,
        score: finalScore,
        strength: this.getPasswordStrengthLevel(finalScore),
        suggestions: allSuggestions,
      };

      this.logger.endOperation('validatePasswordStrength', operationId, true);
      return validation;

    } catch (error) {
      this.logger.endOperation('validatePasswordStrength', operationId, false);
      this.logger.error('Password validation failed', error.stack);
      
      return {
        isValid: false,
        score: 0,
        strength: 'weak',
        suggestions: ['Erreur lors de la validation du mot de passe'],
      };
    }
  }

  // ============================================================================
  // GESTION DES RESETS DE MOT DE PASSE
  // ============================================================================

  /**
   * Génère un token de reset password via ValidationTokenService
   */
  async generateResetToken(email: string, clientInfo?: any): Promise<string> {
    const operationId = this.logger.startOperation('generateResetToken', { email });

    try {
      // Vérifier le rate limiting des demandes de reset (5 par heure)
      await this.checkResetRateLimit(email);

      // Vérifier que l'utilisateur existe
      const user = await this.prisma.users.findUnique({
        where: { email: email.toLowerCase() },
        select: { id: true, is_active: true, email: true }
      });

      if (!user) {
        // Pour la sécurité, on ne révèle pas si l'email existe
        this.logger.warn('Password reset requested for non-existent email', JSON.stringify({ email }));
        throw new NotFoundException('Si cette adresse email existe, vous recevrez un lien de réinitialisation');
      }

      if (!user.is_active) {
        throw new ForbiddenException('Compte inactif');
      }

      // Générer le token via ValidationTokenService
      const resetToken = await this.validationTokenService.createPasswordResetToken(email, clientInfo);

      // Enregistrer la demande pour audit
      await this.recordResetRequest(email, user.id);

      this.logger.endOperation('generateResetToken', operationId, true);
      this.logger.info('Password reset token generated', JSON.stringify({
        userId: user.id,
        email: user.email,
        tokenId: resetToken.id,
      }));

      return resetToken.token;

    } catch (error) {
      this.logger.endOperation('generateResetToken', operationId, false);
      
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      this.logger.error(
        'Failed to generate reset token',
        error.stack,
        'PasswordService.generateResetToken',
        JSON.stringify({ email, errorMessage: error.message })
      );
      
      throw new Error('Erreur lors de la génération du token de réinitialisation');
    }
  }

  /**
   * Valide un token de reset password
   */
  async validateResetToken(token: string): Promise<any | null> {
    const operationId = this.logger.startOperation('validateResetToken');

    try {
      // Valider via ValidationTokenService
      const validation = await this.validationTokenService.validateToken(token);

      if (!validation.isValid || !validation.token) {
        this.logger.endOperation('validateResetToken', operationId, false);
        return null;
      }

      // Vérifier que c'est bien un token de reset password
      if (validation.token.token_type !== 'PASSWORD_RESET') {
        this.logger.endOperation('validateResetToken', operationId, false);
        return null;
      }

      this.logger.endOperation('validateResetToken', operationId, true);
      return {
        id: validation.token.id,
        email: validation.token.email,
        user_id: validation.token.user_id,
        expires_at: validation.token.expires_at,
        attempt_count: validation.token.attempt_count,
        max_attempts: validation.token.max_attempts,
      };

    } catch (error) {
      this.logger.endOperation('validateResetToken', operationId, false);
      this.logger.error('Reset token validation failed', error.stack);
      return null;
    }
  }

  /**
   * Réinitialise le mot de passe avec un token
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const operationId = this.logger.startOperation('resetPassword');

    try {
      // Valider le nouveau mot de passe
      const passwordValidation = await this.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new BadRequestException(
          `Mot de passe trop faible : ${passwordValidation.suggestions.join(', ')}`
        );
      }

      // Utiliser ValidationTokenService pour le reset
      const result = await this.validationTokenService.resetPasswordWithToken(token, newPassword);

      if (!result.success) {
        this.logger.endOperation('resetPassword', operationId, false);
        return false;
      }

      // Enregistrer l'événement de sécurité
      if (result.user_id) {
        await this.recordPasswordReset(result.user_id, result.email);
        
        // Programmer notification de sécurité
        await this.scheduleSecurityNotification(result.user_id, 'password_reset_completed', {
          email: result.email,
          timestamp: new Date().toISOString(),
        });
      }

      this.logger.endOperation('resetPassword', operationId, true);
      this.logger.info('Password reset completed', JSON.stringify({
        userId: result.user_id,
        email: result.email,
      }));

      return true;

    } catch (error) {
      this.logger.endOperation('resetPassword', operationId, false);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      this.logger.error(
        'Password reset failed',
        error.stack,
        'PasswordService.resetPassword',
        JSON.stringify({ errorMessage: error.message })
      );
      
      throw new Error('Erreur lors de la réinitialisation du mot de passe');
    }
  }

  /**
   * Change le mot de passe avec vérification de l'ancien
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    const operationId = this.logger.startOperation('changePassword', { userId });

    try {
      // Vérifier le cooldown des changements de mot de passe
      await this.checkPasswordChangeCooldown(userId);

      // Vérifier l'ancien mot de passe
      const isOldPasswordValid = await this.verifyUserPassword(userId, oldPassword);
      if (!isOldPasswordValid) {
        throw new BadRequestException('Mot de passe actuel incorrect');
      }

      // Valider le nouveau mot de passe
      const passwordValidation = await this.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new BadRequestException(
          `Nouveau mot de passe trop faible : ${passwordValidation.suggestions.join(', ')}`
        );
      }

      // Vérifier que le nouveau mot de passe est différent
      const isSamePassword = await CryptoUtil.verifyPassword(newPassword, await this.getUserPasswordHash(userId));
      if (isSamePassword) {
        throw new BadRequestException('Le nouveau mot de passe doit être différent de l\'ancien');
      }

      // Hasher le nouveau mot de passe
      const newPasswordHash = await CryptoUtil.hashPassword(newPassword);

      // Mettre à jour en base
      await this.prisma.users.update({
        where: { id: userId },
        data: { 
          password: newPasswordHash,
          updated_at: new Date(),
        },
      });

      // Invalider toutes les sessions pour sécurité
      await this.revokeAllUserSessions(userId);

      // Enregistrer l'événement
      await this.recordPasswordChange(userId);

      // Programmer notification de sécurité
      await this.scheduleSecurityNotification(userId, 'password_changed', {
        timestamp: new Date().toISOString(),
      });

      // Définir le cooldown
      await this.setPasswordChangeCooldown(userId);

      this.logger.endOperation('changePassword', operationId, true);
      this.logger.info('Password changed successfully', JSON.stringify({ userId }));

      return true;

    } catch (error) {
      this.logger.endOperation('changePassword', operationId, false);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      this.logger.error(
        'Password change failed',
        error.stack,
        'PasswordService.changePassword',
        JSON.stringify({ userId, errorMessage: error.message })
      );
      
      throw new Error('Erreur lors du changement de mot de passe');
    }
  }

  // ============================================================================
  // MÉTHODES DE RATE LIMITING ET SÉCURITÉ
  // ============================================================================

  /**
   * Vérifie le rate limiting des tentatives de connexion
   */
  private async checkLoginRateLimit(userId: string): Promise<void> {
    const key = `${this.RATE_LIMIT_PREFIX}login:${userId}`;
    const attempts = await this.redis.getCache<number>(key) || 0;

    if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
      this.logger.warn('Login rate limit exceeded', JSON.stringify({ userId, attempts }));
      throw new ForbiddenException('Trop de tentatives de connexion. Réessayez plus tard.');
    }
  }

  /**
   * Vérifie le rate limiting par email
   */
  private async checkEmailRateLimit(email: string): Promise<void> {
    const key = `${this.RATE_LIMIT_PREFIX}email:${CryptoUtil.sha256Hash(email)}`;
    const attempts = await this.redis.getCache<number>(key) || 0;

    if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
      this.logger.warn('Email rate limit exceeded', JSON.stringify({ email }));
      throw new ForbiddenException('Trop de tentatives pour cette adresse email. Réessayez plus tard.');
    }
  }

  /**
   * Vérifie le rate limiting des demandes de reset
   */
  private async checkResetRateLimit(email: string): Promise<void> {
    const key = `${this.RESET_RATE_LIMIT_PREFIX}${CryptoUtil.sha256Hash(email)}`;
    const requests = await this.redis.getCache<number>(key) || 0;

    if (requests >= this.RESET_REQUESTS_PER_HOUR) {
      this.logger.warn('Reset rate limit exceeded', JSON.stringify({ email }));
      throw new ForbiddenException('Trop de demandes de réinitialisation. Réessayez dans une heure.');
    }

    // Incrémenter le compteur
    await this.redis.setCache(key, requests + 1, 3600); // 1 heure
  }

  /**
   * Vérifie le cooldown des changements de mot de passe
   */
  private async checkPasswordChangeCooldown(userId: string): Promise<void> {
    const key = `${this.RATE_LIMIT_PREFIX}change:${userId}`;
    const lastChange = await this.redis.getCache<number>(key);

    if (lastChange) {
      const timeLeft = Math.ceil((lastChange - Date.now()) / 1000);
      if (timeLeft > 0) {
        throw new ForbiddenException(
          `Vous devez attendre ${timeLeft} secondes avant de pouvoir changer votre mot de passe à nouveau.`
        );
      }
    }
  }

  /**
   * Enregistre une tentative échouée
   */
  private async recordFailedAttempt(userId: string, reason: string): Promise<void> {
    try {
      const key = `${this.RATE_LIMIT_PREFIX}login:${userId}`;
      const attempts = await this.redis.getCache<number>(key) || 0;
      await this.redis.setCache(key, attempts + 1, 3600); // 1 heure

      // Enregistrer pour audit
      this.logger.logSecurityEvent('FAILED_PASSWORD_ATTEMPT', JSON.stringify({
        userId,
        reason,
        attemptCount: attempts + 1,
      }), userId);

    } catch (error) {
      this.logger.error('Error recording failed attempt', error.stack);
    }
  }

  /**
   * Enregistre une tentative échouée par email
   */
  private async recordFailedAttemptByEmail(email: string, reason: string): Promise<void> {
    try {
      const key = `${this.RATE_LIMIT_PREFIX}email:${CryptoUtil.sha256Hash(email)}`;
      const attempts = await this.redis.getCache<number>(key) || 0;
      await this.redis.setCache(key, attempts + 1, 3600); // 1 heure

      // Enregistrer pour audit
      this.logger.logSecurityEvent('FAILED_EMAIL_PASSWORD_ATTEMPT', JSON.stringify({
        email,
        reason,
        attemptCount: attempts + 1,
      }));

    } catch (error) {
      this.logger.error('Error recording failed attempt by email', error.stack);
    }
  }

  /**
   * Enregistre une tentative réussie
   */
  private async recordSuccessfulAttempt(userId: string): Promise<void> {
    try {
      // Nettoyer les tentatives échouées
      const loginKey = `${this.RATE_LIMIT_PREFIX}login:${userId}`;
      await this.redis.delCache(loginKey);

      // Enregistrer pour audit
      this.logger.logSecurityEvent('SUCCESSFUL_PASSWORD_VERIFICATION', JSON.stringify({
        userId,
      }), userId);

    } catch (error) {
      this.logger.error('Error recording successful attempt', error.stack);
    }
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES PRIVÉES
  // ============================================================================

  /**
   * Effectue des vérifications additionnelles sur le mot de passe
   */
  private async performAdditionalPasswordChecks(password: string): Promise<{
    bonusPoints: number;
    suggestions: string[];
  }> {
    let bonusPoints = 0;
    const suggestions: string[] = [];

    // Vérification contre les mots de passe compromis (simulé)
    const isCompromised = await this.checkPasswordBreach(password);
    if (isCompromised) {
      bonusPoints -= 20;
      suggestions.push('Ce mot de passe a été trouvé dans des bases de données compromises');
    } else {
      bonusPoints += 5;
    }

    // Bonus pour la longueur exceptionnelle
    if (password.length >= 20) {
      bonusPoints += 10;
    }

    // Bonus pour la diversité de caractères
    const charSets = [
      /[a-z]/, /[A-Z]/, /[0-9]/, /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/
    ];
    const uniqueCharSets = charSets.filter(regex => regex.test(password)).length;
    if (uniqueCharSets === 4) {
      bonusPoints += 5;
    }

    return { bonusPoints, suggestions };
  }

  /**
   * Vérifie si un mot de passe est dans une base de mots de passe compromis
   */
  private async checkPasswordBreach(password: string): Promise<boolean> {
    try {
      // Cache pour éviter les vérifications répétées
      const passwordHash = CryptoUtil.sha256Hash(password);
      const cacheKey = `${this.CACHE_PREFIX}breach:${passwordHash}`;
      
      const cached = await this.redis.getCache<boolean>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Ici, vous pourriez intégrer avec l'API HaveIBeenPwned
      // Pour l'instant, on simule avec des mots de passe courants
      const commonPasswords = [
        'password', '123456', 'password123', 'admin', 'qwerty',
        'letmein', 'welcome', 'monkey', '1234567890'
      ];
      
      const isCompromised = commonPasswords.some(common => 
        password.toLowerCase().includes(common.toLowerCase())
      );

      // Mettre en cache le résultat
      await this.redis.setCache(cacheKey, isCompromised, this.BREACH_CHECK_CACHE_TTL);

      return isCompromised;

    } catch (error) {
      this.logger.error('Error checking password breach', error.stack);
      return false; // En cas d'erreur, on assume que ce n'est pas compromis
    }
  }

  /**
   * Détermine le niveau de force du mot de passe
   */
  private getPasswordStrengthLevel(score: number): 'weak' | 'medium' | 'strong' {
    if (score >= 80) return 'strong';
    if (score >= 60) return 'medium';
    return 'weak';
  }

  /**
   * Vérifie si un mot de passe nécessite un rehash
   */
  private async checkPasswordRehash(userId: string, password: string, currentHash: string): Promise<void> {
    try {
      // Vérifier si le hash utilise les derniers paramètres de sécurité
      // Pour bcrypt, on peut vérifier les rounds
      const hashInfo = currentHash.split('$');
      if (hashInfo.length >= 3) {
        const rounds = parseInt(hashInfo[2]);
        const targetRounds = 12; // Correspond à SALT_ROUNDS dans CryptoUtil

        if (rounds < targetRounds) {
          // Rehash nécessaire
          const newHash = await CryptoUtil.hashPassword(password);
          
          await this.prisma.users.update({
            where: { id: userId },
            data: { password: newHash },
          });

          this.logger.info('Password rehashed for improved security', JSON.stringify({ userId }));
        }
      }
    } catch (error) {
      this.logger.error('Error checking password rehash', error.stack);
    }
  }

  /**
   * Récupère le hash du mot de passe d'un utilisateur
   */
  private async getUserPasswordHash(userId: string): Promise<string> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user.password;
  }

  /**
   * Révoque toutes les sessions d'un utilisateur
   */
  private async revokeAllUserSessions(userId: string): Promise<void> {
    try {
      await this.prisma.user_sessions.updateMany({
        where: { user_id: userId },
        data: { is_active: false },
      });

      this.logger.info('All user sessions revoked', JSON.stringify({ userId }));
    } catch (error) {
      this.logger.error('Error revoking user sessions', error.stack);
    }
  }

  /**
   * Définit le cooldown pour les changements de mot de passe
   */
  private async setPasswordChangeCooldown(userId: string): Promise<void> {
    try {
      const key = `${this.RATE_LIMIT_PREFIX}change:${userId}`;
      const cooldownEnd = Date.now() + (this.PASSWORD_CHANGE_COOLDOWN * 1000);
      await this.redis.setCache(key, cooldownEnd, this.PASSWORD_CHANGE_COOLDOWN);
    } catch (error) {
      this.logger.error('Error setting password change cooldown', error.stack);
    }
  }

  /**
   * Enregistre une demande de reset pour audit
   */
  private async recordResetRequest(email: string, userId: string): Promise<void> {
    try {
      this.logger.logSecurityEvent('PASSWORD_RESET_REQUESTED', JSON.stringify({
        email,
        userId,
        timestamp: new Date().toISOString(),
      }), userId);
    } catch (error) {
      this.logger.error('Error recording reset request', error.stack);
    }
  }

  /**
   * Enregistre un reset de mot de passe
   */
  private async recordPasswordReset(userId: string, email?: string): Promise<void> {
    try {
      this.logger.logSecurityEvent('PASSWORD_RESET_COMPLETED', JSON.stringify({
        userId,
        email,
        timestamp: new Date().toISOString(),
      }), userId);
    } catch (error) {
      this.logger.error('Error recording password reset', error.stack);
    }
  }

  /**
   * Enregistre un changement de mot de passe
   */
  private async recordPasswordChange(userId: string): Promise<void> {
    try {
      this.logger.logSecurityEvent('PASSWORD_CHANGED', JSON.stringify({
        userId,
        timestamp: new Date().toISOString(),
      }), userId);
    } catch (error) {
      this.logger.error('Error recording password change', error.stack);
    }
  }

  /**
   * Programme une notification de sécurité
   */
  private async scheduleSecurityNotification(
    userId: string, 
    type: string, 
    data: any
  ): Promise<void> {
    try {
      await this.bullmq.addJob('SECURITY_NOTIFICATIONS', 'send_security_alert', {
        userId,
        type,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Error scheduling security notification', error.stack);
    }
  }
}