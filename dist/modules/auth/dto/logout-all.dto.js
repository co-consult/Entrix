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
exports.LogoutAllResponseDto = exports.LogoutAllDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class LogoutAllDto {
    password;
    keepCurrentSession;
    revokeRefreshTokens;
    reason;
}
exports.LogoutAllDto = LogoutAllDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Mot de passe actuel pour confirmer la déconnexion de toutes les sessions',
        example: 'MonMotDePasse123!',
        minLength: 6,
        maxLength: 128,
    }),
    (0, class_validator_1.IsString)({
        message: 'Le mot de passe doit être une chaîne de caractères'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'Le mot de passe est requis pour déconnecter toutes les sessions'
    }),
    (0, class_validator_1.MinLength)(6, {
        message: 'Le mot de passe doit contenir au moins 6 caractères'
    }),
    (0, class_validator_1.MaxLength)(128, {
        message: 'Le mot de passe ne peut pas dépasser 128 caractères'
    }),
    __metadata("design:type", String)
], LogoutAllDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Garder la session courante active (déconnecter seulement les autres)',
        example: true,
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({
        message: 'La valeur doit être un booléen'
    }),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (typeof value === 'string') {
            return value.toLowerCase() === 'true';
        }
        return Boolean(value);
    }),
    __metadata("design:type", Boolean)
], LogoutAllDto.prototype, "keepCurrentSession", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Révoquer également tous les refresh tokens',
        example: true,
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({
        message: 'La valeur doit être un booléen'
    }),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (typeof value === 'string') {
            return value.toLowerCase() === 'true';
        }
        return Boolean(value);
    }),
    __metadata("design:type", Boolean)
], LogoutAllDto.prototype, "revokeRefreshTokens", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Raison de la déconnexion massive',
        example: 'Sécurisation du compte après activité suspecte',
        maxLength: 500,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({
        message: 'La raison doit être une chaîne de caractères'
    }),
    (0, class_validator_1.MaxLength)(500, {
        message: 'La raison ne peut pas dépasser 500 caractères'
    }),
    __metadata("design:type", String)
], LogoutAllDto.prototype, "reason", void 0);
class LogoutAllResponseDto {
    sessionsTerminated;
    tokensRevoked;
    currentSessionKept;
    timestamp;
    message;
}
exports.LogoutAllResponseDto = LogoutAllResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nombre de sessions déconnectées',
        example: 3
    }),
    __metadata("design:type", Number)
], LogoutAllResponseDto.prototype, "sessionsTerminated", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nombre de tokens révoqués',
        example: 6
    }),
    __metadata("design:type", Number)
], LogoutAllResponseDto.prototype, "tokensRevoked", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Session courante conservée',
        example: true
    }),
    __metadata("design:type", Boolean)
], LogoutAllResponseDto.prototype, "currentSessionKept", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Timestamp de l\'opération',
        example: '2025-01-07T10:30:00.000Z'
    }),
    __metadata("design:type", String)
], LogoutAllResponseDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message de confirmation',
        example: 'Toutes les autres sessions ont été déconnectées avec succès'
    }),
    __metadata("design:type", String)
], LogoutAllResponseDto.prototype, "message", void 0);
//# sourceMappingURL=logout-all.dto.js.map