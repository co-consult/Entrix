// src/modules/auth/dto/mfa/mfa-challenge.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { MfaProvider } from '../../constants/auth.constants';

/**
 * DTO MFA Challenge Response Entrix V3.0
 * Respecte api_specs_auth_session.md
 * 
 * Note: Renommé pour éviter conflit avec MfaChallengeDto dans login-response.dto
 */

export class MfaChallengeResponseDto {
  @ApiProperty({
    description: 'Méthodes MFA disponibles',
    enum: ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP'],
    isArray: true,
    example: ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP'],
  })
  methods: MfaProvider[];

  @ApiProperty({
    description: 'Token temporaire pour MFA',
    example: 'mfa_challenge_1642694400_abc123def',
  })
  challengeToken: string;

  @ApiProperty({
    description: 'Durée de validité en secondes',
    example: 300,
    minimum: 60,
    maximum: 600,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Instructions pour l\'utilisateur',
    example: 'Veuillez choisir une méthode de vérification et saisir le code reçu',
  })
  instructions: string;

  @ApiProperty({
    description: 'Informations additionnelles par méthode',
    example: {
      SMS_OTP: { masked_phone: '+216***45678', estimated_delivery: '30 seconds' },
      EMAIL_OTP: { masked_email: 'u***@entrix.tn', estimated_delivery: '1 minute' },
      TOTP_APP: { app_name: 'Google Authenticator', setup_required: false }
    },
  })
  methodsInfo: Record<string, any>;
}