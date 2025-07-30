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
exports.CreateAccessRightDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const access_enums_1 = require("../../types/access-enums");
class CreateAccessRightDto {
    user_id;
    event_id;
    organizer_id;
    subscription_id;
    ticket_id;
    zone_id;
    seat_id;
    source_type;
    valid_from;
    valid_until;
    max_uses = 1;
    access_metadata;
    special_permissions;
}
exports.CreateAccessRightDto = CreateAccessRightDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID de l\'utilisateur propriétaire du droit d\'accès',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: 'L\'ID utilisateur doit être un UUID valide' }),
    __metadata("design:type", String)
], CreateAccessRightDto.prototype, "user_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID de l\'événement associé',
        example: '123e4567-e89b-12d3-a456-426614174001'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: 'L\'ID événement doit être un UUID valide' }),
    __metadata("design:type", String)
], CreateAccessRightDto.prototype, "event_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID de l\'organisateur',
        example: '123e4567-e89b-12d3-a456-426614174002'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: 'L\'ID organisateur doit être un UUID valide' }),
    __metadata("design:type", String)
], CreateAccessRightDto.prototype, "organizer_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID de l\'abonnement associé',
        example: '123e4567-e89b-12d3-a456-426614174003'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: 'L\'ID abonnement doit être un UUID valide' }),
    __metadata("design:type", String)
], CreateAccessRightDto.prototype, "subscription_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID du ticket associé',
        example: '123e4567-e89b-12d3-a456-426614174004'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: 'L\'ID ticket doit être un UUID valide' }),
    __metadata("design:type", String)
], CreateAccessRightDto.prototype, "ticket_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID de la zone d\'accès',
        example: 'VIP-001'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'L\'ID zone doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], CreateAccessRightDto.prototype, "zone_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID du siège spécifique',
        example: 'A-15'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'L\'ID siège doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], CreateAccessRightDto.prototype, "seat_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Type de source du droit d\'accès',
        enum: access_enums_1.AccessSourceType,
        example: access_enums_1.AccessSourceType.TICKET
    }),
    (0, class_validator_1.IsEnum)(access_enums_1.AccessSourceType, {
        message: `Le type de source doit être l'un de: ${Object.values(access_enums_1.AccessSourceType).join(', ')}`
    }),
    __metadata("design:type", String)
], CreateAccessRightDto.prototype, "source_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Date et heure de début de validité',
        example: '2024-03-15T18:00:00.000Z'
    }),
    (0, class_validator_1.IsDateString)({}, { message: 'La date de début doit être au format ISO 8601' }),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], CreateAccessRightDto.prototype, "valid_from", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Date et heure de fin de validité',
        example: '2024-03-15T23:00:00.000Z'
    }),
    (0, class_validator_1.IsDateString)({}, { message: 'La date de fin doit être au format ISO 8601' }),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], CreateAccessRightDto.prototype, "valid_until", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nombre maximum d\'utilisations autorisées',
        example: 1,
        default: 1
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'Le nombre maximum d\'utilisations doit être un entier' }),
    (0, class_validator_1.Min)(1, { message: 'Le nombre minimum d\'utilisations est 1' }),
    (0, class_validator_1.Max)(100, { message: 'Le nombre maximum d\'utilisations ne peut pas dépasser 100' }),
    __metadata("design:type", Number)
], CreateAccessRightDto.prototype, "max_uses", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Métadonnées d\'accès additionnelles',
        example: {
            category: 'VIP',
            benefits: ['lounge_access', 'premium_parking'],
            restrictions: ['no_alcohol']
        }
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Les métadonnées d\'accès doivent être un objet' }),
    __metadata("design:type", Object)
], CreateAccessRightDto.prototype, "access_metadata", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Permissions spéciales accordées',
        example: {
            backstage_access: true,
            photo_permissions: true,
            early_entry: true
        }
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Les permissions spéciales doivent être un objet' }),
    __metadata("design:type", Object)
], CreateAccessRightDto.prototype, "special_permissions", void 0);
//# sourceMappingURL=create-access-right.dto.js.map