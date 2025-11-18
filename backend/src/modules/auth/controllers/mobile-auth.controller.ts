// src/modules/auth/controllers/mobile-auth.controller.ts

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
  Get,
  Headers,
  UnauthorizedException,
  BadRequestException
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody,
  ApiHeader
} from '@nestjs/swagger';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { SessionService } from '../services/session.service';
import { SecurityService } from '../services/security.service';
import { DeviceService } from '../services/device.service';
import { 
  MobileLoginDto, 
  MobileBiometricLoginDto,
  MobileLoginResponseDto,
  MobileRefreshTokenDto,
  MobileValidateTokenDto,
  MobileLogoutDto
} from '../dto/mobile';
import { 
  CurrentUser, 
  CurrentUserId, 
  Public,
  SessionId,
  ClientInfo
} from '../decorators';
import { 
  RateLimitLogin,
  RateLimit,
} from '../decorators/rate-limit.decorator';
import { 
  AuditCritical,
} from '../decorators/audit-log.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { IUserProfile } from '../interfaces';

/**
 * Mobile Auth Controller Entrix V3.0
 * Endpoints optimisés pour l'application mobile
 * ✅ NOUVEAU : Authentification biométrique
 * ✅ NOUVEAU : Validation de token simplifiée
 * ✅ NOUVEAU : Gestion des sessions mobiles
 * ✅ NOUVEAU : Endpoints optimisés pour performance mobile
 */

