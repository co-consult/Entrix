
// src/modules/auth/services/mfa.service.ts

import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import * as crypto from 'crypto';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { EmailService } from '../../../shared/email/email.service';
import { MfaProvider } from '../constants/auth.constants';
import { MFA_CONSTANTS } from '../constants/mfa.constants';
import { IMfaService, IMfaSetup, IMfaVerification, IMfaChallenge, IMfaStats } from '../interfaces/mfa.interface';
import { security_level } from '@prisma/client';
import { 
  MfaChallengeExpiredException,
  MfaNotConfiguredException,
  MfaAlreadyConfiguredException,
} from '../exceptions/mfa.exceptions';

import { 
  InvalidMfaCodeException 
} from '../exceptions/auth.exceptions';

interface MfaChallengeData {
  userId: string;
  methods: MfaProvider[];
  deviceFingerprint?: string;
  createdAt: number;
}

/**
 * Service MFA complet Entrix V3.0
 * Respecte schema.prisma user_mfa_settings et mfa_tokens
 */
@Injectable()
export class MfaService implements IMfaService {
  private readonly logger: LoggerService;
  private readonly MAX_ATTEMPTS = 3;
  private readonly RATE_LIMIT_WINDOW = 5 * 60; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('MfaService');
  }

  /**
   * Configure une méthode MFA pour un utilisateur
   */
  async setupMfa(userId: string, provider: MfaProvider): Promise<IMfaSetup> {
    const operationId = this.logger.startOperation('setupMfa', { userId, provider });

    try {
      // 1. Vérifier utilisateur selon schema.prisma
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          email: true, 
          phone: true,
          first_name: true,
          last_name: true,
          is_active: true,
          email_verified: true
        }
      });

      if (!user) {
        throw new BadRequestException('Utilisateur introuvable');
      }

      if (!user.is_active) {
        throw new BadRequestException('Compte utilisateur inactif');
      }

      if (!user.email_verified) {
        throw new BadRequestException('Email non vérifié - vérification requise avant MFA');
      }

      // 2. Vérifier si méthode déjà configurée
      const existingConfig = await this.prisma.user_mfa_settings.findUnique({
        where: {
          user_id_method: {
            user_id: userId,
            method: this.mapProviderToMethod(provider)
          }
        }
      });

      if (existingConfig?.is_enabled) {
        throw new MfaAlreadyConfiguredException(provider);
      }

      // 3. Générer setup selon le provider
      let mfaSetup: IMfaSetup;

      switch (provider) {
        case 'TOTP_APP':
          mfaSetup = await this.setupTotpApp(userId, user.email);
          break;
          
        case 'SMS_OTP':
          if (!user.phone) {
            throw new BadRequestException('Numéro de téléphone requis pour SMS OTP');
          }
          mfaSetup = await this.setupSmsOtp(userId, user.phone);
          break;
          
        case 'EMAIL_OTP':
          mfaSetup = await this.setupEmailOtp(userId, user.email);
          break;

        case 'BACKUP_CODE':
          mfaSetup = await this.setupBackupCodes(userId);
          break;
          
        default:
          throw new BadRequestException(`Provider MFA non supporté: ${provider}`);
      }

      // 4. Logger événement sécurité
      await this.logSecurityEvent('MFA_SETUP_INITIATED', userId, {
        provider,
        setupCompleted: false
      });

      this.logger.endOperation('setupMfa', operationId, true);
      return mfaSetup;

    } catch (error) {
      this.logger.endOperation('setupMfa', operationId, false);
      this.logger.error('MFA setup failed', error.stack, 'MfaService.setupMfa', JSON.stringify({
        userId,
        provider,
        error: error.message
      }));
      throw error;
    }
  }

  /**
   * Vérifie code MFA avec sécurité renforcée
   */
  async verifyMfa(verification: IMfaVerification): Promise<boolean> {
    const operationId = this.logger.startOperation('verifyMfa', { 
      method: verification.method,
      hasChallengeToken: !!verification.challengeToken
    });

    try {
      // 1. Valider token de challenge
      const challengeData = await this.validateChallengeToken(verification.challengeToken);
      if (!challengeData) {
        throw new MfaChallengeExpiredException();
      }

      const { userId } = challengeData;

      // 2. Vérifier rate limiting
      await this.checkRateLimit(userId, verification.method);

      // 3. Vérifier que la méthode est configurée
      const mfaConfig = await this.prisma.user_mfa_settings.findUnique({
        where: {
          user_id_method: {
            user_id: userId,
            method: this.mapProviderToMethod(verification.method)
          }
        }
      });

      if (!mfaConfig?.is_enabled) {
        throw new MfaNotConfiguredException(verification.method);
      }

      // 4. Vérifier le code selon la méthode
      let isValid = false;

      switch (verification.method) {
        case 'TOTP_APP':
          isValid = await this.verifyTotpCode(userId, verification.code);
          break;
          
        case 'SMS_OTP':
          isValid = await this.verifySmsCode(userId, verification.code);
          break;
          
        case 'EMAIL_OTP':
          isValid = await this.verifyEmailCode(userId, verification.code);
          break;

        case 'BACKUP_CODE':
          isValid = await this.verifyBackupCode(userId, verification.code);
          break;
          
        default:
          throw new BadRequestException(`Méthode MFA non supportée: ${verification.method}`);
      }

      if (!isValid) {
        await this.incrementFailedAttempts(userId, verification.method);
        await this.logSecurityEvent('MFA_VERIFICATION_FAILED', userId, {
          method: verification.method,
          reason: 'invalid_code'
        });
        throw new InvalidMfaCodeException();
      }

      // 5. Marquer méthode comme utilisée
      await this.updateLastUsed(userId, verification.method);

      // 6. Gérer appareil de confiance si demandé
      if (verification.trustDevice && challengeData.deviceFingerprint) {
        await this.trustDevice(userId, challengeData.deviceFingerprint);
      }

      // 7. Nettoyer le challenge
      await this.redis.delCache(`mfa_challenge:${verification.challengeToken}`);

      await this.logSecurityEvent('MFA_VERIFICATION_SUCCESS', userId, {
        method: verification.method,
        deviceTrusted: !!verification.trustDevice
      });

      this.logger.endOperation('verifyMfa', operationId, true);
      return true;

    } catch (error) {
      this.logger.endOperation('verifyMfa', operationId, false);
      this.logger.error('MFA verification failed', error.stack, 'MfaService.verifyMfa', JSON.stringify({
        method: verification.method,
        error: error.message
      }));
      throw error;
    }
  }

  /**
   * Désactive une méthode MFA
   */
  async disableMfa(userId: string, provider: MfaProvider): Promise<boolean> {
    const operationId = this.logger.startOperation('disableMfa', { userId, provider });

    try {
      const method = this.mapProviderToMethod(provider);

      // Mettre à jour la configuration
      const updated = await this.prisma.user_mfa_settings.updateMany({
        where: {
          user_id: userId,
          method: method,
          is_enabled: true
        },
        data: {
          is_enabled: false,
          disabled_at: new Date(),
          updated_at: new Date()
        }
      });

      if (updated.count === 0) {
        throw new MfaNotConfiguredException(provider);
      }

      // Nettoyer les données liées
      switch (provider) {
        case 'TOTP_APP':
          await this.redis.delCache(`mfa_totp_secret:${userId}`);
          break;
        case 'BACKUP_CODE':
          await this.redis.delCache(`mfa_backup_codes:${userId}`);
          break;
      }

      // Révoquer tous les tokens MFA existants pour cette méthode
      await this.prisma.mfa_tokens.updateMany({
        where: {
          user_id: userId,
          method: method,
          is_used: false
        },
        data: {
          is_used: true,
          used_at: new Date()
        }
      });

      await this.logSecurityEvent('MFA_DISABLED', userId, { provider });

      this.logger.endOperation('disableMfa', operationId, true);
      return true;

    } catch (error) {
      this.logger.endOperation('disableMfa', operationId, false);
      throw error;
    }
  }

  /**
   * Retourne les providers MFA disponibles pour un utilisateur
   */
  async getAvailableProviders(userId: string): Promise<MfaProvider[]> {
    try {
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { phone: true, email_verified: true }
      });

      if (!user) {
        return [];
      }

      const providers: MfaProvider[] = [];

      // Email OTP toujours disponible si email vérifié
      if (user.email_verified) {
        providers.push('EMAIL_OTP');
      }

      // TOTP App toujours disponible
      providers.push('TOTP_APP');

      // SMS OTP si numéro de téléphone
      if (user.phone) {
        providers.push('SMS_OTP');
      }

      // Backup codes toujours disponibles
      providers.push('BACKUP_CODE');

      return providers;

    } catch (error) {
      this.logger.error('Failed to get available providers', error.stack);
      return ['EMAIL_OTP']; // Fallback sécurisé
    }
  }

  /**
   * Détermine si MFA est requis selon le score de risque
   */
  async requiresMfa(userId: string, riskScore: number): Promise<boolean> {
    try {
      // Vérifier si l'utilisateur a configuré MFA
      const hasMfaConfigured = await this.userHasMfaConfigured(userId);
      
      if (!hasMfaConfigured) {
        // Si pas de MFA configuré, requis si score > 50
        return riskScore > 50;
      }

      // Si MFA configuré, requis si score > 30
      return riskScore > 30;

    } catch (error) {
      this.logger.error('Failed to check MFA requirement', error.stack);
      // En cas d'erreur, être sécuritaire et demander MFA
      return true;
    }
  }

  /**
   * Génère un challenge MFA pour l'authentification
   */
  async generateMfaChallenge(userId: string, availableMethods: MfaProvider[], deviceFingerprint?: string): Promise<IMfaChallenge> {
    try {
      // Filtrer les méthodes réellement configurées
      const configuredMethods = await this.getConfiguredMethodsPrivate(userId);
      const methods = availableMethods.filter(method => configuredMethods.includes(method));

      if (methods.length === 0) {
        throw new MfaNotConfiguredException('Aucune méthode MFA configurée');
      }

      // Générer token de challenge
      const challengeToken = crypto.randomBytes(32).toString('hex');
      const expiresIn = MFA_CONSTANTS.PROVIDERS.EMAIL_OTP.validity_duration;

      // Stocker challenge data
      const challengeData: MfaChallengeData = {
        userId,
        methods,
        deviceFingerprint,
        createdAt: Date.now()
      };

      await this.redis.setCache(
        `mfa_challenge:${challengeToken}`,
        challengeData,
        expiresIn
      );

      return {
        methods,
        challengeToken,
        expiresIn
      };

    } catch (error) {
      this.logger.error('Failed to generate MFA challenge', error.stack);
      throw error;
    }
  }

  // ===================
  // MÉTHODES PRIVÉES
  // ===================

  /**
   * Configure TOTP App
   */
  private async setupTotpApp(userId: string, email: string): Promise<IMfaSetup> {
    const secret = speakeasy.generateSecret({
      name: `Entrix (${email})`,
      issuer: MFA_CONSTANTS.TOTP.ISSUER,
      length: MFA_CONSTANTS.TOTP.SECRET_LENGTH
    });

    // Stocker temporairement le secret (sera confirmé après premier code valide)
    await this.redis.setCache(`mfa_totp_temp:${userId}`, secret.base32, 900); // 15 minutes

    // Générer QR Code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url || '');

    return {
      provider: 'TOTP_APP',
      secret: secret.base32,
      qrCode: qrCodeUrl
    };
  }

  /**
   * Configure SMS OTP
   */
  private async setupSmsOtp(userId: string, phone: string): Promise<IMfaSetup> {
    // Créer/mettre à jour la configuration
    await this.prisma.user_mfa_settings.upsert({
      where: {
        user_id_method: {
          user_id: userId,
          method: 'SMS'
        }
      },
      update: {
        is_enabled: true,
        backup_phone: phone,
        enabled_at: new Date(),
        updated_at: new Date()
      },
      create: {
        user_id: userId,
        method: 'SMS',
        is_enabled: true,
        backup_phone: phone,
        enabled_at: new Date()
      }
    });

    return {
      provider: 'SMS_OTP'
    };
  }

  /**
   * Configure Email OTP
   */
  private async setupEmailOtp(userId: string, email: string): Promise<IMfaSetup> {
    // Créer/mettre à jour la configuration
    await this.prisma.user_mfa_settings.upsert({
      where: {
        user_id_method: {
          user_id: userId,
          method: 'EMAIL'
        }
      },
      update: {
        is_enabled: true,
        enabled_at: new Date(),
        updated_at: new Date()
      },
      create: {
        user_id: userId,
        method: 'EMAIL',
        is_enabled: true,
        enabled_at: new Date()
      }
    });

    return {
      provider: 'EMAIL_OTP'
    };
  }

  /**
   * Configure Backup Codes
   */
  private async setupBackupCodes(userId: string): Promise<IMfaSetup> {
    const codes = this.generateBackupCodes();

    // Stocker les codes de récupération
    await this.redis.setCache(`mfa_backup_codes:${userId}`, codes, 0); // Pas d'expiration

    // Créer/mettre à jour la configuration
    await this.prisma.user_mfa_settings.upsert({
      where: {
        user_id_method: {
          user_id: userId,
          method: 'BACKUP_CODES'
        }
      },
      update: {
        is_enabled: true,
        backup_codes_count: codes.length,
        enabled_at: new Date(),
        updated_at: new Date()
      },
      create: {
        user_id: userId,
        method: 'BACKUP_CODES',
        is_enabled: true,
        backup_codes_count: codes.length,
        enabled_at: new Date()
      }
    });

    return {
      provider: 'BACKUP_CODE',
      backupCodes: codes
    };
  }

  /**
   * Vérifie code TOTP
   */
  private async verifyTotpCode(userId: string, code: string): Promise<boolean> {
    // Récupérer le secret
    let secret = await this.redis.getCache<string>(`mfa_totp_secret:${userId}`);
    
    if (!secret) {
      // Vérifier si c'est un setup en cours
      secret = await this.redis.getCache<string>(`mfa_totp_temp:${userId}`);
      if (!secret) {
        return false;
      }
    }

    // Vérifier le code TOTP
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: MFA_CONSTANTS.TOTP.WINDOW,
      step: MFA_CONSTANTS.TOTP.STEP
    });

    if (verified) {
      // Si c'était un setup temporaire, le confirmer
      const tempSecret = await this.redis.getCache<string>(`mfa_totp_temp:${userId}`);
      if (tempSecret) {
        await this.confirmTotpSetup(userId, tempSecret);
        await this.redis.delCache(`mfa_totp_temp:${userId}`);
      }
    }

    return verified;
  }

  /**
   * Vérifie code SMS
   */
  private async verifySmsCode(userId: string, code: string): Promise<boolean> {
    const storedToken = await this.prisma.mfa_tokens.findFirst({
      where: {
        user_id: userId,
        method: 'SMS',
        is_used: false,
        expires_at: {
          gt: new Date()
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (!storedToken) {
      return false;
    }

    // Vérifier le hash du code
    const codeHash = this.hashCode(code);
    const isValid = storedToken.token_hash === codeHash;

    if (isValid) {
      // Marquer le token comme utilisé
      await this.prisma.mfa_tokens.update({
        where: { id: storedToken.id },
        data: {
          is_used: true,
          used_at: new Date()
        }
      });
    }

    return isValid;
  }

  /**
   * Vérifie code Email
   */
  private async verifyEmailCode(userId: string, code: string): Promise<boolean> {
    const storedToken = await this.prisma.mfa_tokens.findFirst({
      where: {
        user_id: userId,
        method: 'EMAIL',
        is_used: false,
        expires_at: {
          gt: new Date()
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (!storedToken) {
      return false;
    }

    // Vérifier le hash du code
    const codeHash = this.hashCode(code);
    const isValid = storedToken.token_hash === codeHash;

    if (isValid) {
      // Marquer le token comme utilisé
      await this.prisma.mfa_tokens.update({
        where: { id: storedToken.id },
        data: {
          is_used: true,
          used_at: new Date()
        }
      });
    }

    return isValid;
  }

  /**
   * Vérifie code de récupération
   */
  private async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const storedCodes = await this.redis.getCache<string[]>(`mfa_backup_codes:${userId}`);
    
    if (!storedCodes || !storedCodes.includes(code.toUpperCase())) {
      return false;
    }

    // Retirer le code utilisé
    const remainingCodes = storedCodes.filter(c => c !== code.toUpperCase());
    await this.redis.setCache(`mfa_backup_codes:${userId}`, remainingCodes, 0);

    // Mettre à jour le compteur
    await this.prisma.user_mfa_settings.updateMany({
      where: {
        user_id: userId,
        method: 'BACKUP_CODES'
      },
      data: {
        backup_codes_count: remainingCodes.length
      }
    });

    return true;
  }

  /**
   * Confirme le setup TOTP
   */
  private async confirmTotpSetup(userId: string, secret: string): Promise<void> {
    // Stocker le secret de façon permanente
    await this.redis.setCache(`mfa_totp_secret:${userId}`, secret, 0);

    // Créer/mettre à jour la configuration
    await this.prisma.user_mfa_settings.upsert({
      where: {
        user_id_method: {
          user_id: userId,
          method: 'TOTP'
        }
      },
      update: {
        is_enabled: true,
        totp_secret: secret, // Chiffré en base
        enabled_at: new Date(),
        updated_at: new Date()
      },
      create: {
        user_id: userId,
        method: 'TOTP',
        is_enabled: true,
        totp_secret: secret,
        enabled_at: new Date()
      }
    });
  }

  /**
   * Génère codes de récupération
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < MFA_CONSTANTS.BACKUP_CODES.COUNT; i++) {
      const code = crypto.randomBytes(MFA_CONSTANTS.BACKUP_CODES.LENGTH / 2)
        .toString('hex')
        .toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Hash d'un code pour stockage sécurisé
   */
  private hashCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Valide token de challenge
   */
  private async validateChallengeToken(challengeToken: string): Promise<MfaChallengeData | null> {
    if (!challengeToken) {
      return null;
    }

    const data = await this.redis.getCache<MfaChallengeData>(`mfa_challenge:${challengeToken}`);
    
    if (data?.userId && data?.methods) {
      return data;
    }
    
    return null;
  }

  /**
   * Vérifie rate limiting pour MFA
   */
  private async checkRateLimit(userId: string, method: MfaProvider): Promise<void> {
    const rateLimitKey = `mfa_attempts:${userId}:${method}`;
    const attempts = await this.redis.getCache<number>(rateLimitKey) || 0;

    if (attempts >= this.MAX_ATTEMPTS) {
      throw new BadRequestException(
        'Trop de tentatives MFA. Réessayez dans 5 minutes.'
      );
    }
  }

  /**
   * Incrémente les tentatives échouées
   */
  private async incrementFailedAttempts(userId: string, method: MfaProvider): Promise<void> {
    const rateLimitKey = `mfa_attempts:${userId}:${method}`;
    const current = await this.redis.getCache<number>(rateLimitKey) || 0;
    await this.redis.setCache(rateLimitKey, current + 1, this.RATE_LIMIT_WINDOW);
  }

  /**
   * Met à jour la dernière utilisation
   */
  private async updateLastUsed(userId: string, provider: MfaProvider): Promise<void> {
    await this.prisma.user_mfa_settings.updateMany({
      where: {
        user_id: userId,
        method: this.mapProviderToMethod(provider)
      },
      data: {
        last_used_at: new Date()
      }
    });
  }

  /**
   * Active une méthode MFA
   */
  async enableMfa(userId: string, provider: MfaProvider): Promise<boolean> {
    const operationId = this.logger.startOperation('enableMfa', { userId, provider });

    try {
      const result = await this.prisma.user_mfa_settings.updateMany({
        where: {
          user_id: userId,
          method: this.mapProviderToMethod(provider)
        },
        data: {
          is_enabled: true,
          enabled_at: new Date(),
          updated_at: new Date()
        }
      });

      this.logger.endOperation('enableMfa', operationId, true);
      return result.count > 0;

    } catch (error) {
      this.logger.endOperation('enableMfa', operationId, false);
      throw error;
    }
  }

  /**
   * Régénère les codes de récupération
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const operationId = this.logger.startOperation('regenerateBackupCodes', { userId });

    try {
      const newCodes = this.generateBackupCodes();
      
      // Stocker les nouveaux codes
      await this.redis.setCache(`mfa_backup_codes:${userId}`, newCodes, 0);
      
      // Mettre à jour le compteur
      await this.prisma.user_mfa_settings.updateMany({
        where: {
          user_id: userId,
          method: 'BACKUP_CODES'
        },
        data: {
          backup_codes_count: newCodes.length,
          updated_at: new Date()
        }
      });

      this.logger.endOperation('regenerateBackupCodes', operationId, true);
      return newCodes;

    } catch (error) {
      this.logger.endOperation('regenerateBackupCodes', operationId, false);
      throw error;
    }
  }

  /**
   * Compte les appareils de confiance
   */
  async getTrustedDevicesCount(userId: string): Promise<number> {
    try {
      return await this.prisma.user_trusted_devices.count({
        where: {
          user_id: userId,
          is_active: true,
          expires_at: {
            gt: new Date()
          }
        }
      });
    } catch (error) {
      this.logger.error('Failed to count trusted devices', error.stack);
      return 0;
    }
  }

  /**
   * Obtient la méthode MFA primaire
   */
  async getPrimaryMethod(userId: string): Promise<MfaProvider | null> {
    try {
      const primarySetting = await this.prisma.user_mfa_settings.findFirst({
        where: {
          user_id: userId,
          is_enabled: true,
          is_primary: true
        },
        select: {
          method: true
        }
      });

      return primarySetting ? this.mapMethodToProvider(primarySetting.method) : null;
    } catch (error) {
      this.logger.error('Failed to get primary method', error.stack);
      return null;
    }
  }

  /**
   * Obtient la date de dernière utilisation MFA
   */
  async getLastUsedDate(userId: string): Promise<Date | null> {
    try {
      const lastUsed = await this.prisma.user_mfa_settings.findFirst({
        where: {
          user_id: userId,
          is_enabled: true,
          last_used_at: {
            not: null
          }
        },
        select: {
          last_used_at: true
        },
        orderBy: {
          last_used_at: 'desc'
        }
      });

      return lastUsed?.last_used_at || null;
    } catch (error) {
      this.logger.error('Failed to get last used date', error.stack);
      return null;
    }
  }

  /**
   * Obtient la liste des appareils de confiance
   */
  async getTrustedDevices(userId: string): Promise<any[]> {
    try {
      const devices = await this.prisma.user_trusted_devices.findMany({
        where: {
          user_id: userId,
          is_active: true
        },
        orderBy: {
          last_seen_at: 'desc'
        }
      });

      return devices;
    } catch (error) {
      this.logger.error('Failed to get trusted devices', error.stack);
      return [];
    }
  }

  /**
   * Supprime un appareil de confiance
   */
  async removeTrustedDevice(userId: string, deviceId: string): Promise<boolean> {
    const operationId = this.logger.startOperation('removeTrustedDevice', { userId, deviceId });

    try {
      const result = await this.prisma.user_trusted_devices.updateMany({
        where: {
          id: deviceId,
          user_id: userId
        },
        data: {
          is_active: false
        }
      });

      const success = result.count > 0;
      this.logger.endOperation('removeTrustedDevice', operationId, success);
      return success;

    } catch (error) {
      this.logger.endOperation('removeTrustedDevice', operationId, false);
      throw error;
    }
  }

  /**
   * Obtient le nombre de codes de récupération restants
   */
  async getBackupCodesCount(userId: string): Promise<number> {
    try {
      const codes = await this.redis.getCache<string[]>(`mfa_backup_codes:${userId}`);
      return codes ? codes.length : 0;
    } catch (error) {
      this.logger.error('Failed to get backup codes count', error.stack);
      return 0;
    }
  }

  /**
   * Obtient les statistiques MFA d'un utilisateur
   */
  async getMfaStats(userId: string): Promise<IMfaStats> {
    const operationId = this.logger.startOperation('getMfaStats', { userId });

    try {
      // Compter les vérifications récentes
      const [totalVerifications, successfulVerifications] = await Promise.all([
        this.prisma.mfa_tokens.count({
          where: {
            user_id: userId,
            created_at: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 jours
            }
          }
        }),
        this.prisma.mfa_tokens.count({
          where: {
            user_id: userId,
            is_used: true,
            created_at: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ]);

      const failedVerifications = totalVerifications - successfulVerifications;

      // Obtenir la dernière vérification réussie
      const lastSuccessful = await this.prisma.user_mfa_settings.findFirst({
        where: {
          user_id: userId,
          last_used_at: { not: null }
        },
        select: { last_used_at: true },
        orderBy: { last_used_at: 'desc' }
      });

      // Obtenir les statistiques par méthode
      const methodUsage = await this.prisma.user_mfa_settings.findMany({
        where: {
          user_id: userId,
          is_enabled: true
        },
        select: { method: true }
      });

      const methodUsageStats: Record<MfaProvider, number> = {
        'SMS_OTP': 0,
        'EMAIL_OTP': 0,
        'TOTP_APP': 0,
        'BACKUP_CODE': 0
      };

      methodUsage.forEach(usage => {
        const provider = this.mapMethodToProvider(usage.method);
        methodUsageStats[provider] = 1;
      });

      // Méthode la plus utilisée
      const mostUsedMethod = Object.entries(methodUsageStats)
        .reduce((a, b) => methodUsageStats[a[0] as MfaProvider] > methodUsageStats[b[0] as MfaProvider] ? a : b)[0] as MfaProvider;

      // Statistiques des appareils de confiance (approximation)
      const trustedDevicesHistory = {
        added: await this.prisma.user_trusted_devices.count({
          where: {
            user_id: userId,
            created_at: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        }),
        removed: 0, // Difficile à calculer sans audit trail
        expired: await this.prisma.user_trusted_devices.count({
          where: {
            user_id: userId,
            expires_at: {
              lt: new Date()
            }
          }
        })
      };

      this.logger.endOperation('getMfaStats', operationId, true);

      return {
        totalVerifications,
        successfulVerifications,
        failedVerifications,
        lastSuccessfulVerification: lastSuccessful?.last_used_at || undefined,
        mostUsedMethod,
        methodUsageStats,
        trustedDevicesHistory
      };

    } catch (error) {
      this.logger.endOperation('getMfaStats', operationId, false);
      this.logger.error('Failed to get MFA stats', error.stack);
      
      // Retourner des statistiques par défaut en cas d'erreur
      return {
        totalVerifications: 0,
        successfulVerifications: 0,
        failedVerifications: 0,
        mostUsedMethod: 'EMAIL_OTP',
        methodUsageStats: {
          'SMS_OTP': 0,
          'EMAIL_OTP': 0,
          'TOTP_APP': 0,
          'BACKUP_CODE': 0
        },
        trustedDevicesHistory: {
          added: 0,
          removed: 0,
          expired: 0
        }
      };
    }
  }

  /**
   * Envoie un code par email
   */
  async sendEmailCode(userId: string): Promise<boolean> {
    const operationId = this.logger.startOperation('sendEmailCode', { userId });

    try {
      // Récupérer l'email de l'utilisateur
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { 
          email: true, 
          first_name: true,
          email_verified: true 
        }
      });

      if (!user || !user.email_verified) {
        throw new BadRequestException('Email utilisateur non vérifié');
      }

      // Générer et hasher le code
      const code = crypto.randomInt(100000, 999999).toString();
      const hashedCode = this.hashCode(code);

      // Stocker le token en base
      await this.prisma.mfa_tokens.create({
        data: {
          user_id: userId,
          method: 'EMAIL',
          token_hash: hashedCode,
          expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          metadata: {
            email: user.email
          }
        }
      });

      // Envoyer l'email
      const result = await this.emailService.sendEmail({
        to: user.email,
        subject: 'Entrix - Code de vérification MFA',
        template: 'mfa-code',
        context: {
          firstName: user.first_name,
          code,
          expirationMinutes: 10
        }
      }, true);

      const success = result.success;

      this.logger.endOperation('sendEmailCode', operationId, success);
      return true;

    } catch (error) {
      this.logger.endOperation('sendEmailCode', operationId, false);
      this.logger.error('Failed to send email code', error.stack);
      throw error;
    }
  }

  /**
   * Nettoie les tokens MFA expirés
   */
  async cleanupExpiredTokens(): Promise<number> {
    const operationId = this.logger.startOperation('cleanupExpiredTokens');

    try {
      const result = await this.prisma.mfa_tokens.deleteMany({
        where: {
          expires_at: {
            lt: new Date()
          }
        }
      });

      this.logger.endOperation('cleanupExpiredTokens', operationId, true, undefined, {
        deletedCount: result.count
      });

      return result.count;

    } catch (error) {
      this.logger.endOperation('cleanupExpiredTokens', operationId, false);
      this.logger.error('Failed to cleanup expired tokens', error.stack);
      return 0;
    }
  }

  /**
   * Nettoie les appareils de confiance expirés
   */
  async cleanupExpiredTrustedDevices(): Promise<number> {
    const operationId = this.logger.startOperation('cleanupExpiredTrustedDevices');

    try {
      const result = await this.prisma.user_trusted_devices.updateMany({
        where: {
          expires_at: {
            lt: new Date()
          },
          is_active: true
        },
        data: {
          is_active: false
        }
      });

      this.logger.endOperation('cleanupExpiredTrustedDevices', operationId, true, undefined, {
        deactivatedCount: result.count
      });

      return result.count;

    } catch (error) {
      this.logger.endOperation('cleanupExpiredTrustedDevices', operationId, false);
      this.logger.error('Failed to cleanup expired trusted devices', error.stack);
      return 0;
    }
  }

  /**
   * Fait confiance à un appareil
   */
  private async trustDevice(userId: string, deviceFingerprint: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 jours

    await this.prisma.user_trusted_devices.upsert({
      where: {
        user_id_device_fingerprint: {
          user_id: userId,
          device_fingerprint: deviceFingerprint
        }
      },
      update: {
        trusted_at: new Date(),
        expires_at: expiresAt,
        last_seen_at: new Date(),
        is_active: true
      },
      create: {
        user_id: userId,
        device_fingerprint: deviceFingerprint,
        expires_at: expiresAt,
        is_active: true
      }
    });
  }

  /**
   * Vérifie si l'utilisateur a configuré MFA
   */
  private async userHasMfaConfigured(userId: string): Promise<boolean> {
    const count = await this.prisma.user_mfa_settings.count({
      where: {
        user_id: userId,
        is_enabled: true
      }
    });

    return count > 0;
  }

  /**
   * Retourne les méthodes configurées (version publique)
   */
  async getConfiguredMethods(userId: string): Promise<MfaProvider[]> {
    try {
      const settings = await this.prisma.user_mfa_settings.findMany({
        where: {
          user_id: userId,
          is_enabled: true
        },
        select: {
          method: true
        }
      });

      return settings.map(s => this.mapMethodToProvider(s.method));
    } catch (error) {
      this.logger.error('Failed to get configured methods', error.stack);
      return [];
    }
  }

  /**
   * Retourne les méthodes configurées (version privée pour usage interne)
   */
  private async getConfiguredMethodsPrivate(userId: string): Promise<MfaProvider[]> {
    return this.getConfiguredMethods(userId);
  }

  /**
   * Mappe provider vers method enum
   */
  private mapProviderToMethod(provider: MfaProvider): any {
    const mapping = {
      'SMS_OTP': 'SMS',
      'EMAIL_OTP': 'EMAIL',
      'TOTP_APP': 'TOTP',
      'BACKUP_CODE': 'BACKUP_CODES'
    };
    return mapping[provider];
  }

  /**
   * Mappe method enum vers provider
   */
  private mapMethodToProvider(method: any): MfaProvider {
    const mapping = {
      'SMS': 'SMS_OTP',
      'EMAIL': 'EMAIL_OTP',
      'TOTP': 'TOTP_APP',
      'BACKUP_CODES': 'BACKUP_CODE'
    };
    return mapping[method] || 'EMAIL_OTP';
  }

  /**
   * Log événement sécurité
   */
  private async logSecurityEvent(eventType: string, userId: string, metadata: any): Promise<void> {
    try {
      await this.prisma.security_events.create({
        data: {
          event_type: eventType,
          severity: security_level.STANDARD,
          target_user_id: userId,
          description: `MFA event: ${eventType}`,
          event_data: metadata,
          status: 'OPEN'
        }
      });
    } catch (error) {
      this.logger.error('Failed to log security event', error.stack);
    }
  }
}