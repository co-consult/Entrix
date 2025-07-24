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
  UsePipes,
  Get
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody
} from '@nestjs/swagger';
import { Query, BadRequestException } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { LoggerService } from '../../../shared/logger/logger.service';
import { AuthService } from '../services/auth.service';
import { 
  LoginDto, 
  RegisterDto, 
  LoginResponseDto, 
  RegisterResponseDto
} from '../dto';
import { 
  UserProfileMapper,
  TokenPairDto,
  SessionInfoDto,
  MfaChallengeDto,
  RegisterResponseMapper
} from '../dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { 
  CurrentUser, 
  CurrentUserId, 
  Public,
  SessionId,
  ClientInfo
} from '../decorators';
import { 
  RateLimitLogin,
  AuditCritical,
  RateLimit,
} from '../decorators';
import { IUserProfile,IVerificationStatus } from '../interfaces';

/**
 * Auth Controller Entrix V3.0 - Grade A+
 * Endpoints authentification principaux
 * ✅ CORRIGÉ : Utilise mappers pour conversion types internes → DTOs API
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
   * ✅ CORRIGÉ : Utilise UserProfileMapper pour conversion IUserProfile → UserProfileDto
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
    status: 423, 
    description: 'Compte verrouillé'
  })
  @ApiResponse({ 
    status: 429, 
    description: 'Trop de tentatives'
  })
  async login(
    @Body() loginDto: LoginDto,
    @ClientInfo() clientInfo: { ip: string; userAgent: string; deviceFingerprint?: string }
  ): Promise<LoginResponseDto> {
    const operationId = this.logger.startOperation('POST /auth/login', {
      email: loginDto.email,
      rememberMe: loginDto.rememberMe,
      hasDeviceFingerprint: !!loginDto.deviceFingerprint,
    });

    try {
      // Contexte sécurité
      const securityContext = {
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        deviceFingerprint: loginDto.deviceFingerprint || clientInfo.deviceFingerprint,
      };

      // Appeler service authentification
      const result = await this.authService.login(loginDto, securityContext);

      this.logger.endOperation('login', operationId, true);

      // ✅ CORRIGÉ : Utiliser mappers pour conversion types internes → DTOs API
      const response: LoginResponseDto = {
        success: result.success,
        data: result.user && result.tokens && result.session ? {
          user: UserProfileMapper.toDto(result.user),  // ✅ Conversion IUserProfile → UserProfileDto
          tokens: {
            accessToken: result.tokens.accessToken,
            refreshToken: result.tokens.refreshToken,
            tokenType: result.tokens.tokenType,
            expiresIn: result.tokens.expiresIn,
          } as TokenPairDto,
          session: {
            sessionId: result.session.sessionId,
            expiresAt: result.session.expiresAt,
            deviceInfo: result.session.deviceInfo,
            isActive: result.session.isActive,
            lastActivity: result.session.lastActivity,
          } as SessionInfoDto,
          mfaRequired: result.mfaRequired ? {
            methods: result.mfaRequired.methods,
            challengeToken: result.mfaRequired.challengeToken,
            expiresIn: result.mfaRequired.expiresIn,
          } as MfaChallengeDto : undefined,
        } : undefined,
        meta: result.meta,
      };

      return response;

    } catch (error) {
      this.logger.endOperation('login', operationId, false, undefined, { error: error.message });
      throw error; // Les exceptions sont gérées par les guards/filters
    }
  }

  /**
 * POST /auth/register
 * ✅ CORRIGÉ : Passe les informations client au service
 */
