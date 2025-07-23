// src/modules/auth/dto/auth/register-response.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TokenPairDto, UserProfileDto, UserProfileMapper } from './login-response.dto';
import { IRegisterResult } from '../../interfaces/auth.interfaces';

/**
 * DTO Register Response Entrix V3.0
 * CORRIGÉ : Utilise UserProfileDto harmonisé (camelCase)
 * Respecte api_specs_auth_session.md
 */

export class VerificationInfoDto {
  @ApiProperty({ description: 'Email de vérification envoyé' })
  emailSent: boolean;

  @ApiProperty({ description: 'Vérification email requise' })
  verificationRequired: boolean;
}

export class OnboardingInfoDto {
  @ApiProperty({ description: 'Incentive appliqué lors de l\'inscription' })
  incentiveApplied: boolean;

  @ApiProperty({ description: 'Type d\'incentive appliqué' })
  incentiveType: string;

  @ApiProperty({ description: 'Valeur de l\'incentive' })
  incentiveValue: number;

  @ApiProperty({ description: 'Nombre de tickets migrés' })
  migratedTickets: number;
}

export class RegisterResponseDto {
  @ApiProperty({ description: 'Statut de la requête' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Données d\'inscription' })
  data?: {
    user: UserProfileDto;        // ✅ Utilise DTO harmonisé
    tokens: TokenPairDto;
    verification: VerificationInfoDto;
    onboarding?: OnboardingInfoDto;
  };

  @ApiPropertyOptional({ description: 'Message informatif' })
  message?: string;
}

/**
 * MAPPER : IRegisterResult → RegisterResponseDto
 * Convertit résultat service vers DTO API
 */
export class RegisterResponseMapper {
  static toDto(registerResult: IRegisterResult): RegisterResponseDto {
    return {
      success: registerResult.success,
      data: registerResult.user && registerResult.tokens ? {
        user: UserProfileMapper.toDto(registerResult.user),  // ✅ Utilise mapper harmonisé
        tokens: registerResult.tokens,
        verification: registerResult.verification || {
          emailSent: false,
          verificationRequired: false,
        },
        onboarding: registerResult.onboarding,
      } : undefined,
      message: registerResult.success 
        ? 'Inscription réussie. Vérifiez votre email pour activer votre compte.'
        : 'Erreur lors de l\'inscription.',
    };
  }
}