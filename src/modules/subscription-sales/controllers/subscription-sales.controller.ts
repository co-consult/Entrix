// src/modules/subscription-sales/controllers/subscription-sales.controller.ts

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
  ValidationPipe,
  BadRequestException
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

// Services
import { SubscriptionSalesService } from '../services/subscription-sales.service';
import { SubscriptionPlansService } from '../services/subscription-plans.service';
import { ZonesAndSeatsService } from '../services/zones-and-seats.service';
import { SalesFlowService } from '../services/sales-flow.service';

// DTOs
import { CreateSubscriptionSaleDto } from '../dto/create-subscription-sale.dto';
import { ConvertAnonymousSubscriptionDto } from '../dto/convert-anonymous-subscription.dto';
import { 
  SubscriptionSaleResponseDto, 
  ConversionResponseDto,
  QRCodeValidationDto
} from '../dto/subscription-sale-response.dto';
import {
  StartSalesSessionDto,
  SelectPlanDto,
  SelectZoneDto,
  SelectSeatsDto,
  ValidatePhysicalCardsDto,
  CompleteSaleDto,
  CompleteAnonymousSaleDto,
  FlowStepResponseDto,
  AvailablePlansResponseDto,
  PlanZonesResponseDto,
  ZoneSeatsResponseDto,
} from '../dto/sales-flow.dto';

// Guards (optionnels selon le contexte)
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

// Types
import { SaleMode } from '../types/sale-types';

/**
 * Contrôleur de Vente d'Abonnements Entrix V3.0 - Grade A+
 * 
 * Endpoints :
 * - Flow de vente complet (sessions)
 * - Vente directe (bypass flow)
 * - Conversion anonyme vers client enregistré
 * - Validation et gestion QR codes
 * - Consultation des ventes
 * - Gestion des sessions
 */
@ApiTags('Subscription Sales')
@UseGuards(JwtAuthGuard)
@Controller('subscription-sales')
export class SubscriptionSalesController {
  constructor(
    private readonly subscriptionSalesService: SubscriptionSalesService,
    private readonly subscriptionPlansService: SubscriptionPlansService,
    private readonly zonesAndSeatsService: ZonesAndSeatsService,
    private readonly salesFlowService: SalesFlowService,
  ) {}

  // ============================================================================
  // FLOW DE VENTE COMPLET - ÉTAPES 1, 2, 3
  // ============================================================================

