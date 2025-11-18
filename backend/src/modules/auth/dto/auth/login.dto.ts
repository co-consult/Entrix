import { 
  IsEmail, 
  IsString, 
  MinLength, 
  Matches, 
  IsOptional, 
  IsBoolean,
  MaxLength,
  IsNotEmpty 
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AUTH_CONSTANTS } from '../../constants/auth.constants';

/**
 * DTO Login Request Entrix V3.0
 * Respecte api_specs_auth_session.md
 */

export class LoginDto {
  @ApiProperty({
    description: 'Email de connexion',
    example: 'user@entrix.tn',
    format: 'email',
    maxLength: AUTH_CONSTANTS.VALIDATION.EMAIL_MAX_LENGTH,
  })
  @IsEmail({}, { message: 'Format email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  @MaxLength(AUTH_CONSTANTS.VALIDATION.EMAIL_MAX_LENGTH, { 
    message: `Email trop long (max ${AUTH_CONSTANTS.VALIDATION.EMAIL_MAX_LENGTH} caractères)` 
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    description: 'Mot de passe utilisateur',
    minLength: AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH,
    maxLength: AUTH_CONSTANTS.VALIDATION.PASSWORD_MAX_LENGTH,
  })
  @IsString()
  @IsNotEmpty({ message: 'Mot de passe requis' })
  @MinLength(AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH, { 
    message: `Mot de passe minimum ${AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH} caractères` 
  })
  @MaxLength(AUTH_CONSTANTS.VALIDATION.PASSWORD_MAX_LENGTH, { 
    message: `Mot de passe maximum ${AUTH_CONSTANTS.VALIDATION.PASSWORD_MAX_LENGTH} caractères` 
  })
  password: string;

  @ApiPropertyOptional({
    description: 'Session prolongée (30 jours)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  rememberMe?: boolean = false;

  @ApiPropertyOptional({
    description: 'Token CAPTCHA (requis après échecs)',
  })
  @IsOptional()
  @IsString()
  captchaToken?: string;

  @ApiPropertyOptional({
    description: 'Empreinte device pour sécurité',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceFingerprint?: string;
}