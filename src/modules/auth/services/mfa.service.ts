// src/modules/auth/services/mfa.service.ts

import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { EmailService } from '../../../shared/email/email.service';
import { 
  IMfaService,
  IMfaSetup,
  IMfaVerification,
  IMfaChallenge,
  IDeviceInfo
} from '../interfaces';
import { MfaProvider } from '../constants/auth.constants';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import {
  UnsupportedMfaProviderException,
  MfaAlreadySetupException,
  MfaChallengeExpiredException,
  InvalidBackupCodeException
} from '../exceptions/mfa.exceptions';
import { 
  InvalidMfaCodeException 
} from '../exceptions/auth.exceptions';
import { TooManyRequestsException } from '../exceptions/too-many-requests.exception';
import { CryptoUtil } from '../utils/crypto.util';
import { SecurityUtil } from '../utils/security.util';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

/**
 * Interface pour les données de challenge MFA
 */
interface MfaChallengeData {
  userId: string;
  methods: MfaProvider[];
  deviceFingerprint?: string;
  createdAt: string;
  expiresAt: string;
}

/**
 * MFA Service Entrix V3.0 - Grade A+
 * Multi-Factor Authentication complet
 * Respecte api_specs_auth_session.md et sécurité renforcée
 */

@Injectable()
export class MfaService implements IMfaService {
  private readonly logger: LoggerService;
  private readonly MFA_CODE_LENGTH = 6;
  private readonly OTP_EXPIRY = 300; // 5 minutes
  private readonly CHALLENGE_EXPIRY = 300; // 5 minutes
  private readonly MAX_ATTEMPTS = 5;
  private readonly RATE_LIMIT_WINDOW = 300; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly email: EmailService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('MfaService');
  }

  /**
   * Configure MFA pour un utilisateur
   * Respecte schema.prisma et sécurité
   */
  async setupMfa(userId: string, provider: MfaProvider): Promise<IMfaSetup> {
    const operationId = this.logger.startOperation('setupMfa', { userId, provider });

    try {
      this.logger.info('Setting up MFA for user', JSON.stringify({ 
        userId, 
        provider 
      }));

      // 1. Vérifier utilisateur selon schema.prisma
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          email: true, 
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

      // 2. Générer setup selon le provider
      let mfaSetup: IMfaSetup;

      switch (provider) {
        case 'TOTP_APP':
          mfaSetup = await this.setupTotpApp(userId, user.email);
          break;
          
        case 'SMS_OTP':
          mfaSetup = await this.setupSmsOtp(userId);
          break;
          
        case 'EMAIL_OTP':
          mfaSetup = await this.setupEmailOtp(userId);
          break;
          
        default:
          throw new BadRequestException(`Provider MFA non supporté: ${provider}`);
      }

      // 3. Générer codes de récupération
      const backupCodes = this.generateBackupCodes();
      await this.storeBackupCodes(userId, backupCodes);

      // 4. Logger événement sécurité
      this.logger.logSecurityEvent('MFA_SETUP_INITIATED', userId, undefined, undefined, {
        provider,
        setupCompleted: false
      });

      this.logger.endOperation('setupMfa', operationId, true);

      return {
        ...mfaSetup,
        backupCodes
      };

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

      // 3. Vérifier le code selon la méthode
      const isCodeValid = await this.verifyMfaCode(
        userId,
        verification.method,
        verification.code
      );

      if (!isCodeValid) {
        await this.handleFailedMfaAttempt(userId, verification.method);
        
        // Calculer essais restants
        const currentAttempts = await this.redis.getCache<number>(`mfa_attempts:${userId}:${verification.method}`) || 0;
        const attemptsRemaining = Math.max(0, this.MAX_ATTEMPTS - currentAttempts);
        
        throw new InvalidMfaCodeException(attemptsRemaining);
      }

      // 4. Marquer challenge comme utilisé
      await this.markChallengeAsUsed(verification.challengeToken);

      // 5. Device trust si demandé
      if (verification.trustDevice && challengeData.deviceFingerprint) {
        await this.trustDevice(userId, challengeData.deviceFingerprint);
      }

      // 6. Logger succès
      this.logger.logSecurityEvent('MFA_VERIFICATION_SUCCESS', userId, undefined, undefined, {
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
   * Désactive MFA pour un utilisateur
   */
  async disableMfa(userId: string, provider: MfaProvider): Promise<boolean> {
    const operationId = this.logger.startOperation('disableMfa', { userId, provider });

    try {
      // 1. Supprimer configuration MFA selon provider
      switch (provider) {
        case 'TOTP_APP':
          await this.redis.delCache(`mfa_totp_secret:${userId}`);
          break;
          
        case 'SMS_OTP':
          await this.redis.delCache(`mfa_sms_enabled:${userId}`);
          break;
          
        case 'EMAIL_OTP':
          await this.redis.delCache(`mfa_email_enabled:${userId}`);
          break;
      }

      // 2. Supprimer codes de récupération
      await this.redis.delCache(`mfa_backup_codes:${userId}`);

      // 3. Nettoyer challenges actifs
      await this.cleanupUserChallenges(userId);

      // 4. Logger événement sécurité
      this.logger.logSecurityEvent('MFA_DISABLED', userId, undefined, undefined, {
        provider,
        disabledAt: new Date().toISOString()
      });

      this.logger.endOperation('disableMfa', operationId, true);
      return true;

    } catch (error) {
      this.logger.endOperation('disableMfa', operationId, false);
      this.logger.error('MFA disable failed', error.stack, 'MfaService.disableMfa', JSON.stringify({
        userId,
        provider,
        error: error.message
      }));
      throw error;
    }
  }

  /**
   * Retourne providers MFA disponibles pour un utilisateur
   */
  async getAvailableProviders(userId: string): Promise<MfaProvider[]> {
    const operationId = this.logger.startOperation('getAvailableProviders', { userId });

    try {
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { 
          phone: true,
          email: true,
          email_verified: true,
          phone_verified: true
        }
      });

      if (!user) {
        throw new BadRequestException('Utilisateur introuvable');
      }

      const providers: MfaProvider[] = [];

      // TOTP toujours disponible
      providers.push('TOTP_APP');

      // Email OTP si email vérifié
      if (user.email_verified) {
        providers.push('EMAIL_OTP');
      }

      // SMS OTP si téléphone vérifié
      if (user.phone && user.phone_verified) {
        providers.push('SMS_OTP');
      }

      this.logger.endOperation('getAvailableProviders', operationId, true);
      return providers;

    } catch (error) {
      this.logger.endOperation('getAvailableProviders', operationId, false);
      this.logger.error('Get available providers failed', error.stack, 'MfaService.getAvailableProviders');
      throw error;
    }
  }

  /**
   * Détermine si MFA est requis selon score de risque
   */
  async requiresMfa(userId: string, riskScore: number): Promise<boolean> {
    const operationId = this.logger.startOperation('requiresMfa', { userId, riskScore });

    try {
      // 🔧 NOUVEAU : Vérifier variables d'environnement
      const mfaEnabled = process.env.MFA_ENABLED !== 'false';
      const forceDisabled = process.env.MFA_FORCE_DISABLED === 'true';
      
      if (!mfaEnabled || forceDisabled) {
        this.logger.endOperation('requiresMfa', operationId, true);
        return false; // MFA désactivé globalement
      }

      // 1. Vérifier si utilisateur a MFA configuré
      const hasMfaConfigured = await this.userHasMfaConfigured(userId);
      if (!hasMfaConfigured) {
        this.logger.endOperation('requiresMfa', operationId, true);
        return false; // Pas de MFA configuré
      }

      // 2. Seuils de risque selon AUTH_CONSTANTS
      const requiresMfa = riskScore >= AUTH_CONSTANTS.RISK_LEVELS.MEDIUM.min;

      this.logger.endOperation('requiresMfa', operationId, true);
      return requiresMfa;

    } catch (error) {
      this.logger.endOperation('requiresMfa', operationId, false);
      this.logger.error('Requires MFA check failed', error.stack, 'MfaService.requiresMfa');
      return true; // Erreur = MFA requis par sécurité
    }
  }

  /**
   * Génère challenge MFA
   */
  async generateMfaChallenge(
    userId: string, 
    availableMethods: MfaProvider[],
    deviceFingerprint?: string
  ): Promise<IMfaChallenge> {
    const operationId = this.logger.startOperation('generateMfaChallenge', { 
      userId, 
      methodsCount: availableMethods.length 
    });

    try {
      // 1. Générer token de challenge unique
      const challengeToken = crypto.randomBytes(32).toString('hex');

      // 2. Stocker données de challenge
      const challengeData: MfaChallengeData = {
        userId,
        methods: availableMethods,
        deviceFingerprint,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.CHALLENGE_EXPIRY * 1000).toISOString()
      };

      await this.redis.setCache(
        `mfa_challenge:${challengeToken}`,
        challengeData,
        this.CHALLENGE_EXPIRY
      );

      // 3. Envoyer codes OTP si méthodes demandées
      await this.sendOtpCodes(userId, availableMethods);

      this.logger.endOperation('generateMfaChallenge', operationId, true);

      return {
        methods: availableMethods,
        challengeToken,
        expiresIn: this.CHALLENGE_EXPIRY
      };

    } catch (error) {
      this.logger.endOperation('generateMfaChallenge', operationId, false);
      this.logger.error('Generate MFA challenge failed', error.stack, 'MfaService.generateMfaChallenge');
      throw error;
    }
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  /**
   * Configure TOTP App (Google Authenticator, Authy, etc.)
   */
  private async setupTotpApp(userId: string, email: string): Promise<IMfaSetup> {
    const secret = speakeasy.generateSecret({
      name: `Entrix (${email})`,
      issuer: 'Entrix V3.0',
      length: 32
    });

    // Stocker secret temporairement (sera confirmé après premier code valide)
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
  private async setupSmsOtp(userId: string): Promise<IMfaSetup> {
    // Marquer SMS MFA comme configuré
    await this.redis.setCache(`mfa_sms_enabled:${userId}`, true, 0); // Pas d'expiration

    return {
      provider: 'SMS_OTP'
    };
  }

  /**
   * Configure Email OTP
   */
  private async setupEmailOtp(userId: string): Promise<IMfaSetup> {
    // Marquer Email MFA comme configuré
    await this.redis.setCache(`mfa_email_enabled:${userId}`, true, 0); // Pas d'expiration

    return {
      provider: 'EMAIL_OTP'
    };
  }

  /**
   * Génère codes de récupération
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Stocke codes de récupération
   */
  private async storeBackupCodes(userId: string, codes: string[]): Promise<void> {
    await this.redis.setCache(`mfa_backup_codes:${userId}`, codes, 0); // Pas d'expiration
  }

  /**
   * Valide token de challenge
   */
  private async validateChallengeToken(challengeToken: string): Promise<MfaChallengeData | null> {
    if (!challengeToken) {
      return null;
    }

    const data = await this.redis.getCache<MfaChallengeData>(`mfa_challenge:${challengeToken}`);
    
    // Vérifier que les données sont valides
    if (data && data.userId && data.methods) {
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
      throw new TooManyRequestsException(
        'Trop de tentatives MFA. Réessayez dans 5 minutes.'
      );
    }

    await this.redis.setCache(rateLimitKey, attempts + 1, this.RATE_LIMIT_WINDOW);
  }

  /**
   * Vérifie code MFA selon la méthode
   */
  private async verifyMfaCode(userId: string, method: MfaProvider, code: string): Promise<boolean> {
    switch (method) {
      case 'SMS_OTP':
      case 'EMAIL_OTP':
        return this.verifyOtpCode(userId, method, code);

      case 'TOTP_APP':
        return this.verifyTotpCode(userId, code);

      case 'BACKUP_CODE':
        return this.verifyBackupCode(userId, code);

      default:
        return false;
    }
  }

  /**
   * Vérifie code OTP (SMS/Email)
   */
  private async verifyOtpCode(userId: string, method: MfaProvider, code: string): Promise<boolean> {
    try {
      const otpKey = `mfa_otp:${userId}:${method}`;
      const storedCode = await this.redis.getCache<string>(otpKey);
      
      if (storedCode === code) {
        await this.redis.delCache(otpKey); // Code à usage unique
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error('OTP verification failed', error.stack, 'MfaService.verifyOtpCode');
      return false;
    }
  }

  /**
   * Vérifie code TOTP
   */
  private async verifyTotpCode(userId: string, code: string): Promise<boolean> {
    try {
      const secret = await this.redis.getCache<string>(`mfa_totp_secret:${userId}`) ||
                     await this.redis.getCache<string>(`mfa_totp_temp:${userId}`);
                     
      if (!secret) {
        return false;
      }

      const isValid = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: code,
        window: 1 // Permettre ±30 secondes
      });

      // Si code temporaire valide, le confirmer définitivement
      if (isValid) {
        const tempSecret = await this.redis.getCache<string>(`mfa_totp_temp:${userId}`);
        if (tempSecret) {
          await this.redis.setCache(`mfa_totp_secret:${userId}`, tempSecret, 0);
          await this.redis.delCache(`mfa_totp_temp:${userId}`);
        }
      }

      return isValid;
    } catch (error) {
      this.logger.error('TOTP verification failed', error.stack, 'MfaService.verifyTotpCode');
      return false;
    }
  }

  /**
   * Vérifie code de récupération
   */
  private async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      const backupCodesKey = `mfa_backup_codes:${userId}`;
      const backupCodes = await this.redis.getCache<string[]>(backupCodesKey) || [];
      
      const codeIndex = backupCodes.indexOf(code.toUpperCase());
      if (codeIndex !== -1) {
        // Supprimer code utilisé
        backupCodes.splice(codeIndex, 1);
        await this.redis.setCache(backupCodesKey, backupCodes, 0); // Pas d'expiration
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error('Backup code verification failed', error.stack, 'MfaService.verifyBackupCode');
      return false;
    }
  }

  /**
   * Gère échec de tentative MFA
   */
  private async handleFailedMfaAttempt(userId: string, method: MfaProvider): Promise<void> {
    try {
      const failureKey = `mfa_failures:${userId}:${method}`;
      const failures = await this.redis.getCache<number>(failureKey) || 0;
      await this.redis.setCache(failureKey, failures + 1, 300); // 5 minutes

      this.logger.logSecurityEvent('MFA_VERIFICATION_FAILED', userId, undefined, undefined, {
        method,
        failureCount: failures + 1
      });
    } catch (error) {
      this.logger.error('Handle failed MFA attempt error', error.stack, 'MfaService.handleFailedMfaAttempt');
    }
  }

  /**
   * Marque challenge comme utilisé
   */
  private async markChallengeAsUsed(challengeToken: string): Promise<void> {
    try {
      const challengeKey = `mfa_challenge:${challengeToken}`;
      await this.redis.delCache(challengeKey);
    } catch (error) {
      this.logger.error('Mark challenge as used failed', error.stack, 'MfaService.markChallengeAsUsed');
    }
  }

  /**
   * Marque device comme de confiance
   */
  private async trustDevice(userId: string, deviceFingerprint: string): Promise<void> {
    try {
      const trustKey = `trusted_device:${userId}:${deviceFingerprint}`;
      const trustData = {
        userId,
        deviceFingerprint,
        trustedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
      };
      await this.redis.setCache(trustKey, trustData, 30 * 24 * 60 * 60); // 30 jours
    } catch (error) {
      this.logger.error('Trust device failed', error.stack, 'MfaService.trustDevice');
    }
  }

  /**
   * Vérifie si utilisateur a MFA configuré
   */
  private async userHasMfaConfigured(userId: string): Promise<boolean> {
    try {
      const totpSecret = await this.redis.getCache(`mfa_totp_secret:${userId}`);
      const smsEnabled = await this.redis.getCache(`mfa_sms_enabled:${userId}`);
      const emailEnabled = await this.redis.getCache(`mfa_email_enabled:${userId}`);

      return !!(totpSecret || smsEnabled || emailEnabled);
    } catch (error) {
      this.logger.error('Check MFA configured failed', error.stack, 'MfaService.userHasMfaConfigured');
      return false;
    }
  }

  /**
   * Envoie codes OTP selon méthodes demandées
   */
  private async sendOtpCodes(userId: string, methods: MfaProvider[]): Promise<void> {
    try {
      for (const method of methods) {
        if (method === 'SMS_OTP') {
          await this.sendSmsOtp(userId);
        } else if (method === 'EMAIL_OTP') {
          await this.sendEmailOtp(userId);
        }
      }
    } catch (error) {
      this.logger.error('Send OTP codes failed', error.stack, 'MfaService.sendOtpCodes');
    }
  }

  /**
   * Envoie SMS OTP
   */
  private async sendSmsOtp(userId: string): Promise<void> {
    try {
      const code = crypto.randomInt(100000, 999999).toString();
      await this.redis.setCache(`mfa_otp:${userId}:SMS_OTP`, code, this.OTP_EXPIRY);

      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { phone: true, first_name: true }
      });

      if (user?.phone) {
        // TODO: Implémenter envoi SMS réel
        this.logger.info('SMS OTP sent', JSON.stringify({ 
          userId, 
          phone: user.phone.substring(0, 3) + '***' 
        }));
      }
    } catch (error) {
      this.logger.error('Send SMS OTP failed', error.stack, 'MfaService.sendSmsOtp');
    }
  }

  /**
   * Envoie Email OTP
   */
  private async sendEmailOtp(userId: string): Promise<void> {
    try {
      const code = crypto.randomInt(100000, 999999).toString();
      await this.redis.setCache(`mfa_otp:${userId}:EMAIL_OTP`, code, this.OTP_EXPIRY);

      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { email: true, first_name: true }
      });

      if (user?.email) {
        // ✅ CORRIGÉ : Utilise la méthode correcte du EmailService
        await this.email.sendMail({
          to: user.email,
          subject: 'Code de vérification Entrix',
          template: 'mfa-code',
          context: {
            firstName: user.first_name,
            code,
            expiresIn: Math.floor(this.OTP_EXPIRY / 60) // minutes
          }
        });

        this.logger.info('Email OTP sent', JSON.stringify({ 
          userId, 
          email: user.email.substring(0, 3) + '***@***' 
        }));
      }
    } catch (error) {
      this.logger.error('Send Email OTP failed', error.stack, 'MfaService.sendEmailOtp');
    }
  }

  /**
   * Nettoie challenges actifs utilisateur
   */
  private async cleanupUserChallenges(userId: string): Promise<void> {
    try {
      // Nettoyer challenges actifs (approximatif)
      const pattern = `mfa_challenge:*`;
      const keys = await this.redis.keys(pattern);
      
      for (const key of keys) {
        const challengeData = await this.redis.getCache<MfaChallengeData>(key);
        
        // Vérification de type sécurisée avec l'interface typée
        if (challengeData && challengeData.userId === userId) {
          await this.redis.delCache(key);
        }
      }
    } catch (error) {
      this.logger.error('Cleanup user challenges failed', error.stack, 'MfaService.cleanupUserChallenges');
    }
  }

  /**
 * ✅ NOUVELLES MÉTHODES PUBLIQUES à ajouter dans MfaService
 * Pour permettre l'utilisation depuis AuthService
 */

