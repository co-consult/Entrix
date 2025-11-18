// src/modules/auth/dto/session/device-info.dto.ts

import { IsString, IsBoolean, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IDeviceInfo } from '../../interfaces/session.interface';

/**
 * DTO Device Info Entrix V3.0
 */

export class DeviceInfoDto implements IDeviceInfo {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty()
  @IsString()
  userAgent: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  browser?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  os?: string;

  @ApiProperty()
  @IsBoolean()
  isMobile: boolean;

  @ApiProperty()
  @IsString()
  ipAddress: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  geolocation?: {
    country: string;
    city: string;
    coordinates?: [number, number];
  };
}