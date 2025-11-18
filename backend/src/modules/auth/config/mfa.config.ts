// src/modules/auth/config/mfa.config.ts

import { ConfigService } from '@nestjs/config';
import { MFA_CONSTANTS } from '../constants/mfa.constants';

/**
 * Configuration MFA Entrix V3.0
 * Respecte api_specs_auth_session.md
 */

export interface MfaConfig {
  enabled: boolean;
  requiredForOrganizers: boolean;
  providers: {
    sms: {
      enabled: boolean;
      provider: string;
      validityDuration: number;
    };
    email: {
      enabled: boolean;
      validityDuration: number;
    };
    totp: {
      enabled: boolean;
      issuer: string;
      algorithm: string;
      digits: number;
      window: number;
    };
    backupCodes: {
      enabled: boolean;
      count: number;
      length: number;
    };
  };
}

export const getMfaConfig = (configService: ConfigService): MfaConfig => ({
  enabled: configService.get<boolean>('MFA_ENABLED', true),
  requiredForOrganizers: configService.get<boolean>('MFA_REQUIRED_ORGANIZERS', true),
  providers: {
    sms: {
      enabled: configService.get<boolean>('MFA_SMS_ENABLED', true),
      provider: configService.get<string>('SMS_PROVIDER', 'twilio'),
      validityDuration: MFA_CONSTANTS.PROVIDERS.SMS_OTP.validity_duration,
    },
    email: {
      enabled: configService.get<boolean>('MFA_EMAIL_ENABLED', true),
      validityDuration: MFA_CONSTANTS.PROVIDERS.EMAIL_OTP.validity_duration,
    },
    totp: {
      enabled: configService.get<boolean>('MFA_TOTP_ENABLED', true),
      issuer: MFA_CONSTANTS.TOTP.ISSUER,
      algorithm: MFA_CONSTANTS.TOTP.ALGORITHM,
      digits: MFA_CONSTANTS.TOTP.DIGITS,
      window: MFA_CONSTANTS.TOTP.WINDOW,
    },
    backupCodes: {
      enabled: configService.get<boolean>('MFA_BACKUP_CODES_ENABLED', true),
      count: MFA_CONSTANTS.BACKUP_CODES.COUNT,
      length: MFA_CONSTANTS.BACKUP_CODES.LENGTH,
    },
  },
});