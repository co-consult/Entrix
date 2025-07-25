// src/modules/auth/dto/auth/register-response.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TokenPairDto, UserProfileDto, UserProfileMapper, SessionInfoDto } from './login-response.dto';
import { IRegisterResult } from '../../interfaces/auth.interfaces';

/**
 * DTO Register Response Entrix V3.0
 * ✅ AMÉLIORÉ : Support session automatique après inscription
 * Respecte api_specs_auth_session.md
 */

// VerificationInfoDto (inchangé)
export class VerificationInfoDto {
  @ApiProperty({ description: 'Email de vérification envoyé' })
  emailSent: boolean;

  @ApiProperty({ description: 'Vérification email requise' })
  verificationRequired: boolean;

  @ApiProperty({ description: 'ID du token de vérification' })
  tokenId: string;
}

// OnboardingInfoDto (inchangé)
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

// ✅ AMÉLIORÉ : RegisterResponseDto avec session automatique
export class RegisterResponseDto {
  @ApiProperty({ description: 'Statut de la requête' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Données d\'inscription' })
  data?: {
    user: UserProfileDto;
    tokens?: TokenPairDto; // ✅ NOUVEAU : Tokens si session créée automatiquement
    session?: SessionInfoDto; // ✅ NOUVEAU : Session si créée automatiquement
    verification: VerificationInfoDto;
    onboarding?: OnboardingInfoDto;
  };

  @ApiPropertyOptional({ description: 'Message informatif' })
  message?: string;

  @ApiPropertyOptional({ description: 'Métadonnées' })
  meta?: {
    autoLoginEnabled: boolean; // ✅ NOUVEAU : Indique si login automatique activé
    sessionCreated: boolean; // ✅ NOUVEAU : Indique si session créée
  };
}

/**
 * ✅ AMÉLIORÉ : MAPPER IRegisterResult → RegisterResponseDto
 * Gère la nouvelle logique de session automatique
 */
export class RegisterResponseMapper {
  static toDto(registerResult: IRegisterResult): RegisterResponseDto {
    return {
      success: registerResult.success,
      data: registerResult.user ? {
        user: UserProfileMapper.toDto(registerResult.user),
        tokens: registerResult.tokens, // ✅ NOUVEAU : Inclus si présent
        session: registerResult.session, // ✅ NOUVEAU : Inclus si présent
        verification: registerResult.verification || {
          emailSent: false,
          verificationRequired: false,
          tokenId: '',
        },
        onboarding: registerResult.onboarding,
      } : undefined,
      message: registerResult.message || (
        registerResult.success 
          ? 'Inscription réussie. Vérifiez votre email pour activer votre compte.'
          : 'Erreur lors de l\'inscription.'
      ),
      meta: {
        autoLoginEnabled: !!(registerResult.tokens && registerResult.session), // ✅ NOUVEAU
        sessionCreated: !!registerResult.session, // ✅ NOUVEAU
      },
    };
  }
}