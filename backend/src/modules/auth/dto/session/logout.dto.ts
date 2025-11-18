// src/modules/auth/dto/session/logout.dto.ts

import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * DTO Logout Request Entrix V3.0
 */

export class LogoutDto {
  @ApiPropertyOptional({
    description: 'Déconnexion de tous les appareils',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  allDevices?: boolean = false;
}

export class LogoutResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiPropertyOptional()
  data?: {
    message: string;
    tokensInvalidated: number;
    sessionsTerminated: number;
  };
}