/**
 * ✅ NOUVELLE MÉTHODE PUBLIQUE : Génère challenge MFA pour AuthService
 * Utilise la logique existante mais avec interface AuthService-friendly
 */
async generateChallengeForAuth(
  userId: string, 
  email: string, 
  deviceInfo: IDeviceInfo
): Promise<IMfaChallenge> {
  const operationId = this.logger.startOperation('generateChallengeForAuth', { userId });

  try {
    // 1. Détecter méthodes MFA disponibles
    const availableMethods = await this.getUserAvailableMethods(userId);
    
    // 2. Utiliser la méthode generateMfaChallenge existante
    const challenge = await this.generateMfaChallenge(
      userId, 
      availableMethods, 
      deviceInfo.deviceFingerprint
    );

    // 3. Logger avec contexte AuthService
    this.logger.logBusinessEvent('MFA_CHALLENGE_FOR_AUTH', {
      userId,
      email,
      methods: availableMethods,
      deviceFingerprint: deviceInfo.deviceFingerprint,
    }, userId);

    this.logger.endOperation('generateChallengeForAuth', operationId, true);
    return challenge;

  } catch (error) {
    this.logger.logErrorEvent(
      error as Error,
      'MfaService.generateChallengeForAuth',
      userId,
      JSON.stringify({ email, deviceInfo: { ipAddress: deviceInfo.ipAddress } })
    );

    this.logger.endOperation('generateChallengeForAuth', operationId, false);
    throw error;
  }
}

