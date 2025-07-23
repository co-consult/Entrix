// src/modules/auth/services/device.service.ts

import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { IDeviceInfo } from '../interfaces';
import { DeviceUtil } from '../utils/device.util';
import { CryptoUtil } from '../utils/crypto.util';
import { SECURITY_CONSTANTS } from '../constants/security.constants';

/**
 * Device Service Entrix V3.0 - Grade A+
 * Gestion appareils de confiance et fingerprinting
 * Respecte SECURITY_CONSTANTS et best practices
 */

@Injectable()
export class DeviceService {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('DeviceService');
  }

  /**
   * Analyse et normalise informations device
   */
  async analyzeDevice(rawDeviceInfo: any): Promise<IDeviceInfo> {
    const operationId = this.logger.startOperation('analyzeDevice');

    try {
      // 1. Normaliser informations device
      const deviceInfo = DeviceUtil.normalizeDeviceInfo(rawDeviceInfo);

      // 2. Générer fingerprint si absent
      if (!deviceInfo.deviceFingerprint) {
        deviceInfo.deviceFingerprint = DeviceUtil.generateDeviceFingerprint(deviceInfo);
      }

      // 3. Calculer entropie
      const entropy = DeviceUtil.calculateDeviceEntropy(deviceInfo);

      // 4. Enrichir avec métadonnées
      const enrichedDevice = {
        ...deviceInfo,
        entropy,
        analyzedAt: new Date().toISOString(),
      };

      this.logger.endOperation(operationId, 'success');
      return enrichedDevice;

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      this.logger.error('Device analysis failed', error.stack);
      throw new Error(`Erreur analyse device: ${error.message}`);
    }
  }

  /**
   * Vérifie si device est de confiance
   */
  async isDeviceTrusted(userId: string, deviceFingerprint: string): Promise<boolean> {
    const operationId = this.logger.startOperation('isDeviceTrusted', {
      userId,
      deviceFingerprint: deviceFingerprint.substring(0, 8) + '...',
    });

    try {
      // 1. Vérifier cache Redis d'abord
      const trustKey = `trusted_device:${userId}:${deviceFingerprint}`;
      const trustData = await this.redis.getCache(trustKey);

      if (trustData) {
        this.logger.endOperation(operationId, 'cache_hit');
        return true;
      }

      // 2. Vérifier en base de données (sessions récentes)
      const trustedSession = await this.prisma.user_sessions.findFirst({
        where: {
          user_id: userId,
          device_fingerprint: deviceFingerprint,
          is_active: true,
          created_at: {
            gte: new Date(Date.now() - SECURITY_CONSTANTS.DEVICE_FINGERPRINT.TRUST_DURATION * 1000),
          },
        },
        select: { id: true },
      });

      const isTrusted = !!trustedSession;

      if (isTrusted) {
        // Mettre en cache pour accès rapide
        await this.redis.setCache(trustKey, { trusted: true }, SECURITY_CONSTANTS.DEVICE_FINGERPRINT.TRUST_DURATION);
      }

      this.logger.endOperation(operationId, 'db_hit');
      return isTrusted;

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      this.logger.error('Device trust check failed', error.stack, { userId });
      return false;
    }
  }

  /**
   * Marque device comme fiable
   */
  async trustDevice(userId: string, deviceInfo: IDeviceInfo, duration?: number): Promise<void> {
    const operationId = this.logger.startOperation('trustDevice', {
      userId,
      deviceFingerprint: deviceInfo.deviceFingerprint?.substring(0, 8) + '...',
    });

    try {
      const trustDuration = duration || SECURITY_CONSTANTS.DEVICE_FINGERPRINT.TRUST_DURATION;
      const deviceFingerprint = deviceInfo.deviceFingerprint || 
                               DeviceUtil.generateDeviceFingerprint(deviceInfo);

      // 1. Stocker confiance en Redis
      const trustKey = `trusted_device:${userId}:${deviceFingerprint}`;
      const trustData = {
        userId,
        deviceFingerprint,
        deviceInfo,
        trustedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + trustDuration * 1000).toISOString(),
      };

      await this.redis.setCache(trustKey, trustData, trustDuration);

      // 2. Logger confiance device
      this.logger.logBusinessEvent('DEVICE_TRUSTED', {
        userId,
        deviceFingerprint,
        trustDuration,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
      }, userId);

      this.logger.endOperation(operationId, 'success');

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      this.logger.error('Failed to trust device', error.stack, { userId });
    }
  }

  /**
   * Révoque confiance device
   */
  async revokeDeviceTrust(userId: string, deviceFingerprint: string): Promise<boolean> {
    const operationId = this.logger.startOperation('revokeDeviceTrust', {
      userId,
      deviceFingerprint: deviceFingerprint.substring(0, 8) + '...',
    });

    try {
      // 1. Supprimer de Redis
      const trustKey = `trusted_device:${userId}:${deviceFingerprint}`;
      await this.redis.deleteCache(trustKey);

      // 2. Révoquer sessions actives de cet appareil
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
        deviceFingerprint,
        sessionsRevoked: revokedSessions.count,
      }, userId);

      this.logger.endOperation(operationId, 'success');
      return revokedSessions.count > 0;

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      this.logger.error('Failed to revoke device trust', error.stack, { userId });
      return false;
    }
  }

  /**
   * Compare similarité entre devices
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

      this.logger.endOperation(operationId, 'success');
      return {
        ...comparison,
        recommendation,
      };

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      this.logger.error('Device comparison failed', error.stack);
      throw new Error(`Erreur comparaison devices: ${error.message}`);
    }
  }

  /**
   * Génère rapport devices utilisateur
   */
  async getUserDeviceReport(userId: string): Promise<{
    trustedDevices: number;
    activeSessions: number;
    recentDevices: any[];
    securityScore: number;
  }> {
    const operationId = this.logger.startOperation('getUserDeviceReport', { userId });

    try {
      // 1. Compter devices de confiance
      const trustPattern = `trusted_device:${userId}:*`;
      // TODO: Implémenter scan Redis pattern
      const trustedDevices = 0; // Placeholder

      // 2. Sessions actives
      const activeSessions = await this.prisma.user_sessions.count({
        where: {
          user_id: userId,
          is_active: true,
          expires_at: { gt: new Date() },
        },
      });

      // 3. Devices récents
      const recentSessions = await this.prisma.user_sessions.findMany({
        where: {
          user_id: userId,
          created_at: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 jours
          },
        },
        orderBy: { created_at: 'desc' },
        take: 10,
        select: {
          device_fingerprint: true,
          user_agent: true,
          ip_address: true,
          geolocation: true,
          created_at: true,
        },
      });

      // 4. Calculer score sécurité
      const securityScore = this.calculateDeviceSecurityScore({
        trustedDevices,
        activeSessions,
        recentDevicesCount: recentSessions.length,
      });

      const report = {
        trustedDevices,
        activeSessions,
        recentDevices: recentSessions,
        securityScore,
      };

      this.logger.endOperation(operationId, 'success');
      return report;

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      this.logger.error('Failed to generate device report', error.stack, { userId });
      throw new Error(`Erreur génération rapport devices: ${error.message}`);
    }
  }

  /**
   * Calcule score sécurité devices
   */
  private calculateDeviceSecurityScore(data: {
    trustedDevices: number;
    activeSessions: number;
    recentDevicesCount: number;
  }): number {
    let score = 50; // Score de base

    // Bonus pour devices de confiance
    score += Math.min(30, data.trustedDevices * 10);

    // Pénalité pour trop de sessions actives
    if (data.activeSessions > 5) {
      score -= (data.activeSessions - 5) * 5;
    }

    // Pénalité pour trop de devices différents récents
    if (data.recentDevicesCount > 3) {
      score -= (data.recentDevicesCount - 3) * 5;
    }

    return Math.max(0, Math.min(100, score));
  }
}