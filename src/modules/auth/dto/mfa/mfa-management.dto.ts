// src/modules/auth/dto/mfa/mfa-management.dto.ts

import { 
  IsString, 
  IsEnum, 
  IsOptional, 
  IsBoolean, 
  Length,
  ValidateIf
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MfaProvider } from '../../constants/auth.constants';

/**
 * DTOs pour gestion MFA Entrix V3.0
 * Respecte api_specs_auth_session.md
 */

// DTO pour activer/désactiver MFA
export class MfaToggleDto {
  @ApiProperty({
    description: 'Activer ou désactiver la méthode MFA',
    example: true
  })
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  enable: boolean;

  @ApiPropertyOptional({
    description: 'Code de vérification pour désactivation (requis pour désactiver)',
    minLength: 6,
    maxLength: 8
  })
  @IsOptional()
  @IsString()
  @Length(6, 8)
  @ValidateIf((o) => o.enable === false)
  verificationCode?: string;

  @ApiPropertyOptional({
    description: 'Token de challenge pour vérification'
  })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.enable === false)
  challengeToken?: string;
}

// DTO pour supprimer complètement une méthode MFA
export class MfaDisableDto {
  @ApiPropertyOptional({
    description: 'Code de confirmation pour suppression',
    minLength: 6,
    maxLength: 8
  })
  @IsOptional()
  @IsString()
  @Length(6, 8)
  confirmationCode?: string;

  @ApiPropertyOptional({
    description: 'Token de challenge pour vérification'
  })
  @IsOptional()
  @IsString()
  challengeToken?: string;

  @ApiPropertyOptional({
    description: 'Raison de la suppression (optionnel)',
    maxLength: 200
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

// DTO pour régénérer les codes de récupération
export class MfaRegenerateBackupCodesDto {
  @ApiProperty({
    description: 'Méthode MFA pour vérification',
    enum: ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP']
  })
  @IsEnum(['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP'])
  verificationMethod: Exclude<MfaProvider, 'BACKUP_CODE'>;

  @ApiProperty({
    description: 'Code de vérification',
    minLength: 6,
    maxLength: 8
  })
  @IsString()
  @Length(6, 8)
  verificationCode: string;

  @ApiProperty({
    description: 'Token de challenge pour vérification'
  })
  @IsString()
  challengeToken: string;
}

// DTO pour configuration avancée MFA
export class MfaAdvancedConfigDto {
  @ApiPropertyOptional({
    description: 'Définir comme méthode primaire',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isPrimary?: boolean = false;

  @ApiPropertyOptional({
    description: 'Nom personnalisé pour la méthode'
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  customName?: string;

  @ApiPropertyOptional({
    description: 'Numéro de téléphone de secours (pour SMS)'
  })
  @IsOptional()
  @IsString()
  @Length(8, 20)
  backupPhone?: string;
}

// Réponse pour les providers MFA disponibles
export class MfaProviderInfoDto {
  @ApiProperty()
  provider: MfaProvider;

  @ApiProperty()
  isConfigured: boolean;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  setupTime: number; // minutes

  @ApiProperty()
  isRecommended: boolean;
}

export class MfaProvidersResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  data: {
    providers: MfaProviderInfoDto[];
    recommendedProvider: MfaProvider;
    hasMfaConfigured: boolean;
    methodsInfo: Record<string, any>;
  };
}

// Réponse pour le statut MFA
export class MfaStatusDto {
  @ApiProperty()
  isEnabled: boolean;

  @ApiProperty({ type: [String] })
  configuredMethods: MfaProvider[];

  @ApiPropertyOptional()
  primaryMethod?: MfaProvider;

  @ApiProperty()
  trustedDevicesCount: number;

  @ApiProperty()
  backupCodesRemaining: number;

  @ApiPropertyOptional()
  lastUsed?: string; // ISO 8601

  @ApiProperty({ 
    description: 'Score de sécurité de 0 à 100',
    minimum: 0,
    maximum: 100
  })
  securityScore: number;
}

export class MfaStatusResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  data: MfaStatusDto;
}

// Réponse pour les appareils de confiance
export class TrustedDeviceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  deviceName: string;

  @ApiProperty()
  trustedAt: string; // ISO 8601

  @ApiProperty()
  lastSeenAt: string; // ISO 8601

  @ApiProperty()
  expiresAt: string; // ISO 8601

  @ApiPropertyOptional()
  ipAddress?: string;

  @ApiProperty()
  isCurrent: boolean;

  @ApiProperty()
  isActive: boolean;
}

export class TrustedDevicesResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  data: {
    devices: TrustedDeviceDto[];
    totalCount: number;
  };
}

// DTO pour envoi de code OTP
export class MfaSendCodeDto {
  @ApiProperty({
    description: 'Méthode pour envoyer le code',
    enum: ['SMS_OTP', 'EMAIL_OTP']
  })
  @IsEnum(['SMS_OTP', 'EMAIL_OTP'])
  method: 'SMS_OTP' | 'EMAIL_OTP';

  @ApiPropertyOptional({
    description: 'Token de challenge (si dans un flow d\'auth)'
  })
  @IsOptional()
  @IsString()
  challengeToken?: string;

  @ApiPropertyOptional({
    description: 'Numéro alternatif pour SMS (si configuré)'
  })
  @IsOptional()
  @IsString()
  @Length(8, 20)
  alternatePhone?: string;
}

export class MfaSendCodeResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  data: {
    method: 'SMS_OTP' | 'EMAIL_OTP';
    sentTo: string; // Masqué (ex: +216***45678)
    expiresIn: number; // secondes
    estimatedDelivery: string; // "30 seconds", "1 minute"
    canResendAfter: number; // secondes
  };

  @ApiPropertyOptional()
  message?: string;
}

// DTO pour configuration de session MFA
export class MfaSessionConfigDto {
  @ApiPropertyOptional({
    description: 'Durée avant re-demande MFA (secondes)',
    minimum: 300, // 5 minutes minimum
    maximum: 86400 // 24 heures maximum
  })
  @IsOptional()
  mfaSessionDuration?: number;

  @ApiPropertyOptional({
    description: 'Permettre mémorisation appareil',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  allowDeviceTrust?: boolean = true;

  @ApiPropertyOptional({
    description: 'Durée mémorisation appareil (jours)',
    minimum: 1,
    maximum: 90
  })
  @IsOptional()
  deviceTrustDuration?: number;
}

// DTO pour statistiques MFA
export class MfaStatsDto {
  @ApiProperty()
  totalVerifications: number;

  @ApiProperty()
  successfulVerifications: number;

  @ApiProperty()
  failedVerifications: number;

  @ApiProperty()
  lastSuccessfulVerification?: string; // ISO 8601

  @ApiProperty()
  mostUsedMethod: MfaProvider;

  @ApiProperty()
  methodUsageStats: Record<MfaProvider, number>;

  @ApiProperty()
  trustedDevicesHistory: {
    added: number;
    removed: number;
    expired: number;
  };
}

export class MfaStatsResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  data: MfaStatsDto;
}