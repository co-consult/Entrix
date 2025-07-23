// src/modules/auth/dto/session/refresh-token.dto.ts

import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TokenPairDto } from '../auth/login-response.dto'

/**
 * DTO Refresh Token Request Entrix V3.0
 */

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Token de rafraîchissement',
  })
  @IsString()
  @IsNotEmpty({ message: 'Token de rafraîchissement requis' })
  refreshToken: string;
}

export class RefreshTokenResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiPropertyOptional()
  data?: {
    tokens: TokenPairDto;
    sessionExtended: boolean;
  };
}