  @Post('flow/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Démarrer une session de vente d\'abonnement',
    description: 'Étape 0 : Démarre une nouvelle session de vente et retourne les plans disponibles.',
  })
  @ApiBody({ type: StartSalesSessionDto })
  @ApiResponse({
    status: 200,
    description: 'Session démarrée avec succès',
    type: FlowStepResponseDto,
  })
  async startSalesSession(
    @Body(ValidationPipe) startDto: StartSalesSessionDto
  ): Promise<FlowStepResponseDto> {
    return await this.salesFlowService.startSalesSession(startDto.sellerId, startDto.organizerId);
  }

  @Post('flow/:sessionId/select-plan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sélectionner un plan d\'abonnement',
    description: 'Étape 1 : Sélectionne un plan et passe à la sélection de zones/places.',
  })
  @ApiParam({ name: 'sessionId', description: 'ID de la session de vente' })
  @ApiBody({ type: SelectPlanDto })
  @ApiResponse({
    status: 200,
    description: 'Plan sélectionné avec succès',
    type: FlowStepResponseDto,
  })
  async selectPlan(
    @Param('sessionId') sessionId: string,
    @Body(ValidationPipe) selectPlanDto: SelectPlanDto
  ): Promise<FlowStepResponseDto> {
    return await this.salesFlowService.selectPlan(
      sessionId,
      selectPlanDto.planId,
      selectPlanDto.quantity
    );
  }

  @Post('flow/:sessionId/select-zone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sélectionner une zone',
    description: 'Étape 2a : Sélectionne une zone (si plusieurs zones disponibles).',
  })
  @ApiParam({ name: 'sessionId', description: 'ID de la session de vente' })
  @ApiBody({ type: SelectZoneDto })
  @ApiResponse({
    status: 200,
    description: 'Zone sélectionnée avec succès',
    type: FlowStepResponseDto,
  })
  async selectZone(
    @Param('sessionId') sessionId: string,
    @Body(ValidationPipe) selectZoneDto: SelectZoneDto
  ): Promise<FlowStepResponseDto> {
    return await this.salesFlowService.selectZone(sessionId, selectZoneDto.zoneId);
  }

  @Post('flow/:sessionId/select-seats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sélectionner des places',
    description: 'Étape 2b : Sélectionne les places spécifiques (si la zone a des places).',
  })
  @ApiParam({ name: 'sessionId', description: 'ID de la session de vente' })
  @ApiBody({ type: SelectSeatsDto })
  @ApiResponse({
    status: 200,
    description: 'Places sélectionnées avec succès',
    type: FlowStepResponseDto,
  })
  async selectSeats(
    @Param('sessionId') sessionId: string,
    @Body(ValidationPipe) selectSeatsDto: SelectSeatsDto
  ): Promise<FlowStepResponseDto> {
    return await this.salesFlowService.selectSeats(sessionId, selectSeatsDto.seatIds);
  }

  @Post('flow/:sessionId/validate-cards')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Valider les cartes physiques',
    description: 'Étape 3a : Valide les QR codes ou numéros de série des cartes physiques.',
  })
  @ApiParam({ name: 'sessionId', description: 'ID de la session de vente' })
  @ApiBody({ type: ValidatePhysicalCardsDto })
  @ApiResponse({
    status: 200,
    description: 'Cartes validées avec succès',
    type: FlowStepResponseDto,
  })
  async validatePhysicalCards(
    @Param('sessionId') sessionId: string,
    @Body(ValidationPipe) validateCardsDto: ValidatePhysicalCardsDto
  ): Promise<FlowStepResponseDto> {
    return await this.salesFlowService.validatePhysicalCards(sessionId, validateCardsDto.cards);
  }

  @Post('flow/:sessionId/complete-sale')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Finaliser la vente avec informations client',
    description: 'Étape 3b : Finalise la vente avec les informations client (mode identifié).',
  })
  @ApiParam({ name: 'sessionId', description: 'ID de la session de vente' })
  @ApiBody({ type: CompleteSaleDto })
  @ApiResponse({
    status: 200,
    description: 'Vente finalisée avec succès',
    type: FlowStepResponseDto,
  })
  async completeSale(
    @Param('sessionId') sessionId: string,
    @Body(ValidationPipe) completeSaleDto: CompleteSaleDto
  ): Promise<FlowStepResponseDto> {
    return await this.salesFlowService.completeSale(
      sessionId,
      completeSaleDto.customerInfo,
      completeSaleDto.paymentMethod,
      completeSaleDto.saleMode || 'IDENTIFIED'
    );
  }

  @Post('flow/:sessionId/complete-anonymous-sale')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Finaliser la vente anonyme',
    description: 'Étape 3b : Finalise la vente sans informations client (mode anonyme).',
  })
  @ApiParam({ name: 'sessionId', description: 'ID de la session de vente' })
  @ApiBody({ type: CompleteAnonymousSaleDto })
  @ApiResponse({
    status: 200,
    description: 'Vente anonyme finalisée avec succès',
    type: FlowStepResponseDto,
  })
  async completeAnonymousSale(
    @Param('sessionId') sessionId: string,
    @Body(ValidationPipe) completeAnonymousDto: CompleteAnonymousSaleDto
  ): Promise<FlowStepResponseDto> {
    return await this.salesFlowService.completeSale(
      sessionId,
      null,
      completeAnonymousDto.paymentMethod,
      'ANONYMOUS'
    );
  }

  // ============================================================================
  // GESTION DE SESSION - ENDPOINTS EXISTANTS
  // ============================================================================

  @Get('flow/:sessionId/status')
  @ApiOperation({
    summary: 'Obtenir l\'état d\'une session de vente',
    description: 'Récupère l\'état actuel et les données d\'une session de vente.',
  })
  @ApiParam({ name: 'sessionId', description: 'ID de la session de vente' })
  @ApiResponse({
    status: 200,
    description: 'État de la session récupéré',
    type: FlowStepResponseDto,
  })
  async getSessionStatus(
    @Param('sessionId') sessionId: string
  ): Promise<FlowStepResponseDto> {
    return await this.salesFlowService.getSessionStatus(sessionId);
  }

  @Delete('flow/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Annuler une session de vente',
    description: 'Annule une session de vente et libère les ressources (places réservées, etc.).',
  })
  @ApiParam({ name: 'sessionId', description: 'ID de la session de vente' })
  @ApiResponse({
    status: 204,
    description: 'Session annulée avec succès',
  })
  async cancelSession(
    @Param('sessionId') sessionId: string
  ): Promise<void> {
    await this.salesFlowService.cancelSession(sessionId);
  }

  // ============================================================================
  // VENTE DIRECTE - BYPASS FLOW
  // ============================================================================

  @Post('direct-sale')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer une vente directe d\'abonnement',
    description: 'Crée une vente directe en bypassant le flow de session (pour cas d\'urgence ou intégrations).',
  })
  @ApiBody({ type: CreateSubscriptionSaleDto })
  @ApiResponse({
    status: 201,
    description: 'Vente créée avec succès',
    type: SubscriptionSaleResponseDto,
  })
  async createDirectSale(
    @Body(ValidationPipe) createSaleDto: CreateSubscriptionSaleDto
  ): Promise<SubscriptionSaleResponseDto> {
    // Validation si mode identifié requiert customerInfo
    if (createSaleDto.saleMode === SaleMode.IDENTIFIED && !createSaleDto.customerInfo) {
      throw new BadRequestException('Les informations client sont requises pour une vente identifiée');
    }

    // Construire les données de vente
    const saleData = {
      planId: createSaleDto.planId,
      quantity: createSaleDto.quantity,
      qrCodes: createSaleDto.qrCodes,
      saleMode: createSaleDto.saleMode,
      saleChannel: createSaleDto.saleChannel,
      paymentMethod: createSaleDto.paymentMethod,
      amount: createSaleDto.amount,
      currency: createSaleDto.currency,
      customerInfo: createSaleDto.customerInfo ? {
        firstName: createSaleDto.customerInfo.firstName,
        lastName: createSaleDto.customerInfo.lastName,
        email: createSaleDto.customerInfo.email,
        phone: createSaleDto.customerInfo.phone,
        fanId: createSaleDto.customerInfo.fanId,
      } : undefined,
      sellerId: createSaleDto.sellerId,
      metadata: createSaleDto.metadata,
    };

    const result = await this.subscriptionSalesService.createSubscriptionSale(saleData);

    // Mapper le résultat vers le DTO de réponse
    return {
      success: result.success,
      subscriptions: result.subscriptions.map(sub => ({
        id: sub.id,
        qrCode: sub.qrCode,
        onboardingKey: sub.onboardingKey,
      })),
      user: result.user ? {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      } : undefined,
      order: {
        id: result.order.id,
        total: result.order.total,
        currency: result.order.currency,
      },
      message: result.message,
    };
  }

  // ============================================================================
  // CONVERSION ANONYME
  // ============================================================================

  @Post('convert-anonymous')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Convertir un abonnement anonyme vers client enregistré',
    description: 'Permet à un client anonyme de créer son compte en utilisant la clé d\'onboarding imprimée sur sa carte.',
  })
  @ApiBody({ type: ConvertAnonymousSubscriptionDto })
  @ApiResponse({
    status: 200,
    description: 'Conversion réussie',
    type: ConversionResponseDto,
  })
  async convertAnonymousSubscription(
    @Body(ValidationPipe) convertDto: ConvertAnonymousSubscriptionDto
  ): Promise<ConversionResponseDto> {
    const conversionData = {
      onboardingKey: convertDto.onboardingKey,
      customerInfo: {
        firstName: convertDto.customerInfo.firstName,
        lastName: convertDto.customerInfo.lastName,
        email: convertDto.customerInfo.email,
        phone: convertDto.customerInfo.phone,
        fanId: convertDto.customerInfo.fanId,
      },
      password: convertDto.password,
    };

    const result = await this.subscriptionSalesService.convertAnonymousSubscription(conversionData);

    return {
      success: result.success,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      },
      subscriptionsMigrated: result.subscriptionsMigrated,
      incentivesApplied: result.incentivesApplied ? {
        type: result.incentivesApplied.type,
        value: result.incentivesApplied.value,
        description: result.incentivesApplied.description,
      } : undefined,
      message: result.message,
    };
  }

  // ============================================================================
  // ENDPOINTS UTILITAIRES POUR LE FLOW
  // ============================================================================

  @Get('plans/available')
  @ApiOperation({
    summary: 'Obtenir les plans d\'abonnement disponibles',
    description: 'Liste tous les plans d\'abonnement disponibles à la vente.',
  })
  @ApiQuery({
    name: 'organizerId',
    description: 'ID de l\'organisateur (optionnel)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Plans disponibles',
    type: AvailablePlansResponseDto,
  })
  async getAvailablePlans(
    @Query('organizerId') organizerId?: string
  ): Promise<AvailablePlansResponseDto> {
    const plans = await this.subscriptionPlansService.getAvailablePlans(organizerId);

    return {
      success: true,
      data: plans,
      totalPlans: plans.length,
      message: `${plans.length} plan(s) d'abonnement disponible(s)`,
    };
  }

  @Get('plans/:planId/zones')
  @ApiOperation({
    summary: 'Obtenir les zones d\'un plan d\'abonnement',
    description: 'Récupère les zones disponibles pour un plan d\'abonnement donné.',
  })
  @ApiParam({ name: 'planId', description: 'ID du plan d\'abonnement' })
  @ApiResponse({
    status: 200,
    description: 'Zones du plan',
    type: PlanZonesResponseDto,
  })
  async getPlanZones(
    @Param('planId', ParseUUIDPipe) planId: string
  ): Promise<PlanZonesResponseDto> {
    const selectionLogic = await this.zonesAndSeatsService.getSelectionLogicForPlan(planId);

    return {
      success: true,
      planId,
      selectionType: selectionLogic.selectionType,
      zones: selectionLogic.zones,
      message: selectionLogic.message,
    };
  }

  @Get('zones/:zoneId/seats')
  @ApiOperation({
    summary: 'Obtenir les places d\'une zone',
    description: 'Récupère les places disponibles dans une zone spécifique.',
  })
  @ApiParam({ name: 'zoneId', description: 'ID de la zone' })
  @ApiQuery({
    name: 'quantity',
    description: 'Nombre de places demandées',
    required: false,
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Places de la zone',
    type: ZoneSeatsResponseDto,
  })
  async getZoneSeats(
    @Param('zoneId') zoneId: string,
    @Query('quantity') quantityParam?: string
  ): Promise<ZoneSeatsResponseDto> {
    const quantity = quantityParam ? parseInt(quantityParam, 10) : 1;
    
    if (quantityParam && (isNaN(quantity) || quantity < 1 || quantity > 10)) {
      throw new BadRequestException('La quantité doit être un nombre entre 1 et 10');
    }

    const seatsInfo = await this.zonesAndSeatsService.getAvailableSeatsInZone(zoneId, quantity);

    return {
      success: true,
      zoneId,
      zoneName: seatsInfo.zoneName,
      hasSeats: seatsInfo.hasSeats,
      availableSeats: seatsInfo.availableSeats,
      canAccommodateQuantity: seatsInfo.canAccommodateQuantity,
      message: seatsInfo.message,
    };
  }

  @Get('qr-codes/validate')
  @ApiOperation({
    summary: 'Valider des QR codes',
    description: 'Vérifie la disponibilité et la validité de QR codes pour un plan d\'abonnement.',
  })
  @ApiQuery({
    name: 'codes',
    description: 'QR codes à valider (séparés par des virgules)',
    example: 'QR_2025_ABC123,QR_2025_DEF456',
  })
  @ApiQuery({
    name: 'planId',
    description: 'ID du plan d\'abonnement (optionnel)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Résultats de validation',
    type: [QRCodeValidationDto],
  })
  async validateQRCodes(
    @Query('codes') codesParam: string,
    @Query('planId') planId?: string
  ): Promise<QRCodeValidationDto[]> {
    if (!codesParam) {
      return [];
    }

    const qrCodes = codesParam.split(',').map(code => code.trim());
    const validations = await this.subscriptionSalesService.validateQRCodesAvailability(qrCodes, planId);

    return validations.map(validation => ({
      qrCode: validation.qrCode,
      isAvailable: validation.isAvailable,
      status: validation.status,
      assignedAt: validation.assignedAt,
      errorMessage: validation.errorMessage,
    }));
  }

  @Get('qr-codes/available')
  @ApiOperation({
    summary: 'Obtenir des QR codes disponibles',
    description: 'Récupère une liste de QR codes disponibles pour un plan donné.',
  })
  @ApiQuery({
    name: 'planId',
    description: 'ID du plan d\'abonnement',
    required: true,
  })
  @ApiQuery({
    name: 'quantity',
    description: 'Nombre de QR codes requis',
    required: true,
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'QR codes disponibles',
  })
  async getAvailableQRCodes(
    @Query('planId', ParseUUIDPipe) planId: string,
    @Query('quantity') quantityParam: string
  ) {
    const quantity = parseInt(quantityParam, 10);
    
    if (isNaN(quantity) || quantity < 1 || quantity > 100) {
      throw new BadRequestException('La quantité doit être un nombre entre 1 et 100');
    }

    const qrCodes = await this.subscriptionSalesService.getAvailableQRCodes(planId, quantity);

    return {
      success: true,
      data: qrCodes.map(qr => ({
        qrCode: qr.qrCode,
        onboardingKey: qr.onboardingKey,
        serialNumber: qr.serialNumber,
        subscriptionPlanId: qr.subscriptionPlanId,
        status: qr.status,
        cardBatch: qr.cardBatch,
        cardType: qr.cardType,
        assignedBy: qr.assignedBy,
      })),
      message: `${qrCodes.length} QR code(s) disponible(s) trouvé(s) pour ce plan`,
    };
  }

  // ============================================================================
  // CONSULTATION
  // ============================================================================

  @Get(':id')
  @ApiOperation({
    summary: 'Obtenir les détails d\'une vente',
    description: 'Récupère les informations complètes d\'une vente d\'abonnement.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la vente (order ID)',
  })
  @ApiResponse({
    status: 200,
    description: 'Détails de la vente',
  })
  @ApiResponse({
    status: 404,
    description: 'Vente non trouvée',
  })
  async getSaleDetails(
    @Param('id', ParseUUIDPipe) saleId: string
  ) {
    const saleDetails = await this.subscriptionSalesService.getSaleDetails(saleId);

    return {
      success: true,
      data: {
        order: {
          id: saleDetails.order.id,
          status: saleDetails.order.status,
          total: saleDetails.order.total,
          currency: saleDetails.order.currency,
          channel: saleDetails.order.channel,
          paymentMethod: saleDetails.order.payment_method,
          createdAt: saleDetails.order.created_at,
          confirmedAt: saleDetails.order.confirmed_at,
          metadata: saleDetails.order.metadata,
        },
        user: saleDetails.order.users ? {
          id: saleDetails.order.users.id,
          email: saleDetails.order.users.email,
          firstName: saleDetails.order.users.first_name,
          lastName: saleDetails.order.users.last_name,
        } : null,
        subscriptions: saleDetails.subscriptions.map((sub: any) => ({
          id: sub.id,
          qrCode: sub.qr_code,
          onboardingKey: sub.onboarding_key,
          status: sub.status,
          startDate: sub.start_date,
          endDate: sub.end_date,
          pricePaid: sub.price_paid,
          plan: {
            id: sub.subscription_plans.id,
            name: sub.subscription_plans.name,
            type: sub.subscription_plans.type,
          },
          accessRights: sub.access_rights.map((ar: any) => ({
            id: ar.id,
            qrCode: ar.qr_code,
            accessType: ar.access_type,
            status: ar.status,
            validFrom: ar.valid_from,
            validUntil: ar.valid_until,
            maxUses: ar.max_uses,
            currentUses: ar.current_uses,
          })),
        })),
      },
      message: 'Détails de la vente récupérés avec succès',
    };
  }

  @Get('onboarding/:key')
  @ApiOperation({
    summary: 'Obtenir les abonnements par clé d\'onboarding',
    description: 'Récupère les abonnements associés à une clé d\'onboarding donnée.',
  })
  @ApiParam({
    name: 'key',
    description: 'Clé d\'onboarding',
  })
  @ApiResponse({
    status: 200,
    description: 'Abonnements trouvés',
  })
  async getSubscriptionsByOnboardingKey(
    @Param('key') onboardingKey: string
  ) {
    const subscriptions = await this.subscriptionSalesService.getSubscriptionsByOnboardingKey(onboardingKey);

    return {
      success: true,
      data: subscriptions.map(sub => ({
        id: sub.id,
        qrCode: sub.qr_code,
        status: sub.status,
        startDate: sub.start_date,
        endDate: sub.end_date,
        pricePaid: sub.price_paid,
        isAnonymous: sub.user_id === null,
        plan: {
          id: sub.subscription_plans?.id,
          name: sub.subscription_plans?.name,
          type: sub.subscription_plans?.type,
        },
        onboardingInfo: sub.metadata?.onboarding,
      })),
      message: `${subscriptions.length} abonnement(s) trouvé(s) avec cette clé d'onboarding`,
    };
  }

  @Get('organizers/:organizerId/plans')
  @ApiOperation({
    summary: 'Obtenir tous les plans d\'abonnement d\'un organisateur',
    description: 'Récupère la liste complète de tous les plans d\'abonnement (actifs et inactifs) pour un organisateur spécifique.',
  })
  @ApiParam({ 
    name: 'organizerId', 
    description: 'ID de l\'organisateur',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @ApiResponse({
    status: 200,
    description: 'Plans de l\'organisateur récupérés avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              code: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string' },
              price: { type: 'number' },
              currency: { type: 'string' },
              isActive: { type: 'boolean' },
              isCurrentlyOnSale: { type: 'boolean' },
              maxSubscribers: { type: 'number' },
              currentSubscribers: { type: 'number' },
              activeSubscriptions: { type: 'number' },
              availableSlots: { type: 'number', nullable: true },
              validFrom: { type: 'string', format: 'date' },
              validUntil: { type: 'string', format: 'date' },
              saleStartDate: { type: 'string', format: 'date', nullable: true },
              saleEndDate: { type: 'string', format: 'date', nullable: true },
              organizer: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  code: { type: 'string' },
                  contactEmail: { type: 'string' }
                }
              },
              zones: { type: 'array' },
              includedEvents: { type: 'array' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        totalPlans: { type: 'number', example: 5 },
        activePlans: { type: 'number', example: 3 },
        inactivePlans: { type: 'number', example: 2 },
        plansOnSale: { type: 'number', example: 2 },
        message: { type: 'string', example: '5 plan(s) trouvé(s) pour cet organisateur' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Organisateur non trouvé ou aucun plan'
  })
  async getAllPlansByOrganizer(
    @Param('organizerId', ParseUUIDPipe) organizerId: string
  ) {
    const plans = await this.subscriptionPlansService.getAllPlansByOrganizer(organizerId);

    // Calculer les statistiques
    const activePlans = plans.filter(p => p.isActive).length;
    const inactivePlans = plans.filter(p => !p.isActive).length;
    const plansOnSale = plans.filter(p => p.isCurrentlyOnSale).length;

    return {
      success: true,
      data: plans,
      totalPlans: plans.length,
      activePlans,
      inactivePlans,
      plansOnSale,
      message: `${plans.length} plan(s) trouvé(s) pour cet organisateur`,
    };
  }
}