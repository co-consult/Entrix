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
exports.AccessRightsQueryDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const access_enums_1 = require("../../types/access-enums");
class AccessRightsQueryDto {
    user_id;
    event_id;
    organizer_id;
    status;
    source_type;
    zone_id;
    valid_from;
    valid_until;
    page = 1;
    limit = 20;
    include_expired = false;
}
exports.AccessRightsQueryDto = AccessRightsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filtrer par ID utilisateur',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: 'L\'ID utilisateur doit être un UUID valide' }),
    __metadata("design:type", String)
], AccessRightsQueryDto.prototype, "user_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filtrer par ID événement',
        example: '123e4567-e89b-12d3-a456-426614174001'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: 'L\'ID événement doit être un UUID valide' }),
    __metadata("design:type", String)
], AccessRightsQueryDto.prototype, "event_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filtrer par ID organisateur',
        example: '123e4567-e89b-12d3-a456-426614174002'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: 'L\'ID organisateur doit être un UUID valide' }),
    __metadata("design:type", String)
], AccessRightsQueryDto.prototype, "organizer_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filtrer par statut',
        enum: access_enums_1.AccessRightStatus,
        example: access_enums_1.AccessRightStatus.VALID
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(access_enums_1.AccessRightStatus, {
        message: `Le statut doit être l'un de: ${Object.values(access_enums_1.AccessRightStatus).join(', ')}`
    }),
    __metadata("design:type", String)
], AccessRightsQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filtrer par type de source',
        enum: access_enums_1.AccessSourceType,
        example: access_enums_1.AccessSourceType.TICKET
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(access_enums_1.AccessSourceType, {
        message: `Le type de source doit être l'un de: ${Object.values(access_enums_1.AccessSourceType).join(', ')}`
    }),
    __metadata("design:type", String)
], AccessRightsQueryDto.prototype, "source_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filtrer par zone',
        example: 'VIP-001'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'L\'ID zone doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], AccessRightsQueryDto.prototype, "zone_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date de début de la période de recherche',
        example: '2024-03-01T00:00:00.000Z'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'La date de début doit être au format ISO 8601' }),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], AccessRightsQueryDto.prototype, "valid_from", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date de fin de la période de recherche',
        example: '2024-03-31T23:59:59.999Z'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'La date de fin doit être au format ISO 8601' }),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], AccessRightsQueryDto.prototype, "valid_until", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Numéro de page',
        example: 1,
        default: 1
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)({ message: 'Le numéro de page doit être un entier' }),
    (0, class_validator_1.Min)(1, { message: 'Le numéro de page minimum est 1' }),
    __metadata("design:type", Number)
], AccessRightsQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nombre d\'éléments par page',
        example: 20,
        default: 20
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)({ message: 'La limite doit être un entier' }),
    (0, class_validator_1.Min)(1, { message: 'La limite minimum est 1' }),
    (0, class_validator_1.Max)(100, { message: 'La limite maximum est 100' }),
    __metadata("design:type", Number)
], AccessRightsQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Inclure les droits d\'accès expirés',
        example: false,
        default: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], AccessRightsQueryDto.prototype, "include_expired", void 0);
//# sourceMappingURL=access-rights-query.dto.js.map