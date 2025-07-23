// src/modules/auth/guards/device-trusted.guard.ts

import { 
  Injectable, 
  CanActivate, 
  ExecutionContext,
  UnauthorizedException 
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { DeviceUtil } from '../utils/device.util';
import { DeviceNotTrustedException } from '../exceptions/auth.exceptions';
import { TRUST_DEVICE_KEY } from '../decorators/current-user.decorator';

/**
 * Device Trusted Guard Entrix V3.0
 * Vérifie si l'appareil est de confiance
 */

@Injectable()
export class DeviceTrustedGuard implements CanActivate {
  private readonly logger: LoggerService;

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('DeviceTrustedGuard');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Vérifier si vérification device requise
    const requireTrustedDevice = this.reflector.getAllAndOverride<boolean>(TRUST_DEVICE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requireTrustedDevice || !user) {
      return true;
    }

    const operationId = this.logger.startOperation('deviceTrustedGuard', {
      userId: user.id,
      path: request.url,
    });

    try {
      // Extraire infos device de la requête
      const deviceInfo = this.extractDeviceInfo(request);
      const deviceFingerprint = DeviceUtil.generateDeviceFingerprint(deviceInfo);

      // Vérifier si device de confiance en DB
      const isTrusted = await this.isDeviceTrusted(user.id, deviceFingerprint);

      if (isTrusted) {
        this.logger.endOperation(operationId, 'success', true);
        return true;
      }

      // Device non fiable - envoyer code vérification
      this.logger.warn('Untrusted device detected', JSON.stringify({
        userId: user.id,
        deviceFingerprint,
        ipAddress: deviceInfo.ipAddress,
      }));

      await this.sendDeviceVerificationCode(user.id, deviceInfo);

      this.logger.logBusinessEvent('DEVICE_VERIFICATION_REQUIRED', {
        userId: user.id,
        deviceFingerprint,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
      }, user.id);

      this.logger.endOperation(operationId, 'device_verification_required', false);

      throw new DeviceNotTrustedException('email');

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * Extrait informations device de la requête
   */
  private extractDeviceInfo(request: any): any {
    return {
      userAgent: request.headers?.['user-agent'] || '',
      ipAddress: request.ip || 'unknown',
      deviceFingerprint: request.headers?.['x-device-fingerprint'],
    };
  }

  /**
   * Vérifie si device est de confiance en DB
   */
  private async isDeviceTrusted(userId: string, deviceFingerprint: string): Promise<boolean> {
    try {
      // Note: Dans un vrai système, il y aurait une table trusted_devices
      // Ici on simplifie en vérifiant les sessions récentes
      const trustedSession = await this.prisma.user_sessions.findFirst({
        where: {
          user_id: userId,
          device_fingerprint: deviceFingerprint,
          is_active: true,
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 jours
          },
        },
        select: {
          id: true,
        },
      });

      return !!trustedSession;
    } catch (error) {
      this.logger.error('Error checking device trust', error.stack);
      return false;
    }
  }

  /**
   * Envoie code de vérification device
   */
  private async sendDeviceVerificationCode(userId: string, deviceInfo: any): Promise<void> {
    try {
      // Logique simplifiée - dans un vrai système, utiliser EmailService
      this.logger.info('Device verification code sent', JSON.stringify({
        userId,
        deviceFingerprint: DeviceUtil.generateDeviceFingerprint(deviceInfo),
      }));
    } catch (error) {
      this.logger.error('Error sending device verification code', error.stack);
    }
  }
}