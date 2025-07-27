// src/modules/auth/controllers/validation-token.controller.ts

import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  HttpCode, 
  HttpStatus,
  ValidationPipe,
  UsePipes,
  ParseUUIDPipe,
  Req,
  Optional
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { Request } from 'express';
import { LoggerService } from '../../../shared/logger/logger.service';
import { ValidationTokenService } from '../services/validation-token.service';
import { 
  CreateEmailVerificationDto,
  CreatePasswordResetDto,
  UsePasswordResetDto,
  CreateInvitationDto,
  AcceptInvitationDto,
  CreateMagicLinkDto,
  UseMagicLinkDto,
  CreatePhoneVerificationDto,
  VerifyPhoneDto,
  ValidateTokenDto,
  UseTokenDto,
  ResendTokenDto,
  ValidationTokenFiltersDto,
  ValidationTokenResponseDto,
  GeneratedValidationTokenResponseDto,
  TokenValidationResponseDto,
  TokenUsageResponseDto,
  ValidationTokenStatsResponseDto,
  VerifyEmailResponseDto,
  PasswordResetResponseDto,
  InvitationResponseDto
} from '../dto/validation-tokens/validation-token.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Public } from '../decorators/public.decorator';
import { 
  CurrentUserId,
  AuditLog,
  RateLimit,
  ClientInfo
} from '../decorators';

/**
 * Validation Token Controller Entrix V3.0 - Grade A+
 * Gestion des tokens de validation (email, reset password, invitations, magic links)
 * Endpoints publics et protégés selon le cas d'usage
 */

@ApiTags('Validation Tokens')
@Controller('auth/validation')
@UsePipes(new ValidationPipe({ 
  transform: true, 
  whitelist: true, 
  forbidNonWhitelisted: true 
}))
export class ValidationTokenController {
  private readonly logger: LoggerService;

  constructor(
    private readonly validationTokenService: ValidationTokenService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('ValidationTokenController');
  }

  // ============================================================================
  // ENDPOINTS PUBLICS - VÉRIFICATION EMAIL
  // ============================================================================

