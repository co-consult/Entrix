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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZoneSeatsResponseDto = exports.PlanZonesResponseDto = exports.AvailablePlansResponseDto = exports.FlowStepResponseDto = exports.CompleteAnonymousSaleDto = exports.CompleteSaleDto = exports.ValidatePhysicalCardsDto = exports.PhysicalCardDto = exports.SelectSeatsDto = exports.SelectZoneDto = exports.SelectPlanDto = exports.StartSalesSessionDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const create_subscription_sale_dto_1 = require("./create-subscription-sale.dto");
const sale_types_1 = require("../types/sale-types");
class StartSalesSessionDto {
    sellerId;
    organizerId;
}
exports.StartSalesSessionDto = StartSalesSessionDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID du vendeur',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: 'L\'ID du vendeur doit être un UUID valide' }),
    __metadata("design:type", String)
], StartSalesSessionDto.prototype, "sellerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID de l\'organisateur pour filtrer les plans',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: 'L\'ID de l\'organisateur doit être un UUID valide' }),
    __metadata("design:type", String)
], StartSalesSessionDto.prototype, "organizerId", void 0);
class SelectPlanDto {
    planId;
    quantity;
}
exports.SelectPlanDto = SelectPlanDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID du plan d\'abonnement sélectionné',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsUUID)(4, { message: 'L\'ID du plan doit être un UUID valide' }),
    __metadata("design:type", String)
], SelectPlanDto.prototype, "planId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantité d\'abonnements demandés',
        example: 2,
        minimum: 1,
        maximum: 10,
    }),
    (0, class_validator_1.IsNumber)({}, { message: 'La quantité doit être un nombre' }),
    (0, class_validator_1.Min)(1, { message: 'La quantité doit être au moins 1' }),
    (0, class_validator_1.Max)(10, { message: 'La quantité ne peut pas dépasser 10' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], SelectPlanDto.prototype, "quantity", void 0);
class SelectZoneDto {
    zoneId;
}
exports.SelectZoneDto = SelectZoneDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID de la zone sélectionnée',
        example: 'zone_premium_a',
    }),
    (0, class_validator_1.IsString)({ message: 'L\'ID de la zone doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], SelectZoneDto.prototype, "zoneId", void 0);
class SelectSeatsDto {
    seatIds;
}
exports.SelectSeatsDto = SelectSeatsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'IDs des places sélectionnées',
        example: ['seat_001', 'seat_002'],
        type: [String],
    }),
    (0, class_validator_1.IsArray)({ message: 'Les IDs des places doivent être fournis sous forme de tableau' }),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'Au moins une place doit être sélectionnée' }),
    (0, class_validator_1.ArrayMaxSize)(10, { message: 'Maximum 10 places autorisées' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Chaque ID de place doit être une chaîne de caractères' }),
    __metadata("design:type", Array)
], SelectSeatsDto.prototype, "seatIds", void 0);
class PhysicalCardDto {
    qrCode;
    serialNumber;
}
exports.PhysicalCardDto = PhysicalCardDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'QR code de la carte physique',
        example: 'QR_2025_ABC123',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le QR code doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], PhysicalCardDto.prototype, "qrCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Numéro de série de la carte physique',
        example: 'A001',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le numéro de série doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], PhysicalCardDto.prototype, "serialNumber", void 0);
