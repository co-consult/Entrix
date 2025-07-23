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
exports.SecurityEventsResponseDto = exports.SecurityEventDto = exports.SecurityEventsQueryDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class SecurityEventsQueryDto {
    limit = 20;
    offset = 0;
    eventType;
    fromDate;
    toDate;
}
exports.SecurityEventsQueryDto = SecurityEventsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nombre d\'événements à retourner',
        default: 20,
        minimum: 1,
        maximum: 100,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Limit doit être un nombre' }),
    (0, class_validator_1.Min)(1, { message: 'Limit minimum: 1' }),
    (0, class_validator_1.Max)(100, { message: 'Limit maximum: 100' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    __metadata("design:type", Number)
], SecurityEventsQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Offset pour pagination',
        default: 0,
        minimum: 0,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Offset doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'Offset minimum: 0' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    __metadata("design:type", Number)
], SecurityEventsQueryDto.prototype, "offset", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Type d\'événement de sécurité',
        enum: ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGE', 'MFA_SETUP', 'SUSPICIOUS_ACTIVITY'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGE', 'MFA_SETUP', 'SUSPICIOUS_ACTIVITY'], {
        message: 'Type d\'événement invalide'
    }),
    __metadata("design:type", String)
], SecurityEventsQueryDto.prototype, "eventType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date de début (ISO 8601)',
        format: 'date-time',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Format date invalide' }),
    __metadata("design:type", String)
], SecurityEventsQueryDto.prototype, "fromDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date de fin (ISO 8601)',
        format: 'date-time',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Format date invalide' }),
    __metadata("design:type", String)
], SecurityEventsQueryDto.prototype, "toDate", void 0);
class SecurityEventDto {
    id;
    type;
    description;
    ipAddress;
    userAgent;
    location;
    riskScore;
    createdAt;
    resolved;
    metadata;
}
exports.SecurityEventDto = SecurityEventDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SecurityEventDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGE', 'MFA_SETUP', 'SUSPICIOUS_ACTIVITY'],
    }),
    __metadata("design:type", String)
], SecurityEventDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SecurityEventDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SecurityEventDto.prototype, "ipAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SecurityEventDto.prototype, "userAgent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SecurityEventDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Score de risque (0-100)',
        minimum: 0,
        maximum: 100,
    }),
    __metadata("design:type", Number)
], SecurityEventDto.prototype, "riskScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SecurityEventDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], SecurityEventDto.prototype, "resolved", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], SecurityEventDto.prototype, "metadata", void 0);
class SecurityEventsResponseDto {
    success;
    data;
}
exports.SecurityEventsResponseDto = SecurityEventsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], SecurityEventsResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], SecurityEventsResponseDto.prototype, "data", void 0);
//# sourceMappingURL=security-event.dto.js.map