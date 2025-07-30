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
exports.ValidateAccessDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const access_enums_1 = require("../../types/access-enums");
const shield_constants_1 = require("../../types/shield-constants");
class GeolocationDto {
    latitude;
    longitude;
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Latitude de la position',
        example: 36.8065
    }),
    (0, class_validator_1.IsLatitude)({ message: 'La latitude doit être valide' }),
    __metadata("design:type", Number)
], GeolocationDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Longitude de la position',
        example: 10.1815
    }),
    (0, class_validator_1.IsLongitude)({ message: 'La longitude doit être valide' }),
    __metadata("design:type", Number)
], GeolocationDto.prototype, "longitude", void 0);
class AccessContextDto {
    ip_address;
    user_agent;
    geolocation;
    device_fingerprint;
    venue_zone;
    additional_data;
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Adresse IP du client',
        example: '192.168.1.100'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIP)(undefined, { message: 'L\'adresse IP doit être valide' }),
    __metadata("design:type", String)
], AccessContextDto.prototype, "ip_address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User-Agent du navigateur/application',
        example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le User-Agent doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], AccessContextDto.prototype, "user_agent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Position géographique',
        type: GeolocationDto
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => GeolocationDto),
    __metadata("design:type", GeolocationDto)
], AccessContextDto.prototype, "geolocation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Empreinte unique de l\'appareil',
        example: 'fp_1234567890abcdef'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'L\'empreinte d\'appareil doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], AccessContextDto.prototype, "device_fingerprint", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Zone du lieu actuelle',
        example: 'entrance_main'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La zone du lieu doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], AccessContextDto.prototype, "venue_zone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Données additionnelles contextuelles',
        example: {
            scanner_id: 'SCAN001',
            staff_member: 'john_doe',
            verification_method: 'qr_code'
        }
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Les données additionnelles doivent être un objet' }),
    __metadata("design:type", Object)
], AccessContextDto.prototype, "additional_data", void 0);
class ValidateAccessDto {
    access_code;
    access_point;
    action;
    context;
}
exports.ValidateAccessDto = ValidateAccessDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Code d\'accès à valider',
        example: 'A1B2C3D4E5F6G7H8',
        pattern: shield_constants_1.SHIELD_CONSTANTS.VALIDATION_PATTERNS.ACCESS_CODE.source
    }),
    (0, class_validator_1.IsString)({ message: 'Le code d\'accès doit être une chaîne de caractères' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le code d\'accès ne peut pas être vide' }),
    (0, class_validator_1.Matches)(shield_constants_1.SHIELD_CONSTANTS.VALIDATION_PATTERNS.ACCESS_CODE, {
        message: 'Le code d\'accès doit contenir 8 à 20 caractères alphanumériques majuscules'
    }),
    __metadata("design:type", String)
], ValidateAccessDto.prototype, "access_code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Point d\'accès où la validation est effectuée',
        example: 'entrance_main_gate_1'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le point d\'accès doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], ValidateAccessDto.prototype, "access_point", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Action demandée',
        enum: access_enums_1.AccessAction,
        example: access_enums_1.AccessAction.ENTRY
    }),
    (0, class_validator_1.IsEnum)(access_enums_1.AccessAction, {
        message: `L'action doit être l'une de: ${Object.values(access_enums_1.AccessAction).join(', ')}`
    }),
    __metadata("design:type", String)
], ValidateAccessDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Contexte de la validation d\'accès',
        type: AccessContextDto
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => AccessContextDto),
    __metadata("design:type", AccessContextDto)
], ValidateAccessDto.prototype, "context", void 0);
//# sourceMappingURL=validate-access.dto.js.map