@Public()
@Post('register')
@HttpCode(HttpStatus.CREATED)
@RateLimit({ limit: 3, windowMs: 3600000 })
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
async register(
  @Body() registerDto: RegisterDto,
  @ClientInfo() clientInfo: { ip: string; userAgent: string }
): Promise<RegisterResponseDto> {
  const operationId = this.logger.startOperation('POST /auth/register', {
    email: registerDto.email,
    firstName: registerDto.firstName,
    lastName: registerDto.lastName,
    hasOnboardingSecret: !!registerDto.onboardingSecret,
    clientIp: clientInfo.ip, // ✅ Logger l'IP pour debug
  });

  try {
    // ✅ CORRIGÉ : Passer clientInfo au service
    const result = await this.authService.register(registerDto, clientInfo);

    this.logger.endOperation('register', operationId, true);

    const response: RegisterResponseDto = RegisterResponseMapper.toDto(result);
    return response;

  } catch (error) {
    this.logger.endOperation('register', operationId, false, undefined, { error: error.message });
    throw error;
  }
}

  /**
   * POST /auth/logout
   * Déconnexion utilisateur avec invalidation tokens
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @AuditCritical('user_logout')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Déconnexion utilisateur',
    description: 'Invalidation des tokens et fermeture session(s)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Déconnexion réussie'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token invalide'
  })
  async logout(
    @CurrentUser() user: IUserProfile,
    @SessionId() sessionId: string,
    @Body() logoutDto?: { allDevices?: boolean }
  ): Promise<{
    success: boolean;
    data: {
      message: string;
      tokensInvalidated: number;
      sessionsTerminated: number;
    };
  }> {
    const operationId = this.logger.startOperation('POST /auth/logout', {
      userId: user.id,
      allDevices: logoutDto?.allDevices || false,
    });

    try {
      // Appeler service logout
      const result = await this.authService.logout(
        sessionId, 
        logoutDto?.allDevices || false
      );

      this.logger.endOperation('logout', operationId, true);

      return {
        success: true,
        data: {
          message: 'Déconnexion réussie',
          tokensInvalidated: result ? 1 : 0,
          sessionsTerminated: result ? 1 : 0,
        },
      };

    } catch (error) {
      this.logger.endOperation('logout', operationId, false, undefined, { error: error.message });
      throw error;
    }
  }

 /**
 * GET /auth/verify-email
 * Vérification d'email via token (lien cliqué)
 */
    @Get('verify-email')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
    summary: 'Vérifier email utilisateur',
    description: 'Vérifie l\'email utilisateur via token reçu par email'
    })
    @ApiQuery({
    name: 'token',
    description: 'Token de vérification reçu par email',
    required: true,
    type: String,
    })
    @ApiResponse({
    status: 200,
    description: 'Résultat de la vérification',
    schema: {
        example: {
        success: true,
        verified: true,
        message: 'Email vérifié avec succès',
        userId: 'uuid'
        }
    }
    })
    async verifyEmail(
    @Query('token') token: string
    ): Promise<{
    success: boolean;
    verified: boolean;
    message: string;
    userId?: string;
    }> {
    const operationId = this.logger.startOperation('GET /auth/verify-email', {
        tokenLength: token?.length,
    });

    try {
        const result = await this.authService.verifyEmail(token);

        this.logger.endOperation('verifyEmail', operationId, result.success, undefined, {
        verified: result.verified,
        userId: result.userId,
        });

        return result;

    } catch (error) {
        this.logger.endOperation('verifyEmail', operationId, false, undefined, {
        error: error.message,
        });
        throw error;
    }
    }

  /**
 * POST /auth/resend-verification
 * Renvoyer email de vérification
 */
@Post('resend-verification')
@UseGuards(JwtAuthGuard)
@HttpCode(HttpStatus.OK)
@RateLimit({ limit: 3, windowMs: 300000 }) // 3 tentatives/5 minutes
@ApiOperation({
  summary: 'Renvoyer email de vérification',
  description: 'Génère et envoie un nouveau token de vérification d\'email'
})
@ApiBearerAuth()
@ApiResponse({
  status: 200,
  description: 'Email de vérification renvoyé',
  schema: {
    example: {
      success: true,
      message: 'Email de vérification renvoyé',
      tokenId: 'uuid'
    }
  }
})
@ApiResponse({
  status: 400,
  description: 'Email déjà vérifié ou utilisateur inactif'
})
@ApiResponse({
  status: 429,
  description: 'Trop de tentatives'
})
async resendVerificationEmail(
  @CurrentUser() user: IUserProfile
): Promise<{
  success: boolean;
  message: string;
  tokenId?: string;
}> {
  const operationId = this.logger.startOperation('POST /auth/resend-verification', {
    userId: user.id,
  });

  try {
    const result = await this.authService.resendVerificationEmail(user.id);

    this.logger.endOperation('resendVerificationEmail', operationId, result.success, undefined, {
      tokenId: result.tokenId,
    });

    return result;

  } catch (error) {
    this.logger.endOperation('resendVerificationEmail', operationId, false, undefined, {
      error: error.message,
    });
    throw error;
  }
}

/**
 * GET /auth/verification-status
 * Statut de vérification de l'utilisateur connecté
 */
@Get('verification-status')
@UseGuards(JwtAuthGuard)
@ApiOperation({
  summary: 'Statut de vérification email',
  description: 'Obtient le statut de vérification email de l\'utilisateur connecté'
})
@ApiBearerAuth()
@ApiResponse({
  status: 200,
  description: 'Statut de vérification',
  schema: {
    example: {
      emailVerified: true,
      verifiedAt: '2025-07-24T10:30:00.000Z',
      canResend: false
    }
  }
})
async getVerificationStatus(
  @CurrentUser() user: IUserProfile
): Promise<IVerificationStatus> {
  const operationId = this.logger.startOperation('GET /auth/verification-status', {
    userId: user.id,
  });

  try {
    const verificationStatus = await this.authService.getVerificationStatus(user.id);
    this.logger.endOperation('getVerificationStatus', operationId, true);
    return verificationStatus;

  } catch (error) {
    this.logger.endOperation('getVerificationStatus', operationId, false, undefined, {
      error: error.message,
    });
    throw error;
  }
}

}