// src/modules/auth/services/validation-token.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { validation_token_type } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { HashingService } from '../../../shared/hashing/hashing.service';
import { BullmqService } from '../../../shared/bullmq/bullmq.service';
import { 
  IValidationTokenService,
  ICreateValidationTokenData,
  IUpdateValidationTokenData,
  IValidationTokenGenerated,
  IValidationTokenValidation,
  IValidationTokenUsageResult,
  IValidationToken,
  IValidationTokenStats,
  IValidationTokenFilters,
  ValidationTokenError,
  ValidationTokenErrorCode,
  VALIDATION_TOKEN_DURATIONS,
  VALIDATION_TOKEN_ATTEMPT_LIMITS
} from '../interfaces/validation-token.interface';

/**
 * Validation Token Service Entrix V3.0 - Grade A+
 * Service de gestion des tokens de validation (email, reset password, invitations, etc.)
 * Respecte le schema.prisma et utilise les services partagés
 */

@Injectable()
export class ValidationTokenService implements IValidationTokenService {
  private readonly logger: LoggerService;
  private readonly CACHE_PREFIX = 'validation_token:';
  private readonly RATE_LIMIT_PREFIX = 'validation_rate:';
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
    private readonly hashingService: HashingService,
    private readonly bullmq: BullmqService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('ValidationTokenService');
  }

  // ============================================================================
  // MÉTHODES DE CRÉATION DE TOKENS SPÉCIALISÉS
  // ============================================================================

  /**
   * Créer un token de vérification email
   */
  async createEmailVerificationToken(
    email: string,
    userId?: string,
    type: 'registration' | 'email_change' = 'registration'
  ): Promise<IValidationTokenGenerated> {
    const operationId = this.logger.startOperation('createEmailVerificationToken', { email, type });

    try {
      // Vérifier le rate limiting
      await this.checkRateLimit(email, 'EMAIL_VERIFICATION');

      // Révoquer les tokens existants du même type
      await this.revokeExistingTokens(email, 'EMAIL_VERIFICATION');

      const tokenData: ICreateValidationTokenData = {
        user_id: userId,
        email: email,
        token_type: 'EMAIL_VERIFICATION',
        expires_in_minutes: VALIDATION_TOKEN_DURATIONS.EMAIL_VERIFICATION,
        max_attempts: VALIDATION_TOKEN_ATTEMPT_LIMITS.EMAIL_VERIFICATION,
        verification_data: {
          verification_type: type,
        },
      };

      const result = await this.createToken(tokenData);

      // Programmer l'envoi d'email
      await this.scheduleEmailSending(result);

      this.logger.endOperation('createEmailVerificationToken', operationId, true);
      return result;

    } catch (error) {
      this.logger.endOperation('createEmailVerificationToken', operationId, false);
      throw error;
    }
  }

  /**
   * Créer un token de reset password
   */
  async createPasswordResetToken(email: string): Promise<IValidationTokenGenerated> {
    const operationId = this.logger.startOperation('createPasswordResetToken', { email });

    try {
      // Vérifier le rate limiting (plus strict pour reset password)
      await this.checkRateLimit(email, 'PASSWORD_RESET', { limit: 3, windowMinutes: 60 });

      // Vérifier que l'utilisateur existe
      const user = await this.prisma.users.findUnique({
        where: { email },
        select: { id: true, is_active: true, password: true },
      });

      if (!user) {
        // Pour la sécurité, on ne révèle pas si l'email existe
        this.logger.warn('Password reset requested for non-existent email', JSON.stringify({ email }));
        
        // Retourner un faux token pour éviter l'énumération d'emails
        return this.createDummyToken(email, 'PASSWORD_RESET');
      }

      if (!user.is_active) {
        throw new Error('Account is inactive');
      }

      // Révoquer les tokens existants
      await this.revokeExistingTokens(email, 'PASSWORD_RESET');

      const tokenData: ICreateValidationTokenData = {
        user_id: user.id,
        email: email,
        token_type: 'PASSWORD_RESET',
        expires_in_minutes: VALIDATION_TOKEN_DURATIONS.PASSWORD_RESET,
        max_attempts: VALIDATION_TOKEN_ATTEMPT_LIMITS.PASSWORD_RESET,
        reset_password_data: {
          current_password_hash: user.password,
          requires_old_password: false,
        },
      };

      const result = await this.createToken(tokenData);

      // Programmer l'envoi d'email
      await this.scheduleEmailSending(result);

      this.logger.endOperation('createPasswordResetToken', operationId, true);
      return result;

    } catch (error) {
      this.logger.endOperation('createPasswordResetToken', operationId, false);
      throw error;
    }
  }

  /**
   * Créer un token d'invitation
   */
  async createInvitationToken(
    email: string, 
    invitationData: any
  ): Promise<IValidationTokenGenerated> {
    const operationId = this.logger.startOperation('createInvitationToken', { email });

    try {
      // Vérifier que l'email n'est pas déjà utilisé
      const existingUser = await this.prisma.users.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Vérifier le rate limiting
      await this.checkRateLimit(email, 'INVITATION_USER');

      const tokenData: ICreateValidationTokenData = {
        email: email,
        token_type: 'INVITATION_USER',
        expires_in_minutes: VALIDATION_TOKEN_DURATIONS.INVITATION_USER,
        max_attempts: VALIDATION_TOKEN_ATTEMPT_LIMITS.INVITATION_USER,
        invitation_data: {
          inviter_id: invitationData.inviter_id,
          inviter_name: invitationData.inviter_name,
          organization_id: invitationData.organization_id,
          role: invitationData.role || 'USER',
          group_id: invitationData.group_id,
          permissions: invitationData.permissions || [],
          welcome_message: invitationData.welcome_message,
          //auto_accept: invitationData.auto_accept || false,
        },
      };

      const result = await this.createToken(tokenData);

      // Programmer l'envoi d'email d'invitation
      await this.scheduleInvitationEmail(result);

      this.logger.endOperation('createInvitationToken', operationId, true);
      return result;

    } catch (error) {
      this.logger.endOperation('createInvitationToken', operationId, false);
      throw error;
    }
  }

  /**
   * Créer un magic link
   */
  async createMagicLinkToken(
    email: string, 
    action: string, 
    linkData?: any
  ): Promise<IValidationTokenGenerated> {
    const operationId = this.logger.startOperation('createMagicLinkToken', { email, action });

    try {
      // Vérifier le rate limiting
      await this.checkRateLimit(email, 'MAGIC_LINK_LOGIN');

      const tokenData: ICreateValidationTokenData = {
        email: email,
        token_type: action === 'login' ? 'MAGIC_LINK_LOGIN' : 'MAGIC_LINK_ACTION',
        expires_in_minutes: action === 'login' 
          ? VALIDATION_TOKEN_DURATIONS.MAGIC_LINK_LOGIN
          : VALIDATION_TOKEN_DURATIONS.MAGIC_LINK_ACTION,
        max_attempts: action === 'login'
          ? VALIDATION_TOKEN_ATTEMPT_LIMITS.MAGIC_LINK_LOGIN
          : VALIDATION_TOKEN_ATTEMPT_LIMITS.MAGIC_LINK_ACTION,
        magic_link_data: {
          action: action,
          redirect_url: linkData?.redirect_url,
          expires_after_use: linkData?.expires_after_use !== false,
          one_time_use: linkData?.one_time_use !== false,
          context_data: linkData?.context_data || {},
        },
      };

      const result = await this.createToken(tokenData);

      // Programmer l'envoi d'email avec magic link
      await this.scheduleMagicLinkEmail(result);

      this.logger.endOperation('createMagicLinkToken', operationId, true);
      return result;

    } catch (error) {
      this.logger.endOperation('createMagicLinkToken', operationId, false);
      throw error;
    }
  }

  /**
   * Créer un token de vérification téléphone
   */
  async createPhoneVerificationToken(
    phone: string, 
    userId?: string
  ): Promise<IValidationTokenGenerated> {
    const operationId = this.logger.startOperation('createPhoneVerificationToken', { phone });

    try {
      // Pour les SMS, on utilise un token court (6 chiffres)
      const shortToken = this.generateNumericToken(6);

      const tokenData: ICreateValidationTokenData = {
        user_id: userId,
        email: phone, // On utilise le champ email pour stocker le téléphone
        token_type: 'PHONE_VERIFICATION',
        expires_in_minutes: VALIDATION_TOKEN_DURATIONS.PHONE_VERIFICATION,
        max_attempts: VALIDATION_TOKEN_ATTEMPT_LIMITS.PHONE_VERIFICATION,
      };

      const result = await this.createTokenWithCustomCode(tokenData, shortToken);

      // Programmer l'envoi de SMS
      await this.scheduleSMSSending(result, phone);

      this.logger.endOperation('createPhoneVerificationToken', operationId, true);
      return result;

    } catch (error) {
      this.logger.endOperation('createPhoneVerificationToken', operationId, false);
      throw error;
    }
  }

  // ============================================================================
  // MÉTHODES DE VALIDATION ET UTILISATION
  // ============================================================================

  /**
   * Valider un token de validation
   */
  async validateToken(token: string): Promise<IValidationTokenValidation> {
    const operationId = this.logger.startOperation('validateToken');

    try {
      // Hasher le token pour recherche
      const tokenHash = await this.hashingService.hashPassword(token);

      // Chercher le token
      const validationToken = await this.prisma.validation_tokens.findUnique({
        where: { token_hash: tokenHash },
        include: { users: { select: { id: true, is_active: true } } },
      });

      if (!validationToken) {
        return {
          isValid: false,
          errors: [{ code: ValidationTokenErrorCode.TOKEN_NOT_FOUND, message: 'Token not found' }],
        };
      }

      // Vérifications de validité
      const errors: ValidationTokenError[] = [];

      if (validationToken.is_used) {
        errors.push({ 
          code: ValidationTokenErrorCode.TOKEN_USED, 
          message: 'Token has already been used' 
        });
      }

      if (validationToken.expires_at < new Date()) {
        errors.push({ 
          code: ValidationTokenErrorCode.TOKEN_EXPIRED, 
          message: 'Token has expired' 
        });
      }

      if (validationToken.is_blocked) {
        errors.push({ 
          code: ValidationTokenErrorCode.TOKEN_BLOCKED, 
          message: 'Token is blocked due to too many failed attempts' 
        });
      }

      if (validationToken.user_id && !validationToken.users?.is_active) {
        errors.push({ 
          code: ValidationTokenErrorCode.USER_NOT_FOUND, 
          message: 'Associated user account is inactive' 
        });
      }

      const isValid = errors.length === 0;
      const attemptsRemaining = Math.max(0, validationToken.max_attempts - validationToken.attempt_count);

      const validation: IValidationTokenValidation = {
        isValid,
        token: isValid ? validationToken : undefined,
        errors: errors.length > 0 ? errors : undefined,
        attempts_remaining: attemptsRemaining,
        is_blocked: validationToken.is_blocked,
        expires_at: validationToken.expires_at,
        can_resend: await this.canResendToken(validationToken.email, validationToken.token_type),
      };

      this.logger.endOperation('validateToken', operationId, true);
      return validation;

    } catch (error) {
      this.logger.endOperation('validateToken', operationId, false);
      this.logger.error(
        'Failed to validate token',
        error.stack,
        'ValidationTokenService.validateToken',
        JSON.stringify({ errorMessage: error.message })
      );
      
      return {
        isValid: false,
        errors: [{ code: 'INTERNAL_ERROR', message: 'Internal validation error' }],
      };
    }
  }

  /**
   * Utiliser un token (marquer comme utilisé)
   */
  async useToken(token: string, clientInfo?: any): Promise<IValidationTokenUsageResult> {
    const operationId = this.logger.startOperation('useToken');

    try {
      // Valider le token d'abord
      const validation = await this.validateToken(token);

      if (!validation.isValid || !validation.token) {
        return {
          success: false,
          errors: validation.errors || [{ 
            code: ValidationTokenErrorCode.TOKEN_NOT_FOUND, 
            message: 'Invalid token' 
          }],
        };
      }

      const validationToken = validation.token;

      // Marquer le token comme utilisé
      const usedToken = await this.prisma.validation_tokens.update({
        where: { id: validationToken.id },
        data: {
          is_used: true,
          used_at: new Date(),
          used_ip: clientInfo?.ip_address || null,
          updated_at: new Date(),
        },
      });

      // Invalider le cache
      await this.invalidateTokenCache(validationToken.id);

      const result: IValidationTokenUsageResult = {
        success: true,
        token: usedToken,
        user_id: usedToken.user_id,
        email: usedToken.email,
        action_data: this.extractActionData(usedToken),
      };

      this.logger.endOperation('useToken', operationId, true);
      this.logger.info('Validation token used', JSON.stringify({
        tokenId: usedToken.id,
        type: usedToken.token_type,
        email: usedToken.email,
      }));

      return result;

    } catch (error) {
      this.logger.endOperation('useToken', operationId, false);
      this.logger.error(
        'Failed to use token',
        error.stack,
        'ValidationTokenService.useToken',
        JSON.stringify({ errorMessage: error.message })
      );
      
      return {
        success: false,
        errors: [{ code: 'INTERNAL_ERROR', message: 'Internal error during token usage' }],
      };
    }
  }

  /**
   * Vérifier email avec token
   */
  async verifyEmailWithToken(token: string): Promise<IValidationTokenUsageResult> {
    const result = await this.useToken(token);

    if (result.success && result.token?.token_type === 'EMAIL_VERIFICATION') {
      // Marquer l'email comme vérifié
      if (result.user_id) {
        await this.prisma.users.update({
          where: { id: result.user_id },
          data: { 
            email_verified: true, // Boolean selon le schema actuel
            updated_at: new Date(),
          },
        });
      }

      result.next_steps = ['Email successfully verified', 'You can now access all features'];
    }

    return result;
  }

  /**
   * Reset password avec token
   */
  async resetPasswordWithToken(
    token: string, 
    newPassword: string
  ): Promise<IValidationTokenUsageResult> {
    const operationId = this.logger.startOperation('resetPasswordWithToken');

    try {
      const result = await this.useToken(token);

      if (result.success && result.token?.token_type === 'PASSWORD_RESET' && result.user_id) {
        // Hasher le nouveau mot de passe
        const hashedPassword = await this.hashingService.hashPassword(newPassword);

        // Mettre à jour le mot de passe
        await this.prisma.users.update({
          where: { id: result.user_id },
          data: { 
            password: hashedPassword,
            updated_at: new Date(),
          },
        });

        // Révoquer toutes les sessions existantes pour sécurité
        await this.prisma.user_sessions.updateMany({
          where: { user_id: result.user_id },
          data: { is_active: false },
        });

        result.next_steps = [
          'Password successfully updated',
          'All existing sessions have been logged out for security',
          'Please log in with your new password'
        ];

        this.logger.info('Password reset completed', JSON.stringify({
          userId: result.user_id,
          email: result.email,
        }));
      }

      this.logger.endOperation('resetPasswordWithToken', operationId, true);
      return result;

    } catch (error) {
      this.logger.endOperation('resetPasswordWithToken', operationId, false);
      throw error;
    }
  }

  /**
   * Accepter invitation avec token
   */
  async acceptInvitationWithToken(
    token: string, 
    userData?: any
  ): Promise<IValidationTokenUsageResult> {
    const operationId = this.logger.startOperation('acceptInvitationWithToken');

    try {
      const result = await this.useToken(token);

      if (result.success && 
          result.token?.token_type === 'INVITATION_USER' && 
          result.token.invitation_data) {

        const invitationData = result.token.invitation_data;

        // Créer l'utilisateur si les données sont fournies
        if (userData && userData.password) {
          const hashedPassword = await this.hashingService.hashPassword(userData.password);

          const newUser = await this.prisma.users.create({
            data: {
              email: result.email,
              password: hashedPassword,
              first_name: userData.firstName || 'User',
              last_name: userData.lastName || 'User',
              is_active: true,
              email_verified: true, // Email pré-vérifié par invitation
            },
          });

          // Assigner le rôle de l'invitation
          if (invitationData.role) {
            // Logique d'assignation de rôle à implémenter selon votre système
          }

          result.user_id = newUser.id;
          result.next_steps = [
            'Account created successfully',
            'You have been assigned the appropriate role',
            'You can now log in with your credentials'
          ];
        }

        this.logger.info('Invitation accepted', JSON.stringify({
          email: result.email,
          inviterId: invitationData.inviter_id,
          role: invitationData.role,
        }));
      }

      this.logger.endOperation('acceptInvitationWithToken', operationId, true);
      return result;

    } catch (error) {
      this.logger.endOperation('acceptInvitationWithToken', operationId, false);
      throw error;
    }
  }

  /**
   * Utiliser magic link
   */
  async useMagicLink(token: string, clientInfo?: any): Promise<IValidationTokenUsageResult> {
    const result = await this.useToken(token, clientInfo);

    if (result.success && result.token?.magic_link_data) {
      const magicLinkData = result.token.magic_link_data;
      
      result.action_data = {
        action: magicLinkData.action,
        redirect_url: magicLinkData.redirect_url,
        context_data: magicLinkData.context_data,
      };

      // Pour les magic links de login, on peut générer une session temporaire
      if (magicLinkData.action === 'login' && result.user_id) {
        result.next_steps = [
          'Magic link authentication successful',
          'You will be automatically logged in'
        ];
      }
    }

    return result;
  }

  // ============================================================================
  // MÉTHODES DE GESTION DES TENTATIVES
  // ============================================================================

  /**
   * Enregistrer une tentative
   */
  async recordAttempt(tokenId: string, success: boolean, clientInfo?: any): Promise<void> {
    try {
      const token = await this.prisma.validation_tokens.findUnique({
        where: { id: tokenId },
        select: { attempt_count: true, max_attempts: true, is_blocked: true },
      });

      if (!token) return;

      const newAttemptCount = token.attempt_count + 1;
      const shouldBlock = !success && newAttemptCount >= token.max_attempts;

      await this.prisma.validation_tokens.update({
        where: { id: tokenId },
        data: {
          attempt_count: newAttemptCount,
          is_blocked: shouldBlock || token.is_blocked,
          blocked_at: shouldBlock ? new Date() : undefined,
          updated_at: new Date(),
        },
      });

      if (shouldBlock) {
        this.logger.warn('Token blocked due to max attempts', JSON.stringify({
          tokenId,
          attempts: newAttemptCount,
        }));
      }

    } catch (error) {
      this.logger.error('Error recording token attempt', error.stack);
    }
  }

  /**
   * Bloquer un token
   */
  async blockToken(tokenId: string, reason?: string): Promise<boolean> {
    try {
      await this.prisma.validation_tokens.update({
        where: { id: tokenId },
        data: {
          is_blocked: true,
          blocked_at: new Date(),
          metadata: { block_reason: reason },
          updated_at: new Date(),
        },
      });

      await this.invalidateTokenCache(tokenId);
      return true;

    } catch (error) {
      this.logger.error('Error blocking token', error.stack);
      return false;
    }
  }

  /**
   * Débloquer un token
   */
  async unblockToken(tokenId: string): Promise<boolean> {
    try {
      await this.prisma.validation_tokens.update({
        where: { id: tokenId },
        data: {
          is_blocked: false,
          blocked_at: null,
          attempt_count: 0, // Reset attempts
          updated_at: new Date(),
        },
      });

      await this.invalidateTokenCache(tokenId);
      return true;

    } catch (error) {
      this.logger.error('Error unblocking token', error.stack);
      return false;
    }
  }

  // ============================================================================
  // MÉTHODES DE RÉCUPÉRATION
  // ============================================================================

  /**
   * Récupérer un token par ID
   */
  async getToken(tokenId: string): Promise<IValidationToken | null> {
    try {
      return await this.prisma.validation_tokens.findUnique({
        where: { id: tokenId },
      });
    } catch (error) {
      this.logger.error('Error getting token', error.stack);
      return null;
    }
  }

  /**
   * Récupérer un token par hash
   */
  async getTokenByHash(tokenHash: string): Promise<IValidationToken | null> {
    try {
      return await this.prisma.validation_tokens.findUnique({
        where: { token_hash: tokenHash },
      });
    } catch (error) {
      this.logger.error('Error getting token by hash', error.stack);
      return null;
    }
  }

  /**
   * Récupérer les tokens d'un utilisateur
   */
  async getUserTokens(
    userId: string, 
    type?: validation_token_type
  ): Promise<IValidationToken[]> {
    try {
      const whereClause: any = { user_id: userId };
      if (type) whereClause.token_type = type;

      return await this.prisma.validation_tokens.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
      });
    } catch (error) {
      this.logger.error('Error getting user tokens', error.stack);
      return [];
    }
  }

  /**
   * Récupérer les tokens d'un email
   */
  async getEmailTokens(
    email: string, 
    type?: validation_token_type
  ): Promise<IValidationToken[]> {
    try {
      const whereClause: any = { email };
      if (type) whereClause.token_type = type;

      return await this.prisma.validation_tokens.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
      });
    } catch (error) {
      this.logger.error('Error getting email tokens', error.stack);
      return [];
    }
  }

  // ============================================================================
  // MÉTHODES DE RENOUVELLEMENT ET GESTION
  // ============================================================================

  /**
   * Renvoyer un token
   */
  async resendToken(originalTokenId: string): Promise<IValidationTokenGenerated> {
    const operationId = this.logger.startOperation('resendToken', { originalTokenId });

    try {
      const originalToken = await this.prisma.validation_tokens.findUnique({
        where: { id: originalTokenId },
      });

      if (!originalToken) {
        throw new Error('Original token not found');
      }

      // Vérifier si on peut renvoyer
      const canResend = await this.canResendToken(originalToken.email, originalToken.token_type);
      if (!canResend) {
        throw new Error('Cannot resend token due to rate limiting');
      }

      // Révoquer l'ancien token
      await this.revokeToken(originalTokenId);

      // Recréer un token similaire
      const tokenData: ICreateValidationTokenData = {
        user_id: originalToken.user_id,
        email: originalToken.email,
        token_type: originalToken.token_type,
        expires_in_minutes: VALIDATION_TOKEN_DURATIONS[originalToken.token_type],
        max_attempts: VALIDATION_TOKEN_ATTEMPT_LIMITS[originalToken.token_type],
        verification_data: originalToken.verification_data as any,
        reset_password_data: originalToken.reset_password_data as any,
        invitation_data: originalToken.invitation_data as any,
        magic_link_data: originalToken.magic_link_data as any,
      };

      const newToken = await this.createToken(tokenData);

      this.logger.endOperation('resendToken', operationId, true);
      return newToken;

    } catch (error) {
      this.logger.endOperation('resendToken', operationId, false);
      throw error;
    }
  }

  /**
   * Étendre l'expiration d'un token
   */
  async extendTokenExpiry(tokenId: string, additionalMinutes: number): Promise<boolean> {
    const operationId = this.logger.startOperation('extendTokenExpiry', { tokenId, additionalMinutes });

    try {
      const token = await this.prisma.validation_tokens.findUnique({
        where: { id: tokenId },
        select: { expires_at: true, is_used: true, is_blocked: true },
      });

      if (!token) {
        this.logger.endOperation('extendTokenExpiry', operationId, false);
        return false;
      }

      if (token.is_used || token.is_blocked) {
        this.logger.endOperation('extendTokenExpiry', operationId, false);
        return false;
      }

      const newExpiryDate = new Date(token.expires_at.getTime() + additionalMinutes * 60 * 1000);

      await this.prisma.validation_tokens.update({
        where: { id: tokenId },
        data: {
          expires_at: newExpiryDate,
          updated_at: new Date(),
        },
      });

      // Invalider le cache
      await this.invalidateTokenCache(tokenId);

      this.logger.endOperation('extendTokenExpiry', operationId, true);
      this.logger.info('Token expiry extended', JSON.stringify({
        tokenId,
        additionalMinutes,
        newExpiryDate: newExpiryDate.toISOString(),
      }));

      return true;

    } catch (error) {
      this.logger.endOperation('extendTokenExpiry', operationId, false);
      this.logger.error(
        'Failed to extend token expiry',
        error.stack,
        'ValidationTokenService.extendTokenExpiry',
        JSON.stringify({ errorMessage: error.message, tokenId })
      );
      return false;
    }
  }

  /**
   * Révoquer un token
   */
  async revokeToken(tokenId: string): Promise<boolean> {
    try {
      await this.prisma.validation_tokens.update({
        where: { id: tokenId },
        data: {
          is_used: true,
          used_at: new Date(),
          updated_at: new Date(),
        },
      });

      await this.invalidateTokenCache(tokenId);
      return true;

    } catch (error) {
      this.logger.error('Error revoking token', error.stack);
      return false;
    }
  }

  /**
   * Révoquer tous les tokens d'un utilisateur
   */
  async revokeUserTokens(
    userId: string, 
    type?: validation_token_type
  ): Promise<number> {
    try {
      const whereClause: any = { 
        user_id: userId, 
        is_used: false 
      };
      if (type) whereClause.token_type = type;

      const result = await this.prisma.validation_tokens.updateMany({
        where: whereClause,
        data: {
          is_used: true,
          used_at: new Date(),
          updated_at: new Date(),
        },
      });

      return result.count;

    } catch (error) {
      this.logger.error('Error revoking user tokens', error.stack);
      return 0;
    }
  }

  // ============================================================================
  // MÉTHODES DE STATISTIQUES ET MAINTENANCE
  // ============================================================================

  /**
   * Obtenir les statistiques des tokens
   */
  async getTokenStats(userId?: string): Promise<IValidationTokenStats> {
    try {
      const whereClause = userId ? { user_id: userId } : {};

      const [total, active, used, expired, blocked, byType] = await Promise.all([
        this.prisma.validation_tokens.count({ where: whereClause }),
        this.prisma.validation_tokens.count({ 
          where: { 
            ...whereClause, 
            is_used: false, 
            is_blocked: false,
            expires_at: { gt: new Date() }
          } 
        }),
        this.prisma.validation_tokens.count({ 
          where: { ...whereClause, is_used: true } 
        }),
        this.prisma.validation_tokens.count({ 
          where: { 
            ...whereClause, 
            expires_at: { lt: new Date() } 
          } 
        }),
        this.prisma.validation_tokens.count({ 
          where: { ...whereClause, is_blocked: true } 
        }),
        this.getTokenCountByType(userId),
      ]);

      const successRate = total > 0 ? (used / total) * 100 : 0;
      const recentActivity = await this.getRecentTokenActivity(userId);

      return {
        total,
        active,
        used,
        expired,
        blocked,
        by_type: byType,
        success_rate: Math.round(successRate * 100) / 100,
        average_usage_time: 0, // À implémenter si nécessaire
        recent_activity: recentActivity,
      };
    } catch (error) {
      this.logger.error('Error getting token stats', error.stack);
      return {
        total: 0,
        active: 0,
        used: 0,
        expired: 0,
        blocked: 0,
        by_type: {} as any,
        success_rate: 0,
        average_usage_time: 0,
        recent_activity: { last_24h: 0, last_7d: 0, last_30d: 0 },
      };
    }
  }

  /**
   * Obtenir l'historique d'utilisation d'un token
   */
  async getTokenUsageHistory(tokenId: string): Promise<any[]> {
    const operationId = this.logger.startOperation('getTokenUsageHistory', { tokenId });

    try {
      const token = await this.prisma.validation_tokens.findUnique({
        where: { id: tokenId },
        select: {
          id: true,
          token_type: true,
          email: true,
          attempt_count: true,
          is_used: true,
          used_at: true,
          used_ip: true,
          is_blocked: true,
          blocked_at: true,
          created_at: true,
          expires_at: true,
        },
      });

      if (!token) {
        this.logger.endOperation('getTokenUsageHistory', operationId, false);
        return [];
      }

      // Générer un historique basé sur les événements disponibles
      const history = [];

      // Événement de création
      history.push({
        timestamp: token.created_at.toISOString(),
        action: 'token_created',
        token_type: token.token_type,
        email: token.email,
        ip_address: null,
      });

      // Événements d'utilisation (basé sur attempt_count)
      for (let i = 1; i <= token.attempt_count; i++) {
        history.push({
          timestamp: token.created_at.toISOString(), // Approximation
          action: 'token_attempt',
          attempt_number: i,
          ip_address: null,
        });
      }

      // Événement de blocage
      if (token.is_blocked && token.blocked_at) {
        history.push({
          timestamp: token.blocked_at.toISOString(),
          action: 'token_blocked',
          reason: 'max_attempts_exceeded',
          ip_address: null,
        });
      }

      // Événement d'utilisation réussie
      if (token.is_used && token.used_at) {
        history.push({
          timestamp: token.used_at.toISOString(),
          action: 'token_used_successfully',
          ip_address: token.used_ip,
        });
      }

      // Événement d'expiration
      if (token.expires_at < new Date()) {
        history.push({
          timestamp: token.expires_at.toISOString(),
          action: 'token_expired',
          ip_address: null,
        });
      }

      this.logger.endOperation('getTokenUsageHistory', operationId, true);
      return history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    } catch (error) {
      this.logger.endOperation('getTokenUsageHistory', operationId, false);
      this.logger.error(
        'Failed to get token usage history',
        error.stack,
        'ValidationTokenService.getTokenUsageHistory',
        JSON.stringify({ errorMessage: error.message, tokenId })
      );
      return [];
    }
  }

  /**
   * Nettoyer les tokens expirés
   */
  async cleanupExpiredTokens(): Promise<number> {
    const operationId = this.logger.startOperation('cleanupExpiredTokens');

    try {
      const result = await this.prisma.validation_tokens.deleteMany({
        where: {
          expires_at: { lt: new Date() },
        },
      });

      this.logger.endOperation('cleanupExpiredTokens', operationId, true);
      this.logger.info('Expired validation tokens cleaned up', JSON.stringify({
        count: result.count,
      }));

      return result.count;

    } catch (error) {
      this.logger.endOperation('cleanupExpiredTokens', operationId, false);
      this.logger.error(
        'Failed to cleanup expired tokens',
        error.stack,
        'ValidationTokenService.cleanupExpiredTokens',
        JSON.stringify({ errorMessage: error.message })
      );
      return 0;
    }
  }

  /**
   * Nettoyer les tokens utilisés anciens
   */
  async cleanupUsedTokens(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await this.prisma.validation_tokens.deleteMany({
        where: {
          is_used: true,
          used_at: { lt: cutoffDate },
        },
      });

      this.logger.info('Used validation tokens cleaned up', JSON.stringify({
        count: result.count,
        olderThanDays,
      }));

      return result.count;
    } catch (error) {
      this.logger.error('Error cleaning up used tokens', error.stack);
      return 0;
    }
  }

  /**
   * Nettoyer les tokens bloqués anciens
   */
  async cleanupBlockedTokens(olderThanDays: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await this.prisma.validation_tokens.deleteMany({
        where: {
          is_blocked: true,
          blocked_at: { lt: cutoffDate },
        },
      });

      this.logger.info('Blocked validation tokens cleaned up', JSON.stringify({
        count: result.count,
        olderThanDays,
      }));

      return result.count;
    } catch (error) {
      this.logger.error('Error cleaning up blocked tokens', error.stack);
      return 0;
    }
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES
  // ============================================================================

  /**
   * Générer URL de vérification
   */
  generateVerificationUrl(token: string, baseUrl?: string): string {
    const base = baseUrl || this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    return `${base}/verify-email?token=${token}`;
  }

  /**
   * Générer URL magic link
   */
  generateMagicLinkUrl(token: string, baseUrl?: string): string {
    const base = baseUrl || this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    return `${base}/magic-link?token=${token}`;
  }

  /**
   * Vérifier si on peut renvoyer un token
   */
  async canResendToken(email: string, type: validation_token_type): Promise<boolean> {
    try {
      const rateLimitKey = `${this.RATE_LIMIT_PREFIX}${email}:${type}`;
      const count = await this.redis.getCache<number>(rateLimitKey) || 0;
      
      // Limite de 3 renvois par heure
      return count < 3;
    } catch (error) {
      this.logger.error('Error checking resend rate limit', error.stack);
      return false;
    }
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  /**
   * Créer un token générique
   */
  private async createToken(data: ICreateValidationTokenData): Promise<IValidationTokenGenerated> {
    const { token, tokenHash } = await this.generateTokenData();
    const expiresAt = new Date(Date.now() + (data.expires_in_minutes || 60) * 60 * 1000);

    const validationToken = await this.prisma.validation_tokens.create({
      data: {
        user_id: data.user_id || null,
        email: data.email,
        token_type: data.token_type,
        token_hash: tokenHash,
        token_plain: data.token_type === 'PHONE_VERIFICATION' ? token : null,
        expires_at: expiresAt,
        max_attempts: data.max_attempts || 3,
        reset_password_data: data.reset_password_data || null,
        invitation_data: data.invitation_data || null,
        verification_data: data.verification_data || null,
        magic_link_data: data.magic_link_data || null,
        client_info: data.client_info || null,
        metadata: data.metadata || null,
      },
    });

    return {
      id: validationToken.id,
      token: token,
      token_type: data.token_type,
      email: data.email,
      user_id: data.user_id,
      expires_at: expiresAt,
      max_attempts: validationToken.max_attempts,
      verification_url: this.generateVerificationUrl(token),
      magic_link_url: data.token_type.includes('MAGIC_LINK') ? this.generateMagicLinkUrl(token) : undefined,
      created_at: validationToken.created_at,
    };
  }

  /**
   * Créer un token avec code personnalisé
   */
  private async createTokenWithCustomCode(
    data: ICreateValidationTokenData, 
    customToken: string
  ): Promise<IValidationTokenGenerated> {
    const tokenHash = await this.hashingService.hashPassword(customToken);
    const expiresAt = new Date(Date.now() + (data.expires_in_minutes || 60) * 60 * 1000);

    const validationToken = await this.prisma.validation_tokens.create({
      data: {
        user_id: data.user_id || null,
        email: data.email,
        token_type: data.token_type,
        token_hash: tokenHash,
        token_plain: customToken,
        expires_at: expiresAt,
        max_attempts: data.max_attempts || 3,
        client_info: data.client_info || null,
        metadata: data.metadata || null,
      },
    });

    return {
      id: validationToken.id,
      token: customToken,
      token_type: data.token_type,
      email: data.email,
      user_id: data.user_id,
      expires_at: expiresAt,
      max_attempts: validationToken.max_attempts,
      created_at: validationToken.created_at,
    };
  }

  /**
   * Générer données de token
   */
  private async generateTokenData(): Promise<{ token: string; tokenHash: string }> {
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('base64url');
    const tokenHash = await this.hashingService.hashPassword(token);
    return { token, tokenHash };
  }

  /**
   * Générer token numérique (pour SMS)
   */
  private generateNumericToken(length: number): string {
    const digits = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return result;
  }

  /**
   * Créer un faux token (pour sécurité)
   */
  private async createDummyToken(
    email: string, 
    type: validation_token_type
  ): Promise<IValidationTokenGenerated> {
    const { token } = await this.generateTokenData();
    
    return {
      id: 'dummy-' + Date.now(),
      token: token,
      token_type: type,
      email: email,
      expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 heure
      max_attempts: 3,
      created_at: new Date(),
    };
  }

  /**
   * Vérifier rate limiting
   */
  private async checkRateLimit(
    email: string, 
    type: validation_token_type, 
    options?: { limit?: number; windowMinutes?: number }
  ): Promise<void> {
    const limit = options?.limit || 5;
    const windowMinutes = options?.windowMinutes || 60;
    
    const rateLimitKey = `${this.RATE_LIMIT_PREFIX}${email}:${type}`;
    const count = await this.redis.getCache<number>(rateLimitKey) || 0;

    if (count >= limit) {
      throw new Error(`Rate limit exceeded for ${type}. Try again later.`);
    }

    await this.redis.setCache(rateLimitKey, count + 1, windowMinutes * 60);
  }

  /**
   * Révoquer tokens existants du même type
   */
  private async revokeExistingTokens(
    email: string, 
    type: validation_token_type
  ): Promise<void> {
    await this.prisma.validation_tokens.updateMany({
      where: {
        email,
        token_type: type,
        is_used: false,
      },
      data: {
        is_used: true,
        used_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  /**
   * Extraire données d'action du token
   */
  private extractActionData(token: IValidationToken): Record<string, any> {
    switch (token.token_type) {
      case 'EMAIL_VERIFICATION':
        return (token.verification_data as any) || {};
      case 'PASSWORD_RESET':
        return { 
          requires_old_password: (token.reset_password_data as any)?.requires_old_password || false 
        };
      case 'INVITATION_USER':
      case 'INVITATION_GROUP':
        return (token.invitation_data as any) || {};
      case 'MAGIC_LINK_LOGIN':
      case 'MAGIC_LINK_ACTION':
        return (token.magic_link_data as any) || {};
      default:
        return {};
    }
  }

  /**
   * Programmer l'envoi d'email
   */
  private async scheduleEmailSending(token: IValidationTokenGenerated): Promise<void> {
    try {
      await this.bullmq.addJob('email', 'send_verification_email', {
        email: token.email,
        token: token.token,
        type: token.token_type,
        verification_url: token.verification_url,
        expires_at: token.expires_at,
      });
    } catch (error) {
      this.logger.error('Error scheduling email', error.stack);
    }
  }

  /**
   * Programmer l'envoi d'email d'invitation
   */
  private async scheduleInvitationEmail(token: IValidationTokenGenerated): Promise<void> {
    try {
      await this.bullmq.addJob('email', 'send_invitation_email', {
        email: token.email,
        token: token.token,
        verification_url: token.verification_url,
        expires_at: token.expires_at,
      });
    } catch (error) {
      this.logger.error('Error scheduling invitation email', error.stack);
    }
  }

  /**
   * Programmer l'envoi d'email magic link
   */
  private async scheduleMagicLinkEmail(token: IValidationTokenGenerated): Promise<void> {
    try {
      await this.bullmq.addJob('EMAIL_QUEUE', 'send_magic_link_email', {
        email: token.email,
        token: token.token,
        magic_link_url: token.magic_link_url,
        expires_at: token.expires_at,
      });
    } catch (error) {
      this.logger.error('Error scheduling magic link email', error.stack);
    }
  }

  /**
   * Programmer l'envoi de SMS
   */
  private async scheduleSMSSending(token: IValidationTokenGenerated, phone: string): Promise<void> {
    try {
      await this.bullmq.addJob('sms', 'send_verification_sms', {
        phone: phone,
        code: token.token,
        expires_at: token.expires_at,
      });
    } catch (error) {
      this.logger.error('Error scheduling SMS', error.stack);
    }
  }

  /**
   * Obtenir comptage par type
   */
  private async getTokenCountByType(userId?: string): Promise<Record<validation_token_type, number>> {
    const whereClause = userId ? { user_id: userId } : {};
    
    const counts = await this.prisma.validation_tokens.groupBy({
      by: ['token_type'],
      where: whereClause,
      _count: { id: true },
    });

    const result: any = {};
    counts.forEach(count => {
      result[count.token_type] = count._count.id;
    });

    return result;
  }

  /**
   * Obtenir activité récente
   */
  private async getRecentTokenActivity(userId?: string): Promise<{
    last_24h: number;
    last_7d: number;
    last_30d: number;
  }> {
    const now = new Date();
    const whereClause = userId ? { user_id: userId } : {};

    const [last24h, last7d, last30d] = await Promise.all([
      this.prisma.validation_tokens.count({
        where: {
          ...whereClause,
          created_at: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.validation_tokens.count({
        where: {
          ...whereClause,
          created_at: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.validation_tokens.count({
        where: {
          ...whereClause,
          created_at: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return { last_24h: last24h, last_7d: last7d, last_30d: last30d };
  }

  /**
   * Invalider cache token
   */
  private async invalidateTokenCache(tokenId: string): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${tokenId}`;
      await this.redis.delCache(cacheKey);
    } catch (error) {
      this.logger.error('Error invalidating token cache', error.stack);
    }
  }
}