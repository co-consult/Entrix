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
exports.TokenPairDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class TokenPairDto {
    accessToken;
    refreshToken;
    tokenType;
    expiresIn;
    refreshExpiresIn;
    issuedAt;
    accessTokenExpiresAt;
    refreshTokenExpiresAt;
}
exports.TokenPairDto = TokenPairDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Access token JWT pour authentification des requêtes',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        pattern: '^[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]*$',
    }),
    (0, class_validator_1.IsString)({
        message: 'L\'access token doit être une chaîne de caractères'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'L\'access token est requis'
    }),
    __metadata("design:type", String)
], TokenPairDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Refresh token JWT pour renouveler l\'access token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE1MTYyMzkwMjJ9.kVL8RJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        pattern: '^[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]*$',
    }),
    (0, class_validator_1.IsString)({
        message: 'Le refresh token doit être une chaîne de caractères'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'Le refresh token est requis'
    }),
    __metadata("design:type", String)
], TokenPairDto.prototype, "refreshToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Type de token pour l\'en-tête Authorization',
        example: 'Bearer',
        default: 'Bearer',
    }),
    (0, class_validator_1.IsString)({
        message: 'Le type de token doit être une chaîne de caractères'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'Le type de token est requis'
    }),
    __metadata("design:type", String)
], TokenPairDto.prototype, "tokenType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Durée de vie de l\'access token en secondes',
        example: 900,
        minimum: 60,
        maximum: 86400,
    }),
    (0, class_validator_1.IsNumber)({}, {
        message: 'La durée d\'expiration doit être un nombre'
    }),
    (0, class_validator_1.Min)(60, {
        message: 'La durée d\'expiration doit être d\'au moins 60 secondes'
    }),
    (0, class_validator_1.Max)(86400, {
        message: 'La durée d\'expiration ne peut pas dépasser 24 heures'
    }),
    __metadata("design:type", Number)
], TokenPairDto.prototype, "expiresIn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Durée de vie du refresh token en secondes',
        example: 604800,
        minimum: 3600,
        maximum: 2592000,
    }),
    (0, class_validator_1.IsNumber)({}, {
        message: 'La durée d\'expiration du refresh token doit être un nombre'
    }),
    (0, class_validator_1.Min)(3600, {
        message: 'La durée d\'expiration du refresh token doit être d\'au moins 1 heure'
    }),
    (0, class_validator_1.Max)(2592000, {
        message: 'La durée d\'expiration du refresh token ne peut pas dépasser 30 jours'
    }),
    __metadata("design:type", Number)
], TokenPairDto.prototype, "refreshExpiresIn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Timestamp d\'émission des tokens (ISO string)',
        example: '2025-01-07T10:30:00.000Z',
    }),
    __metadata("design:type", String)
], TokenPairDto.prototype, "issuedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Timestamp d\'expiration de l\'access token (ISO string)',
        example: '2025-01-07T10:45:00.000Z',
    }),
    __metadata("design:type", String)
], TokenPairDto.prototype, "accessTokenExpiresAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Timestamp d\'expiration du refresh token (ISO string)',
        example: '2025-01-14T10:30:00.000Z',
    }),
    __metadata("design:type", String)
], TokenPairDto.prototype, "refreshTokenExpiresAt", void 0);
//# sourceMappingURL=token-pair.dto.js.map