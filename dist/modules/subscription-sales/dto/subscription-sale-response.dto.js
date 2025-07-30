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
exports.QRCodeValidationDto = exports.ConversionResponseDto = exports.SubscriptionSaleResponseDto = exports.IncentiveInfoDto = exports.OrderInfoDto = exports.UserInfoDto = exports.SubscriptionInfoDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class SubscriptionInfoDto {
    id;
    qrCode;
    onboardingKey;
}
exports.SubscriptionInfoDto = SubscriptionInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID de l\'abonnement créé',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], SubscriptionInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'QR code assigné à l\'abonnement',
        example: 'QR_2025_ABC123',
    }),
    __metadata("design:type", String)
], SubscriptionInfoDto.prototype, "qrCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Clé d\'onboarding pour conversion ultérieure',
        example: 'ONB_2025_ABC_XYZ123',
    }),
    __metadata("design:type", String)
], SubscriptionInfoDto.prototype, "onboardingKey", void 0);
class UserInfoDto {
    id;
    email;
    firstName;
    lastName;
}
exports.UserInfoDto = UserInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID de l\'utilisateur',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], UserInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Adresse email',
        example: 'ahmed.benali@email.com',
    }),
    __metadata("design:type", String)
], UserInfoDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Prénom',
        example: 'Ahmed',
    }),
    __metadata("design:type", String)
], UserInfoDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nom de famille',
        example: 'Ben Ali',
    }),
    __metadata("design:type", String)
], UserInfoDto.prototype, "lastName", void 0);
class OrderInfoDto {
    id;
    total;
    currency;
}
exports.OrderInfoDto = OrderInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID de la commande',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], OrderInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Montant total',
        example: 150.00,
    }),
    __metadata("design:type", Number)
], OrderInfoDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Devise',
        example: 'TND',
    }),
    __metadata("design:type", String)
], OrderInfoDto.prototype, "currency", void 0);
class IncentiveInfoDto {
    type;
    value;
    description;
}
exports.IncentiveInfoDto = IncentiveInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Type d\'incentive',
        example: 'BONUS_POINTS',
    }),
    __metadata("design:type", String)
], IncentiveInfoDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Valeur de l\'incentive',
        example: 100,
    }),
    __metadata("design:type", Number)
], IncentiveInfoDto.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Description de l\'incentive',
        example: '100 points bonus à l\'inscription',
    }),
    __metadata("design:type", String)
], IncentiveInfoDto.prototype, "description", void 0);
class SubscriptionSaleResponseDto {
    success;
    subscriptions;
    user;
    order;
    message;
}
exports.SubscriptionSaleResponseDto = SubscriptionSaleResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Statut de la réponse',
        example: true,
    }),
    __metadata("design:type", Boolean)
], SubscriptionSaleResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Liste des abonnements créés',
        type: [SubscriptionInfoDto],
    }),
    __metadata("design:type", Array)
], SubscriptionSaleResponseDto.prototype, "subscriptions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Informations utilisateur (si saleMode = IDENTIFIED)',
        type: UserInfoDto,
    }),
    __metadata("design:type", UserInfoDto)
], SubscriptionSaleResponseDto.prototype, "user", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Informations de commande',
        type: OrderInfoDto,
    }),
    __metadata("design:type", OrderInfoDto)
], SubscriptionSaleResponseDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message de confirmation',
        example: 'Vente d\'abonnement réalisée avec succès. 2 abonnements créés.',
    }),
    __metadata("design:type", String)
], SubscriptionSaleResponseDto.prototype, "message", void 0);
class ConversionResponseDto {
    success;
    user;
    subscriptionsMigrated;
    incentivesApplied;
    message;
}
exports.ConversionResponseDto = ConversionResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Statut de la réponse',
        example: true,
    }),
    __metadata("design:type", Boolean)
], ConversionResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Informations de l\'utilisateur créé',
        type: UserInfoDto,
    }),
    __metadata("design:type", UserInfoDto)
], ConversionResponseDto.prototype, "user", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nombre d\'abonnements migrés',
        example: 2,
    }),
    __metadata("design:type", Number)
], ConversionResponseDto.prototype, "subscriptionsMigrated", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Incentives appliqués',
        type: IncentiveInfoDto,
    }),
    __metadata("design:type", IncentiveInfoDto)
], ConversionResponseDto.prototype, "incentivesApplied", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message de confirmation',
        example: 'Compte créé avec succès. 2 abonnements ont été associés à votre compte.',
    }),
    __metadata("design:type", String)
], ConversionResponseDto.prototype, "message", void 0);
class QRCodeValidationDto {
    qrCode;
    isAvailable;
    status;
    assignedAt;
    errorMessage;
}
exports.QRCodeValidationDto = QRCodeValidationDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'QR code validé',
        example: 'QR_2025_ABC123',
    }),
    __metadata("design:type", String)
], QRCodeValidationDto.prototype, "qrCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Disponibilité du QR code',
        example: true,
    }),
    __metadata("design:type", Boolean)
], QRCodeValidationDto.prototype, "isAvailable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Statut du QR code',
        example: 'AVAILABLE',
    }),
    __metadata("design:type", String)
], QRCodeValidationDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date d\'assignation (si applicable)',
        example: '2025-01-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], QRCodeValidationDto.prototype, "assignedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Message d\'erreur (si non disponible)',
        example: 'QR code déjà assigné',
    }),
    __metadata("design:type", String)
], QRCodeValidationDto.prototype, "errorMessage", void 0);
//# sourceMappingURL=subscription-sale-response.dto.js.map