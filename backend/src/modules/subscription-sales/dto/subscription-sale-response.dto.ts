// src/modules/subscription-sales/dto/subscription-sale-response.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO pour les informations d'abonnement dans la réponse
 */
export class SubscriptionInfoDto {
  @ApiProperty({
    description: 'ID de l\'abonnement créé',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'QR code assigné à l\'abonnement',
    example: 'QR_2025_ABC123',
  })
  qrCode: string;

  @ApiProperty({
    description: 'Clé d\'onboarding pour conversion ultérieure',
    example: 'ONB_2025_ABC_XYZ123',
  })
  onboardingKey: string;
}

/**
 * DTO pour les informations utilisateur dans la réponse
 */
export class UserInfoDto {
  @ApiProperty({
    description: 'ID de l\'utilisateur',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Adresse email',
    example: 'ahmed.benali@email.com',
  })
  email: string;

  @ApiProperty({
    description: 'Prénom',
    example: 'Ahmed',
  })
  firstName: string;

  @ApiProperty({
    description: 'Nom de famille',
    example: 'Ben Ali',
  })
  lastName: string;
}

/**
 * DTO pour les informations de commande
 */
export class OrderInfoDto {
  @ApiProperty({
    description: 'ID de la commande',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Montant total',
    example: 150.00,
  })
  total: number;

  @ApiProperty({
    description: 'Devise',
    example: 'TND',
  })
  currency: string;
}

/**
 * DTO pour les incentives appliqués
 */
export class IncentiveInfoDto {
  @ApiProperty({
    description: 'Type d\'incentive',
    example: 'BONUS_POINTS',
  })
  type: string;

  @ApiProperty({
    description: 'Valeur de l\'incentive',
    example: 100,
  })
  value: number;

  @ApiProperty({
    description: 'Description de l\'incentive',
    example: '100 points bonus à l\'inscription',
  })
  description: string;
}

/**
 * DTO de réponse pour création de vente d'abonnement
 */
export class SubscriptionSaleResponseDto {
  @ApiProperty({
    description: 'Statut de la réponse',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Liste des abonnements créés',
    type: [SubscriptionInfoDto],
  })
  subscriptions: SubscriptionInfoDto[];

  @ApiPropertyOptional({
    description: 'Informations utilisateur (si saleMode = IDENTIFIED)',
    type: UserInfoDto,
  })
  user?: UserInfoDto;

  @ApiProperty({
    description: 'Informations de commande',
    type: OrderInfoDto,
  })
  order: OrderInfoDto;

  @ApiProperty({
    description: 'Message de confirmation',
    example: 'Vente d\'abonnement réalisée avec succès. 2 abonnements créés.',
  })
  message: string;
}

/**
 * DTO de réponse pour conversion anonyme
 */
export class ConversionResponseDto {
  @ApiProperty({
    description: 'Statut de la réponse',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Informations de l\'utilisateur créé',
    type: UserInfoDto,
  })
  user: UserInfoDto;

  @ApiProperty({
    description: 'Nombre d\'abonnements migrés',
    example: 2,
  })
  subscriptionsMigrated: number;

  @ApiPropertyOptional({
    description: 'Incentives appliqués',
    type: IncentiveInfoDto,
  })
  incentivesApplied?: IncentiveInfoDto;

  @ApiProperty({
    description: 'Message de confirmation',
    example: 'Compte créé avec succès. 2 abonnements ont été associés à votre compte.',
  })
  message: string;
}

/**
 * DTO de réponse pour validation QR codes
 */
export class QRCodeValidationDto {
  @ApiProperty({
    description: 'QR code validé',
    example: 'QR_2025_ABC123',
  })
  qrCode: string;

  @ApiProperty({
    description: 'Disponibilité du QR code',
    example: true,
  })
  isAvailable: boolean;

  @ApiProperty({
    description: 'Statut du QR code',
    example: 'AVAILABLE',
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Date d\'assignation (si applicable)',
    example: '2025-01-15T10:30:00Z',
  })
  assignedAt?: Date;

  @ApiPropertyOptional({
    description: 'Message d\'erreur (si non disponible)',
    example: 'QR code déjà assigné',
  })
  errorMessage?: string;
}