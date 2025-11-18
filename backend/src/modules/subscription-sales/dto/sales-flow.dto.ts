// src/modules/subscription-sales/dto/sales-flow.dto.ts

import {
  IsUUID,
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsOptional,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Réutilisation du DTO existant
import { CustomerInfoDto } from './create-subscription-sale.dto';
import { PaymentMethod } from '../types/sale-types';

/**
 * DTO pour démarrer une session de vente
 */
export class StartSalesSessionDto {
  @ApiPropertyOptional({
    description: 'ID du vendeur',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID(4, { message: 'L\'ID du vendeur doit être un UUID valide' })
  sellerId?: string;

  @ApiPropertyOptional({
    description: 'ID de l\'organisateur pour filtrer les plans',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID(4, { message: 'L\'ID de l\'organisateur doit être un UUID valide' })
  organizerId?: string;
}

/**
 * DTO pour sélectionner un plan d'abonnement
 */
export class SelectPlanDto {
  @ApiProperty({
    description: 'ID du plan d\'abonnement sélectionné',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID(4, { message: 'L\'ID du plan doit être un UUID valide' })
  planId: string;

  @ApiProperty({
    description: 'Quantité d\'abonnements demandés',
    example: 2,
    minimum: 1,
    maximum: 1000,
  })
  @IsNumber({}, { message: 'La quantité doit être un nombre' })
  @Min(1, { message: 'La quantité doit être au moins 1' })
  @Max(1000, { message: 'La quantité ne peut pas dépasser 1000' })
  @Type(() => Number)
  quantity: number;
}

/**
 * DTO pour sélectionner une zone
 */
export class SelectZoneDto {
  @ApiProperty({
    description: 'ID de la zone sélectionnée',
    example: 'zone_premium_a',
  })
  @IsString({ message: 'L\'ID de la zone doit être une chaîne de caractères' })
  zoneId: string;
}

/**
 * DTO pour sélectionner des places
 */
export class SelectSeatsDto {
  @ApiProperty({
    description: 'IDs des places sélectionnées',
    example: ['seat_001', 'seat_002'],
    type: [String],
  })
  @IsArray({ message: 'Les IDs des places doivent être fournis sous forme de tableau' })
  @ArrayMinSize(1, { message: 'Au moins une place doit être sélectionnée' })
  @ArrayMaxSize(1000, { message: 'Maximum 1000 places autorisées' })
  @IsString({ each: true, message: 'Chaque ID de place doit être une chaîne de caractères' })
  seatIds: string[];
}

/**
 * DTO pour une carte physique
 */
export class PhysicalCardDto {
  @ApiPropertyOptional({
    description: 'QR code de la carte physique',
    example: 'QR_2025_ABC123',
  })
  @IsOptional()
  @IsString({ message: 'Le QR code doit être une chaîne de caractères' })
  qrCode?: string;

  @ApiPropertyOptional({
    description: 'Numéro de série de la carte physique',
    example: 'A001',
  })
  @IsOptional()
  @IsString({ message: 'Le numéro de série doit être une chaîne de caractères' })
  serialNumber?: string;
}

/**
 * DTO pour valider les cartes physiques
 */
export class ValidatePhysicalCardsDto {
  @ApiProperty({
    description: 'Liste des cartes physiques à valider',
    type: [PhysicalCardDto],
  })
  @IsArray({ message: 'Les cartes doivent être fournies sous forme de tableau' })
  @ArrayMinSize(1, { message: 'Au moins une carte doit être fournie' })
  @ArrayMaxSize(1000, { message: 'Maximum 1000 cartes autorisées' })
  @ValidateNested({ each: true })
  @Type(() => PhysicalCardDto)
  cards: PhysicalCardDto[];
}

/**
 * DTO pour finaliser la vente
 */
export class CompleteSaleDto {
  @ApiProperty({
    description: 'Informations client',
    type: CustomerInfoDto,
  })
  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customerInfo: CustomerInfoDto;

  @ApiProperty({
    description: 'Méthode de paiement',
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  @IsEnum(PaymentMethod, { message: 'Méthode de paiement invalide' })
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Mode de vente',
    enum: ['IDENTIFIED', 'ANONYMOUS'],
    example: 'IDENTIFIED',
    default: 'IDENTIFIED',
  })
  @IsOptional()
  @IsEnum(['IDENTIFIED', 'ANONYMOUS'], { message: 'Mode de vente invalide' })
  saleMode?: 'IDENTIFIED' | 'ANONYMOUS';
}

/**
 * DTO pour finaliser une vente anonyme
 */
export class CompleteAnonymousSaleDto {
  @ApiProperty({
    description: 'Méthode de paiement',
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  @IsEnum(PaymentMethod, { message: 'Méthode de paiement invalide' })
  paymentMethod: PaymentMethod;
}

// ============================================================================
// DTOs DE RÉPONSE
// ============================================================================

/**
 * DTO de réponse pour une étape du flow
 */
export class FlowStepResponseDto {
  @ApiProperty({
    description: 'Statut de la réponse',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'ID de la session de vente',
    example: 'SALES_1642680000_ABC123',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Étape courante du flow',
    example: 'ZONE_SEAT_SELECTION',
  })
  currentStep: string;

  @ApiPropertyOptional({
    description: 'Prochaine étape suggérée',
    example: 'CARD_VALIDATION',
  })
  nextStep?: string;

  @ApiProperty({
    description: 'Données spécifiques à l\'étape',
  })
  data: any;

  @ApiProperty({
    description: 'Message descriptif',
    example: 'Plan sélectionné. Choisissez votre zone préférée.',
  })
  message: string;

  @ApiProperty({
    description: 'Actions autorisées à cette étape',
    example: ['SELECT_ZONE', 'CHANGE_PLAN', 'CANCEL_SESSION'],
    type: [String],
  })
  allowedActions: string[];
}

/**
 * DTO de réponse pour la liste des plans
 */
export class AvailablePlansResponseDto {
  @ApiProperty({
    description: 'Statut de la réponse',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Liste des plans d\'abonnement disponibles',
  })
  data: any[];

  @ApiProperty({
    description: 'Nombre de plans disponibles',
    example: 3,
  })
  totalPlans: number;

  @ApiProperty({
    description: 'Message descriptif',
    example: '3 plans d\'abonnement disponibles',
  })
  message: string;
}

/**
 * DTO de réponse pour les zones d'un plan
 */
export class PlanZonesResponseDto {
  @ApiProperty({
    description: 'Statut de la réponse',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'ID du plan',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  planId: string;

  @ApiProperty({
    description: 'Type de sélection requis',
    example: 'MULTIPLE_ZONES',
  })
  selectionType: string;

  @ApiProperty({
    description: 'Zones disponibles pour ce plan',
  })
  zones: any[];

  @ApiProperty({
    description: 'Message descriptif',
    example: 'Le client doit d\'abord choisir une zone',
  })
  message: string;
}

/**
 * DTO de réponse pour les places d'une zone
 */
export class ZoneSeatsResponseDto {
  @ApiProperty({
    description: 'Statut de la réponse',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'ID de la zone',
    example: 'zone_premium_a',
  })
  zoneId: string;

  @ApiProperty({
    description: 'Nom de la zone',
    example: 'Tribune Premium A',
  })
  zoneName: string;

  @ApiProperty({
    description: 'La zone a-t-elle des places individuelles',
    example: true,
  })
  hasSeats: boolean;

  @ApiProperty({
    description: 'Places disponibles',
  })
  availableSeats: any[];

  @ApiProperty({
    description: 'Peut accommoder la quantité demandée',
    example: true,
  })
  canAccommodateQuantity: boolean;

  @ApiProperty({
    description: 'Message descriptif',
    example: '45 place(s) disponible(s)',
  })
  message: string;
}