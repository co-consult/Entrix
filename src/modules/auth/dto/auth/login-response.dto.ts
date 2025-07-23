// src/modules/auth/dto/auth/login-response.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ITokenPair, ISessionInfo } from '../../interfaces/session.interface';
import { IUserProfile } from '../../interfaces/user.interface';
import { IMfaChallenge } from '../../interfaces/mfa.interface';
/**
 * DTO Login Response Entrix V3.0
 * Respecte api_specs_auth_session.md
 */

export class UserProfileDto implements Omit<IUserProfile, 'created_at' | 'updated_at' | 'email_verified' | 'phone_verified' | 'last_login'> {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  first_name: string;

  @ApiProperty()
  last_name: string;

  @ApiPropertyOptional()
  phone: string | null;

  @ApiPropertyOptional()
  avatar: string | null;

  @ApiProperty()
  is_active: boolean;

  @ApiPropertyOptional()
  emailVerified?: boolean;

  @ApiPropertyOptional()
  phoneVerified?: boolean;

  @ApiPropertyOptional()
  lastLoginAt?: string;

  @ApiPropertyOptional()
  roles?: string[];

  @ApiPropertyOptional()
  permissions?: string[];

  @ApiPropertyOptional()
  subscription?: {
    tier: 'FREE' | 'PREMIUM' | 'VIP';
    expiresAt?: string;
  };

  @ApiPropertyOptional()
  preferences?: any;

  @ApiPropertyOptional()
  metadata: any | null;
}

export class TokenPairDto implements ITokenPair {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty({ enum: ['Bearer'] })
  tokenType: 'Bearer';

  @ApiProperty()
  expiresIn: number;
}

export class SessionInfoDto implements ISessionInfo {
  @ApiProperty()
  sessionId: string;

  @ApiProperty()
  expiresAt: string;

  @ApiProperty()
  deviceInfo: any;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  lastActivity: string;
}

export class MfaChallengeDto implements IMfaChallenge {
  @ApiProperty({ enum: ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP'] })
  methods: any[];

  @ApiProperty()
  challengeToken: string;

  @ApiProperty()
  expiresIn: number;
}

export class LoginResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiPropertyOptional()
  data?: {
    user: UserProfileDto;
    tokens: TokenPairDto;
    session: SessionInfoDto;
    mfaRequired?: MfaChallengeDto;
  };

  @ApiPropertyOptional()
  meta?: {
    riskScore: number;
    requiresMfa: boolean;
    ipGeolocation: string;
  };
}