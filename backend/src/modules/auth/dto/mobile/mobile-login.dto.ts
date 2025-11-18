import { 
  IsString, 
  MinLength, 
  IsOptional, 
  IsBoolean,
  MaxLength,
  IsNotEmpty 
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AUTH_CONSTANTS } from '../../constants/auth.constants';

/**
 * DTO Login Mobile Request Entrix V3.0
 * Optimisé pour l'application mobile
 * Support username ou email
 */

export class MobileLoginDto {
  @ApiProperty({
    description: 'Nom d\'utilisateur ou email de connexion',
    example: 'controller_001',
    maxLength: AUTH_CONSTANTS.VALIDATION.EMAIL_MAX_LENGTH,
  })
  @IsString()
  @IsNotEmpty({ message: 'Nom d\'utilisateur requis' })
  @MaxLength(AUTH_CONSTANTS.VALIDATION.EMAIL_MAX_LENGTH, { 
    message: `Nom d'utilisateur trop long (max ${AUTH_CONSTANTS.VALIDATION.EMAIL_MAX_LENGTH} caractères)` 
  })
  @Transform(({ value }) => value?.trim())
  username: string;

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