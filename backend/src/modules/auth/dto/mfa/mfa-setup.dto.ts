// src/modules/auth/dto/mfa/mfa-setup.dto.ts

import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MfaProvider } from '../../constants/auth.constants';

/**
 * DTOs Multi-Factor Authentication Entrix V3.0
 * Respecte api_specs_auth_session.md
 */

export class MfaSetupDto {
  @ApiProperty({
    description: 'Provider MFA à configurer',
    enum: ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP', 'BACKUP_CODE'],
  })
  @IsEnum(['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP', 'BACKUP_CODE'], {
    message: 'Provider MFA invalide'
  })
  provider: MfaProvider;
}

export class MfaSetupResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiPropertyOptional()
  data?: {
    provider: MfaProvider;
    qrCode?: string; // Pour TOTP
    secret?: string; // Pour TOTP
    backupCodes?: string[]; // Codes de récupération
    setupInstructions: string;
  };
}