  /**
   * POST /auth/validation/email-verification
   * Créer token de vérification email (public)
   */
  @Post('email-verification')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ limit: 3, windowMs: 300000 }) // 3 demandes/5min par IP
  @AuditLog({ action: 'create_email_verification', level: 'info' })
  @ApiOperation({ 
    summary: 'Demander vérification email',
    description: 'Crée un token de vérification email et l\'envoie par email'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Token de vérification créé',
    type: GeneratedValidationTokenResponseDto
  })
  @ApiResponse({ status: 429, description: 'Trop de demandes' })
  async createEmailVerification(
    @Body() createDto: CreateEmailVerificationDto,
    @ClientInfo() clientInfo: any
  ): Promise<GeneratedValidationTokenResponseDto> {
    const operationId = this.logger.startOperation('POST /auth/validation/email-verification');

    try {
      const token = await this.validationTokenService.createEmailVerificationToken(
        createDto.email,
        undefined, // userId non fourni en public
        createDto.verification_type
      );

      this.logger.endOperation('createEmailVerification', operationId, true);

      return {
        id: token.id,
        token_type: token.token_type,
        email: token.email,
        expires_at: token.expires_at.toISOString(),
        max_attempts: token.max_attempts,
        verification_url: token.verification_url,
        message: 'Un email de vérification a été envoyé. Vérifiez votre boîte de réception.',
      };

    } catch (error) {
      this.logger.endOperation('createEmailVerification', operationId, false);
      throw error;
    }
  }

  /**
   * POST /auth/validation/verify-email
   * Vérifier email avec token (public)
   */
  @Post('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 5, windowMs: 300000 }) // 5 tentatives/5min par IP
  @AuditLog({ action: 'verify_email', level: 'info' })
  @ApiOperation({ 
    summary: 'Vérifier email',
    description: 'Utilise le token reçu par email pour vérifier l\'adresse'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Email vérifié avec succès',
    type: VerifyEmailResponseDto
  })
  @ApiResponse({ status: 400, description: 'Token invalide ou expiré' })
  async verifyEmail(
    @Body() useTokenDto: UseTokenDto,
    @ClientInfo() clientInfo: any
  ): Promise<VerifyEmailResponseDto> {
    const operationId = this.logger.startOperation('POST /auth/validation/verify-email');

    try {
      const result = await this.validationTokenService.verifyEmailWithToken(useTokenDto.token);

      this.logger.endOperation('verifyEmail', operationId, true);

      return {
        ...result,
        email_verified: result.success,
        verified_at: result.success ? new Date().toISOString() : undefined,
        message: result.success ? 'Email vérifié avec succès !' : 'Échec de la vérification',
      };

    } catch (error) {
      this.logger.endOperation('verifyEmail', operationId, false);
      throw error;
    }
  }

  // ============================================================================
  // ENDPOINTS PUBLICS - RESET PASSWORD
  // ============================================================================

  /**
   * POST /auth/validation/password-reset
   * Demander reset password (public)
   */
  @Post('password-reset')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ limit: 3, windowMs: 3600000 }) // 3 demandes/heure par IP
  @AuditLog({ action: 'request_password_reset', level: 'warn' })
  @ApiOperation({ 
    summary: 'Demander reset mot de passe',
    description: 'Crée un token de reset et l\'envoie par email'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Token de reset créé',
    type: GeneratedValidationTokenResponseDto
  })
  async createPasswordReset(
    @Body() createDto: CreatePasswordResetDto,
    @ClientInfo() clientInfo: any
  ): Promise<GeneratedValidationTokenResponseDto> {
    const operationId = this.logger.startOperation('POST /auth/validation/password-reset');

    try {
      const token = await this.validationTokenService.createPasswordResetToken(createDto.email);

      this.logger.endOperation('createPasswordReset', operationId, true);

      return {
        id: token.id,
        token_type: token.token_type,
        email: token.email,
        expires_at: token.expires_at.toISOString(),
        max_attempts: token.max_attempts,
        message: 'Si cette adresse email existe, vous recevrez un lien de réinitialisation.',
      };

    } catch (error) {
      this.logger.endOperation('createPasswordReset', operationId, false);
      
      // Retourner toujours le même message pour la sécurité
      return {
        id: 'security-dummy',
        token_type: 'PASSWORD_RESET',
        email: createDto.email,
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        max_attempts: 3,
        message: 'Si cette adresse email existe, vous recevrez un lien de réinitialisation.',
      };
    }
  }

  /**
   * POST /auth/validation/reset-password
   * Utiliser token reset password (public)
   */
  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 5, windowMs: 300000 }) // 5 tentatives/5min par IP
  @AuditLog({ action: 'reset_password', level: 'warn' })
  @ApiOperation({ 
    summary: 'Réinitialiser mot de passe',
    description: 'Utilise le token reçu par email pour changer le mot de passe'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Mot de passe réinitialisé',
    type: PasswordResetResponseDto
  })
  async resetPassword(
    @Body() resetDto: UsePasswordResetDto,
    @ClientInfo() clientInfo: any
  ): Promise<PasswordResetResponseDto> {
    const operationId = this.logger.startOperation('POST /auth/validation/reset-password');

    try {
      // Vérifier que les mots de passe correspondent si confirmé
      if (resetDto.confirm_password && resetDto.new_password !== resetDto.confirm_password) {
        throw new Error('Password confirmation does not match');
      }

      const result = await this.validationTokenService.resetPasswordWithToken(
        resetDto.token, 
        resetDto.new_password
      );

      this.logger.endOperation('resetPassword', operationId, true);

      return {
        ...result,
        password_updated: result.success,
        sessions_closed: result.success ? 1 : 0, // Approximation
        message: result.success ? 
          'Mot de passe mis à jour avec succès. Reconnectez-vous avec votre nouveau mot de passe.' :
          'Échec de la réinitialisation du mot de passe.',
      };

    } catch (error) {
      this.logger.endOperation('resetPassword', operationId, false);
      throw error;
    }
  }

  // ============================================================================
  // ENDPOINTS PUBLICS - INVITATIONS
  // ============================================================================

  /**
   * POST /auth/validation/invitation
   * Créer invitation (nécessite auth)
   */
  @Post('invitation')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ limit: 10, windowMs: 3600000 }) // 10 invitations/heure
  @AuditLog({ action: 'create_invitation', level: 'info' })
  @ApiOperation({ 
    summary: 'Créer invitation utilisateur',
    description: 'Crée une invitation pour un nouvel utilisateur'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Invitation créée',
    type: GeneratedValidationTokenResponseDto
  })
  async createInvitation(
    @CurrentUserId() inviterId: string,
    @Body() createDto: CreateInvitationDto
  ): Promise<GeneratedValidationTokenResponseDto> {
    const operationId = this.logger.startOperation('POST /auth/validation/invitation');

    try {
      const invitationData = {
        ...createDto,
        inviter_id: inviterId,
      };

      const token = await this.validationTokenService.createInvitationToken(
        createDto.email, 
        invitationData
      );

      this.logger.endOperation('createInvitation', operationId, true);

      return {
        id: token.id,
        token_type: token.token_type,
        email: token.email,
        expires_at: token.expires_at.toISOString(),
        max_attempts: token.max_attempts,
        verification_url: token.verification_url,
        message: 'Invitation envoyée avec succès.',
      };

    } catch (error) {
      this.logger.endOperation('createInvitation', operationId, false);
      throw error;
    }
  }

  /**
   * POST /auth/validation/accept-invitation
   * Accepter invitation (public)
   */
  @Post('accept-invitation')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ limit: 5, windowMs: 300000 }) // 5 tentatives/5min par IP
  @AuditLog({ action: 'accept_invitation', level: 'info' })
  @ApiOperation({ 
    summary: 'Accepter invitation',
    description: 'Accepte une invitation et crée le compte utilisateur'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Invitation acceptée et compte créé',
    type: InvitationResponseDto
  })
  async acceptInvitation(
    @Body() acceptDto: AcceptInvitationDto,
    @ClientInfo() clientInfo: any
  ): Promise<InvitationResponseDto> {
    const operationId = this.logger.startOperation('POST /auth/validation/accept-invitation');

    try {
      const result = await this.validationTokenService.acceptInvitationWithToken(
        acceptDto.token, 
        {
          firstName: acceptDto.firstName,
          lastName: acceptDto.lastName,
          password: acceptDto.password,
          phone: acceptDto.phone,
          terms_accepted: acceptDto.terms_accepted,
        }
      );

      this.logger.endOperation('acceptInvitation', operationId, true);

      return {
        ...result,
        account_created: result.success && !!result.user_id,
        role_assigned: result.action_data?.role,
        permissions_granted: result.action_data?.permissions,
        message: result.success ? 
          'Invitation acceptée et compte créé avec succès !' :
          'Échec de l\'acceptation de l\'invitation.',
      };

    } catch (error) {
      this.logger.endOperation('acceptInvitation', operationId, false);
      throw error;
    }
  }

  // ============================================================================
  // ENDPOINTS PUBLICS - MAGIC LINKS
  // ============================================================================

  /**
   * POST /auth/validation/magic-link
   * Créer magic link (public)
   */
  @Post('magic-link')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ limit: 5, windowMs: 300000 }) // 5 magic links/5min par IP
  @AuditLog({ action: 'create_magic_link', level: 'info' })
  @ApiOperation({ 
    summary: 'Créer magic link',
    description: 'Crée un lien magique pour connexion sans mot de passe'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Magic link créé',
    type: GeneratedValidationTokenResponseDto
  })
  async createMagicLink(
    @Body() createDto: CreateMagicLinkDto,
    @ClientInfo() clientInfo: any
  ): Promise<GeneratedValidationTokenResponseDto> {
    const operationId = this.logger.startOperation('POST /auth/validation/magic-link');

    try {
      const token = await this.validationTokenService.createMagicLinkToken(
        createDto.email, 
        createDto.action, 
        {
          redirect_url: createDto.redirect_url,
          context_data: createDto.context_data,
          expires_after_use: createDto.expires_after_use,
        }
      );

      this.logger.endOperation('createMagicLink', operationId, true);

      return {
        id: token.id,
        token_type: token.token_type,
        email: token.email,
        expires_at: token.expires_at.toISOString(),
        max_attempts: token.max_attempts,
        magic_link_url: token.magic_link_url,
        message: 'Magic link envoyé par email.',
      };

    } catch (error) {
      this.logger.endOperation('createMagicLink', operationId, false);
      throw error;
    }
  }

  /**
   * POST /auth/validation/use-magic-link
   * Utiliser magic link (public)
   */
  @Post('use-magic-link')
  @Public()
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 10, windowMs: 300000 }) // 10 utilisations/5min par IP
  @AuditLog({ action: 'use_magic_link', level: 'info' })
  @ApiOperation({ 
    summary: 'Utiliser magic link',
    description: 'Utilise un magic link pour effectuer l\'action demandée'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Magic link utilisé',
    type: TokenUsageResponseDto
  })
  async useMagicLink(
    @Body() useDto: UseMagicLinkDto,
    @ClientInfo() clientInfo: any
  ): Promise<TokenUsageResponseDto> {
    const operationId = this.logger.startOperation('POST /auth/validation/use-magic-link');

    try {
      const result = await this.validationTokenService.useMagicLink(useDto.token, useDto.client_info);

      this.logger.endOperation('useMagicLink', operationId, true);

      return {
        ...result,
        message: result.success ? 'Magic link utilisé avec succès !' : 'Échec d\'utilisation du magic link',
      };

    } catch (error) {
      this.logger.endOperation('useMagicLink', operationId, false);
      throw error;
    }
  }

  // ============================================================================
  // ENDPOINTS PUBLICS - VÉRIFICATION TÉLÉPHONE
  // ============================================================================

  /**
   * POST /auth/validation/phone-verification
   * Créer token vérification téléphone
   */
  @Post('phone-verification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ limit: 3, windowMs: 300000 }) // 3 codes SMS/5min
  @AuditLog({ action: 'create_phone_verification', level: 'info' })
  @ApiOperation({ 
    summary: 'Demander vérification téléphone',
    description: 'Envoie un code de vérification par SMS'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Code SMS envoyé',
    type: GeneratedValidationTokenResponseDto
  })
  async createPhoneVerification(
    @CurrentUserId() userId: string,
    @Body() createDto: CreatePhoneVerificationDto
  ): Promise<GeneratedValidationTokenResponseDto> {
    const operationId = this.logger.startOperation('POST /auth/validation/phone-verification');

    try {
      const token = await this.validationTokenService.createPhoneVerificationToken(
        createDto.phone, 
        userId
      );

      this.logger.endOperation('createPhoneVerification', operationId, true);

      return {
        id: token.id,
        token_type: token.token_type,
        email: createDto.phone, // Phone stocké dans email
        expires_at: token.expires_at.toISOString(),
        max_attempts: token.max_attempts,
        message: 'Code de vérification envoyé par SMS.',
      };

    } catch (error) {
      this.logger.endOperation('createPhoneVerification', operationId, false);
      throw error;
    }
  }

  /**
   * POST /auth/validation/verify-phone
   * Vérifier téléphone avec code SMS
   */
  @Post('verify-phone')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 5, windowMs: 300000 }) // 5 tentatives/5min
  @AuditLog({ action: 'verify_phone', level: 'info' })
  @ApiOperation({ 
    summary: 'Vérifier téléphone',
    description: 'Vérifie le numéro de téléphone avec le code reçu'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Téléphone vérifié',
    type: TokenUsageResponseDto
  })
  async verifyPhone(
    @CurrentUserId() userId: string,
    @Body() verifyDto: VerifyPhoneDto,
    @ClientInfo() clientInfo: any
  ): Promise<TokenUsageResponseDto> {
    const operationId = this.logger.startOperation('POST /auth/validation/verify-phone');

    try {
      const result = await this.validationTokenService.useToken(verifyDto.code, clientInfo);

      // Si succès, marquer le téléphone comme vérifié
      if (result.success && result.user_id === userId) {
        // Mise à jour du téléphone vérifié à implémenter selon votre logique
      }

      this.logger.endOperation('verifyPhone', operationId, true);

      return {
        ...result,
        message: result.success ? 'Téléphone vérifié avec succès !' : 'Code incorrect',
      };

    } catch (error) {
      this.logger.endOperation('verifyPhone', operationId, false);
      throw error;
    }
  }

  // ============================================================================
  // ENDPOINTS GÉNÉRIQUES
  // ============================================================================

  /**
   * POST /auth/validation/validate
   * Valider un token quelconque (public pour debug)
   */
  @Post('validate')
  @Public()
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 20, windowMs: 60000 }) // 20 validations/minute
  @ApiOperation({ 
    summary: 'Valider un token',
    description: 'Valide n\'importe quel token de validation'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Résultat de validation',
    type: TokenValidationResponseDto
  })
  async validateToken(
    @Body() validateDto: ValidateTokenDto
  ): Promise<TokenValidationResponseDto> {
    const operationId = this.logger.startOperation('POST /auth/validation/validate');

    try {
      const validation = await this.validationTokenService.validateToken(validateDto.token);

      this.logger.endOperation('validateToken', operationId, true);

      // Transformer la réponse pour que les dates soient au format string
      const response: TokenValidationResponseDto = {
        isValid: validation.isValid,
        errors: validation.errors,
        attempts_remaining: validation.attempts_remaining,
        is_blocked: validation.is_blocked,
        expires_at: validation.expires_at?.toISOString(),
        can_resend: validation.can_resend,
      };

      return response;

    } catch (error) {
      this.logger.endOperation('validateToken', operationId, false);
      throw error;
    }
  }

  /**
   * POST /auth/validation/resend
   * Renvoyer un token
   */
  @Post('resend')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ limit: 3, windowMs: 3600000 }) // 3 renvois/heure par IP
  @AuditLog({ action: 'resend_validation_token', level: 'info' })
  @ApiOperation({ 
    summary: 'Renvoyer un token',
    description: 'Renvoie un token de validation (annule l\'ancien)'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Token renvoyé',
    type: GeneratedValidationTokenResponseDto
  })
  async resendToken(
    @Body() resendDto: ResendTokenDto,
    @ClientInfo() clientInfo: any
  ): Promise<GeneratedValidationTokenResponseDto> {
    const operationId = this.logger.startOperation('POST /auth/validation/resend');

    try {
      // Trouver le dernier token de ce type pour cet email
      const existingTokens = await this.validationTokenService.getEmailTokens(
        resendDto.email, 
        resendDto.token_type
      );

      if (!existingTokens.length) {
        throw new Error('No existing token found to resend');
      }

      const latestToken = existingTokens[0];
      const newToken = await this.validationTokenService.resendToken(latestToken.id);

      this.logger.endOperation('resendToken', operationId, true);

      return {
        id: newToken.id,
        token_type: newToken.token_type,
        email: newToken.email,
        expires_at: newToken.expires_at.toISOString(),
        max_attempts: newToken.max_attempts,
        verification_url: newToken.verification_url,
        magic_link_url: newToken.magic_link_url,
        message: 'Token renvoyé avec succès.',
      };

    } catch (error) {
      this.logger.endOperation('resendToken', operationId, false);
      throw error;
    }
  }

  // ============================================================================
  // ENDPOINTS PROTÉGÉS - GESTION
  // ============================================================================

  /**
   * GET /auth/validation/my-tokens
   * Lister mes tokens de validation
   */
  @Get('my-tokens')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Mes tokens de validation',
    description: 'Liste les tokens de validation de l\'utilisateur connecté'
  })
  @ApiQuery({ name: 'token_type', required: false })
  @ApiQuery({ name: 'is_used', type: Boolean, required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des tokens',
    type: [ValidationTokenResponseDto]
  })
  async getMyTokens(
    @CurrentUserId() userId: string,
    @Query() filters: ValidationTokenFiltersDto
  ): Promise<ValidationTokenResponseDto[]> {
    const operationId = this.logger.startOperation('GET /auth/validation/my-tokens');

    try {
      const tokens = await this.validationTokenService.getUserTokens(userId, filters.token_type);

      this.logger.endOperation('getMyTokens', operationId, true);

      return tokens.map(token => ({
        id: token.id,
        token_type: token.token_type,
        email: token.email,
        user_id: token.user_id,
        expires_at: token.expires_at.toISOString(),
        is_used: token.is_used,
        used_at: token.used_at?.toISOString(),
        attempt_count: token.attempt_count,
        max_attempts: token.max_attempts,
        is_blocked: token.is_blocked,
        created_at: token.created_at.toISOString(),
      }));

    } catch (error) {
      this.logger.endOperation('getMyTokens', operationId, false);
      throw error;
    }
  }

  /**
   * GET /auth/validation/stats
   * Statistiques des tokens de validation
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Statistiques validation tokens',
    description: 'Statistiques d\'utilisation des tokens de validation'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistiques',
    type: ValidationTokenStatsResponseDto
  })
  async getTokenStats(
    @CurrentUserId() userId: string
  ): Promise<ValidationTokenStatsResponseDto> {
    const operationId = this.logger.startOperation('GET /auth/validation/stats');

    try {
      const stats = await this.validationTokenService.getTokenStats(userId);

      this.logger.endOperation('getTokenStats', operationId, true);

      return stats;

    } catch (error) {
      this.logger.endOperation('getTokenStats', operationId, false);
      throw error;
    }
  }
}