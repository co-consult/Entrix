// src/modules/auth/services/device.service.ts

import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { EmailService } from '../../../shared/email/email.service';
import { 
  IDeviceInfo, 
  IUserSession 
} from '../interfaces';
import { DeviceUtil } from '../utils/device.util';
import { SecurityUtil } from '../utils/security.util';
import { AUTH_CONSTANTS, SECURITY_CONSTANTS } from '../constants';
import { 
  DeviceNotTrustedException,
  SuspiciousActivityException
} from '../exceptions';

/**
 * Device Service Entrix V3.0 - Grade A+
 * Gestion des appareils de confiance et fingerprinting
 * Respecte schema.prisma exact et sécurité renforcée
 */

@Injectable()
export class DeviceService {
  private readonly logger: LoggerService;
  private readonly TRUSTED_DEVICE_TTL = 30 * 24 * 60 * 60; // 30 jours en secondes

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly email: EmailService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('DeviceService');
  }

  /**
   * Vérifie si un device est de confiance pour un utilisateur
   * Cache Redis avec fallback base de données
   */
  async isDeviceTrusted(userId: string, deviceFingerprint: string): Promise<boolean> {
    const operationId = this.logger.startOperation('isDeviceTrusted', {
      userId,
      deviceFingerprint: deviceFingerprint?.substring(0, 8) + '...',
    });

    try {
      if (!deviceFingerprint) {
        this.logger.endOperation('isDeviceTrusted', operationId, true, undefined, { trusted: false, reason: 'no_fingerprint' });
        return false;
      }

      // 1. Vérifier cache Redis d'abord
      const trustKey = `trusted_device:${userId}:${deviceFingerprint}`;
      const cachedTrust = await this.redis.getCache<any>(trustKey);
      
      if (cachedTrust !== null) {
        const isValid = new Date(cachedTrust.expiresAt) > new Date();
        this.logger.endOperation('isDeviceTrusted', operationId, true, undefined, { 
          trusted: isValid, 
          source: 'cache',
          expiresAt: cachedTrust.expiresAt 
        });
        return isValid;
      }

      // 2. Fallback : chercher dans les sessions récentes fiables
      const recentTrustedSession = await this.prisma.user_sessions.findFirst({
        where: {
          user_id: userId,
          device_fingerprint: deviceFingerprint,
          is_active: true,
          expires_at: { gt: new Date() },
          created_at: {
            gte: new Date(Date.now() - this.TRUSTED_DEVICE_TTL * 1000)
          }
        },
        select: { id: true, created_at: true },
        orderBy: { last_activity: 'desc' }
      });

      if (recentTrustedSession) {
        // Remettre en cache pour optimiser les prochains appels
        const trustData = {
          userId,
          deviceFingerprint,
          trustedAt: recentTrustedSession.created_at.toISOString(),
          expiresAt: new Date(Date.now() + this.TRUSTED_DEVICE_TTL * 1000).toISOString(),
        };
        await this.redis.setCache(trustKey, trustData, this.TRUSTED_DEVICE_TTL);

        this.logger.endOperation('isDeviceTrusted', operationId, true, undefined, { 
          trusted: true, 
          source: 'database',
          sessionId: recentTrustedSession.id 
        });
        return true;
      }

      this.logger.endOperation('isDeviceTrusted', operationId, true, undefined, { 
        trusted: false, 
        source: 'not_found' 
      });
      return false;

    } catch (error) {
      this.logger.endOperation('isDeviceTrusted', operationId, false, undefined, { error: error.message });
      this.logger.error('Device trust check failed', error.stack, 'DeviceService', JSON.stringify({
        userId,
        deviceFingerprint: deviceFingerprint?.substring(0, 8) + '...',
      }));
      // En cas d'erreur, considérer comme non fiable par sécurité
      return false;
    }
  }

  /**
   * Marque un device comme fiable après vérification 2FA
   * Sauvegarde Redis + notification par email
   */
  async trustDevice(
    userId: string, 
    deviceInfo: IDeviceInfo, 
    verifiedBy2FA: boolean = false
  ): Promise<boolean> {
    const operationId = this.logger.startOperation('trustDevice', {
      userId,
      ipAddress: deviceInfo.ipAddress,
      verifiedBy2FA,
    });

    try {
      if (!deviceInfo.deviceFingerprint) {
        throw new Error('Device fingerprint requis pour marquer comme fiable');
      }

      // 1. Créer entrée trusted device en cache Redis
      const trustKey = `trusted_device:${userId}:${deviceInfo.deviceFingerprint}`;
      const trustData = {
        userId,
        deviceFingerprint: deviceInfo.deviceFingerprint,
        deviceName: DeviceUtil.generateDeviceName(deviceInfo),
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        geolocation: deviceInfo.geolocation,
        verifiedBy2FA,
        trustedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.TRUSTED_DEVICE_TTL * 1000).toISOString(),
      };

      await this.redis.setCache(trustKey, trustData, this.TRUSTED_DEVICE_TTL);

      // 2. Récupérer infos utilisateur pour email
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { 
          email: true, 
          first_name: true, 
          last_name: true 
        }
      });

      if (!user) {
        throw new Error('Utilisateur introuvable');
      }

      // 3. Envoyer notification email sécurisée
      try {
        await this.email.sendEmail({
          to: user.email,
          subject: '🔒 Nouvel appareil de confiance ajouté',
          template: 'device-trusted',
          context: {
            firstName: user.first_name,
            deviceName: trustData.deviceName,
            ipAddress: deviceInfo.ipAddress,
            location: deviceInfo.geolocation?.city || 'Localisation inconnue',
            trustedAt: new Date().toLocaleString('fr-TN', {
              timeZone: 'Africa/Tunis',
              dateStyle: 'full',
              timeStyle: 'short'
            }),
            securityUrl: `${process.env.FRONTEND_URL}/security/devices`,
          }
        });
      } catch (emailError) {
        // Ne pas faire échouer l'opération pour un problème d'email
        this.logger.warn('Failed to send device trusted email', JSON.stringify({
          userId,
          error: emailError.message,
        }));
      }

      // 4. Logger événement business
      this.logger.logBusinessEvent('DEVICE_TRUSTED', {
        userId,
        deviceFingerprint: deviceInfo.deviceFingerprint,
        deviceName: trustData.deviceName,
        ipAddress: deviceInfo.ipAddress,
        verifiedBy2FA,
        location: deviceInfo.geolocation?.city,
      }, userId);

      this.logger.endOperation('trustDevice', operationId, true, undefined, {
        deviceFingerprint: deviceInfo.deviceFingerprint?.substring(0, 8) + '...',
        expiresAt: trustData.expiresAt,
      });

      return true;

    } catch (error) {
      this.logger.endOperation('trustDevice', operationId, false, undefined, { error: error.message });
      this.logger.error('Failed to trust device', error.stack, 'DeviceService', JSON.stringify({
        userId,
        ipAddress: deviceInfo.ipAddress,
      }));
      return false;
    }
  }

  /**
   * Révoque la confiance d'un device
   * Supprime cache + termine sessions actives
   */
  async revokeDeviceTrust(userId: string, deviceFingerprint: string): Promise<boolean> {
    const operationId = this.logger.startOperation('revokeDeviceTrust', {
      userId,
      deviceFingerprint: deviceFingerprint?.substring(0, 8) + '...',
    });

    try {
      if (!deviceFingerprint) {
        throw new Error('Device fingerprint requis pour révocation');
      }

      // 1. Supprimer du cache Redis
      const trustKey = `trusted_device:${userId}:${deviceFingerprint}`;
      await this.redis.delCache(trustKey);

      // 2. Révoquer sessions actives de cet appareil selon schema.prisma exact
      const revokedSessions = await this.prisma.user_sessions.updateMany({
        where: {
          user_id: userId,
          device_fingerprint: deviceFingerprint,
          is_active: true,
        },
        data: {
          is_active: false,
          updated_at: new Date(),
        },
      });

      // 3. Logger révocation
      this.logger.logBusinessEvent('DEVICE_TRUST_REVOKED', {
        userId,
        deviceFingerprint: deviceFingerprint?.substring(0, 8) + '...',
        sessionsRevoked: revokedSessions.count,
      }, userId);

      this.logger.endOperation('revokeDeviceTrust', operationId, true, undefined, {
        sessionsRevoked: revokedSessions.count,
      });

      return revokedSessions.count > 0;

    } catch (error) {
      this.logger.endOperation('revokeDeviceTrust', operationId, false, undefined, { error: error.message });
      this.logger.error('Failed to revoke device trust', error.stack, 'DeviceService', JSON.stringify({
        userId,
        deviceFingerprint: deviceFingerprint?.substring(0, 8) + '...',
      }));
      return false;
    }
  }

  /**
   * Liste les devices de confiance d'un utilisateur
   * Cache + base de données pour cohérence
   */
  async getUserTrustedDevices(userId: string): Promise<Array<{
    deviceFingerprint: string;
    deviceName: string;
    ipAddress: string;
    userAgent: string;
    location: string;
    trustedAt: string;
    lastUsed: string;
    expiresAt: string;
    isActive: boolean;
  }>> {
    const operationId = this.logger.startOperation('getUserTrustedDevices', { userId });

    try {
      // 1. Récupérer sessions récentes avec device info selon schema.prisma
      const recentSessions = await this.prisma.user_sessions.findMany({
        where: {
          user_id: userId,
          device_fingerprint: { not: null },
          created_at: {
            gte: new Date(Date.now() - this.TRUSTED_DEVICE_TTL * 1000)
          }
        },
        select: {
          device_fingerprint: true,
          ip_address: true,
          user_agent: true,
          geolocation: true,
          created_at: true,
          last_activity: true,
          is_active: true,
        },
        orderBy: { last_activity: 'desc' },
        distinct: ['device_fingerprint']
      });

      const trustedDevices = [];

      // 2. Pour chaque device, vérifier confiance et enrichir
      for (const session of recentSessions) {
        if (!session.device_fingerprint) continue;

        const isTrusted = await this.isDeviceTrusted(userId, session.device_fingerprint);
        if (!isTrusted) continue;

        // Enrichir avec infos cached
        const trustKey = `trusted_device:${userId}:${session.device_fingerprint}`;
        const trustData = await this.redis.getCache<any>(trustKey);

        trustedDevices.push({
          deviceFingerprint: session.device_fingerprint,
          deviceName: trustData?.deviceName || DeviceUtil.generateDeviceName({
            userAgent: session.user_agent || '',
            ipAddress: session.ip_address,
          }),
          ipAddress: session.ip_address,
          userAgent: session.user_agent || '',
          location: this.formatLocation(session.geolocation),
          trustedAt: trustData?.trustedAt || session.created_at.toISOString(),
          lastUsed: session.last_activity.toISOString(),
          expiresAt: trustData?.expiresAt || new Date(Date.now() + this.TRUSTED_DEVICE_TTL * 1000).toISOString(),
          isActive: session.is_active,
        });
      }

      this.logger.endOperation('getUserTrustedDevices', operationId, true, undefined, {
        devicesFound: trustedDevices.length,
      });

      return trustedDevices;

    } catch (error) {
      this.logger.endOperation('getUserTrustedDevices', operationId, false, undefined, { error: error.message });
      this.logger.error('Failed to get user trusted devices', error.stack, 'DeviceService', JSON.stringify({ userId }));
      return [];
    }
  }

  /**
   * Compare similarité entre devices pour détection
   */
  async compareDevices(device1: IDeviceInfo, device2: IDeviceInfo): Promise<{
    similarity: number;
    factors: string[];
    recommendation: 'SAME_DEVICE' | 'SIMILAR_DEVICE' | 'DIFFERENT_DEVICE';
  }> {
    const operationId = this.logger.startOperation('compareDevices');

    try {
      const comparison = DeviceUtil.compareDevices(device1, device2);
      
      let recommendation: 'SAME_DEVICE' | 'SIMILAR_DEVICE' | 'DIFFERENT_DEVICE';
      if (comparison.similarity >= 90) {
        recommendation = 'SAME_DEVICE';
      } else if (comparison.similarity >= 60) {
        recommendation = 'SIMILAR_DEVICE';
      } else {
        recommendation = 'DIFFERENT_DEVICE';
      }

      this.logger.endOperation('compareDevices', operationId, true, undefined, {
        similarity: comparison.similarity,
        recommendation,
      });

      return {
        ...comparison,
        recommendation,
      };

    } catch (error) {
      this.logger.endOperation('compareDevices', operationId, false, undefined, { error: error.message });
      this.logger.error('Device comparison failed', error.stack, 'DeviceService');
      throw new Error(`Erreur comparaison devices: ${error.message}`);
    }
  }

  /**
   * Génère rapport sécurité devices pour un utilisateur
   */
  async getUserDeviceReport(userId: string): Promise<{
    trustedDevices: number;
    activeSessions: number;
    recentDevices: any[];
    securityScore: number;
    suspiciousActivity: boolean;
  }> {
    const operationId = this.logger.startOperation('getUserDeviceReport', { userId });

    try {
      // 1. Compter devices de confiance
      const trustedDevices = await this.getUserTrustedDevices(userId);

      // 2. Sessions actives selon schema.prisma exact
      const activeSessions = await this.prisma.user_sessions.count({
        where: {
          user_id: userId,
          is_active: true,
          expires_at: { gt: new Date() },
        },
      });

      // 3. Devices récents (dernière semaine)
      const recentDevices = await this.prisma.user_sessions.findMany({
        where: {
          user_id: userId,
          created_at: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 jours
          }
        },
        select: {
          device_fingerprint: true,
          ip_address: true,
          user_agent: true,
          geolocation: true,
          created_at: true,
          last_activity: true,
        },
        orderBy: { created_at: 'desc' },
        take: 10,
        distinct: ['device_fingerprint']
      });

      // 4. Calcul score sécurité
      const securityScore = this.calculateDeviceSecurityScore({
        trustedDevicesCount: trustedDevices.length,
        activeSessionsCount: activeSessions,
        recentDevicesCount: recentDevices.length,
        hasRecentSuspiciousActivity: false, // TODO: implémenter détection
      });

      // 5. Détection activité suspecte
      const suspiciousActivity = this.detectSuspiciousActivity(recentDevices);

      this.logger.endOperation('getUserDeviceReport', operationId, true, undefined, {
        trustedDevices: trustedDevices.length,
        activeSessions,
        securityScore,
        suspiciousActivity,
      });

      return {
        trustedDevices: trustedDevices.length,
        activeSessions,
        recentDevices,
        securityScore,
        suspiciousActivity,
      };

    } catch (error) {
      this.logger.endOperation('getUserDeviceReport', operationId, false, undefined, { error: error.message });
      this.logger.error('Failed to generate device report', error.stack, 'DeviceService', JSON.stringify({ userId }));
      throw new Error(`Erreur génération rapport: ${error.message}`);
    }
  }

  /**
   * Nettoie les devices expirés (job de maintenance)
   */
  async cleanupExpiredDevices(): Promise<number> {
    const operationId = this.logger.startOperation('cleanupExpiredDevices');

    try {
      let cleanedCount = 0;

      // TODO: Implémenter scan Redis pattern pour nettoyer devices expirés
      // Pattern : trusted_device:*
      // Vérifier expiresAt et supprimer si expiré

      this.logger.endOperation('cleanupExpiredDevices', operationId, true, undefined, {
        cleanedCount,
      });

      return cleanedCount;

    } catch (error) {
      this.logger.endOperation('cleanupExpiredDevices', operationId, false, undefined, { error: error.message });
      this.logger.error('Device cleanup failed', error.stack, 'DeviceService');
      return 0;
    }
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  /**
   * Formate geolocation pour affichage
   */
  private formatLocation(geolocation: any): string {
    if (!geolocation) return 'Localisation inconnue';
    
    try {
      const location = typeof geolocation === 'string' 
        ? JSON.parse(geolocation) 
        : geolocation;
      
      return `${location.city || 'Ville inconnue'}, ${location.country || 'Pays inconnu'}`;
    } catch {
      return 'Localisation inconnue';
    }
  }

  /**
   * Calcule score sécurité basé sur devices
   */
  private calculateDeviceSecurityScore(metrics: {
    trustedDevicesCount: number;
    activeSessionsCount: number;
    recentDevicesCount: number;
    hasRecentSuspiciousActivity: boolean;
  }): number {
    let score = 100;

    // Pénalités
    if (metrics.trustedDevicesCount === 0) score -= 30;
    if (metrics.activeSessionsCount > 5) score -= 15;
    if (metrics.recentDevicesCount > 10) score -= 20;
    if (metrics.hasRecentSuspiciousActivity) score -= 40;

    // Bonus
    if (metrics.trustedDevicesCount >= 2 && metrics.trustedDevicesCount <= 4) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Détecte activité suspecte dans devices récents
   */
  private detectSuspiciousActivity(recentDevices: any[]): boolean {
    if (recentDevices.length === 0) return false;

    // Détection basique : plus de 5 devices différents en 24h
    const last24h = recentDevices.filter(device => 
      new Date(device.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    return last24h.length > 5;
  }

  /**
   * ✅ NOUVEAU : Log des informations d'appareil mobile
   * Enregistre les détails spécifiques aux appareils mobiles
   */
  async logMobileDevice(data: {
    userId: string;
    deviceId?: string;
    appVersion?: string;
    userAgent: string;
    ipAddress: string;
    deviceFingerprint?: string;
  }): Promise<void> {
    const operationId = this.logger.startOperation('logMobileDevice', {
      userId: data.userId,
      deviceId: data.deviceId,
      appVersion: data.appVersion
    });

    try {
      // Enregistrer dans la base de données
      await this.prisma.user_trusted_devices.upsert({
        where: {
          user_id_device_fingerprint: {
            user_id: data.userId,
            device_fingerprint: data.deviceFingerprint || data.deviceId || 'unknown'
          }
        },
        update: {
          device_name: data.deviceId || 'unknown',
          user_agent: data.userAgent,
          ip_address: data.ipAddress,
          last_seen_at: new Date(),
          metadata: {
            app_version: data.appVersion,
            last_used: new Date()
          }
        },
        create: {
          user_id: data.userId,
          device_fingerprint: data.deviceFingerprint || data.deviceId || 'unknown',
          device_name: data.deviceId || 'unknown',
          user_agent: data.userAgent,
          ip_address: data.ipAddress,
          is_active: true,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          metadata: {
            app_version: data.appVersion,
            last_used: new Date()
          }
        }
      });

      this.logger.endOperation('logMobileDeviceInfo', operationId, true);
    } catch (error) {
      this.logger.endOperation('logMobileDeviceInfo', operationId, false, undefined, { 
        error: error.message 
      });
      // Ne pas faire échouer l'opération principale
      this.logger.warn('Failed to log mobile device info: ' + error.message);
    }
  }

  /**
   * ✅ NOUVEAU : Validation d'appareil biométrique
   * Vérifie si un appareil est autorisé pour l'authentification biométrique
   */
  async validateBiometricDevice(data: {
    deviceId: string;
    biometricType?: string;
    deviceFingerprint?: string;
    ipAddress: string;
  }): Promise<{
    isValid: boolean;
    reason?: string;
    user?: any;
  }> {
    const operationId = this.logger.startOperation('validateBiometricDevice', {
      deviceId: data.deviceId,
      biometricType: data.biometricType
    });

    try {
      // Vérifier si l'appareil existe et est actif
      const device = await this.prisma.user_trusted_devices.findFirst({
        where: {
          device_fingerprint: data.deviceFingerprint || data.deviceId,
          is_active: true
        },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
              is_active: true,
              email_verified: true
            }
          }
        }
      });

      if (!device) {
                this.logger.endOperation('validateBiometricDevice', operationId, true, undefined, {
          isValid: false,
          reason: 'device_not_found'
        });
        return { isValid: false, reason: 'device_not_found' };
      }

      // Vérifier si l'utilisateur est actif
            if (!device.users.is_active) {
        this.logger.endOperation('validateBiometricDevice', operationId, true, undefined, {
          isValid: false,
          reason: 'user_inactive'
        });
        return { isValid: false, reason: 'user_inactive' };
      }

      // Vérifier si l'email est vérifié
      if (!device.users.email_verified) {
        this.logger.endOperation('validateBiometricDevice', operationId, true, undefined, {
          isValid: false,
          reason: 'email_not_verified'
        });
        return { isValid: false, reason: 'email_not_verified' };
      }

      // Vérifier la cohérence du device fingerprint (optionnel)
      if (data.deviceFingerprint && device.device_fingerprint) {
        if (data.deviceFingerprint !== device.device_fingerprint) {
          this.logger.warn('Device fingerprint mismatch: ' + JSON.stringify({
            deviceId: data.deviceId,
            stored: device.device_fingerprint?.substring(0, 8) + '...',
            provided: data.deviceFingerprint.substring(0, 8) + '...'
          }));
          // Pour l'instant, on ne bloque pas pour cela
        }
      }

      // Mettre à jour la dernière utilisation
      await this.prisma.user_trusted_devices.update({
        where: { id: device.id },
        data: { 
          last_seen_at: new Date()
        }
      });

      this.logger.endOperation('validateBiometricDevice', operationId, true, undefined, { 
        isValid: true, 
        userId: device.users.id 
      });

      return { 
        isValid: true, 
        user: device.users 
      };

    } catch (error) {
      this.logger.endOperation('validateBiometricDevice', operationId, false, undefined, { 
        error: error.message 
      });
      return { isValid: false, reason: 'validation_error' };
    }
  }

  /**
   * ✅ NOUVEAU : Récupérer l'utilisateur associé à un appareil
   */
  async getUserFromDevice(deviceId: string): Promise<any> {
    const operationId = this.logger.startOperation('getUserFromDevice', {
      deviceId
    });

    try {
      const device = await this.prisma.user_trusted_devices.findFirst({
        where: {
          device_fingerprint: deviceId,
          is_active: true
        },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
              avatar: true,
              is_active: true,
              email_verified: true
            }
          }
        }
      });

      if (!device || !device.users) {
        this.logger.endOperation('getUserFromDevice', operationId, true, undefined, { 
          userFound: false 
        });
        return null;
      }

      this.logger.endOperation('getUserFromDevice', operationId, true, undefined, { 
        userFound: true,
        userId: device.users.id 
      });

      return {
        id: device.users.id,
        email: device.users.email,
        username: device.users.email, // Use email as username
        role: 'user', // Default role
        isActive: device.users.is_active,
        emailVerified: device.users.email_verified,
        profile: {
          firstName: device.users.first_name,
          lastName: device.users.last_name,
          avatar: device.users.avatar
        }
      };

    } catch (error) {
      this.logger.endOperation('getUserFromDevice', operationId, false, undefined, { 
        error: error.message 
      });
      return null;
    }
  }

  /**
   * ✅ NOUVEAU : Associer un appareil à un utilisateur pour la biométrie
   */
  async associateDeviceForBiometrics(data: {
    userId: string;
    deviceId: string;
    biometricType: string;
    deviceFingerprint?: string;
    userAgent: string;
    ipAddress: string;
  }): Promise<boolean> {
    const operationId = this.logger.startOperation('associateDeviceForBiometrics', {
      userId: data.userId,
      deviceId: data.deviceId,
      biometricType: data.biometricType
    });

    try {
      await this.prisma.user_trusted_devices.upsert({
        where: {
          user_id_device_fingerprint: {
            user_id: data.userId,
            device_fingerprint: data.deviceFingerprint || data.deviceId
          }
        },
        update: {
          device_name: data.deviceId,
          user_agent: data.userAgent,
          ip_address: data.ipAddress,
          last_seen_at: new Date(),
          metadata: {
            biometric_enabled: true,
            biometric_type: data.biometricType,
            last_used: new Date()
          }
        },
        create: {
          user_id: data.userId,
          device_fingerprint: data.deviceFingerprint || data.deviceId,
          device_name: data.deviceId,
          user_agent: data.userAgent,
          ip_address: data.ipAddress,
          is_active: true,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          metadata: {
            biometric_enabled: true,
            biometric_type: data.biometricType,
            last_used: new Date()
          }
        }
      });

      this.logger.endOperation('associateDeviceForBiometrics', operationId, true);
      return true;

    } catch (error) {
      this.logger.endOperation('associateDeviceForBiometrics', operationId, false, undefined, { 
        error: error.message 
      });
      return false;
    }
  }
}