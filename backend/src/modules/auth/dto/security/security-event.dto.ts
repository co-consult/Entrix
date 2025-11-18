// src/modules/auth/dto/security/security-event.dto.ts

import { IsOptional, IsEnum, IsDateString, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { SecurityEventType } from '../../constants/auth.constants';

/**
 * DTOs Security Events Entrix V3.0
 */

export class SecurityEventsQueryDto {
  @ApiPropertyOptional({
    description: 'Nombre d\'événements à retourner',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Limit doit être un nombre' })
  @Min(1, { message: 'Limit minimum: 1' })
  @Max(100, { message: 'Limit maximum: 100' })
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Offset pour pagination',
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Offset doit être un nombre' })
  @Min(0, { message: 'Offset minimum: 0' })
  @Transform(({ value }) => parseInt(value, 10))
  offset?: number = 0;

  @ApiPropertyOptional({
    description: 'Type d\'événement de sécurité',
    enum: ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGE', 'MFA_SETUP', 'SUSPICIOUS_ACTIVITY'],
  })
  @IsOptional()
  @IsEnum(['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGE', 'MFA_SETUP', 'SUSPICIOUS_ACTIVITY'], {
    message: 'Type d\'événement invalide'
  })
  eventType?: SecurityEventType;

  @ApiPropertyOptional({
    description: 'Date de début (ISO 8601)',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Format date invalide' })
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Date de fin (ISO 8601)',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Format date invalide' })
  toDate?: string;
}

export class SecurityEventDto {
  @ApiProperty()
  id: string;

  @ApiProperty({
    enum: ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGE', 'MFA_SETUP', 'SUSPICIOUS_ACTIVITY'],
  })
  type: SecurityEventType;

  @ApiProperty()
  description: string;

  @ApiProperty()
  ipAddress: string;

  @ApiProperty()
  userAgent: string;

  @ApiProperty()
  location: string;

  @ApiProperty({
    description: 'Score de risque (0-100)',
    minimum: 0,
    maximum: 100,
  })
  riskScore: number;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  resolved: boolean;

  @ApiPropertyOptional()
  metadata?: any;
}

export class SecurityEventsResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  data: {
    events: SecurityEventDto[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}
