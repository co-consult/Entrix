"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionSalesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const subscription_sales_service_1 = require("../services/subscription-sales.service");
const subscription_plans_service_1 = require("../services/subscription-plans.service");
const zones_and_seats_service_1 = require("../services/zones-and-seats.service");
const sales_flow_service_1 = require("../services/sales-flow.service");
const create_subscription_sale_dto_1 = require("../dto/create-subscription-sale.dto");
const convert_anonymous_subscription_dto_1 = require("../dto/convert-anonymous-subscription.dto");
const subscription_sale_response_dto_1 = require("../dto/subscription-sale-response.dto");
const sales_flow_dto_1 = require("../dto/sales-flow.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const sale_types_1 = require("../types/sale-types");
let SubscriptionSalesController = class SubscriptionSalesController {
    subscriptionSalesService;
    subscriptionPlansService;
    zonesAndSeatsService;
    salesFlowService;
    constructor(subscriptionSalesService, subscriptionPlansService, zonesAndSeatsService, salesFlowService) {
        this.subscriptionSalesService = subscriptionSalesService;
        this.subscriptionPlansService = subscriptionPlansService;
        this.zonesAndSeatsService = zonesAndSeatsService;
        this.salesFlowService = salesFlowService;
    }
    async startSalesSession(startDto) {
        return await this.salesFlowService.startSalesSession(startDto.sellerId, startDto.organizerId);
    }
    async selectPlan(sessionId, selectPlanDto) {
        return await this.salesFlowService.selectPlan(sessionId, selectPlanDto.planId, selectPlanDto.quantity);
    }
    async selectZone(sessionId, selectZoneDto) {
        return await this.salesFlowService.selectZone(sessionId, selectZoneDto.zoneId);
    }
    async selectSeats(sessionId, selectSeatsDto) {
        return await this.salesFlowService.selectSeats(sessionId, selectSeatsDto.seatIds);
    }
    async validatePhysicalCards(sessionId, validateCardsDto) {
        return await this.salesFlowService.validatePhysicalCards(sessionId, validateCardsDto.cards);
    }
    async completeSale(sessionId, completeSaleDto) {
        return await this.salesFlowService.completeSale(sessionId, completeSaleDto.customerInfo, completeSaleDto.paymentMethod, completeSaleDto.saleMode || 'IDENTIFIED');
    }
    async completeAnonymousSale(sessionId, completeAnonymousDto) {
        return await this.salesFlowService.completeSale(sessionId, null, completeAnonymousDto.paymentMethod, 'ANONYMOUS');
    }
    async getSessionStatus(sessionId) {
        return await this.salesFlowService.getSessionStatus(sessionId);
    }
    async cancelSession(sessionId) {
        await this.salesFlowService.cancelSession(sessionId);
    }
    async createDirectSale(createSaleDto) {
        if (createSaleDto.saleMode === sale_types_1.SaleMode.IDENTIFIED && !createSaleDto.customerInfo) {
            throw new common_1.BadRequestException('Les informations client sont requises pour une vente identifiée');
        }
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
    async convertAnonymousSubscription(convertDto) {
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
    async getAvailablePlans(organizerId) {
        const plans = await this.subscriptionPlansService.getAvailablePlans(organizerId);
        return {
            success: true,
            data: plans,
            totalPlans: plans.length,
            message: `${plans.length} plan(s) d'abonnement disponible(s)`,
        };
    }
    async getPlanZones(planId) {
        const selectionLogic = await this.zonesAndSeatsService.getSelectionLogicForPlan(planId);
        return {
            success: true,
            planId,
            selectionType: selectionLogic.selectionType,
            zones: selectionLogic.zones,
            message: selectionLogic.message,
        };
    }
    async getZoneSeats(zoneId, quantityParam) {
        const quantity = quantityParam ? parseInt(quantityParam, 10) : 1;
        if (quantityParam && (isNaN(quantity) || quantity < 1 || quantity > 10)) {
            throw new common_1.BadRequestException('La quantité doit être un nombre entre 1 et 10');
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
    async validateQRCodes(codesParam, planId) {
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
    async getAvailableQRCodes(planId, quantityParam) {
        const quantity = parseInt(quantityParam, 10);
        if (isNaN(quantity) || quantity < 1 || quantity > 100) {
            throw new common_1.BadRequestException('La quantité doit être un nombre entre 1 et 100');
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
    async getSaleDetails(saleId) {
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
                subscriptions: saleDetails.subscriptions.map((sub) => ({
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
                    accessRights: sub.access_rights.map((ar) => ({
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
    async getSubscriptionsByOnboardingKey(onboardingKey) {
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
    async getAllPlansByOrganizer(organizerId) {
        const plans = await this.subscriptionPlansService.getAllPlansByOrganizer(organizerId);
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
};
exports.SubscriptionSalesController = SubscriptionSalesController;
__decorate([
    (0, common_1.Post)('flow/start'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Démarrer une session de vente d\'abonnement',
        description: 'Étape 0 : Démarre une nouvelle session de vente et retourne les plans disponibles.',
    }),
    (0, swagger_1.ApiBody)({ type: sales_flow_dto_1.StartSalesSessionDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Session démarrée avec succès',
        type: sales_flow_dto_1.FlowStepResponseDto,
    }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sales_flow_dto_1.StartSalesSessionDto]),
    __metadata("design:returntype", Promise)
], SubscriptionSalesController.prototype, "startSalesSession", null);
__decorate([
    (0, common_1.Post)('flow/:sessionId/select-plan'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Sélectionner un plan d\'abonnement',
        description: 'Étape 1 : Sélectionne un plan et passe à la sélection de zones/places.',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'ID de la session de vente' }),
    (0, swagger_1.ApiBody)({ type: sales_flow_dto_1.SelectPlanDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Plan sélectionné avec succès',
        type: sales_flow_dto_1.FlowStepResponseDto,
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sales_flow_dto_1.SelectPlanDto]),
    __metadata("design:returntype", Promise)
], SubscriptionSalesController.prototype, "selectPlan", null);
__decorate([
    (0, common_1.Post)('flow/:sessionId/select-zone'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Sélectionner une zone',
        description: 'Étape 2a : Sélectionne une zone (si plusieurs zones disponibles).',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'ID de la session de vente' }),
    (0, swagger_1.ApiBody)({ type: sales_flow_dto_1.SelectZoneDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Zone sélectionnée avec succès',
        type: sales_flow_dto_1.FlowStepResponseDto,
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sales_flow_dto_1.SelectZoneDto]),
    __metadata("design:returntype", Promise)
], SubscriptionSalesController.prototype, "selectZone", null);
__decorate([
    (0, common_1.Post)('flow/:sessionId/select-seats'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Sélectionner des places',
        description: 'Étape 2b : Sélectionne les places spécifiques (si la zone a des places).',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'ID de la session de vente' }),
    (0, swagger_1.ApiBody)({ type: sales_flow_dto_1.SelectSeatsDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Places sélectionnées avec succès',
        type: sales_flow_dto_1.FlowStepResponseDto,
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sales_flow_dto_1.SelectSeatsDto]),
    __metadata("design:returntype", Promise)
], SubscriptionSalesController.prototype, "selectSeats", null);
__decorate([
    (0, common_1.Post)('flow/:sessionId/validate-cards'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Valider les cartes physiques',
        description: 'Étape 3a : Valide les QR codes ou numéros de série des cartes physiques.',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'ID de la session de vente' }),
    (0, swagger_1.ApiBody)({ type: sales_flow_dto_1.ValidatePhysicalCardsDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Cartes validées avec succès',
        type: sales_flow_dto_1.FlowStepResponseDto,
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sales_flow_dto_1.ValidatePhysicalCardsDto]),
    __metadata("design:returntype", Promise)
], SubscriptionSalesController.prototype, "validatePhysicalCards", null);
__decorate([
    (0, common_1.Post)('flow/:sessionId/complete-sale'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Finaliser la vente avec informations client',
        description: 'Étape 3b : Finalise la vente avec les informations client (mode identifié).',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'ID de la session de vente' }),
    (0, swagger_1.ApiBody)({ type: sales_flow_dto_1.CompleteSaleDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Vente finalisée avec succès',
        type: sales_flow_dto_1.FlowStepResponseDto,
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sales_flow_dto_1.CompleteSaleDto]),
    __metadata("design:returntype", Promise)
], SubscriptionSalesController.prototype, "completeSale", null);
__decorate([
    (0, common_1.Post)('flow/:sessionId/complete-anonymous-sale'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Finaliser la vente anonyme',
        description: 'Étape 3b : Finalise la vente sans informations client (mode anonyme).',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'ID de la session de vente' }),
    (0, swagger_1.ApiBody)({ type: sales_flow_dto_1.CompleteAnonymousSaleDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Vente anonyme finalisée avec succès',
        type: sales_flow_dto_1.FlowStepResponseDto,
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sales_flow_dto_1.CompleteAnonymousSaleDto]),
    __metadata("design:returntype", Promise)
], SubscriptionSalesController.prototype, "completeAnonymousSale", null);
__decorate([
    (0, common_1.Get)('flow/:sessionId/status'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtenir l\'état d\'une session de vente',
        description: 'Récupère l\'état actuel et les données d\'une session de vente.',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'ID de la session de vente' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'État de la session récupéré',
        type: sales_flow_dto_1.FlowStepResponseDto,
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubscriptionSalesController.prototype, "getSessionStatus", null);
__decorate([
    (0, common_1.Delete)('flow/:sessionId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({
        summary: 'Annuler une session de vente',
        description: 'Annule une session de vente et libère les ressources (places réservées, etc.).',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'ID de la session de vente' }),
    (0, swagger_1.ApiResponse)({
        status: 204,
        description: 'Session annulée avec succès',
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubscriptionSalesController.prototype, "cancelSession", null);
__decorate([
    (0, common_1.Post)('direct-sale'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Créer une vente directe d\'abonnement',
        description: 'Crée une vente directe en bypassant le flow de session (pour cas d\'urgence ou intégrations).',
    }),
    (0, swagger_1.ApiBody)({ type: create_subscription_sale_dto_1.CreateSubscriptionSaleDto }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Vente créée avec succès',
        type: subscription_sale_response_dto_1.SubscriptionSaleResponseDto,
    }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_subscription_sale_dto_1.CreateSubscriptionSaleDto]),
    __metadata("design:returntype", Promise)
], SubscriptionSalesController.prototype, "createDirectSale", null);
__decorate([
    (0, common_1.Post)('convert-anonymous'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Convertir un abonnement anonyme vers client enregistré',
        description: 'Permet à un client anonyme de créer son compte en utilisant la clé d\'onboarding imprimée sur sa carte.',
    }),
    (0, swagger_1.ApiBody)({ type: convert_anonymous_subscription_dto_1.ConvertAnonymousSubscriptionDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Conversion réussie',
        type: subscription_sale_response_dto_1.ConversionResponseDto,
    }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [convert_anonymous_subscription_dto_1.ConvertAnonymousSubscriptionDto]),
    __metadata("design:returntype", Promise)
], SubscriptionSalesController.prototype, "convertAnonymousSubscription", null);
__decorate([
    (0, common_1.Get)('plans/available'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtenir les plans d\'abonnement disponibles',
        description: 'Liste tous les plans d\'abonnement disponibles à la vente.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'organizerId',
        description: 'ID de l\'organisateur (optionnel)',
        required: false,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Plans disponibles',
        type: sales_flow_dto_1.AvailablePlansResponseDto,
    }),
    __param(0, (0, common_1.Query)('organizerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubscriptionSalesController.prototype, "getAvailablePlans", null);
__decorate([
    (0, common_1.Get)('plans/:planId/zones'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtenir les zones d\'un plan d\'abonnement',
        description: 'Récupère les zones disponibles pour un plan d\'abonnement donné.',
    }),
    (0, swagger_1.ApiParam)({ name: 'planId', description: 'ID du plan d\'abonnement' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Zones du plan',
        type: sales_flow_dto_1.PlanZonesResponseDto,
    }),
    __param(0, (0, common_1.Param)('planId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubscriptionSalesController.prototype, "getPlanZones", null);
__decorate([
    (0, common_1.Get)('zones/:zoneId/seats'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtenir les places d\'une zone',
        description: 'Récupère les places disponibles dans une zone spécifique.',
    }),
    (0, swagger_1.ApiParam)({ name: 'zoneId', description: 'ID de la zone' }),
    (0, swagger_1.ApiQuery)({
        name: 'quantity',
        description: 'Nombre de places demandées',
        required: false,
        type: 'number',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Places de la zone',
        type: sales_flow_dto_1.ZoneSeatsResponseDto,
    }),
    __param(0, (0, common_1.Param)('zoneId')),
    __param(1, (0, common_1.Query)('quantity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SubscriptionSalesController.prototype, "getZoneSeats", null);
__decorate([
    (0, common_1.Get)('qr-codes/validate'),
    (0, swagger_1.ApiOperation)({
        summary: 'Valider des QR codes',
        description: 'Vérifie la disponibilité et la validité de QR codes pour un plan d\'abonnement.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'codes',
        description: 'QR codes à valider (séparés par des virgules)',
        example: 'QR_2025_ABC123,QR_2025_DEF456',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'planId',
        description: 'ID du plan d\'abonnement (optionnel)',
        required: false,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Résultats de validation',
        type: [subscription_sale_response_dto_1.QRCodeValidationDto],
    }),
    __param(0, (0, common_1.Query)('codes')),
    __param(1, (0, common_1.Query)('planId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SubscriptionSalesController.prototype, "validateQRCodes", null);
__decorate([
    (0, common_1.Get)('qr-codes/available'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtenir des QR codes disponibles',
        description: 'Récupère une liste de QR codes disponibles pour un plan donné.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'planId',
        description: 'ID du plan d\'abonnement',
        required: true,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'quantity',
        description: 'Nombre de QR codes requis',
        required: true,
        type: 'number',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'QR codes disponibles',
    }),
    __param(0, (0, common_1.Query)('planId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('quantity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SubscriptionSalesController.prototype, "getAvailableQRCodes", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtenir les détails d\'une vente',
        description: 'Récupère les informations complètes d\'une vente d\'abonnement.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'ID de la vente (order ID)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Détails de la vente',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Vente non trouvée',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubscriptionSalesController.prototype, "getSaleDetails", null);
__decorate([
    (0, common_1.Get)('onboarding/:key'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtenir les abonnements par clé d\'onboarding',
        description: 'Récupère les abonnements associés à une clé d\'onboarding donnée.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'key',
        description: 'Clé d\'onboarding',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Abonnements trouvés',
    }),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubscriptionSalesController.prototype, "getSubscriptionsByOnboardingKey", null);
__decorate([
    (0, common_1.Get)('organizers/:organizerId/plans'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtenir tous les plans d\'abonnement d\'un organisateur',
        description: 'Récupère la liste complète de tous les plans d\'abonnement (actifs et inactifs) pour un organisateur spécifique.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'organizerId',
        description: 'ID de l\'organisateur',
        example: '550e8400-e29b-41d4-a716-446655440000'
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Organisateur non trouvé ou aucun plan'
    }),
    __param(0, (0, common_1.Param)('organizerId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubscriptionSalesController.prototype, "getAllPlansByOrganizer", null);
exports.SubscriptionSalesController = SubscriptionSalesController = __decorate([
    (0, swagger_1.ApiTags)('Subscription Sales'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('subscription-sales'),
    __metadata("design:paramtypes", [subscription_sales_service_1.SubscriptionSalesService,
        subscription_plans_service_1.SubscriptionPlansService,
        zones_and_seats_service_1.ZonesAndSeatsService,
        sales_flow_service_1.SalesFlowService])
], SubscriptionSalesController);
//# sourceMappingURL=subscription-sales.controller.js.map