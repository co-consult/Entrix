// src/modules/auth/dto/mfa-config.dto.ts
/**
 * DTO pour configuration MFA utilisateur
 * 
 * Structure :
 * - État d'activation MFA
 * - Méthodes configurées
 * - Codes de secours disponibles
 * - Historique d'utilisation
 * 
 * Utilisation :
 * - Status MFA utilisateur
 * - Configuration disponible
 * - Gestion méthodes multiples
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { mfa_method } from '@prisma/client';

export class MfaMethodConfigDto {
  @ApiProperty({ 
    description: 'Méthode MFA',
    enum: mfa_method,
    example: 'SMS' 
  })
  method: mfa_method;

  @ApiProperty({ 
    description: 'Méthode activée',
    example: true 
  })
  enabled: boolean;

  @ApiProperty({ 
    description: 'Méthode vérifiée',
    example: true 
  })
  verified: boolean;

  @ApiProperty({ 
    description: 'Date de configuration',
    example: '2025-01-07T10:30:00.000Z' 
  })
  configuredAt: Date;

  @ApiPropertyOptional({ 
    description: 'Dernière utilisation',
    example: '2025-01-07T09:45:00.000Z' 
  })
  lastUsed?: Date;

  @ApiPropertyOptional({ 
    description: 'Informations spécifiques à la méthode (masquées)',
    example: { phoneNumber: '+216**\*\***456' }
  })
  metadata?: Record<string, any>;
}

export class BackupCodesInfoDto {
  @ApiProperty({ 
    description: 'Codes de secours générés',
    example: true 
  })
  generated: boolean;

  @ApiProperty({ 
    description: 'Date de génération',
    example: '2025-01-07T10:30:00.000Z' 
  })
  generatedAt: Date;

  @ApiProperty({ 
    description: 'Nombre total de codes',
    example: 8 
  })
  totalCodes: number;

  @ApiProperty({ 
    description: 'Nombre de codes utilisés',
    example: 2 
  })
  usedCodes: number;

  @ApiProperty({ 
    description: 'Codes restants',
    example: 6 
  })
  remainingCodes: number;

  @ApiPropertyOptional({ 
    description: 'Date d\'expiration des codes',
    example: '2026-01-07T10:30:00.000Z' 
  })
  expiresAt?: Date;
}

export class MfaConfigDto {
  /**
   * MFA activé globalement
   */
  @ApiProperty({
    description: 'Indique si MFA est activé pour l\'utilisateur',
    example: true,
  })
  enabled: boolean;

  /**
   * Méthodes MFA configurées
   */
  @ApiProperty({
    description: 'Liste des méthodes MFA configurées',
    type: [MfaMethodConfigDto],
  })
  @Type(() => MfaMethodConfigDto)
  methods: MfaMethodConfigDto[];

  /**
   * Méthode par défaut
   */
  @ApiPropertyOptional({
    description: 'Méthode MFA par défaut utilisée',
    enum: mfa_method,
    example: 'SMS',
  })
  defaultMethod?: mfa_method;

  /**
   * Codes de secours
   */
  @ApiPropertyOptional({
    description: 'Informations sur les codes de secours',
    type: BackupCodesInfoDto,
  })
  @Type(() => BackupCodesInfoDto)
  backupCodes?: BackupCodesInfoDto;

  /**
   * Dernière vérification MFA
   */
  @ApiPropertyOptional({
    description: 'Date de la dernière vérification MFA réussie',
    example: '2025-01-07T09:45:00.000Z',
  })
  lastVerified?: Date;

  /**
   * Statistiques d'utilisation
   */
  @ApiProperty({
    description: 'Statistiques d\'utilisation MFA',
    example: {
      totalVerifications: 145,
      failedAttempts: 3,
      lastFailedAttempt: '2025-01-06T15:30:00.000Z'
    },
  })
  statistics: {
    totalVerifications: number;
    failedAttempts: number;
    lastFailedAttempt?: Date;
  };

  /**
   * Exigences de sécurité
   */
  @ApiProperty({
    description: 'Exigences de sécurité pour cet utilisateur',
    example: {
      required: true,
      reason: 'Compte à privilèges élevés',
      enforced: true,
      canDisable: false
    },
  })
  securityRequirements: {
    required: boolean;
    reason?: string;
    enforced: boolean;
    canDisable: boolean;
  };

  /**
   * Configuration recommandée
   */
  @ApiProperty({
    description: 'Méthodes MFA recommandées pour cet utilisateur',
    example: ['TOTP', 'SMS'],
    type: [String],
  })
  recommendedMethods: mfa_method[];

  /**
   * Prochaine configuration requise
   */
  @ApiPropertyOptional({
    description: 'Prochaine étape de configuration MFA requise',
    example: 'Configurer une méthode de secours',
  })
  nextStepRequired?: string;

  /**
   * Restrictions actives
   */
  @ApiPropertyOptional({
    description: 'Restrictions actives sur le compte',
    example: {
      temporaryLock: false,
      suspiciousActivity: false,
      requiresAdditionalVerification: false
    },
  })
  restrictions?: {
    temporaryLock: boolean;
    suspiciousActivity: boolean;
    requiresAdditionalVerification: boolean;
    lockReason?: string;
    lockExpiresAt?: Date;
  };
}