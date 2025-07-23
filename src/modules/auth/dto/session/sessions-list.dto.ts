// src/modules/auth/dto/session/sessions-list.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SessionDto {
  @ApiProperty()
  sessionId: string;

  @ApiProperty()
  deviceInfo: any; // DeviceInfoDto

  @ApiProperty()
  location: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  lastActivity: string;

  @ApiProperty()
  isCurrent: boolean;
}

export class SessionsListResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  data: {
    sessions: SessionDto[];
    total: number;
  };
}

export class RevokeSessionResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  data: {
    sessionRevoked: boolean;
    sessionId: string;
  };
}