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
exports.CreateSubscriptionSaleDto = exports.CustomerInfoDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const sale_types_1 = require("../types/sale-types");
class CustomerInfoDto {
    firstName;
    lastName;
    email;
    phone;
    fanId;
}
exports.CustomerInfoDto = CustomerInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Prénom du client',
        example: 'Ahmed',
        minLength: 2,
        maxLength: 100,
    }),
    (0, class_validator_1.IsString)({ message: 'Le prénom doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(2, 100, { message: 'Le prénom doit contenir entre 2 et 100 caractères' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], CustomerInfoDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nom de famille du client',
        example: 'Ben Ali',
        minLength: 2,
        maxLength: 100,
    }),
    (0, class_validator_1.IsString)({ message: 'Le nom doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(2, 100, { message: 'Le nom doit contenir entre 2 et 100 caractères' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], CustomerInfoDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Adresse email du client',
        example: 'ahmed.benali@email.com',
        format: 'email',
    }),
    (0, class_validator_1.IsEmail)({}, { message: 'L\'adresse email n\'est pas valide' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.toLowerCase().trim()),
    __metadata("design:type", String)
], CustomerInfoDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Numéro de téléphone du client',
        example: '+21697123456',
    }),
    (0, class_validator_1.IsPhoneNumber)(null, { message: 'Le numéro de téléphone n\'est pas valide' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], CustomerInfoDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID fan du client (optionnel)',
        example: 'FAN_2025_001',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le fan ID doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(1, 50, { message: 'Le fan ID ne peut pas dépasser 50 caractères' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim().toUpperCase()),
    __metadata("design:type", String)
], CustomerInfoDto.prototype, "fanId", void 0);
class CreateSubscriptionSaleDto {
    planId;
    quantity;
    qrCodes;
    saleMode;
    saleChannel;
    paymentMethod;
    amount;
    currency;
    customerInfo;
    sellerId;
    metadata;
}
exports.CreateSubscriptionSaleDto = CreateSubscriptionSaleDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID du plan d\'abonnement',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsUUID)(4, { message: 'L\'ID du plan doit être un UUID valide' }),
    __metadata("design:type", String)
], CreateSubscriptionSaleDto.prototype, "planId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantité d\'abonnements à vendre',
        example: 2,
        minimum: 1,
        maximum: 10,
    }),
    (0, class_validator_1.IsNumber)({}, { message: 'La quantité doit être un nombre' }),
    (0, class_validator_1.Min)(1, { message: 'La quantité doit être au moins 1' }),
    (0, class_validator_1.Max)(10, { message: 'La quantité ne peut pas dépasser 10' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateSubscriptionSaleDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'QR codes des cartes physiques à assigner',
        example: ['QR_2025_ABC123', 'QR_2025_DEF456'],
        type: [String],
    }),
    (0, class_validator_1.IsArray)({ message: 'Les QR codes doivent être fournis sous forme de tableau' }),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'Au moins un QR code doit être fourni' }),
    (0, class_validator_1.ArrayMaxSize)(10, { message: 'Maximum 10 QR codes autorisés' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Chaque QR code doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(10, 255, { each: true, message: 'Chaque QR code doit contenir entre 10 et 255 caractères' }),
    __metadata("design:type", Array)
], CreateSubscriptionSaleDto.prototype, "qrCodes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Mode de vente',
        enum: sale_types_1.SaleMode,
        example: sale_types_1.SaleMode.IDENTIFIED,
    }),
    (0, class_validator_1.IsEnum)(sale_types_1.SaleMode, { message: 'Mode de vente invalide' }),
    __metadata("design:type", String)
], CreateSubscriptionSaleDto.prototype, "saleMode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Canal de vente',
        enum: sale_types_1.SaleChannel,
        example: sale_types_1.SaleChannel.PHYSICAL,
    }),
    (0, class_validator_1.IsEnum)(sale_types_1.SaleChannel, { message: 'Canal de vente invalide' }),
    __metadata("design:type", String)
], CreateSubscriptionSaleDto.prototype, "saleChannel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Méthode de paiement',
        enum: sale_types_1.PaymentMethod,
        example: sale_types_1.PaymentMethod.CASH,
    }),
    (0, class_validator_1.IsEnum)(sale_types_1.PaymentMethod, { message: 'Méthode de paiement invalide' }),
    __metadata("design:type", String)
], CreateSubscriptionSaleDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Montant total de la vente',
        example: 150.00,
        minimum: 0,
    }),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }, { message: 'Le montant doit être un nombre avec maximum 2 décimales' }),
    (0, class_validator_1.Min)(0, { message: 'Le montant ne peut pas être négatif' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateSubscriptionSaleDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Devise',
        example: 'TND',
        minLength: 3,
        maxLength: 3,
    }),
    (0, class_validator_1.IsString)({ message: 'La devise doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(3, 3, { message: 'La devise doit contenir exactement 3 caractères' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.toUpperCase()),
    __metadata("design:type", String)
], CreateSubscriptionSaleDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Informations client (requis si saleMode = IDENTIFIED)',
        type: CustomerInfoDto,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CustomerInfoDto),
    __metadata("design:type", CustomerInfoDto)
], CreateSubscriptionSaleDto.prototype, "customerInfo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID du vendeur (pour vente physique)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: 'L\'ID du vendeur doit être un UUID valide' }),
    __metadata("design:type", String)
], CreateSubscriptionSaleDto.prototype, "sellerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Métadonnées additionnelles',
        example: { location: 'Stand A', campaign: 'Summer2025' },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Les métadonnées doivent être un objet' }),
    __metadata("design:type", Object)
], CreateSubscriptionSaleDto.prototype, "metadata", void 0);
//# sourceMappingURL=create-subscription-sale.dto.js.map