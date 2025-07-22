// src/modules/auth/services/mfa.service.ts
/**
 * Service d'authentification multi-facteurs (MFA)
 * 
 * Responsabilités :
 * - Configuration TOTP (Google Authenticator, etc.)
 * - Envoi de codes par SMS et Email
 * - Génération et validation des codes MFA
 * - Gestion des codes de secours
 * - Activation/désactivation MFA par méthode
 * 
 * Sécurité :
 * - Codes à usage unique avec expiration
 * - Rate limiting sur les tentatives
 * - Chiffrement des secrets TOTP
 * - Invalidation automatique des codes utilisés
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import * as crypto from 'crypto';

// Services partagés (chemins corrigés)
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { EmailService } from '../../../shared/email/email.service';

// Types et interfaces
import { IMfaService } from '../../../common/interfaces/auth.interface';
import { MfaConfig, MfaToken, AuthContext } from '../../../common/types/auth.types';

// Enums Prisma
import { mfa_method } from '@prisma/client';

@Injectable()
export class MfaService implements IMfaService {
  private readonly logger: LoggerService;
  private readonly encryptionKey: string;
  private readonly issuerName: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
    logger: LoggerService,
  ) {
    this.logger = logger.createChildLogger('MfaService');
    this.encryptionKey = this.config.get<string>('MFA_ENCRYPTION_KEY') || crypto.randomBytes(32).toString('hex');
    this.issuerName = this.config.get<string>('MFA_ISSUER_NAME', 'Entrix');
  }

  /**
   * Activation MFA pour un utilisateur
   */
  async enableMfa(userId: string, method: mfa_method, config: Partial<MfaConfig>): Promise<MfaConfig> {
    this.logger.log(`Activation MFA ${method} pour utilisateur: ${userId}`);

    try {
      // Vérifier si l'utilisateur existe
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { 
          id: true,
          email: true,
          phone: true, // phone est dans la table users
          first_name: true,
          last_name: true,
        },
      });

      if (!user) {
        throw new BadRequestException('Utilisateur non trouvé');
      }

      let mfaConfig: MfaConfig;

      switch (method) {
        case 'TOTP':
          mfaConfig = await this.enableTotpMfa(userId, config);
          break;
        case 'SMS':
          if (!user.phone && !config.phoneNumber) {
            throw new BadRequestException('Numéro de téléphone requis pour SMS MFA');
          }
          mfaConfig = await this.enableSmsMfa(userId, config.phoneNumber || user.phone);
          break;
        case 'EMAIL':
          mfaConfig = await this.enableEmailMfa(userId, config.backupEmail || user.email);
          break;
        default:
          throw new BadRequestException(`Méthode MFA non supportée: ${method}`);
      }

      this.logger.log(`MFA ${method} activé avec succès pour: ${userId}`);
      return mfaConfig;

    } catch (error) {
      this.logger.error(`Erreur activation MFA ${method} pour ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Désactivation MFA
   */
  async disableMfa(userId: string, method?: mfa_method): Promise<void> {
    this.logger.log(`Désactivation MFA pour utilisateur: ${userId}, méthode: ${method || 'toutes'}`);

    try {
      const whereClause: any = { user_id: userId };
      if (method) {
        whereClause.method = method;
      }

      // Marquer les tokens comme utilisés (soft delete)
      await this.prisma.mfa_tokens.updateMany({
        where: whereClause,
        data: { 
          is_used: true,
          used_at: new Date(),
        },
      });

      // Supprimer du cache
      const cacheKey = method ? `mfa:${userId}:${method}` : `mfa:${userId}:*`;
      if (method) {
        await this.redis.del(cacheKey);
      } else {
        // Supprimer toutes les clés MFA pour cet utilisateur
        const methods: mfa_method[] = ['TOTP', 'SMS', 'EMAIL', 'APP_PUSH', 'HARDWARE_TOKEN', 'BIOMETRIC', 'BACKUP_CODES'];
        const deletePromises = methods.map(m => this.redis.del(`mfa:${userId}:${m}`));
        await Promise.all(deletePromises);
      }

      this.logger.log(`MFA désactivé pour: ${userId}`);

    } catch (error) {
      this.logger.error(`Erreur désactivation MFA pour ${userId}:`, error);
      throw new BadRequestException('Impossible de désactiver MFA');
    }
  }

  /**
   * Génération d'un token MFA
   */
  async generateMfaToken(userId: string, method: mfa_method): Promise<MfaToken> {
    this.logger.log(`Génération token MFA ${method} pour: ${userId}`);

    try {
      // Vérifier rate limiting
      await this.checkMfaRateLimit(userId, method);

      let token: string;
      let secret: string | undefined;
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      switch (method) {
        case 'TOTP':
          // Pour TOTP, pas de génération de token, utilisation du secret existant
          throw new BadRequestException('TOTP ne génère pas de tokens, utilisez verifyTotp()');
        
        case 'SMS':
        case 'EMAIL':
          token = this.generateNumericToken(6);
          break;
        
        default:
          token = this.generateAlphanumericToken(8);
      }

      // Hasher le token
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Sauvegarder en base
      const mfaToken = await this.prisma.mfa_tokens.create({
        data: {
          user_id: userId,
          method,
          token_hash: tokenHash,
          secret: secret ? this.encrypt(secret) : undefined,
          expires_at: expiresAt,
          is_used: false,
        },
      });

      // Envoyer le token selon la méthode
      if (method === 'SMS') {
        await this.sendSmsToken(userId, token);
      } else if (method === 'EMAIL') {
        await this.sendEmailToken(userId, token);
      }

      return this.mapToMfaToken(mfaToken, token);

    } catch (error) {
      this.logger.error(`Erreur génération token MFA ${method} pour ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Vérification d'un token MFA
   */
  async verifyMfaToken(userId: string, method: mfa_method, token: string): Promise<boolean> {
    this.logger.log(`Vérification token MFA ${method} pour: ${userId}`);

    try {
      if (method === 'TOTP') {
        return this.verifyTotp(userId, token);
      }

      // Hasher le token fourni
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Chercher le token en base
      const mfaToken = await this.prisma.mfa_tokens.findFirst({
        where: {
          user_id: userId,
          method,
          token_hash: tokenHash,
          is_used: false,
          expires_at: { gt: new Date() },
        },
      });

      if (!mfaToken) {
        this.logger.warn(`Token MFA invalide ou expiré pour ${userId}, méthode: ${method}`);
        return false;
      }

      // Marquer comme utilisé
      await this.prisma.mfa_tokens.update({
        where: { id: mfaToken.id },
        data: { 
          is_used: true,
          used_at: new Date(),
        },
      });

      this.logger.log(`Token MFA vérifié avec succès pour: ${userId}`);
      return true;

    } catch (error) {
      this.logger.error(`Erreur vérification token MFA ${method} pour ${userId}:`, error);
      return false;
    }
  }

  /**
   * Configuration TOTP
   */
  async setupTotp(userId: string): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
    this.logger.log(`Configuration TOTP pour: ${userId}`);

    try {
      // Récupérer les infos utilisateur
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { email: true, first_name: true, last_name: true },
      });

      if (!user) {
        throw new BadRequestException('Utilisateur non trouvé');
      }

      // Générer le secret TOTP
      const secret = speakeasy.generateSecret({
        name: `${user.first_name} ${user.last_name}`,
        account: user.email,
        issuer: this.issuerName,
        length: 32,
      });

      // Générer le QR code
      const qrCodeUrl = speakeasy.otpauthURL({
        secret: secret.ascii,
        label: user.email,
        issuer: this.issuerName,
        encoding: 'ascii',
      });

      const qrCode = await qrcode.toDataURL(qrCodeUrl);

      // Générer les codes de secours
      const backupCodes = this.generateBackupCodesArray();

      // Sauvegarder temporairement (sera activé lors de la vérification)
      await this.prisma.mfa_tokens.create({
        data: {
          user_id: userId,
          method: 'TOTP',
          token_hash: 'temp_setup', // Placeholder
          secret: this.encrypt(secret.base32),
          expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes pour setup
          is_used: false,
          metadata: JSON.stringify({ 
            backupCodes: backupCodes.map(code => crypto.createHash('sha256').update(code).digest('hex')),
            setupComplete: false,
          }),
        },
      });

      return {
        secret: secret.base32,
        qrCode,
        backupCodes,
      };

    } catch (error) {
      this.logger.error(`Erreur configuration TOTP pour ${userId}:`, error);
      throw new BadRequestException('Impossible de configurer TOTP');
    }
  }

  /**
   * Vérification TOTP
   */
  async verifyTotp(userId: string, token: string): Promise<boolean> {
    try {
      // Récupérer le secret TOTP
      const mfaConfig = await this.prisma.mfa_tokens.findFirst({
        where: {
          user_id: userId,
          method: 'TOTP',
          is_used: false,
        },
        orderBy: { created_at: 'desc' },
      });

      if (!mfaConfig || !mfaConfig.secret) {
        return false;
      }

      const secret = this.decrypt(mfaConfig.secret);

      // Vérifier le token TOTP avec window pour tolérer décalage d'horloge
      const verified = speakeasy.totp.verify({
        secret,
        token,
        encoding: 'base32',
        window: 2, // ±2 intervalles de 30 secondes
      });

      if (verified) {
        // Si c'est un setup en cours, marquer comme complet
        if (mfaConfig.token_hash === 'temp_setup') {
          await this.prisma.mfa_tokens.update({
            where: { id: mfaConfig.id },
            data: {
              token_hash: crypto.createHash('sha256').update(userId + 'totp_active').digest('hex'),
              metadata: JSON.stringify({
                ...JSON.parse(String(mfaConfig.metadata || '{}')),
                setupComplete: true,
                activatedAt: new Date().toISOString(),
              }),
            },
          });
        }

        this.logger.log(`TOTP vérifié avec succès pour: ${userId}`);
      }

      return verified;

    } catch (error) {
      this.logger.error(`Erreur vérification TOTP pour ${userId}:`, error);
      return false;
    }
  }

  /**
   * Génération de nouveaux codes de secours pour un utilisateur
   */
  async generateBackupCodes(userId: string): Promise<string[]> {
    this.logger.log(`Génération codes de secours pour: ${userId}`);

    try {
      const backupCodes = this.generateBackupCodesArray();

      // Sauvegarder les codes hashés
      await this.prisma.mfa_tokens.create({
        data: {
          user_id: userId,
          method: 'BACKUP_CODES',
          token_hash: 'backup_codes',
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
          is_used: false,
          metadata: JSON.stringify({
            codes: backupCodes.map(code => crypto.createHash('sha256').update(code).digest('hex')),
            generatedAt: new Date().toISOString(),
          }),
        },
      });

      return backupCodes;

    } catch (error) {
      this.logger.error(`Erreur génération codes de secours pour ${userId}:`, error);
      throw new BadRequestException('Impossible de générer les codes de secours');
    }
  }

  /**
   * Utilisation d'un code de secours
   */
  async useBackupCode(userId: string, code: string): Promise<boolean> {
    this.logger.log(`Utilisation code de secours pour: ${userId}`);

    try {
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');

      // Récupérer les codes de secours
      const backupCodesRecord = await this.prisma.mfa_tokens.findFirst({
        where: {
          user_id: userId,
          method: 'BACKUP_CODES',
          is_used: false,
        },
        orderBy: { created_at: 'desc' },
      });

      if (!backupCodesRecord?.metadata) {
        return false;
      }

      const metadata = JSON.parse(String(backupCodesRecord.metadata));
      const codes: string[] = metadata.codes || [];

      if (!codes.includes(codeHash)) {
        return false;
      }

      // Retirer le code utilisé
      const updatedCodes = codes.filter(c => c !== codeHash);
      
      await this.prisma.mfa_tokens.update({
        where: { id: backupCodesRecord.id },
        data: {
          metadata: JSON.stringify({
            ...metadata,
            codes: updatedCodes,
            lastUsed: new Date().toISOString(),
          }),
        },
      });

      this.logger.log(`Code de secours utilisé avec succès pour: ${userId}`);
      return true;

    } catch (error) {
      this.logger.error(`Erreur utilisation code de secours pour ${userId}:`, error);
      return false;
    }
  }

  /**
   * Obtenir la configuration MFA d'un utilisateur
   */
  async getUserMfaConfig(userId: string): Promise<MfaConfig | null> {
    try {
      const mfaTokens = await this.prisma.mfa_tokens.findMany({
        where: {
          user_id: userId,
          is_used: false,
          expires_at: { gt: new Date() },
        },
      });

      if (mfaTokens.length === 0) {
        return null;
      }

      // Retourner la configuration de la méthode principale (TOTP prioritaire)
      const totpConfig = mfaTokens.find(t => t.method === 'TOTP');
      const activeConfig = totpConfig || mfaTokens[0];

      return {
        method: activeConfig.method,
        enabled: true,
        secret: activeConfig.secret ? this.decrypt(activeConfig.secret) : undefined,
      };

    } catch (error) {
      this.logger.error(`Erreur récupération config MFA pour ${userId}:`, error);
      return null;
    }
  }

  /**
   * Vérifier si MFA est requis
   */
  async isMfaRequired(userId: string, context: Partial<AuthContext>): Promise<boolean> {
    try {
      // Vérifier si l'utilisateur a MFA activé
      const mfaConfig = await this.getUserMfaConfig(userId);
      return mfaConfig !== null;

    } catch (error) {
      this.logger.error(`Erreur vérification MFA requis pour ${userId}:`, error);
      return false;
    }
  }

  /**
   * Envoi de code par SMS
   */
  async sendSmsCode(userId: string, phoneNumber: string): Promise<void> {
    this.logger.log(`Envoi code SMS pour: ${userId}`);
    // TODO: Intégrer avec service SMS (Twilio, etc.)
    // Pour l'instant, on log le code (dev uniquement)
    this.logger.warn(`SMS MFA non implémenté. Code à envoyer au ${phoneNumber}`);
  }

  /**
   * Envoi de code par email
   */
  async sendEmailCode(userId: string, email: string): Promise<void> {
    this.logger.log(`Envoi code email pour: ${userId}`);
    // Le code est généré et envoyé dans generateMfaToken
  }

  // === MÉTHODES PRIVÉES ===

  /**
   * Activer MFA TOTP
   */
  private async enableTotpMfa(userId: string, config: Partial<MfaConfig>): Promise<MfaConfig> {
    const setupResult = await this.setupTotp(userId);
    return {
      method: 'TOTP',
      enabled: true,
      secret: setupResult.secret,
      qrCodeUrl: setupResult.qrCode,
      backupCodes: setupResult.backupCodes,
    };
  }

  /**
   * Activer MFA SMS
   */
  private async enableSmsMfa(userId: string, phoneNumber: string): Promise<MfaConfig> {
    return {
      method: 'SMS',
      enabled: true,
      phoneNumber,
    };
  }

  /**
   * Activer MFA Email
   */
  private async enableEmailMfa(userId: string, email: string): Promise<MfaConfig> {
    return {
      method: 'EMAIL',
      enabled: true,
      backupEmail: email,
    };
  }

  /**
   * Générer un token numérique
   */
  private generateNumericToken(length: number): string {
    let token = '';
    for (let i = 0; i < length; i++) {
      token += Math.floor(Math.random() * 10);
    }
    return token;
  }

  /**
   * Générer un token alphanumérique
   */
  private generateAlphanumericToken(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * Générer des codes de secours (méthode privée)
   */
  private generateBackupCodesArray(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(this.generateAlphanumericToken(8));
    }
    return codes;
  }

  /**
   * Chiffrer une donnée sensible
   */
  private encrypt(text: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Déchiffrer une donnée sensible
   */
  private decrypt(encryptedText: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Vérifier le rate limiting MFA
   */
  private async checkMfaRateLimit(userId: string, method: mfa_method): Promise<void> {
    const key = `mfa_rate_limit:${userId}:${method}`;
    const attempts = await this.redis.get(key);
    
    if (attempts && parseInt(attempts) >= 5) {
      throw new BadRequestException('Trop de tentatives MFA, réessayez dans 15 minutes');
    }
    
    await this.redis.set(key, (parseInt(attempts || '0') + 1).toString(), 900); // 15 minutes
  }

  /**
   * Envoyer token SMS
   */
  private async sendSmsToken(userId: string, token: string): Promise<void> {
    // TODO: Intégrer service SMS
    this.logger.log(`Code SMS ${token} à envoyer pour utilisateur ${userId}`);
  }

  /**
   * Envoyer token par email
   */
  private async sendEmailToken(userId: string, token: string): Promise<void> {
    try {
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { email: true, first_name: true },
      });

      if (user) {
        await this.email.sendMail({
          to: user.email,
          subject: 'Code de vérification Entrix',
          template: 'mfa-code',
          context: {
            firstName: user.first_name,
            code: token,
            expiresIn: '5 minutes',
          },
        });
      }
    } catch (error) {
      this.logger.error('Erreur envoi email MFA:', error);
    }
  }

  /**
   * Mapper vers MfaToken
   */
  private mapToMfaToken(dbToken: any, plainToken?: string): MfaToken {
    return {
      id: dbToken.id,
      userId: dbToken.user_id,
      method: dbToken.method,
      tokenHash: dbToken.token_hash,
      secret: dbToken.secret,
      expiresAt: dbToken.expires_at,
      isUsed: dbToken.is_used,
      metadata: dbToken.metadata ? JSON.parse(String(dbToken.metadata)) : undefined,
    };
  }

  /**
   * Crée un challenge MFA pour l'utilisateur
   */
  async createChallenge(userId: string, method: 'email' | 'sms' | 'totp'): Promise<{ challengeId: string; expiresIn: number }> {
    this.logger.log(`Création d'un challenge MFA ${method} pour l'utilisateur: ${userId}`);

    try {
      // Vérifier rate limiting
      await this.checkMfaRateLimit(userId, method as mfa_method);

      let challengeId: string;
      const expiresIn = 300; // 5 minutes

      switch (method) {
        case 'email':
          challengeId = await this.createEmailChallenge(userId);
          break;
        case 'sms':
          challengeId = await this.createSmsChallenge(userId);
          break;
        case 'totp':
          // TOTP n'a pas besoin de challenge, retourner un ID fictif
          challengeId = `totp_${userId}_${Date.now()}`;
          break;
        default:
          throw new BadRequestException(`Méthode MFA non supportée: ${method}`);
      }

      return {
        challengeId,
        expiresIn,
      };

    } catch (error) {
      this.logger.error(`Erreur création challenge MFA ${method} pour ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Vérifie un challenge MFA
   */
  async verifyChallenge(userId: string, code: string, method: 'email' | 'sms' | 'totp'): Promise<boolean> {
    this.logger.log(`Vérification challenge MFA ${method} pour l'utilisateur: ${userId}`);

    try {
      switch (method) {
        case 'email':
          return await this.verifyEmailChallenge(userId, code);
        case 'sms':
          return await this.verifySmsChallenge(userId, code);
        case 'totp':
          return await this.verifyTotp(userId, code);
        default:
          throw new BadRequestException(`Méthode MFA non supportée: ${method}`);
      }

    } catch (error) {
      this.logger.error(`Erreur vérification challenge MFA ${method} pour ${userId}:`, error);
      return false;
    }
  }

  /**
   * Crée un challenge email
   */
  private async createEmailChallenge(userId: string): Promise<string> {
    // Générer un token MFA pour email
    const mfaToken = await this.generateMfaToken(userId, 'EMAIL');
    
    // Récupérer l'email de l'utilisateur
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { email: true, first_name: true }
    });

    if (!user) {
      throw new BadRequestException('Utilisateur non trouvé');
    }

    // Envoyer l'email avec le code
    const token = this.generateNumericToken(6);
    
    await this.email.sendMail({
      to: user.email,
      subject: 'Code de vérification Entrix',
      template: 'mfa-email',
      context: {
        firstName: user.first_name,
        code: token,
        expiresIn: '5 minutes'
      }
    });

    // Stocker le token hashé dans Redis avec TTL
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await this.redis.set(`mfa:email:${userId}`, tokenHash, 300); // 5 minutes

    return mfaToken.id;
  }

  /**
   * Crée un challenge SMS
   */
  private async createSmsChallenge(userId: string): Promise<string> {
    // Générer un token MFA pour SMS
    const mfaToken = await this.generateMfaToken(userId, 'SMS');
    
    // Récupérer le téléphone de l'utilisateur
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { phone: true, first_name: true }
    });

    if (!user || !user.phone) {
      throw new BadRequestException('Numéro de téléphone non configuré');
    }

    // Générer et envoyer le code SMS
    const token = this.generateNumericToken(6);
    
    // TODO: Implémenter l'envoi SMS réel
    this.logger.log(`SMS MFA code for ${userId}: ${token} (not sent - SMS provider not configured)`);

    // Stocker le token hashé dans Redis avec TTL
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await this.redis.set(`mfa:sms:${userId}`, tokenHash, 300); // 5 minutes

    return mfaToken.id;
  }

  /**
   * Vérifie un challenge email
   */
  private async verifyEmailChallenge(userId: string, code: string): Promise<boolean> {
    const storedTokenHash = await this.redis.get(`mfa:email:${userId}`);
    
    if (!storedTokenHash) {
      return false; // Token expiré ou inexistant
    }

    const providedTokenHash = crypto.createHash('sha256').update(code).digest('hex');
    
    if (storedTokenHash === providedTokenHash) {
      // Supprimer le token utilisé
      await this.redis.del(`mfa:email:${userId}`);
      return true;
    }

    return false;
  }

  /**
   * Vérifie un challenge SMS
   */
  private async verifySmsChallenge(userId: string, code: string): Promise<boolean> {
    const storedTokenHash = await this.redis.get(`mfa:sms:${userId}`);
    
    if (!storedTokenHash) {
      return false; // Token expiré ou inexistant
    }

    const providedTokenHash = crypto.createHash('sha256').update(code).digest('hex');
    
    if (storedTokenHash === providedTokenHash) {
      // Supprimer le token utilisé
      await this.redis.del(`mfa:sms:${userId}`);
      return true;
    }

    return false;
  }
}