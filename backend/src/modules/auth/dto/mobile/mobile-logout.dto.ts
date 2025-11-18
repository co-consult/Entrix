import { 
  IsOptional, 
  IsBoolean 
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO Mobile Logout Request Entrix V3.0
 * Déconnexion mobile
 */

export class MobileLogoutDto {
  @ApiPropertyOptional({
    description: 'Déconnexion de tous les appareils',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  allDevices?: boolean = false;
} 