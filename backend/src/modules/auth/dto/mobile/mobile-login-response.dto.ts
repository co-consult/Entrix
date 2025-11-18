import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO Mobile Login Response Entrix V3.0
 * Réponse optimisée pour l'application mobile
 */

export class MobileUserProfileDto {
  @ApiProperty({
    description: 'ID utilisateur',
    example: 'user_123456789'
  })
  id: string;

  @ApiProperty({
    description: 'Nom d\'utilisateur',
    example: 'controller_001'
  })
  username: string;

  @ApiProperty({
    description: 'Email utilisateur',
    example: 'controller_001@entrix.tn'
  })
  email: string;

  @ApiProperty({
    description: 'Rôle utilisateur',
    example: 'controller'
  })
  role: string;

  @ApiProperty({
    description: 'Permissions utilisateur',
    type: [String],
    example: ['scan_tickets', 'view_events']
  })
  permissions: string[];

  @ApiPropertyOptional({
    description: 'Profil utilisateur',
    type: 'object',
    additionalProperties: false
  })
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
}

export class MobileSessionDto {
  @ApiProperty({
    description: 'ID de session',
    example: 'session_123456789'
  })
  id: string;

  @ApiProperty({
    description: 'Date d\'expiration de session',
    example: '2025-02-15T20:00:00Z'
  })
  expiresAt: string;
}

export class MobileMfaChallengeDto {
  @ApiProperty({
    description: 'Token de challenge MFA',
    example: 'mfa_challenge_123456789'
  })
  token: string;

  @ApiProperty({
    description: 'Type de challenge MFA',
    example: 'totp'
  })
  method: string;

  @ApiProperty({
    description: 'Expiration du challenge',
    example: '2025-02-15T15:05:00Z'
  })
  expiresAt: string;
}

export class MobileLoginResponseDto {
  @ApiProperty({
    description: 'Succès de l\'opération',
    example: true
  })
  success: boolean;

  @ApiProperty({
    description: 'Token d\'accès JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  accessToken: string;

  @ApiProperty({
    description: 'Token de rafraîchissement',
    example: 'refresh_token_123456789'
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Informations utilisateur',
    type: MobileUserProfileDto
  })
  user: MobileUserProfileDto;

  @ApiPropertyOptional({
    description: 'Informations de session',
    type: MobileSessionDto
  })
  session?: MobileSessionDto;

  @ApiProperty({
    description: 'MFA requis',
    example: false
  })
  requiresMfa: boolean;

  @ApiPropertyOptional({
    description: 'Challenge MFA si requis',
    type: MobileMfaChallengeDto
  })
  mfaChallenge?: MobileMfaChallengeDto;
} 