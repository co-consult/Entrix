// src/modules/auth/dto/password/forgot-password.dto.ts

import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AUTH_CONSTANTS } from '../../constants/auth.constants';

/**
 * DTO Forgot Password Request Entrix V3.0
 */

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email du compte à réinitialiser',
    example: 'user@entrix.tn',
    format: 'email',
  })
  @IsEmail({}, { message: 'Format email invalide' })
  @MaxLength(AUTH_CONSTANTS.VALIDATION.EMAIL_MAX_LENGTH)
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiPropertyOptional({
    description: 'Token CAPTCHA pour sécurité',
  })
  @IsOptional()
  @IsString()
  captchaToken?: string;
}

export class ForgotPasswordResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  data: {
    emailSent: boolean;
    resetTokenSent: boolean;
    expiresIn: number;
  };

  @ApiProperty()
  message: string;
}