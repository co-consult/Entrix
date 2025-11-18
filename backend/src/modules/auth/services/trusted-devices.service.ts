// src/modules/auth/services/trusted-devices.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { ITrustedDevice } from '../interfaces/mfa.interface';
import { IDeviceInfo } from '../interfaces/session.interface';

/**
 * Service de gestion des appareils de confiance MFA
 * Entrix V3.0 - Respecte schema.prisma user_trusted_devices
 */
@Injectable()
export class TrustedDevicesService {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('TrustedDevicesService');
  }

  /**
   * Marque un appareil comme fiable
   */
  async trustDevice(
    userId: string, 
    deviceFingerprint: string, 
    deviceInfo?: Partial<IDeviceInfo>
  ): Promise<ITrustedDevice> {
    const operationId = this.logger.startOperation('trustDevice', { 
      userId, 
      deviceFingerprint: deviceFingerprint.slice(0, 8) + '...' 
    });

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 jours par défaut

      const trustedDevice = await this.prisma.user_trusted_devices.upsert({
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
          ip_address: deviceInfo?.ipAddress,
          user_agent: deviceInfo?.userAgent,
          device_name: this.generateDeviceName(deviceInfo),
          is_active: true,
          metadata: {
            browser: deviceInfo?.browser,
            os: deviceInfo?.os,
            isMobile: deviceInfo?.isMobile,
            geolocation: deviceInfo?.geolocation
          }
        },
        create: {
          user_id: userId,
          device_fingerprint: deviceFingerprint,
          device_name: this.generateDeviceName(deviceInfo),
          expires_at: expiresAt,
          ip_address: deviceInfo?.ipAddress,
          user_agent: deviceInfo?.userAgent,
          is_active: true,
          metadata: {
            browser: deviceInfo?.browser,
            os: deviceInfo?.os,
            isMobile: deviceInfo?.isMobile,
            geolocation: deviceInfo?.geolocation
          }
        }
      });

      this.logger.endOperation('trustDevice', operationId, true);

      return this.mapToInterface(trustedDevice);

    } catch (error) {
      this.logger.endOperation('trustDevice', operationId, false);
      this.logger.error('Failed to trust device', error.stack, 'TrustedDevicesService.trustDevice', JSON.stringify({
        userId,
        error: error.message
      }));
      throw error;
    }
  }

  /**
   * Vérifie si un appareil est de confiance
   */
  async isDeviceTrusted(userId: string, deviceFingerprint: string): Promise<boolean> {
    try {
      const device = await this.prisma.user_trusted_devices.findUnique({
        where: {
          user_id_device_fingerprint: {
            user_id: userId,
            device_fingerprint: deviceFingerprint
          }
        },
        select: {
          is_active: true,
          expires_at: true
        }
      });

      if (!device || !device.is_active) {
        return false;
      }

      // Vérifier si l'appareil n'a pas expiré
      return device.expires_at > new Date();

    } catch (error) {
      this.logger.error('Failed to check device trust', error.stack);
      return false;
    }
  }

  /**
   * Retourne la liste des appareils de confiance
   */
  async getTrustedDevices(userId: string): Promise<ITrustedDevice[]> {
    const operationId = this.logger.startOperation('getTrustedDevices', { userId });

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

      this.logger.endOperation('getTrustedDevices', operationId, true);

      return devices.map(device => this.mapToInterface(device));

    } catch (error) {
      this.logger.endOperation('getTrustedDevices', operationId, false);
      throw error;
    }
  }

  /**
   * Compte le nombre d'appareils de confiance
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
   * Supprime un appareil de confiance
   */
  async removeTrustedDevice(userId: string, deviceId: string): Promise<boolean> {
    const operationId = this.logger.startOperation('removeTrustedDevice', { 
      userId, 
      deviceId 
    });

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

      if (!success) {
        throw new NotFoundException('Appareil de confiance non trouvé');
      }

      this.logger.endOperation('removeTrustedDevice', operationId, true);
      return true;

    } catch (error) {
      this.logger.endOperation('removeTrustedDevice', operationId, false);
      throw error;
    }
  }

  /**
   * Supprime tous les appareils de confiance d'un utilisateur
   */
  async removeAllTrustedDevices(userId: string): Promise<number> {
    const operationId = this.logger.startOperation('removeAllTrustedDevices', { userId });

    try {
      const result = await this.prisma.user_trusted_devices.updateMany({
        where: {
          user_id: userId,
          is_active: true
        },
        data: {
          is_active: false
        }
      });

      this.logger.endOperation('removeAllTrustedDevices', operationId, true);
      return result.count;

    } catch (error) {
      this.logger.endOperation('removeAllTrustedDevices', operationId, false);
      throw error;
    }
  }

  /**
   * Met à jour la dernière activité d'un appareil
   */
  async updateLastSeen(userId: string, deviceFingerprint: string): Promise<void> {
    try {
      await this.prisma.user_trusted_devices.updateMany({
        where: {
          user_id: userId,
          device_fingerprint: deviceFingerprint,
          is_active: true
        },
        data: {
          last_seen_at: new Date()
        }
      });

    } catch (error) {
      this.logger.error('Failed to update last seen', error.stack);
      // Ne pas propager l'erreur, c'est non critique
    }
  }

  /**
   * Nettoie les appareils expirés
   */
  async cleanupExpiredDevices(): Promise<number> {
    const operationId = this.logger.startOperation('cleanupExpiredDevices');

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

      this.logger.endOperation('cleanupExpiredDevices', operationId, true, undefined, {
        cleanedCount: result.count
      });

      return result.count;

    } catch (error) {
      this.logger.endOperation('cleanupExpiredDevices', operationId, false);
      this.logger.error('Failed to cleanup expired devices', error.stack);
      return 0;
    }
  }

  /**
   * Prolonge la validité d'un appareil de confiance
   */
  async extendDeviceTrust(userId: string, deviceId: string, additionalDays: number): Promise<boolean> {
    const operationId = this.logger.startOperation('extendDeviceTrust', { 
      userId, 
      deviceId, 
      additionalDays 
    });

    try {
      const device = await this.prisma.user_trusted_devices.findFirst({
        where: {
          id: deviceId,
          user_id: userId,
          is_active: true
        }
      });

      if (!device) {
        throw new NotFoundException('Appareil de confiance non trouvé');
      }

      const newExpirationDate = new Date(device.expires_at);
      newExpirationDate.setDate(newExpirationDate.getDate() + additionalDays);

      await this.prisma.user_trusted_devices.update({
        where: { id: deviceId },
        data: {
          expires_at: newExpirationDate
        }
      });

      this.logger.endOperation('extendDeviceTrust', operationId, true);
      return true;

    } catch (error) {
      this.logger.endOperation('extendDeviceTrust', operationId, false);
      throw error;
    }
  }

  /**
   * Obtient les statistiques des appareils de confiance
   */
  async getDeviceStats(userId: string): Promise<{
    total: number;
    active: number;
    expired: number;
    recentlyUsed: number; // Dans les 7 derniers jours
  }> {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [total, active, expired, recentlyUsed] = await Promise.all([
        this.prisma.user_trusted_devices.count({
          where: { user_id: userId }
        }),
        this.prisma.user_trusted_devices.count({
          where: {
            user_id: userId,
            is_active: true,
            expires_at: { gt: now }
          }
        }),
        this.prisma.user_trusted_devices.count({
          where: {
            user_id: userId,
            expires_at: { lt: now }
          }
        }),
        this.prisma.user_trusted_devices.count({
          where: {
            user_id: userId,
            is_active: true,
            last_seen_at: { gte: sevenDaysAgo }
          }
        })
      ]);

      return { total, active, expired, recentlyUsed };

    } catch (error) {
      this.logger.error('Failed to get device stats', error.stack);
      return { total: 0, active: 0, expired: 0, recentlyUsed: 0 };
    }
  }

  // ===================
  // MÉTHODES PRIVÉES
  // ===================

  /**
   * Mappe l'entité Prisma vers l'interface
   */
  private mapToInterface(device: any): ITrustedDevice {
    return {
      id: device.id,
      userId: device.user_id,
      deviceFingerprint: device.device_fingerprint,
      deviceName: device.device_name,
      trustedAt: device.trusted_at,
      expiresAt: device.expires_at,
      lastSeenAt: device.last_seen_at,
      ipAddress: device.ip_address,
      userAgent: device.user_agent,
      metadata: device.metadata,
      isActive: device.is_active,
      createdAt: device.created_at
    };
  }

  /**
   * Génère un nom d'appareil convivial
   */
  private generateDeviceName(deviceInfo?: Partial<IDeviceInfo>): string {
    if (!deviceInfo) {
      return 'Appareil inconnu';
    }

    const parts: string[] = [];

    if (deviceInfo.isMobile) {
      parts.push('Mobile');
    } else {
      parts.push('Ordinateur');
    }

    if (deviceInfo.os) {
      parts.push(deviceInfo.os);
    }

    if (deviceInfo.browser) {
      parts.push(deviceInfo.browser);
    }

    if (deviceInfo.geolocation?.city) {
      parts.push(`(${deviceInfo.geolocation.city})`);
    }

    return parts.length > 0 ? parts.join(' ') : 'Appareil inconnu';
  }
}