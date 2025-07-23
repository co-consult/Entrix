// src/modules/auth/dto/password/reset-password.dto.ts

import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AUTH_CONSTANTS } from '../../constants/auth.constants';

/**
 * DTO Reset Password Request Entrix V3.0
 */

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de réinitialisation reçu par email',
  })
  @IsString()
  @IsNotEmpty({ message: 'Token de réinitialisation requis' })
  token: string;

  @ApiProperty({
    description: 'Nouveau mot de passe',
    minLength: AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH,
    maxLength: AUTH_CONSTANTS.VALIDATION.PASSWORD_MAX_LENGTH,
  })
  @IsString()
  @IsNotEmpty({ message: 'Nouveau mot de passe requis' })
  @MinLength(AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH, { 
    message: `Mot de passe minimum ${AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH} caractères` 
  })
  @MaxLength(AUTH_CONSTANTS.VALIDATION.PASSWORD_MAX_LENGTH, { 
    message: `Mot de passe maximum ${AUTH_CONSTANTS.VALIDATION.PASSWORD_MAX_LENGTH} caractères` 
  })
  @Matches(AUTH_CONSTANTS.VALIDATION.PASSWORD_REGEX, { 
    message: 'Mot de passe doit contenir majuscule, minuscule, chiffre et symbole' 
  })
  newPassword: string;

  @ApiProperty({
    description: 'Confirmation du nouveau mot de passe',
  })
  @IsString()
  @IsNotEmpty({ message: 'Confirmation mot de passe requise' })
  confirmPassword: string;
}

export class ResetPasswordResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  data: {
    passwordReset: boolean;
    autoLogin: boolean;
  };

  @ApiProperty()
  message: string;
}