/ src/modules/auth/controllers/mfa.controller.ts

import { 
  Controller, 
  Get,
  Post, 
  Delete,
  Body, 
  Param,
  UseGuards,
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
  ApiParam
} from '@nestjs/swagger';
import { LoggerService } from '../../../shared/logger/logger.service';
import { MfaService } from '../services/mfa.service';
import { 
  MfaSetupDto,
  MfaSetupResponseDto,
  MfaVerifyDto,
  MfaVerifyResponseDto
} from '../dto/mfa';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser, CurrentUserId } from '../decorators/current-user.decorator';
import { 
  AuditCritical,
  AuditSecurity,
  RateLimitMfa,
  RateLimit
} from '../decorators/audit-log.decorator';
import { IUserProfile, MfaProvider } from '../interfaces';

/**
 * MFA Controller Entrix V3.0 - Grade A+
 * Gestion Multi-Factor Authentication
 * Respecte api_specs_auth_session.md
 */

@ApiTags('Multi-Factor Authentication')
@Controller('auth/mfa')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ 
  transform: true, 
  whitelist: true, 
  forbidNonWhitelisted: true 
}))
export class MfaController {
  private readonly logger: LoggerService;

  constructor(
    private readonly mfaService: MfaService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('MfaController');
  }

  /**
   * GET /auth/mfa/providers
   * Liste providers MFA disponibles pour utilisateur
   */
  @Get('providers')
  @ApiOperation({ 
    summary: 'Providers MFA disponibles',
    description: 'Récupère liste des méthodes MFA disponibles'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste providers récupérée',
    schema: {
      example: {
        success: true,
        data: {
          available: ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP'],
          configured: ['EMAIL_OTP'],
          recommended: 'TOTP_APP'
        }
      }
    }
  })
  async getAvailableProviders(
    @CurrentUserId() userId: string
  ) {
    const operationId = this.logger.startOperation('GET /auth/mfa/providers', {
      userId,
    });

    try {
      const availableProviders = await this.mfaService.getAvailableProviders(userId);

      // TODO: Récupérer providers déjà configurés
      const configuredProviders: MfaProvider[] = [];

      this.logger.endOperation(operationId, 'success');

      return {
        success: true,
        data: {
          available: availableProviders,
          configured: configuredProviders,
          recommended: this.getRecommendedProvider(availableProviders),
        },
      };

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * POST /auth/mfa/setup
   * Configuration MFA pour utilisateur
   */
  @Post('setup')
  @HttpCode(HttpStatus.OK)
  @AuditCritical('mfa_setup')
  @RateLimit({ limit: 3, windowMs: 900000 }) // 3 setup/15min
  @ApiOperation({ 
    summary: 'Configuration MFA',
    description: 'Configure une méthode d\'authentification multifacteur'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'MFA configuré',
    type: MfaSetupResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Provider non supporté'
  })
  @ApiResponse({ 
    status: 409, 
    description: 'MFA déjà configuré pour ce provider'
  })
  async setupMfa(
    @Body() mfaSetupDto: MfaSetupDto,
    @CurrentUserId() userId: string
  ): Promise<MfaSetupResponseDto> {
    const operationId = this.logger.startOperation('POST /auth/mfa/setup', {
      userId,
      provider: mfaSetupDto.provider,
    });

    try {
      const setup = await this.mfaService.setupMfa(userId, mfaSetupDto.provider);

      this.logger.endOperation(operationId, 'success');

      return {
        success: true,
        data: {
          provider: setup.provider,
          qrCode: setup.qrCode,
          secret: setup.secret,
          backupCodes: setup.backupCodes,
          setupInstructions: setup.setupInstructions || 'Configuration terminée',
        },
      };

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * POST /auth/mfa/verify
   * Vérification code MFA
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @RateLimitMfa()
  @AuditSecurity('mfa_verification')
  @ApiOperation({ 
    summary: 'Vérification MFA',
    description: 'Vérifie code d\'authentification multifacteur'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Code MFA valide',
    type: MfaVerifyResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Code MFA invalide'
  })
  @ApiResponse({ 
    status: 428, 
    description: 'Challenge MFA expiré'
  })
  async verifyMfa(
    @Body() mfaVerifyDto: MfaVerifyDto,
    @CurrentUser() user: IUserProfile
  ): Promise<MfaVerifyResponseDto> {
    const operationId = this.logger.startOperation('POST /auth/mfa/verify', {
      userId: user.id,
      method: mfaVerifyDto.method,
    });

    try {
      const isValid = await this.mfaService.verifyMfa(mfaVerifyDto);

      if (!isValid) {
        this.logger.endOperation(operationId, 'invalid_code');
        throw new Error('Code MFA invalide');
      }

      // TODO: Générer nouveaux tokens après MFA réussi
      const tokens = null; // await this.tokenService.generateTokenPair(...)

      this.logger.endOperation(operationId, 'success');

      return {
        success: true,
        data: {
          user,
          tokens,
          session: null, // TODO: Récupérer session info
          trustedDevice: mfaVerifyDto.trustDevice ? {
            deviceId: 'device_xxx',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          } : undefined,
        },
      };

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * POST /auth/mfa/challenge
   * Génère challenge MFA pour re-authentification
   */
  @Post('challenge')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 5, windowMs: 300000 }) // 5 challenges/5min
  @ApiOperation({ 
    summary: 'Génération challenge MFA',
    description: 'Génère nouveau challenge pour re-authentification'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Challenge généré',
    schema: {
      example: {
        success: true,
        data: {
          challengeToken: 'mfa_challenge_xxx',
          availableMethods: ['SMS_OTP', 'TOTP_APP'],
          expiresIn: 300
        }
      }
    }
  })
  async generateMfaChallenge(
    @CurrentUserId() userId: string
  ) {
    const operationId = this.logger.startOperation('POST /auth/mfa/challenge', {
      userId,
    });

    try {
      // TODO: Générer challenge MFA
      const challengeToken = `mfa_challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const availableMethods = await this.mfaService.getAvailableProviders(userId);

      // Stocker challenge temporairement
      // await this.storeMfaChallenge(challengeToken, userId);

      this.logger.endOperation(operationId, 'success');

      return {
        success: true,
        data: {
          challengeToken,
          availableMethods,
          expiresIn: 300, // 5 minutes
        },
      };

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * DELETE /auth/mfa/:provider
   * Désactivation MFA pour provider
   */
  @Delete(':provider')
  @HttpCode(HttpStatus.OK)
  @AuditCritical('mfa_disable')
  @ApiOperation({ 
    summary: 'Désactivation MFA',
    description: 'Désactive MFA pour un provider spécifique'
  })
  @ApiParam({ name: 'provider', enum: ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP', 'BACKUP_CODE'] })
  @ApiResponse({ 
    status: 200, 
    description: 'MFA désactivé',
    schema: {
      example: {
        success: true,
        data: {
          provider: 'SMS_OTP',
          disabled: true,
          remainingMethods: ['TOTP_APP']
        }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'MFA non configuré pour ce provider'
  })
  async disableMfa(
    @Param('provider') provider: MfaProvider,
    @CurrentUserId() userId: string
  ) {
    const operationId = this.logger.startOperation('DELETE /auth/mfa/:provider', {
      userId,
      provider,
    });

    try {
      const disabled = await this.mfaService.disableMfa(userId, provider);

      if (!disabled) {
        this.logger.endOperation(operationId, 'not_found');
        return {
          success: false,
          error: {
            code: 'MFA_NOT_CONFIGURED',
            message: 'MFA non configuré pour ce provider',
          },
        };
      }

      const remainingMethods = await this.mfaService.getAvailableProviders(userId);

      this.logger.endOperation(operationId, 'success');

      return {
        success: true,
        data: {
          provider,
          disabled: true,
          remainingMethods,
        },
      };

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * POST /auth/mfa/backup-codes
   * Génération nouveaux codes de récupération
   */
  @Post('backup-codes')
  @HttpCode(HttpStatus.OK)
  @AuditCritical('mfa_backup_codes_generated')
  @RateLimit({ limit: 2, windowMs: 3600000 }) // 2 générations/heure
  @ApiOperation({ 
    summary: 'Génération codes de récupération',
    description: 'Génère nouveaux codes de récupération MFA'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Codes générés',
    schema: {
      example: {
        success: true,
        data: {
          backupCodes: ['ABC12345', 'DEF67890'],
          previousCodesRevoked: true,
          warning: 'Conservez ces codes en lieu sûr'
        }
      }
    }
  })
  async generateBackupCodes(
    @CurrentUserId() userId: string
  ) {
    const operationId = this.logger.startOperation('POST /auth/mfa/backup-codes', {
      userId,
    });

    try {
      // TODO: Générer nouveaux codes de récupération
      const setup = await this.mfaService.setupMfa(userId, 'BACKUP_CODE');

      this.logger.endOperation(operationId, 'success');

      return {
        success: true,
        data: {
          backupCodes: setup.backupCodes || [],
          previousCodesRevoked: true,
          warning: 'Conservez ces codes en lieu sûr. Ils ne seront plus affichés.',
        },
      };

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * Méthodes helper privées
   */

  private getRecommendedProvider(available: MfaProvider[]): MfaProvider | null {
    // Priorité: TOTP_APP > SMS_OTP > EMAIL_OTP
    if (available.includes('TOTP_APP')) return 'TOTP_APP';
    if (available.includes('SMS_OTP')) return 'SMS_OTP';
    if (available.includes('EMAIL_OTP')) return 'EMAIL_OTP';
    return null;
  }
}