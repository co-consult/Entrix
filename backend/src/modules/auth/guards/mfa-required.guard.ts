// src/modules/auth/guards/mfa-required.guard.ts

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { MfaService } from '../services/mfa.service';
import { TrustedDevicesService } from '../services/trusted-devices.service';
import { RiskAssessmentService } from '../services/risk-assessment.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { IUserProfile } from '../interfaces/user.interface';
import { MFA_REQUIRED_KEY } from '../decorators/mfa-required.decorator';
import { MfaDeviceNotTrustedException } from '../exceptions/mfa.exceptions';

/**
 * Guard MFA Required Entrix V3.0
 * Vérifie si MFA est requis selon le contexte
 */
@Injectable()
export class MfaRequiredGuard implements CanActivate {
  private readonly logger: LoggerService;

  constructor(
    private readonly reflector: Reflector,
    private readonly mfaService: MfaService,
    private readonly trustedDevicesService: TrustedDevicesService,
    private readonly riskAssessment: RiskAssessmentService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('MfaRequiredGuard');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as IUserProfile;

    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    // Vérifier si MFA est requis par décorateur
    const isMfaRequired = this.reflector.getAllAndOverride<boolean>(MFA_REQUIRED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si pas explicitement requis, vérifier selon le contexte
    if (!isMfaRequired) {
      return true;
    }

    const operationId = this.logger.startOperation('MfaRequiredGuard.canActivate', {
      userId: user.id,
      endpoint: `${request.method} ${request.path}`
    });

    try {
      // 1. Vérifier si session MFA active
      const hasMfaSession = await this.checkMfaSession(request);
      if (hasMfaSession) {
        this.logger.endOperation('canActivate', operationId, true, undefined, { reason: 'active_mfa_session' });
        return true;
      }

      // 2. Vérifier si appareil de confiance
      const deviceFingerprint = this.extractDeviceFingerprint(request);
      if (deviceFingerprint) {
        const isTrusted = await this.trustedDevicesService.isDeviceTrusted(user.id, deviceFingerprint);
        if (isTrusted) {
          await this.trustedDevicesService.updateLastSeen(user.id, deviceFingerprint);
          this.logger.endOperation('canActivate', operationId, true, undefined, { reason: 'trusted_device' });
          return true;
        }
      }

      // 3. Évaluer le risque et déterminer si MFA requis
      const riskScore = await this.riskAssessment.assessLoginRisk(user.id, {
        ipAddress: request.ip,
        userAgent: request.get('User-Agent'),
        deviceFingerprint
      });

      const requiresMfa = await this.mfaService.requiresMfa(user.id, riskScore);

      if (requiresMfa) {
        this.logger.endOperation('canActivate', operationId, false, undefined, { 
          reason: 'mfa_required',
          riskScore
        });
        throw new MfaDeviceNotTrustedException();
      }

      this.logger.endOperation('canActivate', operationId, true, undefined, { reason: 'low_risk' });
      return true;

    } catch (error) {
      this.logger.endOperation('canActivate', operationId, false);
      
      if (error instanceof MfaDeviceNotTrustedException) {
        throw error;
      }

      this.logger.error('MFA guard error', error.stack, 'MfaRequiredGuard.canActivate', JSON.stringify({
        userId: user.id,
        error: error.message
      }));
      
      throw new ForbiddenException('Erreur lors de la vérification MFA');
    }
  }

  /**
   * Vérifie si une session MFA est active
   */
  private async checkMfaSession(request: Request): Promise<boolean> {
    try {
      const mfaSessionToken = request.headers['x-mfa-session'] as string;
      if (!mfaSessionToken) {
        return false;
      }

      // TODO: Implémenter vérification token session MFA
      // const isValid = await this.mfaService.validateMfaSession(mfaSessionToken);
      // return isValid;

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Extrait l'empreinte de l'appareil
   */
  private extractDeviceFingerprint(request: Request): string | undefined {
    return request.headers['x-device-fingerprint'] as string;
  }
}