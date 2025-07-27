// src/modules/auth/controllers/mfa.controller.ts

import { 
  Controller, 
  Post, 
  Delete, 
  Get, 
  Put,
  Body, 
  Param,
  HttpCode, 
  HttpStatus, 
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { MfaService } from '../services/mfa.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { IUserProfile } from '../interfaces/user.interface';
import { MfaProvider } from '../constants/auth.constants';
import {
  MfaSetupDto,
  MfaSetupResponseDto
} from '../dto/mfa/mfa-setup.dto';
import {
  MfaVerifyDto,
  MfaVerifyResponseDto
} from '../dto/mfa/mfa-verify.dto';
import {
  MfaDisableDto,
  MfaToggleDto,
  MfaProvidersResponseDto,
  MfaStatusResponseDto,
  MfaRegenerateBackupCodesDto
} from '../dto/mfa/mfa-management.dto';

/**
 * Contrôleur MFA complet Entrix V3.0
 * Respecte api_specs_auth_session.md
 */
@ApiTags('Auth - Multi-Factor Authentication')
@Controller('auth/mfa')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
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
   * Obtenir les providers MFA disponibles
   */
  @Get('providers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Providers MFA disponibles',
    description: 'Retourne la liste des méthodes MFA supportées et leur statut'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Providers MFA avec détails',
    type: MfaProvidersResponseDto
  })
  async getAvailableProviders(
    @CurrentUser() user: IUserProfile
  ): Promise<MfaProvidersResponseDto> {
    const operationId = this.logger.startOperation('GET /auth/mfa/providers', {
      userId: user.id
    });

    try {
      const availableProviders = await this.mfaService.getAvailableProviders(user.id);
      const configuredMethods = await this.mfaService.getConfiguredMethods(user.id);

      const providersInfo = availableProviders.map(provider => ({
        provider,
        isConfigured: configuredMethods.includes(provider),
        name: this.getProviderDisplayName(provider),
        description: this.getProviderDescription(provider),
        setupTime: this.getProviderSetupTime(provider),
        isRecommended: this.isProviderRecommended(provider, availableProviders)
      }));

      this.logger.endOperation('getAvailableProviders', operationId, true);

      return {
        success: true,
        data: {
          providers: providersInfo,
          recommendedProvider: this.getRecommendedProvider(availableProviders),
          hasMfaConfigured: configuredMethods.length > 0,
          methodsInfo: this.generateMethodsInfo(availableProviders, user)
        }
      };

    } catch (error) {
      this.logger.endOperation('getAvailableProviders', operationId, false);
      this.logger.error('Failed to get providers', error.stack, 'MfaController.getAvailableProviders', JSON.stringify({
        userId: user.id,
        error: error.message
      }));
      throw error;
    }
  }

  /**
   * GET /auth/mfa/status
   * Statut MFA de l'utilisateur
   */
  @Get('status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Statut MFA utilisateur',
    description: 'Retourne le statut détaillé de la configuration MFA'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statut MFA détaillé',
    type: MfaStatusResponseDto
  })
  async getMfaStatus(
    @CurrentUser() user: IUserProfile
  ): Promise<MfaStatusResponseDto> {
    const operationId = this.logger.startOperation('GET /auth/mfa/status', {
      userId: user.id
    });

    try {
      const configuredMethods = await this.mfaService.getConfiguredMethods(user.id);
      const trustedDevicesCount = await this.mfaService.getTrustedDevicesCount(user.id);
      const backupCodesCount = await this.mfaService.getBackupCodesCount(user.id);
      const lastUsedDate = await this.mfaService.getLastUsedDate(user.id);

      this.logger.endOperation('getMfaStatus', operationId, true);

      return {
        success: true,
        data: {
          isEnabled: configuredMethods.length > 0,
          configuredMethods,
          primaryMethod: await this.mfaService.getPrimaryMethod(user.id),
          trustedDevicesCount,
          backupCodesRemaining: backupCodesCount,
          lastUsed: lastUsedDate?.toISOString(),
          securityScore: this.calculateSecurityScore(configuredMethods, trustedDevicesCount)
        }
      };

    } catch (error) {
      this.logger.endOperation('getMfaStatus', operationId, false);
      throw error;
    }
  }

  /**
   * POST /auth/mfa/setup
   * Configuration initiale MFA
   */
  @Post('setup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Configuration MFA',
    description: 'Démarre la configuration d\'une méthode MFA'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Configuration MFA initiée',
    type: MfaSetupResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides'
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Méthode déjà configurée'
  })
  async setupMfa(
    @Body() mfaSetupDto: MfaSetupDto,
    @CurrentUser() user: IUserProfile
  ): Promise<MfaSetupResponseDto> {
    const operationId = this.logger.startOperation('POST /auth/mfa/setup', {
      userId: user.id,
      provider: mfaSetupDto.provider
    });

    try {
      const setup = await this.mfaService.setupMfa(user.id, mfaSetupDto.provider);

      this.logger.endOperation('setupMfa', operationId, true);

      return {
        success: true,
        data: {
          provider: setup.provider,
          qrCode: setup.qrCode,
          secret: setup.secret,
          backupCodes: setup.backupCodes,
          setupInstructions: this.getSetupInstructions(setup.provider)
        }
      };

    } catch (error) {
      this.logger.endOperation('setupMfa', operationId, false);
      this.logger.error('MFA setup failed', error.stack, 'MfaController.setupMfa', JSON.stringify({
        userId: user.id,
        provider: mfaSetupDto.provider,
        error: error.message
      }));
      throw error;
    }
  }

  /**
   * POST /auth/mfa/verify
   * Vérification code MFA
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Vérification MFA',
    description: 'Vérifie un code d\'authentification multifacteur'
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
        throw new BadRequestException('Code MFA invalide');
      }

      // TODO: Implémenter génération nouveaux tokens après MFA réussi
      const tokens = await this.generatePostMfaTokens(user.id);
      const session = await this.getSessionInfo(user.id);

      this.logger.endOperation('verifyMfa', operationId, true);

      return {
        success: true,
        data: {
          user,
          tokens,
          session,
          trustedDevice: mfaVerifyDto.trustDevice ? {
            deviceId: 'generated-device-id', // TODO: Générer vrai ID
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 jours
          } : undefined
        }
      };

    } catch (error) {
      this.logger.endOperation('verifyMfa', operationId, false);
      throw error;
    }
  }

  /**
   * PUT /auth/mfa/:provider/toggle
   * Activer/Désactiver une méthode MFA
   */
  @Put(':provider/toggle')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ 
    name: 'provider', 
    enum: ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP', 'BACKUP_CODE'],
    description: 'Provider MFA à modifier'
  })
  @ApiOperation({ 
    summary: 'Activer/Désactiver MFA',
    description: 'Bascule l\'état d\'activation d\'une méthode MFA'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Méthode MFA modifiée'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Méthode non configurée'
  })
  async toggleMfa(
    @Param('provider') provider: MfaProvider,
    @Body() toggleDto: MfaToggleDto,
    @CurrentUser() user: IUserProfile
  ) {
    const operationId = this.logger.startOperation('PUT /auth/mfa/:provider/toggle', {
      userId: user.id,
      provider,
      enable: toggleDto.enable
    });

    try {
      if (toggleDto.enable) {
        await this.mfaService.enableMfa(user.id, provider);
      } else {
        await this.mfaService.disableMfa(user.id, provider);
      }

      this.logger.endOperation('toggleMfa', operationId, true);

      return {
        success: true,
        message: `MFA ${provider} ${toggleDto.enable ? 'activé' : 'désactivé'} avec succès`,
        data: {
          provider,
          isEnabled: toggleDto.enable
        }
      };

    } catch (error) {
      this.logger.endOperation('toggleMfa', operationId, false);
      throw error;
    }
  }

  /**
   * DELETE /auth/mfa/:provider
   * Supprimer complètement une méthode MFA
   */
  @Delete(':provider')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ 
    name: 'provider', 
    enum: ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP', 'BACKUP_CODE'],
    description: 'Provider MFA à supprimer'
  })
  @ApiOperation({ 
    summary: 'Supprimer méthode MFA',
    description: 'Supprime complètement une méthode MFA et ses données'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Méthode MFA supprimée'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Méthode non trouvée'
  })
  async deleteMfa(
    @Param('provider') provider: MfaProvider,
    @Body() disableDto: MfaDisableDto,
    @CurrentUser() user: IUserProfile
  ) {
    const operationId = this.logger.startOperation('DELETE /auth/mfa/:provider', {
      userId: user.id,
      provider
    });

    try {
      // Vérifier code de confirmation si fourni
      if (disableDto.confirmationCode) {
        const isValid = await this.mfaService.verifyMfa({
          challengeToken: disableDto.challengeToken,
          method: provider,
          code: disableDto.confirmationCode,
          trustDevice: false
        });

        if (!isValid) {
          throw new BadRequestException('Code de confirmation invalide');
        }
      }

      const success = await this.mfaService.disableMfa(user.id, provider);

      if (!success) {
        throw new NotFoundException('Méthode MFA non configurée');
      }

      this.logger.endOperation('deleteMfa', operationId, true);

      return {
        success: true,
        message: `Méthode MFA ${provider} supprimée avec succès`,
        data: {
          provider,
          deletedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      this.logger.endOperation('deleteMfa', operationId, false);
      throw error;
    }
  }

  /**
   * POST /auth/mfa/backup-codes/regenerate
   * Régénérer les codes de récupération
   */
  @Post('backup-codes/regenerate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Régénérer codes de récupération',
    description: 'Génère de nouveaux codes de récupération (invalide les anciens)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Nouveaux codes générés'
  })
  async regenerateBackupCodes(
    @Body() regenerateDto: MfaRegenerateBackupCodesDto,
    @CurrentUser() user: IUserProfile
  ) {
    const operationId = this.logger.startOperation('POST /auth/mfa/backup-codes/regenerate', {
      userId: user.id
    });

    try {
      // Vérifier MFA pour action sensible
      const isValid = await this.mfaService.verifyMfa({
        challengeToken: regenerateDto.challengeToken,
        method: regenerateDto.verificationMethod,
        code: regenerateDto.verificationCode,
        trustDevice: false
      });

      if (!isValid) {
        throw new BadRequestException('Vérification MFA requise pour régénérer les codes');
      }

      const newCodes = await this.mfaService.regenerateBackupCodes(user.id);

      this.logger.endOperation('regenerateBackupCodes', operationId, true);

      return {
        success: true,
        message: 'Codes de récupération régénérés avec succès',
        data: {
          backupCodes: newCodes,
          generatedAt: new Date().toISOString(),
          warning: 'Conservez ces codes en lieu sûr. Les anciens codes ne sont plus valides.'
        }
      };

    } catch (error) {
      this.logger.endOperation('regenerateBackupCodes', operationId, false);
      throw error;
    }
  }

  /**
   * GET /auth/mfa/trusted-devices
   * Liste des appareils de confiance
   */
  @Get('trusted-devices')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Appareils de confiance',
    description: 'Liste des appareils marqués comme fiables'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des appareils de confiance'
  })
  async getTrustedDevices(
    @CurrentUser() user: IUserProfile
  ) {
    const operationId = this.logger.startOperation('GET /auth/mfa/trusted-devices', {
      userId: user.id
    });

    try {
      const devices = await this.mfaService.getTrustedDevices(user.id);

      this.logger.endOperation('getTrustedDevices', operationId, true);

      return {
        success: true,
        data: {
          devices: devices.map(device => ({
            id: device.id,
            deviceName: device.deviceName || 'Appareil inconnu',
            trustedAt: device.trustedAt,
            lastSeenAt: device.lastSeenAt,
            expiresAt: device.expiresAt,
            ipAddress: device.ipAddress,
            isCurrent: device.deviceFingerprint === this.getCurrentDeviceFingerprint(), // TODO: Implémenter
            isActive: device.isActive
          })),
          totalCount: devices.length
        }
      };

    } catch (error) {
      this.logger.endOperation('getTrustedDevices', operationId, false);
      throw error;
    }
  }

  /**
   * DELETE /auth/mfa/trusted-devices/:deviceId
   * Supprimer un appareil de confiance
   */
  @Delete('trusted-devices/:deviceId')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ 
    name: 'deviceId', 
    description: 'ID de l\'appareil à supprimer'
  })
  @ApiOperation({ 
    summary: 'Supprimer appareil de confiance',
    description: 'Révoque la confiance d\'un appareil'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Appareil supprimé'
  })
  async removeTrustedDevice(
    @Param('deviceId') deviceId: string,
    @CurrentUser() user: IUserProfile
  ) {
    const operationId = this.logger.startOperation('DELETE /auth/mfa/trusted-devices/:deviceId', {
      userId: user.id,
      deviceId
    });

    try {
      const success = await this.mfaService.removeTrustedDevice(user.id, deviceId);

      if (!success) {
        throw new NotFoundException('Appareil de confiance non trouvé');
      }

      this.logger.endOperation('removeTrustedDevice', operationId, true);

      return {
        success: true,
        message: 'Appareil de confiance supprimé avec succès',
        data: {
          deviceId,
          removedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      this.logger.endOperation('removeTrustedDevice', operationId, false);
      throw error;
    }
  }

  // ===================
  // MÉTHODES PRIVÉES
  // ===================

  /**
   * Nom d'affichage du provider
   */
  private getProviderDisplayName(provider: MfaProvider): string {
    const names = {
      'SMS_OTP': 'SMS',
      'EMAIL_OTP': 'Email',
      'TOTP_APP': 'Authenticator App',
      'BACKUP_CODE': 'Codes de récupération'
    };
    return names[provider] || provider;
  }

  /**
   * Description du provider
   */
  private getProviderDescription(provider: MfaProvider): string {
    const descriptions = {
      'SMS_OTP': 'Recevez des codes à 6 chiffres par SMS',
      'EMAIL_OTP': 'Recevez des codes à 6 chiffres par email',
      'TOTP_APP': 'Utilisez Google Authenticator, Authy ou similaire',
      'BACKUP_CODE': 'Codes à usage unique pour accès d\'urgence'
    };
    return descriptions[provider] || '';
  }

  /**
   * Temps de setup estimé
   */
  private getProviderSetupTime(provider: MfaProvider): number {
    const times = {
      'SMS_OTP': 2,
      'EMAIL_OTP': 1,
      'TOTP_APP': 5,
      'BACKUP_CODE': 1
    };
    return times[provider] || 2;
  }

  /**
   * Provider recommandé
   */
  private isProviderRecommended(provider: MfaProvider, available: MfaProvider[]): boolean {
    const recommended = this.getRecommendedProvider(available);
    return provider === recommended;
  }

  /**
   * Retourne le provider MFA recommandé
   */
  private getRecommendedProvider(availableProviders: MfaProvider[]): MfaProvider {
    const priorityOrder: MfaProvider[] = ['TOTP_APP', 'SMS_OTP', 'EMAIL_OTP', 'BACKUP_CODE'];
    
    for (const provider of priorityOrder) {
      if (availableProviders.includes(provider)) {
        return provider;
      }
    }

    return availableProviders[0] || 'TOTP_APP';
  }

  /**
   * Instructions de setup
   */
  private getSetupInstructions(provider: MfaProvider): string {
    const instructions = {
      'SMS_OTP': 'Vous recevrez des codes par SMS lors des connexions.',
      'EMAIL_OTP': 'Vous recevrez des codes par email lors des connexions.',
      'TOTP_APP': 'Scannez le QR code avec votre application d\'authentification.',
      'BACKUP_CODE': 'Conservez ces codes en lieu sûr pour accéder à votre compte.'
    };
    return instructions[provider] || 'Configuration MFA terminée avec succès.';
  }

  /**
   * Calcule le score de sécurité
   */
  private calculateSecurityScore(methods: MfaProvider[], trustedDevices: number): number {
    let score = 0;

    // Base selon nombre de méthodes
    score += methods.length * 25;

    // Bonus pour diversité des méthodes
    if (methods.includes('TOTP_APP')) score += 20;
    if (methods.includes('SMS_OTP')) score += 15;
    if (methods.includes('BACKUP_CODE')) score += 10;

    // Malus pour trop d'appareils de confiance
    if (trustedDevices > 3) score -= 10;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Génère des informations détaillées par méthode MFA
   */
  private generateMethodsInfo(providers: MfaProvider[], user: IUserProfile): Record<string, any> {
    const info: Record<string, any> = {};

    providers.forEach(provider => {
      switch (provider) {
        case 'SMS_OTP':
          info[provider] = {
            masked_phone: this.maskPhone(user.phone),
            estimated_delivery: '30 seconds',
            cost: 'Gratuit',
          };
          break;
        case 'EMAIL_OTP':
          info[provider] = {
            masked_email: this.maskEmail(user.email),
            estimated_delivery: '1 minute',
            cost: 'Gratuit',
          };
          break;
        case 'TOTP_APP':
          info[provider] = {
            app_name: 'Google Authenticator',
            setup_required: true, // TODO: Vérifier si setup requis
            offline_capable: true,
          };
          break;
        case 'BACKUP_CODE':
          info[provider] = {
            codes_remaining: 0, // TODO: Compter les codes restants
            single_use: true,
            recommendation: 'À utiliser uniquement en cas d\'urgence',
          };
          break;
      }
    });

    return info;
  }

  /**
   * Masque un numéro de téléphone
   */
  private maskPhone(phone?: string): string {
    if (!phone) return '+216***45678';
    if (phone.length < 8) return phone;
    return phone.slice(0, 4) + '***' + phone.slice(-4);
  }

  /**
   * Masque un email
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    const maskedLocal = local.length > 2 
      ? local[0] + '***' + local.slice(-1)
      : local;
    return `${maskedLocal}@${domain}`;
  }

  /**
   * TODO: Génère les tokens post-MFA
   */
  private async generatePostMfaTokens(userId: string): Promise<any> {
    // À implémenter selon le service de tokens existant
    return null;
  }

  /**
   * TODO: Récupère les infos de session
   */
  private async getSessionInfo(userId: string): Promise<any> {
    // À implémenter selon le service de session existant
    return null;
  }

  /**
   * TODO: Récupère l'empreinte de l'appareil actuel
   */
  private getCurrentDeviceFingerprint(): string {
    // À implémenter selon la logique d'empreinte existante
    return '';
  }
}