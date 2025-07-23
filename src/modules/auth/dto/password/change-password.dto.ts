// src/modules/auth/dto/password/change-password.dto.ts

import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AUTH_CONSTANTS } from '../../constants/auth.constants';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Mot de passe actuel',
  })
  @IsString()
  @IsNotEmpty({ message: 'Mot de passe actuel requis' })
  currentPassword: string;

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

export class ChangePasswordResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  data: {
    passwordChanged: boolean;
    securityEventLogged: boolean;
  };

  @ApiProperty()
  message: string;
}
