// src/modules/auth/providers/totp.provider.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { ITotpProvider } from '../interfaces/mfa.interface';
import { MFA_CONSTANTS } from '../constants/mfa.constants';
import { LoggerService } from '../../../shared/logger/logger.service';

/**
 * Provider TOTP Entrix V3.0
 * Gestion des codes à temps limité (Google Authenticator, Authy)
 */
@Injectable()
export class TotpProvider implements ITotpProvider {
  private readonly logger: LoggerService;

  constructor(
    private readonly config: ConfigService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('TotpProvider');
  }

  /**
   * Génère un secret TOTP avec QR code
   */
  async generateSecret(userEmail: string): Promise<{ secret: string; qrCode: string }> {
    const operationId = this.logger.startOperation('generateSecret', { userEmail });

    try {
      const secretData = speakeasy.generateSecret({
        name: `${MFA_CONSTANTS.TOTP.ISSUER} (${userEmail})`,
        issuer: MFA_CONSTANTS.TOTP.ISSUER,
        length: MFA_CONSTANTS.TOTP.SECRET_LENGTH
      });

      const qrCodeUrl = await qrcode.toDataURL(secretData.otpauth_url || '');

      this.logger.endOperation('generateSecret', operationId, true);

      return {
        secret: secretData.base32,
        qrCode: qrCodeUrl
      };

    } catch (error) {
      this.logger.endOperation('generateSecret', operationId, false);
      this.logger.error('Failed to generate TOTP secret', error.stack);
      throw error;
    }
  }

  /**
   * Vérifie un code TOTP
   */
  verifyCode(secret: string, code: string): boolean {
    try {
      return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: code,
        window: MFA_CONSTANTS.TOTP.WINDOW,
        step: MFA_CONSTANTS.TOTP.STEP
      });

    } catch (error) {
      this.logger.error('Failed to verify TOTP code', error.stack);
      return false;
    }
  }

  /**
   * Génère QR code pour un secret existant
   */
  async generateQrCode(secret: string, userEmail: string): Promise<string> {
    try {
      const otpauthUrl = speakeasy.otpauthURL({
        secret,
        label: `${MFA_CONSTANTS.TOTP.ISSUER} (${userEmail})`,
        issuer: MFA_CONSTANTS.TOTP.ISSUER,
        encoding: 'base32'
      });

      return await qrcode.toDataURL(otpauthUrl);

    } catch (error) {
      this.logger.error('Failed to generate QR code', error.stack);
      throw error;
    }
  }

  /**
   * Valide un secret TOTP
   */
  validateSecret(secret: string): boolean {
    try {
      // Vérifier que le secret est valide base32
      return secret && secret.length === MFA_CONSTANTS.TOTP.SECRET_LENGTH;
    } catch {
      return false;
    }
  }

  /**
   * Génère un code TOTP pour tests
   */
  generateCurrentCode(secret: string): string {
    return speakeasy.totp({
      secret,
      encoding: 'base32',
      step: MFA_CONSTANTS.TOTP.STEP
    });
  }
}