class ValidatePhysicalCardsDto {
    cards;
}
exports.ValidatePhysicalCardsDto = ValidatePhysicalCardsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Liste des cartes physiques à valider',
        type: [PhysicalCardDto],
    }),
    (0, class_validator_1.IsArray)({ message: 'Les cartes doivent être fournies sous forme de tableau' }),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'Au moins une carte doit être fournie' }),
    (0, class_validator_1.ArrayMaxSize)(10, { message: 'Maximum 10 cartes autorisées' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PhysicalCardDto),
    __metadata("design:type", Array)
], ValidatePhysicalCardsDto.prototype, "cards", void 0);
class CompleteSaleDto {
    customerInfo;
    paymentMethod;
    saleMode;
}
exports.CompleteSaleDto = CompleteSaleDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Informations client',
        type: create_subscription_sale_dto_1.CustomerInfoDto,
    }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => create_subscription_sale_dto_1.CustomerInfoDto),
    __metadata("design:type", create_subscription_sale_dto_1.CustomerInfoDto)
], CompleteSaleDto.prototype, "customerInfo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Méthode de paiement',
        enum: sale_types_1.PaymentMethod,
        example: sale_types_1.PaymentMethod.CASH,
    }),
    (0, class_validator_1.IsEnum)(sale_types_1.PaymentMethod, { message: 'Méthode de paiement invalide' }),
    __metadata("design:type", String)
], CompleteSaleDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Mode de vente',
        enum: ['IDENTIFIED', 'ANONYMOUS'],
        example: 'IDENTIFIED',
        default: 'IDENTIFIED',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['IDENTIFIED', 'ANONYMOUS'], { message: 'Mode de vente invalide' }),
    __metadata("design:type", String)
], CompleteSaleDto.prototype, "saleMode", void 0);
class CompleteAnonymousSaleDto {
    paymentMethod;
}
exports.CompleteAnonymousSaleDto = CompleteAnonymousSaleDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Méthode de paiement',
        enum: sale_types_1.PaymentMethod,
        example: sale_types_1.PaymentMethod.CASH,
    }),
    (0, class_validator_1.IsEnum)(sale_types_1.PaymentMethod, { message: 'Méthode de paiement invalide' }),
    __metadata("design:type", String)
], CompleteAnonymousSaleDto.prototype, "paymentMethod", void 0);
class FlowStepResponseDto {
    success;
    sessionId;
    currentStep;
    nextStep;
    data;
    message;
    allowedActions;
}
exports.FlowStepResponseDto = FlowStepResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Statut de la réponse',
        example: true,
    }),
    __metadata("design:type", Boolean)
], FlowStepResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID de la session de vente',
        example: 'SALES_1642680000_ABC123',
    }),
    __metadata("design:type", String)
], FlowStepResponseDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Étape courante du flow',
        example: 'ZONE_SEAT_SELECTION',
    }),
    __metadata("design:type", String)
], FlowStepResponseDto.prototype, "currentStep", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Prochaine étape suggérée',
        example: 'CARD_VALIDATION',
    }),
    __metadata("design:type", String)
], FlowStepResponseDto.prototype, "nextStep", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Données spécifiques à l\'étape',
    }),
    __metadata("design:type", Object)
], FlowStepResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message descriptif',
        example: 'Plan sélectionné. Choisissez votre zone préférée.',
    }),
    __metadata("design:type", String)
], FlowStepResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Actions autorisées à cette étape',
        example: ['SELECT_ZONE', 'CHANGE_PLAN', 'CANCEL_SESSION'],
        type: [String],
    }),
    __metadata("design:type", Array)
], FlowStepResponseDto.prototype, "allowedActions", void 0);
class AvailablePlansResponseDto {
    success;
    data;
    totalPlans;
    message;
}
exports.AvailablePlansResponseDto = AvailablePlansResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Statut de la réponse',
        example: true,
    }),
    __metadata("design:type", Boolean)
], AvailablePlansResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Liste des plans d\'abonnement disponibles',
    }),
    __metadata("design:type", Array)
], AvailablePlansResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nombre de plans disponibles',
        example: 3,
    }),
    __metadata("design:type", Number)
], AvailablePlansResponseDto.prototype, "totalPlans", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message descriptif',
        example: '3 plans d\'abonnement disponibles',
    }),
    __metadata("design:type", String)
], AvailablePlansResponseDto.prototype, "message", void 0);
class PlanZonesResponseDto {
    success;
    planId;
    selectionType;
    zones;
    message;
}
exports.PlanZonesResponseDto = PlanZonesResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Statut de la réponse',
        example: true,
    }),
    __metadata("design:type", Boolean)
], PlanZonesResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID du plan',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], PlanZonesResponseDto.prototype, "planId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Type de sélection requis',
        example: 'MULTIPLE_ZONES',
    }),
    __metadata("design:type", String)
], PlanZonesResponseDto.prototype, "selectionType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Zones disponibles pour ce plan',
    }),
    __metadata("design:type", Array)
], PlanZonesResponseDto.prototype, "zones", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message descriptif',
        example: 'Le client doit d\'abord choisir une zone',
    }),
    __metadata("design:type", String)
], PlanZonesResponseDto.prototype, "message", void 0);
class ZoneSeatsResponseDto {
    success;
    zoneId;
    zoneName;
    hasSeats;
    availableSeats;
    canAccommodateQuantity;
    message;
}
exports.ZoneSeatsResponseDto = ZoneSeatsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Statut de la réponse',
        example: true,
    }),
    __metadata("design:type", Boolean)
], ZoneSeatsResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID de la zone',
        example: 'zone_premium_a',
    }),
    __metadata("design:type", String)
], ZoneSeatsResponseDto.prototype, "zoneId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nom de la zone',
        example: 'Tribune Premium A',
    }),
    __metadata("design:type", String)
], ZoneSeatsResponseDto.prototype, "zoneName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'La zone a-t-elle des places individuelles',
        example: true,
    }),
    __metadata("design:type", Boolean)
], ZoneSeatsResponseDto.prototype, "hasSeats", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Places disponibles',
    }),
    __metadata("design:type", Array)
], ZoneSeatsResponseDto.prototype, "availableSeats", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Peut accommoder la quantité demandée',
        example: true,
    }),
    __metadata("design:type", Boolean)
], ZoneSeatsResponseDto.prototype, "canAccommodateQuantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message descriptif',
        example: '45 place(s) disponible(s)',
    }),
    __metadata("design:type", String)
], ZoneSeatsResponseDto.prototype, "message", void 0);
//# sourceMappingURL=sales-flow.dto.js.map