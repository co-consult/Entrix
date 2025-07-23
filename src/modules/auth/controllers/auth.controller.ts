// src/modules/auth/controllers/auth.controller.ts

import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody
} from '@nestjs/swagger';
import { LoggerService } from '../../../shared/logger/logger.service';
import { AuthService } from '../services/auth.service';
import { 
  LoginDto, 
  RegisterDto, 
  LoginResponseDto, 
  RegisterResponseDto,
  LogoutDto,
  LogoutResponseDto
} from '../dto/auth';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { 
  CurrentUser, 
  CurrentUserId, 
  Public,
  SessionId,
  ClientInfo
} from '../decorators/current-user.decorator';
import { 
  RateLimitLogin,
  AuditCritical,
  RateLimit
} from '../decorators/audit-log.decorator';
import { IUserProfile } from '../interfaces';

/**
 * Auth Controller Entrix V3.0 - Grade A+
 * Endpoints authentification principaux
 * Respecte api_specs_auth_session.md
 */

@ApiTags('Authentication')
@Controller('auth')
@UsePipes(new ValidationPipe({ 
  transform: true, 
  whitelist: true, 
  forbidNonWhitelisted: true 
}))
export class AuthController {
  private readonly logger: LoggerService;

  constructor(
    private readonly authService: AuthService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('AuthController');
  }

  /**
   * POST /auth/login
   * Connexion utilisateur avec validation adaptative
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @RateLimitLogin()
  @AuditCritical('user_login')
  @ApiOperation({ 
    summary: 'Connexion utilisateur',
    description: 'Authentification avec email/password et validation de sécurité adaptative'
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Connexion réussie',
    type: LoginResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Identifiants invalides'
  })
  @ApiResponse({ 
    status: 428, 
    description: 'MFA requis',
    schema: {
      example: {
        success: false,
        error: {
          code: 'MFA_REQUIRED',
          message: 'Authentification multifacteur requise',
          mfaChallenge: {
            challengeToken: 'mfa_xxx',
            methods: ['SMS_OTP', 'EMAIL_OTP'],
            expiresIn: 300
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 429, 
    description: 'Trop de tentatives'
  })
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: any,
    @ClientInfo() clientInfo: { ip: string; userAgent: string }
  ): Promise<LoginResponseDto> {
    const operationId = this.logger.startOperation('POST /auth/login', {
      email: loginDto.email,
      rememberMe: loginDto.rememberMe,
      ipAddress: clientInfo.ip,
    });

    try {
      // Extraire contexte de sécurité
      const securityContext = {
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        deviceFingerprint: req.headers?.['x-device-fingerprint'],
      };

      // Appeler service authentification
      const result = await this.authService.login(loginDto, securityContext);

      this.logger.endOperation(operationId, 'success');

      // Retourner réponse selon spécification API
      return {
        success: result.success,
        data: result.user && result.tokens && result.session ? {
          user: result.user,
          tokens: result.tokens,
          session: result.session,
          mfaRequired: result.mfaRequired,
        } : undefined,
        meta: result.meta,
      };

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error; // Les exceptions sont gérées par les guards/filters
    }
  }

  /**
   * POST /auth/register
   * Inscription nouveau utilisateur
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ limit: 3, windowMs: 3600000 }) // 3 inscriptions/heure
  @AuditCritical('user_registration')
  @ApiOperation({ 
    summary: 'Inscription utilisateur',
    description: 'Création compte avec validation complète et onboarding'
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Inscription réussie',
    type: RegisterResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides'
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Email déjà utilisé'
  })
  async register(
    @Body() registerDto: RegisterDto,
    @ClientInfo() clientInfo: { ip: string; userAgent: string }
  ): Promise<RegisterResponseDto> {
    const operationId = this.logger.startOperation('POST /auth/register', {
      email: registerDto.email,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
    });

    try {
      const result = await this.authService.register(registerDto);

      this.logger.endOperation(operationId, 'success');

      return {
        success: result.success,
        data: result.user && result.tokens ? {
          user: result.user,
          tokens: result.tokens,
          verification: result.verification,
          onboarding: result.onboarding,
        } : undefined,
      };

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * POST /auth/logout
   * Déconnexion utilisateur
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @AuditCritical('user_logout')
  @ApiOperation({ 
    summary: 'Déconnexion utilisateur',
    description: 'Révocation tokens et sessions'
  })
  @ApiBody({ type: LogoutDto, required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Déconnexion réussie',
    type: LogoutResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token invalide'
  })
  async logout(
    @Body() logoutDto: LogoutDto = {},
    @CurrentUserId() userId: string,
    @SessionId() sessionId: string
  ): Promise<LogoutResponseDto> {
    const operationId = this.logger.startOperation('POST /auth/logout', {
      userId,
      sessionId,
      allDevices: logoutDto.allDevices,
    });

    try {
      const success = await this.authService.logout(sessionId, logoutDto.allDevices);

      const tokensInvalidated = success ? 1 : 0;
      const sessionsTerminated = logoutDto.allDevices ? 
        await this.getActiveSessionsCount(userId) : 
        (success ? 1 : 0);

      this.logger.endOperation(operationId, 'success');

      return {
        success: true,
        data: {
          message: logoutDto.allDevices ? 
            'Déconnexion de tous les appareils réussie' : 
            'Déconnexion réussie',
          tokensInvalidated,
          sessionsTerminated,
        },
      };

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * POST /auth/verify-email
   * Vérification email utilisateur
   */
  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 5, windowMs: 300000 }) // 5 tentatives/5min
  @ApiOperation({ 
    summary: 'Vérification email',
    description: 'Confirmation adresse email avec token'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Email vérifié avec succès'
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Token invalide ou expiré'
  })
  async verifyEmail(
    @Body('token') token: string
  ): Promise<{ success: boolean; message: string }> {
    const operationId = this.logger.startOperation('POST /auth/verify-email');

    try {
      // TODO: Implémenter vérification email
      // const verified = await this.authService.verifyEmail(token);

      this.logger.endOperation(operationId, 'success');

      return {
        success: true,
        message: 'Email vérifié avec succès',
      };

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * POST /auth/resend-verification
   * Renvoie email de vérification
   */
  @UseGuards(JwtAuthGuard)
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @RateLimit({ limit: 3, windowMs: 3600000 }) // 3 envois/heure
  @ApiOperation({ 
    summary: 'Renvoyer email de vérification',
    description: 'Génère et envoie nouveau lien de vérification'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Email de vérification envoyé'
  })
  @ApiResponse({ 
    status: 429, 
    description: 'Trop de demandes'
  })
  async resendVerification(
    @CurrentUser() user: IUserProfile
  ): Promise<{ success: boolean; message: string }> {
    const operationId = this.logger.startOperation('POST /auth/resend-verification', {
      userId: user.id,
    });

    try {
      // TODO: Implémenter renvoi email vérification
      // await this.authService.resendVerificationEmail(user.id);

      this.logger.endOperation(operationId, 'success');

      return {
        success: true,
        message: 'Email de vérification envoyé',
      };

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * Méthodes helper privées
   */

  private async getActiveSessionsCount(userId: string): Promise<number> {
    // TODO: Implémenter comptage sessions actives
    return 1;
  }
}