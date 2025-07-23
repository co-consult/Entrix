// src/modules/auth/dto/mfa/mfa-verify.dto.ts

import { IsString, IsEnum, IsOptional, IsBoolean, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MfaProvider, AUTH_CONSTANTS } from '../../constants/auth.constants';

export class MfaVerifyDto {
  @ApiProperty({
    description: 'Token de challenge MFA',
  })
  @IsString()
  challengeToken: string;

  @ApiProperty({
    description: 'Méthode de vérification MFA',
    enum: ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP', 'BACKUP_CODE'],
  })
  @IsEnum(['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP', 'BACKUP_CODE'], {
    message: 'Méthode MFA invalide'
  })
  method: MfaProvider;

  @ApiProperty({
    description: 'Code de vérification à 6 chiffres',
    minLength: 6,
    maxLength: 8,
    example: '123456',
  })
  @IsString()
  @Length(6, 8, { message: 'Code doit faire entre 6 et 8 caractères' })
  code: string;

  @ApiPropertyOptional({
    description: 'Marquer cet appareil comme fiable',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  trustDevice?: boolean = false;
}

export class MfaVerifyResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiPropertyOptional()
  data?: {
    user: any; // UserProfileDto
    tokens: any; // TokenPairDto
    session: any; // SessionInfoDto
    trustedDevice?: {
      deviceId: string;
      expiresAt: string;
    };
  };
}