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
exports.CreateAnonymousResponseDto = exports.CreateAnonymousDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class CreateAnonymousDto {
    guestName;
    guestEmail;
    guestPhone;
    incentiveType;
    incentiveValue;
    incentiveDescription;
    expiresAt;
    metadata;
}
exports.CreateAnonymousDto = CreateAnonymousDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nom complet de l\'utilisateur anonyme',
        example: 'Ahmed Ben Salem',
        minLength: 2,
        maxLength: 200,
    }),
    (0, class_validator_1.IsString)({ message: 'Le nom doit être une chaîne de caractères' }),
    (0, class_validator_1.MinLength)(2, { message: 'Le nom doit contenir au moins 2 caractères' }),
    (0, class_validator_1.MaxLength)(200, { message: 'Le nom ne peut pas dépasser 200 caractères' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], CreateAnonymousDto.prototype, "guestName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Email de l\'utilisateur anonyme',
        example: 'ahmed.temp@gmail.com',
    }),
    (0, class_validator_1.IsEmail)({}, { message: 'Format d\'email invalide' }),
    (0, class_validator_1.MaxLength)(255, { message: 'L\'email ne peut pas dépasser 255 caractères' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.toLowerCase()?.trim()),
    __metadata("design:type", String)
], CreateAnonymousDto.prototype, "guestEmail", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Numéro de téléphone (optionnel)',
        example: '+21697123456',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le téléphone doit être une chaîne de caractères' }),
    (0, class_validator_1.MaxLength)(20, { message: 'Le téléphone ne peut pas dépasser 20 caractères' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], CreateAnonymousDto.prototype, "guestPhone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Type d\'incentive pour l\'onboarding',
        example: 'BONUS_POINTS',
        enum: ['BONUS_POINTS', 'DISCOUNT_NEXT', 'FREE_UPGRADE', 'EXCLUSIVE_ACCESS', 'GIFT_VOUCHER'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le type d\'incentive doit être une chaîne de caractères' }),
    (0, class_validator_1.IsIn)(['BONUS_POINTS', 'DISCOUNT_NEXT', 'FREE_UPGRADE', 'EXCLUSIVE_ACCESS', 'GIFT_VOUCHER'], {
        message: 'Type d\'incentive invalide',
    }),
    __metadata("design:type", String)
], CreateAnonymousDto.prototype, "incentiveType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Valeur de l\'incentive',
        example: 100,
        minimum: 0,
        maximum: 10000,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'La valeur de l\'incentive doit être un nombre entier' }),
    (0, class_validator_1.Min)(0, { message: 'La valeur de l\'incentive doit être positive' }),
    (0, class_validator_1.Max)(10000, { message: 'La valeur de l\'incentive ne peut pas dépasser 10000' }),
    __metadata("design:type", Number)
], CreateAnonymousDto.prototype, "incentiveValue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Description de l\'incentive',
        example: '100 points bonus à l\'inscription + accès ventes privées',
        maxLength: 500,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La description doit être une chaîne de caractères' }),
    (0, class_validator_1.MaxLength)(500, { message: 'La description ne peut pas dépasser 500 caractères' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], CreateAnonymousDto.prototype, "incentiveDescription", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date d\'expiration de l\'incentive',
        example: '2025-12-31T23:59:59Z',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Format de date invalide' }),
    __metadata("design:type", String)
], CreateAnonymousDto.prototype, "expiresAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Métadonnées additionnelles',
        example: {
            source: 'event-purchase',
            eventId: 'evt-123',
            ticketType: 'STANDARD',
            campaign: 'summer2025'
        },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Les métadonnées doivent être un objet' }),
    __metadata("design:type", Object)
], CreateAnonymousDto.prototype, "metadata", void 0);
class CreateAnonymousResponseDto {
    id;
    guestName;
    guestEmail;
    onboardingKey;
    incentive;
    createdAt;
    onboardingUrl;
}
exports.CreateAnonymousResponseDto = CreateAnonymousResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID de l\'utilisateur anonyme créé',
        example: 'anon-123-456',
    }),
    __metadata("design:type", String)
], CreateAnonymousResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nom de l\'utilisateur anonyme',
        example: 'Ahmed Ben Salem',
    }),
    __metadata("design:type", String)
], CreateAnonymousResponseDto.prototype, "guestName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Email de l\'utilisateur anonyme',
        example: 'ahmed.temp@gmail.com',
    }),
    __metadata("design:type", String)
], CreateAnonymousResponseDto.prototype, "guestEmail", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Clé d\'onboarding générée',
        example: 'ONB_2025_EVT_XY9Z23',
    }),
    __metadata("design:type", String)
], CreateAnonymousResponseDto.prototype, "onboardingKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Détails de l\'incentive',
        example: {
            type: 'BONUS_POINTS',
            value: 100,
            description: '100 points bonus à l\'inscription'
        },
    }),
    __metadata("design:type", Object)
], CreateAnonymousResponseDto.prototype, "incentive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Date de création',
        example: '2025-07-17T10:30:00Z',
    }),
    __metadata("design:type", String)
], CreateAnonymousResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Lien d\'onboarding personnalisé',
        example: 'https://entrix.tn/onboard/ONB_2025_EVT_XY9Z23',
    }),
    __metadata("design:type", String)
], CreateAnonymousResponseDto.prototype, "onboardingUrl", void 0);
//# sourceMappingURL=create-anonymous.dto.js.map