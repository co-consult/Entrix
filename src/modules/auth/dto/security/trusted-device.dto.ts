// src/modules/auth/dto/security/trusted-device.dto.ts

import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TrustedDeviceDto {
  @ApiProperty({
    description: 'Code de vérification reçu par email/SMS',
    example: '123456',
  })
  @IsString()
  verificationCode: string;

  @ApiPropertyOptional({
    description: 'Nom personnalisé pour l\'appareil',
    example: 'Mon iPhone',
  })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiPropertyOptional({
    description: 'Marquer cet appareil comme fiable',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  trustDevice?: boolean = true;
}

export class TrustedDeviceResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  data: {
    deviceTrusted: boolean;
    deviceId: string;
    expiresAt: string;
  };
}