@ApiTags('Mobile Authentication')
@Controller('mobile/auth')
@UsePipes(new ValidationPipe({ 
  transform: true, 
  whitelist: true, 
  forbidNonWhitelisted: true 
}))
export class MobileAuthController {
  private readonly logger: LoggerService;

  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly securityService: SecurityService,
    private readonly deviceService: DeviceService,
    private readonly prisma: PrismaService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('MobileAuthController');
  }

  /**
   * POST /mobile/auth/login
   * Connexion mobile optimisée avec gestion des sessions
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @RateLimitLogin()
  @AuditCritical('mobile_user_login')
  @ApiOperation({ 
    summary: 'Connexion mobile',
    description: 'Authentification mobile optimisée avec gestion des sessions et device fingerprinting'
  })
  @ApiBody({ type: MobileLoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Connexion mobile réussie',
    type: MobileLoginResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Identifiants invalides ou compte verrouillé' 
  })
  @ApiResponse({ 
    status: 429, 
    description: 'Trop de tentatives de connexion' 
  })
  async mobileLogin(
    @Body() loginDto: MobileLoginDto,
    @ClientInfo() clientInfo: { ip: string; userAgent: string; deviceFingerprint?: string },
    @Headers('x-device-id') deviceId?: string,
    @Headers('x-app-version') appVersion?: string
  ): Promise<MobileLoginResponseDto> {
    const operationId = this.logger.startOperation('mobile_login', {
      username: loginDto.username,
      hasDeviceFingerprint: !!clientInfo.deviceFingerprint,
      deviceId,
      appVersion
    });

    try {
      // Convert username to email format if needed
      const email = loginDto.username.includes('@') 
        ? loginDto.username 
        : `${loginDto.username}@entrix.tn`;

      // Prepare login data
      const loginData = {
        email,
        password: loginDto.password,
        rememberMe: loginDto.rememberMe || false,
        deviceFingerprint: clientInfo.deviceFingerprint,
        captchaToken: loginDto.captchaToken
      };

      // Perform login using existing auth service
      const loginResult = await this.authService.login(loginData, {
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        deviceFingerprint: clientInfo.deviceFingerprint
      });

      // Log mobile-specific device info
      if (deviceId || appVersion) {
        await this.deviceService.logMobileDevice({
          userId: loginResult.user.id,
          deviceId,
          appVersion,
          userAgent: clientInfo.userAgent,
          ipAddress: clientInfo.ip,
          deviceFingerprint: clientInfo.deviceFingerprint
        });
      }

      this.logger.endOperation('mobile_login', operationId, true);

      return {
        success: true,
        accessToken: loginResult.tokens.accessToken,
        refreshToken: loginResult.tokens.refreshToken,
        user: {
          id: loginResult.user.id,
          username: loginResult.user.email,
          email: loginResult.user.email,
          role: loginResult.user.roles?.[0] || 'user',
          permissions: loginResult.user.permissions || [],
          profile: {
            firstName: loginResult.user.firstName,
            lastName: loginResult.user.lastName,
            avatar: loginResult.user.avatar
          }
        },
        session: {
          id: loginResult.session?.sessionId,
          expiresAt: loginResult.session?.expiresAt
        },
        requiresMfa: loginResult.meta?.requiresMfa || false,
        mfaChallenge: loginResult.mfaRequired ? {
          token: loginResult.mfaRequired.challengeToken,
          method: loginResult.mfaRequired.methods[0] || 'TOTP',
          expiresAt: new Date(Date.now() + loginResult.mfaRequired.expiresIn * 1000).toISOString()
        } : undefined
      };

    } catch (error) {
      this.logger.endOperation('mobile_login', operationId, false, undefined, { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * POST /mobile/auth/biometric-login
   * Connexion biométrique pour mobile
   */
  @Public()
  @Post('biometric-login')
  @HttpCode(HttpStatus.OK)
  @RateLimitLogin()
  @AuditCritical('mobile_biometric_login')
  @ApiOperation({ 
    summary: 'Connexion biométrique mobile',
    description: 'Authentification par biométrie (empreinte digitale, Face ID)'
  })
  @ApiBody({ type: MobileBiometricLoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Connexion biométrique réussie',
    type: MobileLoginResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Authentification biométrique échouée' 
  })
  async biometricLogin(
    @Body() biometricDto: MobileBiometricLoginDto,
    @ClientInfo() clientInfo: { ip: string; userAgent: string; deviceFingerprint?: string },
    @Headers('x-device-id') deviceId?: string,
    @Headers('x-biometric-type') biometricType?: string
  ): Promise<MobileLoginResponseDto> {
    const operationId = this.logger.startOperation('mobile_biometric_login', {
      deviceId,
      biometricType,
      hasDeviceFingerprint: !!clientInfo.deviceFingerprint
    });

    try {
      // Validate device and biometric credentials
      const deviceValidation = await this.deviceService.validateBiometricDevice({
        deviceId,
        biometricType,
        deviceFingerprint: clientInfo.deviceFingerprint,
        ipAddress: clientInfo.ip
      });

      if (!deviceValidation.isValid) {
        throw new UnauthorizedException('Device not authorized for biometric login');
      }

      // Get user from device association
      const user = await this.deviceService.getUserFromDevice(deviceId);
      if (!user) {
        throw new UnauthorizedException('No user associated with this device');
      }

      // Generate new tokens for the user
      const tokens = await this.tokenService.generateTokenPair(user.id, 'session_' + Date.now());
      
      // Create or update session
      const session = await this.sessionService.createSession(
        user.id,
        {
          userAgent: clientInfo.userAgent,
          ipAddress: clientInfo.ip,
          deviceFingerprint: clientInfo.deviceFingerprint,
          isMobile: true
        },
        true
      );

      this.logger.endOperation('mobile_biometric_login', operationId, true);

      return {
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          username: user.email,
          email: user.email,
          role: 'user', // Default role for mobile
          permissions: [],
          profile: {
            firstName: user.first_name,
            lastName: user.last_name,
            avatar: user.avatar
          }
        },
        session: {
          id: session.id,
          expiresAt: session.expires_at.toISOString()
        },
        requiresMfa: false,
        mfaChallenge: null
      };

    } catch (error) {
      this.logger.endOperation('mobile_biometric_login', operationId, false, undefined, { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * POST /mobile/auth/refresh
   * Renouvellement de token optimisé pour mobile
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @RateLimitLogin()
  @ApiOperation({ 
    summary: 'Renouvellement de token mobile',
    description: 'Renouvellement optimisé des tokens d\'accès pour mobile'
  })
  @ApiBody({ type: MobileRefreshTokenDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Tokens renouvelés avec succès',
    type: MobileLoginResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Refresh token invalide ou expiré' 
  })
  async refreshTokens(
    @Body() refreshDto: MobileRefreshTokenDto,
    @ClientInfo() clientInfo: { ip: string; userAgent: string }
  ): Promise<MobileLoginResponseDto> {
    const operationId = this.logger.startOperation('mobile_refresh_tokens');

    try {
      // Validate and refresh tokens
      const refreshResult = await this.authService.refreshTokens(refreshDto.refreshToken);
      
      // Extract user ID from the refresh token
      const tokenValidation = await this.tokenService.validateAnyToken(refreshDto.refreshToken);
      if (!tokenValidation.isValid || !tokenValidation.userId) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      
      // Get user profile - using direct prisma call for now
      const user = await this.prisma.users.findUnique({
        where: { id: tokenValidation.userId },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          avatar: true,
          phone: true,
          is_active: true,
          email_verified: true
        }
      });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      this.logger.endOperation('mobile_refresh_tokens', operationId, true);

      return {
        success: true,
        accessToken: refreshResult.accessToken,
        refreshToken: refreshResult.refreshToken,
        user: {
          id: user.id,
          username: user.email,
          email: user.email,
          role: 'user', // Default role for mobile
          permissions: [],
          profile: {
            firstName: user.first_name,
            lastName: user.last_name,
            avatar: user.avatar
          }
        },
        session: null, // Session info not needed for refresh
        requiresMfa: false,
        mfaChallenge: null
      };

    } catch (error) {
      this.logger.endOperation('mobile_refresh_tokens', operationId, false, undefined, { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * POST /mobile/auth/validate
   * Validation rapide de token pour mobile
   */
  @Public()
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @RateLimitLogin()
  @ApiOperation({ 
    summary: 'Validation de token mobile',
    description: 'Validation rapide de token d\'accès pour vérification de session'
  })
  @ApiBody({ type: MobileValidateTokenDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Token valide',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        user: { type: 'object' },
        expiresIn: { type: 'number' }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token invalide ou expiré' 
  })
  async validateToken(
    @Body() validateDto: MobileValidateTokenDto
  ): Promise<{
    valid: boolean;
    user?: any;
    expiresIn?: number;
  }> {
    try {
      const validation = await this.tokenService.validateAnyToken(validateDto.accessToken);
      
      if (!validation.isValid) {
        return { valid: false };
      }

      const user = await this.prisma.users.findUnique({
        where: { id: validation.userId },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          avatar: true,
          phone: true,
          is_active: true,
          email_verified: true
        }
      });
      
      return {
        valid: true,
        user: user ? {
          id: user.id,
          username: user.email,
          email: user.email,
          role: 'user', // Default role for mobile
          permissions: []
        } : null,
        expiresIn: 3600 // Default 1 hour
      };

    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * POST /mobile/auth/logout
   * Déconnexion mobile avec gestion des sessions
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @AuditCritical('mobile_user_logout')
  @ApiOperation({ 
    summary: 'Déconnexion mobile',
    description: 'Déconnexion avec invalidation des tokens et gestion des sessions'
  })
  @ApiBearerAuth()
  @ApiBody({ type: MobileLogoutDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Déconnexion réussie',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  async mobileLogout(
    @CurrentUser() user: IUserProfile,
    @SessionId() sessionId: string,
    @Body() logoutDto: MobileLogoutDto
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const operationId = this.logger.startOperation('mobile_logout', {
      userId: user.id,
      sessionId,
      allDevices: logoutDto.allDevices
    });

    try {
      await this.authService.logout(sessionId, logoutDto.allDevices);

      this.logger.endOperation('mobile_logout', operationId, true);

      return {
        success: true,
        message: logoutDto.allDevices 
          ? 'Déconnexion de tous les appareils réussie'
          : 'Déconnexion réussie'
      };

    } catch (error) {
      this.logger.endOperation('mobile_logout', operationId, false, undefined, { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * GET /mobile/auth/profile
   * Récupération du profil utilisateur pour mobile
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ 
    summary: 'Profil utilisateur mobile',
    description: 'Récupération du profil utilisateur optimisé pour mobile'
  })
  @ApiBearerAuth()
  @ApiResponse({ 
    status: 200, 
    description: 'Profil utilisateur',
    type: 'object'
  })
  async getMobileProfile(
    @CurrentUser() user: IUserProfile
  ): Promise<any> {
    return {
      id: user.id,
      username: user.email,
      email: user.email,
      role: user.roles?.[0] || 'user',
      permissions: user.permissions || [],
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        phone: user.phone
      },
      preferences: {
        language: user.preferences?.language || 'fr',
        timezone: user.preferences?.timezone || 'Africa/Tunis',
        notifications: user.preferences?.notifications || true
      }
    };
  }
} 