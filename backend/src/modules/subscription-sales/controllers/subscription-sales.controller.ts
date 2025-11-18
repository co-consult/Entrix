// src/modules/subscription-sales/controllers/subscription-sales.controller.ts

import {
  Controller,
  Post,
  Get,
  Put,
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
import { CreateSubscriptionPlanDto } from '../dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from '../dto/update-subscription-plan.dto';
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
@Controller('subscription-sales')
export class SubscriptionSalesController {
  constructor(
    private readonly subscriptionSalesService: SubscriptionSalesService,
    private readonly subscriptionPlansService: SubscriptionPlansService,
    private readonly zonesAndSeatsService: ZonesAndSeatsService,
    private readonly salesFlowService: SalesFlowService,
  ) {}

  // ============================================================================
  // UTILITAIRES QR CODES
  // ============================================================================

  @Get('qr-code-info/:qrCode')
  @ApiOperation({ summary: 'Obtenir les informations d\'un QR code physique' })
  @ApiParam({ name: 'qrCode', description: 'Code QR à rechercher' })
  @ApiResponse({ status: 200, description: 'Informations du QR code récupérées avec succès' })
  @ApiResponse({ status: 404, description: 'QR code non trouvé' })
  async getQRCodeInfo(@Param('qrCode') qrCode: string) {
    return this.subscriptionSalesService.getQRCodeInfo(qrCode);
  }

  @Get('qr-code-by-serial/:serialNumber')
  @ApiOperation({ summary: 'Rechercher un QR code par numéro de série' })
  @ApiParam({ name: 'serialNumber', description: 'Numéro de série à rechercher' })
  @ApiQuery({ name: 'planId', description: 'ID du plan d\'abonnement pour validation', required: false })
  @ApiQuery({ name: 'suffix', description: 'Suffixe du QR code (SUB, SUBVB) pour filtrer les résultats', required: false })
  @ApiResponse({ status: 200, description: 'QR code trouvé avec succès' })
  @ApiResponse({ status: 404, description: 'Aucun QR code trouvé avec ce numéro de série' })
  @ApiResponse({ status: 400, description: 'QR code n\'appartient pas au plan sélectionné' })
  async getQRCodeBySerialNumber(
    @Param('serialNumber') serialNumber: string,
    @Query('planId') planId?: string,
    @Query('suffix') suffix?: string,
  ) {
    return this.subscriptionSalesService.getQRCodeBySerialNumber(serialNumber, planId, suffix);
  }

  @Get('qr-code-debug/:qrCode')
  @ApiOperation({ summary: 'Debug: Voir toutes les informations d\'un QR code' })
  @ApiParam({ name: 'qrCode', description: 'Code QR à rechercher' })
  async getQRCodeDebug(@Param('qrCode') qrCode: string) {
    return this.subscriptionSalesService.getQRCodeDebug(qrCode);
  }

  @Get('qr-code-test/:qrCode')
  @ApiOperation({ summary: 'Test: Voir les résultats de validation d\'un QR code' })
  @ApiParam({ name: 'qrCode', description: 'Code QR à tester' })
  async testQRCodeValidation(@Param('qrCode') qrCode: string) {
    return this.subscriptionSalesService.testQRCodeValidation(qrCode);
  }

  @Get('qr-code-raw/:qrCode')
  @ApiOperation({ summary: 'Raw: Voir toutes les données brutes d\'un QR code' })
  @ApiParam({ name: 'qrCode', description: 'Code QR à examiner' })
  async getQRCodeRaw(@Param('qrCode') qrCode: string) {
    return this.subscriptionSalesService.getQRCodeRaw(qrCode);
  }

  @Post('clear-qr-cache')
  @ApiOperation({ summary: 'Clear all QR code cache (for testing)' })
  async clearQRCache() {
    return this.subscriptionSalesService.clearAllQRCache();
  }

  @Post('clear-plans-cache')
  @ApiOperation({ summary: 'Clear all subscription plans cache (for testing)' })
  async clearPlansCache() {
    return this.subscriptionSalesService.clearAllPlansCache();
  }

  @Get('debug-subscriptions')
  @ApiOperation({ summary: 'Debug subscriptions data (for testing)' })
  async debugSubscriptions() {
    return this.subscriptionSalesService.debugSubscriptions();
  }

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
  // DEBUG ENDPOINT - FOR TESTING NO-PRICE VALIDATION
  // ============================================================================

  @Post('debug-no-price')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Debug no-price validation',
    description: 'Debug endpoint to test no-price validation logic',
  })
  async debugNoPriceValidation(
    @Body() body: any
  ): Promise<any> {
    // Test the exact validation logic from the service
    const isNoPriceUser = body.customerInfo?.noPrice === true;
    const willFailValidation = body.amount < 0 || (!isNoPriceUser && body.amount <= 0);
    
    return {
      receivedData: body,
      amount: body.amount,
      amountType: typeof body.amount,
      customerInfo: body.customerInfo,
      noPrice: body.customerInfo?.noPrice,
      noPriceType: typeof body.customerInfo?.noPrice,
      isNoPriceUser,
      validation: {
        amountNegative: body.amount < 0,
        amountZero: body.amount === 0,
        amountZeroOrNegative: body.amount <= 0,
        shouldAllowZero: isNoPriceUser,
        willFail: willFailValidation,
        errorMessage: willFailValidation 
          ? (isNoPriceUser ? 'Le montant ne peut pas être négatif' : 'Le montant doit être positif')
          : 'Validation would pass'
      },
      recommendations: {
        forZeroAmount: isNoPriceUser 
          ? '✅ Zero amount is allowed for no-price users' 
          : '❌ Zero amount is NOT allowed for regular users. Set customerInfo.noPrice = true',
        forPositiveAmount: '✅ Positive amount is always allowed',
        forNegativeAmount: '❌ Negative amount is never allowed'
      }
    };
  }

  @Post('test-no-price-sale')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test no-price subscription sale',
    description: 'Test endpoint to validate no-price subscription sale flow',
  })
  async testNoPriceSale(
    @Body() body: any
  ): Promise<any> {
    try {
      // First, validate the data structure
      const validationResult = await this.debugNoPriceValidation(body);
      
      // If validation would fail, return early
      if (validationResult.validation.willFail) {
        return {
          success: false,
          error: 'Validation would fail',
          validationResult
        };
      }

      // Try to create the actual sale data structure
      const saleData = {
        planId: body.planId,
        quantity: body.quantity,
        qrCodes: body.qrCodes,
        saleMode: body.saleMode,
        saleChannel: body.saleChannel,
        paymentMethod: body.paymentMethod,
        amount: body.amount,
        currency: body.currency,
        customerInfo: body.customerInfo ? {
          firstName: body.customerInfo.firstName,
          lastName: body.customerInfo.lastName,
          email: body.customerInfo.email,
          phone: body.customerInfo.phone,
          fanId: body.customerInfo.fanId,
          noPrice: body.customerInfo.noPrice,
          sponsorType: body.customerInfo.sponsorType,
        } : undefined,
        sellerId: body.sellerId,
        sellerEmail: body.sellerEmail,
        sellerName: body.sellerName,
        paymentDetails: body.paymentDetails,
        note: body.note,
        metadata: body.metadata,
      };

      return {
        success: true,
        message: 'Data structure is valid for no-price sale',
        saleData,
        validationResult
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
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
        noPrice: createSaleDto.customerInfo.noPrice,
        sponsorType: createSaleDto.customerInfo.sponsorType,
      } : undefined,
      sellerId: createSaleDto.sellerId,
      sellerEmail: createSaleDto.sellerEmail,
      sellerName: createSaleDto.sellerName,
      paymentDetails: createSaleDto.paymentDetails,
      note: createSaleDto.note,
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
  // SUBSCRIPTION MANAGEMENT ENDPOINTS
  // ============================================================================

  @Get('subscriptions')
  @ApiOperation({
    summary: 'Obtenir la liste des abonnements',
    description: 'Récupère la liste des abonnements avec pagination et filtres.',
  })
  @ApiQuery({
    name: 'userId',
    description: 'ID de l\'utilisateur (optionnel)',
    required: false,
  })
  @ApiQuery({
    name: 'organizerId',
    description: 'ID de l\'organisateur (optionnel)',
    required: false,
  })
  @ApiQuery({
    name: 'planId',
    description: 'ID du plan d\'abonnement (optionnel)',
    required: false,
  })
  @ApiQuery({
    name: 'status',
    description: 'Statut de l\'abonnement (optionnel)',
    required: false,
  })
  @ApiQuery({
    name: 'vendorId',
    description: 'ID du vendeur (optionnel)',
    required: false,
  })
  @ApiQuery({
    name: 'paymentMethod',
    description: 'Méthode de paiement (optionnel)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des abonnements récupérée avec succès',
  })
  async getSubscriptions(
    @Query('userId') userId?: string,
    @Query('organizerId') organizerId?: string,
    @Query('planId') planId?: string,
    @Query('status') status?: string,
    @Query('vendorId') vendorId?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('query') query?: string,
    @Query('createdAfter') createdAfter?: string,
    @Query('createdBefore') createdBefore?: string,
    @Query('page') pageParam?: string,
    @Query('limit') limitParam?: string,
  ) {
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 20; // Default 20 per page for list view
    
    // Validate pagination parameters
    const validPage = Math.max(1, page);
    const validLimit = limitParam ? Math.max(1, limit) : null; // null means no limit (all records)
    
    const result = await this.subscriptionSalesService.getSubscriptions({
      userId,
      organizerId,
      planId,
      status,
      vendorId,
      paymentMethod,
      query,
      createdAfter,
      createdBefore,
      page: validPage,
      limit: validLimit,
    });

    return {
      success: true,
      data: result.subscriptions,
      total: result.total,
      page: validPage,
      limit: validLimit,
      totalPages: validLimit ? Math.ceil(result.total / validLimit) : 1,
      message: `${result.subscriptions.length} abonnement(s) trouvé(s) sur ${result.total} total`,
    };
  }

  @Get('filter-options')
  @ApiOperation({
    summary: 'Obtenir les options de filtrage',
    description: 'Récupère toutes les options disponibles pour les filtres (plans, vendeurs, méthodes de paiement).',
  })
  @ApiResponse({
    status: 200,
    description: 'Options de filtrage récupérées avec succès',
  })
  async getFilterOptions() {
    const result = await this.subscriptionSalesService.getFilterOptions();

    return {
      success: true,
      data: result,
      message: 'Options de filtrage récupérées avec succès',
    };
  }

  @Get('stats/subscriptions')
  @ApiOperation({
    summary: 'Obtenir les statistiques des abonnements',
    description: 'Récupère les statistiques complètes des abonnements (tous les enregistrements).',
  })
  @ApiQuery({
    name: 'userId',
    description: 'ID de l\'utilisateur (optionnel)',
    required: false,
  })
  @ApiQuery({
    name: 'organizerId',
    description: 'ID de l\'organisateur (optionnel)',
    required: false,
  })
  @ApiQuery({
    name: 'planId',
    description: 'ID du plan d\'abonnement (optionnel)',
    required: false,
  })
  @ApiQuery({
    name: 'status',
    description: 'Statut de l\'abonnement (optionnel)',
    required: false,
  })
  @ApiQuery({
    name: 'vendorId',
    description: 'ID du vendeur (optionnel)',
    required: false,
  })
  @ApiQuery({
    name: 'paymentMethod',
    description: 'Méthode de paiement (optionnel)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques des abonnements récupérées avec succès',
  })
  async getSubscriptionsStats(
    @Query('userId') userId?: string,
    @Query('organizerId') organizerId?: string,
    @Query('planId') planId?: string,
    @Query('status') status?: string,
    @Query('vendorId') vendorId?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('createdAfter') createdAfter?: string,
    @Query('createdBefore') createdBefore?: string,
  ) {
    const result = await this.subscriptionSalesService.getSubscriptionsStats({
      userId,
      organizerId,
      planId,
      status,
      vendorId,
      paymentMethod,
      createdAfter,
      createdBefore,
    });

    return {
      success: true,
      data: result,
      message: 'Statistiques récupérées avec succès',
    };
  }

  @Get('subscriptions/:id')
  @ApiOperation({
    summary: 'Obtenir les détails d\'un abonnement',
    description: 'Récupère les détails complets d\'un abonnement spécifique.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'abonnement',
  })
  @ApiResponse({
    status: 200,
    description: 'Détails de l\'abonnement récupérés avec succès',
  })
  async getSubscription(@Param('id', ParseUUIDPipe) id: string) {
    const subscription = await this.subscriptionSalesService.getSubscription(id);

    return {
      success: true,
      data: subscription,
      message: 'Abonnement récupéré avec succès',
    };
  }

  @Get('subscriptions/:id/qr-code-info')
  @ApiOperation({
    summary: 'Obtenir les informations QR code et siège pour un abonnement',
    description: 'Récupère les informations du QR code et du siège associés à un abonnement.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'abonnement',
  })
  @ApiResponse({
    status: 200,
    description: 'Informations QR code et siège récupérées avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Abonnement ou QR code non trouvé',
  })
  async getSubscriptionQRCodeInfo(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.subscriptionSalesService.getSubscriptionQRCodeInfo(id);
    return result;
  }

  @Post('subscriptions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un abonnement',
    description: 'Crée un nouvel abonnement pour un utilisateur.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', format: 'uuid' },
        subscription_plan_id: { type: 'string', format: 'uuid' },
        qr_code: { type: 'string' },
        event_id: { type: 'string', format: 'uuid' },
        start_date: { type: 'string', format: 'date' },
        end_date: { type: 'string', format: 'date' },
      },
      required: ['user_id', 'subscription_plan_id', 'qr_code'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Abonnement créé avec succès',
  })
  async createSubscription(@Body() createData: {
    user_id: string;
    subscription_plan_id: string;
    qr_code: string;
    event_id?: string;
    start_date?: string;
    end_date?: string;
  }) {
    const subscription = await this.subscriptionSalesService.createSubscription(createData);

    return {
      success: true,
      data: subscription,
      message: 'Abonnement créé avec succès',
    };
  }

  @Put('subscriptions/:id')
  @ApiOperation({
    summary: 'Mettre à jour un abonnement',
    description: 'Met à jour les informations d\'un abonnement existant.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'abonnement',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        start_date: { type: 'string', format: 'date' },
        end_date: { type: 'string', format: 'date' },
        subscription_plan_id: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Abonnement mis à jour avec succès',
  })
  async updateSubscription(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: {
      status?: string;
      start_date?: string;
      end_date?: string;
      subscription_plan_id?: string;
    },
  ) {
    const subscription = await this.subscriptionSalesService.updateSubscription(id, updateData);

    return {
      success: true,
      data: subscription,
      message: 'Abonnement mis à jour avec succès',
    };
  }

  @Delete('subscriptions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer un abonnement',
    description: 'Supprime un abonnement existant.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'abonnement',
  })
  @ApiResponse({
    status: 204,
    description: 'Abonnement supprimé avec succès',
  })
  async deleteSubscription(@Param('id', ParseUUIDPipe) id: string) {
    await this.subscriptionSalesService.deleteSubscription(id);

    return {
      success: true,
      message: 'Abonnement supprimé avec succès',
    };
  }

  @Post('subscriptions/:id/activate')
  @ApiOperation({
    summary: 'Activer un abonnement',
    description: 'Active un abonnement existant.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'abonnement',
  })
  @ApiResponse({
    status: 200,
    description: 'Abonnement activé avec succès',
  })
  async activateSubscription(@Param('id', ParseUUIDPipe) id: string) {
    const subscription = await this.subscriptionSalesService.activateSubscription(id);

    return {
      success: true,
      data: subscription,
      message: 'Abonnement activé avec succès',
    };
  }

  @Post('subscriptions/:id/deactivate')
  @ApiOperation({
    summary: 'Désactiver un abonnement',
    description: 'Désactive un abonnement existant.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'abonnement',
  })
  @ApiResponse({
    status: 200,
    description: 'Abonnement désactivé avec succès',
  })
  async deactivateSubscription(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body?: { suspensionReason?: string }
  ) {
    const subscription = await this.subscriptionSalesService.deactivateSubscription(id, body?.suspensionReason);

    return {
      success: true,
      data: subscription,
      message: 'Abonnement désactivé avec succès',
    };
  }

  @Get('subscriptions/:id/benefits')
  @ApiOperation({
    summary: 'Obtenir les avantages d\'un abonnement',
    description: 'Récupère les avantages et droits d\'accès d\'un abonnement.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'abonnement',
  })
  @ApiResponse({
    status: 200,
    description: 'Avantages de l\'abonnement récupérés avec succès',
  })
  async getSubscriptionBenefits(@Param('id', ParseUUIDPipe) id: string) {
    const benefits = await this.subscriptionSalesService.getSubscriptionBenefits(id);

    return {
      success: true,
      data: benefits,
      message: 'Avantages de l\'abonnement récupérés avec succès',
    };
  }



  @Post('subscriptions/check-access')
  @ApiOperation({
    summary: 'Vérifier l\'accès d\'un utilisateur à un événement',
    description: 'Vérifie si un utilisateur a accès à un événement via ses abonnements.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', format: 'uuid' },
        eventId: { type: 'string', format: 'uuid' },
      },
      required: ['userId', 'eventId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Vérification d\'accès effectuée avec succès',
  })
  async checkSubscriptionAccess(@Body() data: { userId: string; eventId: string }) {
    const access = await this.subscriptionSalesService.checkSubscriptionAccess(data.userId, data.eventId);

    return {
      success: true,
      data: access,
      message: 'Vérification d\'accès effectuée avec succès',
    };
  }

  @Get('subscriptions/users/:userId/active')
  @ApiOperation({
    summary: 'Obtenir les abonnements actifs d\'un utilisateur',
    description: 'Récupère tous les abonnements actifs d\'un utilisateur spécifique.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID de l\'utilisateur',
  })
  @ApiResponse({
    status: 200,
    description: 'Abonnements actifs récupérés avec succès',
  })
  async getActiveSubscriptions(@Param('userId', ParseUUIDPipe) userId: string) {
    const subscriptions = await this.subscriptionSalesService.getActiveSubscriptions(userId);

    return {
      success: true,
      data: subscriptions,
      message: 'Abonnements actifs récupérés avec succès',
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
    @Query('organizerId') organizerId?: string,
    @Query('_t') timestamp?: string,
  ): Promise<AvailablePlansResponseDto> {
    // Skip cache if timestamp parameter is present (cache-busting from frontend)
    const skipCache = !!timestamp;
    const plans = await this.subscriptionPlansService.getAvailablePlans(organizerId, skipCache);

    return {
      success: true,
      data: plans,
      totalPlans: plans.length,
      message: `${plans.length} plan(s) d'abonnement disponible(s)`,
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
    @Param('organizerId', ParseUUIDPipe) organizerId: string,
    @Query('_t') timestamp?: string,
  ) {
    // Skip cache if timestamp parameter is present (cache-busting from frontend)
    const skipCache = !!timestamp;
    const plans = await this.subscriptionPlansService.getAllPlansByOrganizer(organizerId, skipCache);

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

  // ============================================================================
  // SUBSCRIPTION PLAN MANAGEMENT - CREATE/UPDATE/DELETE
  // ============================================================================

  @Get('subscription-plans/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get subscription plan details',
    description: 'Retrieves detailed information about a specific subscription plan (including inactive plans)',
  })
  @ApiParam({ name: 'id', description: 'Subscription plan ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription plan retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription plan not found',
  })
  async getSubscriptionPlan(
    @Param('id', ParseUUIDPipe) id: string
  ) {
    const plan = await this.subscriptionPlansService.getPlanDetails(id);

    return {
      success: true,
      data: plan,
      message: 'Subscription plan retrieved successfully',
    };
  }

  @Post('subscription-plans')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new subscription plan',
    description: 'Creates a new subscription plan with zones and events',
  })
  @ApiBody({ type: CreateSubscriptionPlanDto })
  @ApiResponse({
    status: 201,
    description: 'Subscription plan created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: 409,
    description: 'Plan code already exists',
  })
  async createSubscriptionPlan(
    @Body(ValidationPipe) createPlanDto: CreateSubscriptionPlanDto
  ) {
    const plan = await this.subscriptionPlansService.createPlan(createPlanDto);

    return {
      success: true,
      data: plan,
      message: 'Subscription plan created successfully',
    };
  }

  @Put('subscription-plans/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a subscription plan',
    description: 'Updates an existing subscription plan',
  })
  @ApiParam({ name: 'id', description: 'Subscription plan ID' })
  @ApiBody({ type: UpdateSubscriptionPlanDto })
  @ApiResponse({
    status: 200,
    description: 'Subscription plan updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription plan not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  async updateSubscriptionPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updatePlanDto: UpdateSubscriptionPlanDto
  ) {
    const plan = await this.subscriptionPlansService.updatePlan(id, updatePlanDto);

    return {
      success: true,
      data: plan,
      message: 'Subscription plan updated successfully',
    };
  }

  @Delete('subscription-plans/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a subscription plan',
    description: 'Deletes a subscription plan (only if no active subscriptions or QR codes)',
  })
  @ApiParam({ name: 'id', description: 'Subscription plan ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription plan deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription plan not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete plan with active subscriptions or QR codes',
  })
  async deleteSubscriptionPlan(
    @Param('id', ParseUUIDPipe) id: string
  ) {
    const result = await this.subscriptionPlansService.deletePlan(id);

    return {
      success: result.success,
      message: result.message,
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
}