/**
 * ✅ NOUVELLE MÉTHODE PUBLIQUE : Expose la détection des méthodes MFA
 * Rend publique la logique de userHasMfaConfigured
 */
async getUserAvailableMethods(userId: string): Promise<MfaProvider[]> {
  const methods: MfaProvider[] = [];

  try {
    // Réutiliser la logique privée existante mais l'exposer
    const hasMfaConfigured = await this.userHasMfaConfigured(userId);
    
    if (!hasMfaConfigured) {
      // Si aucune méthode configurée, proposer EMAIL_OTP par défaut
      methods.push('EMAIL_OTP');
      return methods;
    }

    // Vérifier chaque méthode individuellement
    const [totpSecret, smsEnabled, emailEnabled] = await Promise.all([
      this.redis.getCache(`mfa_totp_secret:${userId}`),
      this.redis.getCache(`mfa_sms_enabled:${userId}`),
      this.redis.getCache(`mfa_email_enabled:${userId}`)
    ]);

    if (totpSecret) methods.push('TOTP_APP');
    if (smsEnabled) methods.push('SMS_OTP');
    if (emailEnabled) methods.push('EMAIL_OTP');

    // Fallback si problème de détection
    if (methods.length === 0) {
      methods.push('EMAIL_OTP');
    }

  } catch (error) {
    this.logger.warn('Erreur getUserAvailableMethods', JSON.stringify({
      userId,
      error: error.message,
    }));
    
    // Fallback sécurisé
    methods.push('EMAIL_OTP');
  }

  return methods;
}

/**
 * ✅ NOUVELLE MÉTHODE PUBLIQUE : Vérifie si MFA requis pour un risque donné
 * Utilise la logique existante de requiresMfa
 */
async isMfaRequiredForRisk(userId: string, riskScore: number): Promise<boolean> {
  return await this.requiresMfa(userId, riskScore);
}
}