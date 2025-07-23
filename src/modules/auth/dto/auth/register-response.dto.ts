// src/modules/auth/dto/auth/register-response.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TokenPairDto, UserProfileDto } from './login-response.dto'

export class RegisterResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiPropertyOptional()
  data?: {
    user: UserProfileDto;
    tokens: TokenPairDto;
    verification: {
      emailSent: boolean;
      verificationRequired: boolean;
    };
    onboarding?: {
      incentiveApplied: boolean;
      incentiveType: string;
      incentiveValue: number;
      migratedTickets: number;
    };
  };
}