// src/modules/auth/controllers/mfa.controller.ts

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
  MfaVerifyResponseDto,
  MfaChallengeResponseDto
} from '../dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser, CurrentUserId } from '../decorators/current-user.decorator';
import { 
  AuditCritical,
  AuditSecurity,
  RateLimitMfa,
  RateLimit
} from '../decorators';
import { IUserProfile } from '../interfaces';
import { MfaProvider } from '../constants/auth.constants'; // ✅ CORRIGÉ : Import depuis constants

/**
 * MFA Controller Entrix V3.0 - Grade A+
 * Gestion Multi-Factor Authentication
 * ✅ CORRIGÉ : Imports et types correspondant aux fichiers réels
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
  ): Promise<{
    success: boolean;
    data: {
      available: MfaProvider[];
      configured: MfaProvider[];
      recommended: MfaProvider;
    };
  }> {
    const operationId = this.logger.startOperation('GET /auth/mfa/providers', {
      userId,
    });

    try {
      const availableProviders = await this.mfaService.getAvailableProviders(userId);

      // TODO: Récupérer providers déjà configurés depuis la base
      const configuredProviders: MfaProvider[] = [];

      this.logger.endOperation('getAvailableProviders', operationId, true);

      return {
        success: true,
        data: {
          available: availableProviders,
          configured: configuredProviders,
          recommended: this.getRecommendedProvider(availableProviders),
        },
      };

    } catch (error) {
      this.logger.endOperation('getAvailableProviders', operationId, false, undefined, { error: error.message });
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

      this.logger.endOperation('setupMfa', operationId, true);

      // ✅ CORRIGÉ : Mappage correct selon l'interface IMfaSetup réelle
      return {
        success: true,
        data: {
          provider: setup.provider,
          qrCode: setup.qrCode,
          secret: setup.secret,
          backupCodes: setup.backupCodes,
          setupInstructions: this.generateSetupInstructions(setup.provider), // ✅ Généré dynamiquement
        },
      };

    } catch (error) {
      this.logger.endOperation('setupMfa', operationId, false, undefined, { error: error.message });
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
      trustDevice: mfaVerifyDto.trustDevice,
    });

    try {
      const isValid = await this.mfaService.verifyMfa(mfaVerifyDto);

      if (!isValid) {
        this.logger.endOperation('verifyMfa', operationId, false, undefined, { reason: 'invalid_code' });
        throw new Error('Code MFA invalide');
      }

      // TODO: Générer nouveaux tokens après MFA réussi
      const tokens = null; // await this.tokenService.generateTokenPair(...)

      this.logger.endOperation('verifyMfa', operationId, true);

      return {
        success: true,
        data: {
          user,
          tokens,
          session: null, // TODO: Récupérer session info
          trustedDevice: mfaVerifyDto.trustDevice ? {
            deviceId: 'device_' + Date.now(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
          } : undefined,
        },
      };

    } catch (error) {
      this.logger.endOperation('verifyMfa', operationId, false, undefined, { error: error.message });
      throw error;
    }
  }

  /**
   * DELETE /auth/mfa/disable/:provider
   * Désactivation MFA pour un provider
   */
  @Delete('disable/:provider')
  @HttpCode(HttpStatus.OK)
  @AuditCritical('mfa_disable')
  @ApiOperation({ 
    summary: 'Désactiver MFA',
    description: 'Désactive une méthode MFA spécifique'
  })
  @ApiParam({ 
    name: 'provider', 
    enum: ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP', 'BACKUP_CODE'],
    description: 'Provider MFA à désactiver'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'MFA désactivé'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Provider non configuré'
  })
  async disableMfa(
    @Param('provider') provider: MfaProvider,
    @CurrentUserId() userId: string
  ): Promise<{
    success: boolean;
    data: { disabled: boolean; provider: MfaProvider; message: string };
  }> {
    const operationId = this.logger.startOperation('DELETE /auth/mfa/disable', {
      userId,
      provider,
    });

    try {
      const disabled = await this.mfaService.disableMfa(userId, provider);

      this.logger.endOperation('disableMfa', operationId, true);

      return {
        success: true,
        data: {
          disabled,
          provider,
          message: `MFA ${provider} désactivé avec succès`,
        },
      };

    } catch (error) {
      this.logger.endOperation('disableMfa', operationId, false, undefined, { error: error.message });
      throw error;
    }
  }

  /**
   * GET /auth/mfa/status
   * Statut MFA utilisateur
   */
  @Get('status')
  @ApiOperation({ 
    summary: 'Statut MFA utilisateur',
    description: 'Récupère le statut MFA et méthodes configurées'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statut MFA récupéré'
  })
  async getMfaStatus(
    @CurrentUserId() userId: string
  ): Promise<{
    success: boolean;
    data: {
      enabled: boolean;
      providers: MfaProvider[];
      requiredByPolicy: boolean;
      lastUsed?: string;
    };
  }> {
    const operationId = this.logger.startOperation('GET /auth/mfa/status', {
      userId,
    });

    try {
      // TODO: Récupérer le statut depuis la base de données
      const configuredProviders: MfaProvider[] = [];
      const enabled = configuredProviders.length > 0;
      const requiredByPolicy = await this.mfaService.requiresMfa(userId, 50); // Score de risque moyen

      this.logger.endOperation('getMfaStatus', operationId, true);

      return {
        success: true,
        data: {
          enabled,
          providers: configuredProviders,
          requiredByPolicy,
          lastUsed: undefined, // TODO: Récupérer dernière utilisation
        },
      };

    } catch (error) {
      this.logger.endOperation('getMfaStatus', operationId, false, undefined, { error: error.message });
      throw error;
    }
  }

  /**
   * POST /auth/mfa/challenge
   * Génère un challenge MFA
   */
  @Post('challenge')
  @HttpCode(HttpStatus.OK)
  @RateLimitMfa()
  @ApiOperation({ 
    summary: 'Générer challenge MFA',
    description: 'Génère un nouveau challenge MFA pour authentification'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Challenge généré',
    type: MfaChallengeResponseDto
  })
  async generateMfaChallenge(
    @CurrentUserId() userId: string
  ): Promise<{
    success: boolean;
    data: MfaChallengeResponseDto;
  }> {
    const operationId = this.logger.startOperation('POST /auth/mfa/challenge', {
      userId,
    });

    try {
      // TODO: Implémenter la génération de challenge
      const availableProviders = await this.mfaService.getAvailableProviders(userId);
      
      const challenge: MfaChallengeResponseDto = {
        methods: availableProviders,
        challengeToken: `mfa_challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        expiresIn: 300, // 5 minutes
        instructions: 'Veuillez choisir une méthode de vérification et saisir le code reçu',
        methodsInfo: this.generateMethodsInfo(availableProviders),
      };

      this.logger.endOperation('generateMfaChallenge', operationId, true);

      return {
        success: true,
        data: challenge,
      };

    } catch (error) {
      this.logger.endOperation('generateMfaChallenge', operationId, false, undefined, { error: error.message });
      throw error;
    }
  }

  // ========================================
  // MÉTHODES PRIVÉES UTILITAIRES
  // ========================================

  /**
   * Génère des instructions de setup selon le provider
   */
  private generateSetupInstructions(provider: MfaProvider): string {
    const instructions = {
      SMS_OTP: 'SMS configuré avec succès. Vous recevrez des codes par SMS lors des connexions.',
      EMAIL_OTP: 'Email OTP configuré. Vous recevrez des codes par email lors des connexions.',
      TOTP_APP: 'Scannez le QR code avec votre application d\'authentification (Google Authenticator, Authy, etc.).',
      BACKUP_CODE: 'Codes de récupération générés. Conservez-les en lieu sûr pour accéder à votre compte.',
    };

    return instructions[provider] || 'Configuration MFA terminée avec succès.';
  }

  /**
   * Retourne le provider MFA recommandé
   */
  private getRecommendedProvider(availableProviders: MfaProvider[]): MfaProvider {
    // Ordre de préférence : TOTP_APP > SMS_OTP > EMAIL_OTP > BACKUP_CODE
    const priorityOrder: MfaProvider[] = ['TOTP_APP', 'SMS_OTP', 'EMAIL_OTP', 'BACKUP_CODE'];
    
    for (const provider of priorityOrder) {
      if (availableProviders.includes(provider)) {
        return provider;
      }
    }

    return availableProviders[0] || 'TOTP_APP';
  }

  /**
   * Génère des informations détaillées par méthode MFA
   */
  private generateMethodsInfo(providers: MfaProvider[]): Record<string, any> {
    const info: Record<string, any> = {};

    providers.forEach(provider => {
      switch (provider) {
        case 'SMS_OTP':
          info[provider] = {
            masked_phone: '+216***45678', // TODO: Récupérer le vrai numéro masqué
            estimated_delivery: '30 seconds',
            cost: 'Gratuit',
          };
          break;
        case 'EMAIL_OTP':
          info[provider] = {
            masked_email: 'u***@entrix.tn', // TODO: Récupérer le vrai email masqué
            estimated_delivery: '1 minute',
            cost: 'Gratuit',
          };
          break;
        case 'TOTP_APP':
          info[provider] = {
            app_name: 'Google Authenticator',
            setup_required: false, // TODO: Vérifier si setup requis
            offline_capable: true,
          };
          break;
        case 'BACKUP_CODE':
          info[provider] = {
            codes_remaining: 8, // TODO: Compter les codes restants
            single_use: true,
            recommendation: 'À utiliser uniquement en cas d\'urgence',
          };
          break;
      }
    });

    return info;
  }
}