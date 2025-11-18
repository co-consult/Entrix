import { 
  IsString, 
  IsOptional, 
  MaxLength,
  IsNotEmpty 
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO Biometric Login Mobile Request Entrix V3.0
 * Authentification biométrique pour mobile
 */

export class MobileBiometricLoginDto {
  @ApiProperty({
    description: 'Identifiant unique de l\'appareil',
    example: 'device_123456789',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: 'Identifiant appareil requis' })
  @MaxLength(255, { 
    message: 'Identifiant appareil trop long (max 255 caractères)' 
  })
  @Transform(({ value }) => value?.trim())
  deviceId: string;

  @ApiPropertyOptional({
    description: 'Type de biométrie utilisé',
    example: 'fingerprint',
    enum: ['fingerprint', 'face', 'iris'],
  })
  @IsOptional()
  @IsString()
  biometricType?: string;

  @ApiPropertyOptional({
    description: 'Empreinte device pour sécurité',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceFingerprint?: string;

  @ApiPropertyOptional({
    description: 'Challenge biométrique (optionnel)',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  biometricChallenge?: string;
} 