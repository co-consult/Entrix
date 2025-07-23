// src/modules/auth/dto/security/risk-assessment.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RiskAssessmentDto {
  @ApiProperty({
    description: 'Score de risque (0-100)',
    minimum: 0,
    maximum: 100,
  })
  score: number;

  @ApiProperty()
  factors: {
    unknownDevice: boolean;
    newLocation: boolean;
    unusualTime: boolean;
    failedAttempts: number;
    suspiciousIp: boolean;
    multipleSessions: boolean;
  };

  @ApiProperty({
    enum: ['ALLOW', 'REQUIRE_MFA', 'BLOCK', 'ALERT'],
  })
  recommendation: 'ALLOW' | 'REQUIRE_MFA' | 'BLOCK' | 'ALERT';

  @ApiProperty()
  requiresMfa: boolean;

  @ApiPropertyOptional()
  details?: {
    geolocation?: {
      country: string;
      city: string;
      suspicious: boolean;
    };
    device?: {
      fingerprint: string;
      trusted: boolean;
      lastSeen?: string;
    };
    behavior?: {
      loginPattern: string;
      velocityScore: number;
    };
  };
}