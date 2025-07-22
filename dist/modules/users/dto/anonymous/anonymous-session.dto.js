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
exports.AnonymousSessionResponseDto = exports.UpdateAnonymousSessionDto = exports.CreateAnonymousSessionDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateAnonymousSessionDto {
    anonymousUserId;
    ipAddress;
    userAgent;
    deviceFingerprint;
    geolocation;
    durationMinutes = 60;
    metadata;
}
exports.CreateAnonymousSessionDto = CreateAnonymousSessionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID de l\'utilisateur anonyme',
        example: 'anon-123-456',
    }),
    (0, class_validator_1.IsString)({ message: 'L\'ID utilisateur anonyme doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], CreateAnonymousSessionDto.prototype, "anonymousUserId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Adresse IP de la session',
        example: '192.168.1.100',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'L\'adresse IP doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], CreateAnonymousSessionDto.prototype, "ipAddress", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User Agent du navigateur',
        example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le User Agent doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], CreateAnonymousSessionDto.prototype, "userAgent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Empreinte numérique de l\'appareil',
        example: 'fp_1234567890abcdef',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'L\'empreinte de l\'appareil doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], CreateAnonymousSessionDto.prototype, "deviceFingerprint", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Informations de géolocalisation',
        example: {
            country: 'TN',
            city: 'Tunis',
            latitude: 36.8189,
            longitude: 10.1658
        },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'La géolocalisation doit être un objet' }),
    __metadata("design:type", Object)
], CreateAnonymousSessionDto.prototype, "geolocation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Durée de session souhaitée en minutes',
        example: 60,
        minimum: 5,
        maximum: 1440,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'La durée de session doit être un nombre entier' }),
    (0, class_validator_1.Min)(5, { message: 'La session doit durer au moins 5 minutes' }),
    (0, class_validator_1.Max)(1440, { message: 'La session ne peut pas dépasser 24 heures' }),
    __metadata("design:type", Number)
], CreateAnonymousSessionDto.prototype, "durationMinutes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Métadonnées de session',
        example: {
            source: 'purchase-flow',
            referrer: 'https://google.com',
            utm_campaign: 'summer2025'
        },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Les métadonnées doivent être un objet' }),
    __metadata("design:type", Object)
], CreateAnonymousSessionDto.prototype, "metadata", void 0);
class UpdateAnonymousSessionDto {
    lastActivity;
    extendMinutes;
    metadata;
}
exports.UpdateAnonymousSessionDto = UpdateAnonymousSessionDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Dernière activité de la session',
        example: '2025-07-17T10:30:00Z',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La dernière activité doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], UpdateAnonymousSessionDto.prototype, "lastActivity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Étendre la session de X minutes',
        example: 30,
        minimum: 1,
        maximum: 240,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'L\'extension doit être un nombre entier' }),
    (0, class_validator_1.Min)(1, { message: 'L\'extension doit être d\'au moins 1 minute' }),
    (0, class_validator_1.Max)(240, { message: 'L\'extension ne peut pas dépasser 4 heures' }),
    __metadata("design:type", Number)
], UpdateAnonymousSessionDto.prototype, "extendMinutes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nouvelles métadonnées à ajouter',
        example: { lastPage: '/checkout', cartItems: 2 },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Les métadonnées doivent être un objet' }),
    __metadata("design:type", Object)
], UpdateAnonymousSessionDto.prototype, "metadata", void 0);
class AnonymousSessionResponseDto {
    sessionId;
    sessionToken;
    anonymousUserId;
    expiresAt;
    status;
    anonymousUser;
    createdAt;
    lastActivity;
    metadata;
}
exports.AnonymousSessionResponseDto = AnonymousSessionResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID de la session',
        example: 'sess-anon-123-456',
    }),
    __metadata("design:type", String)
], AnonymousSessionResponseDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Token de session',
        example: 'anon_token_1234567890abcdef',
    }),
    __metadata("design:type", String)
], AnonymousSessionResponseDto.prototype, "sessionToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID de l\'utilisateur anonyme',
        example: 'anon-123-456',
    }),
    __metadata("design:type", String)
], AnonymousSessionResponseDto.prototype, "anonymousUserId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Date d\'expiration de la session',
        example: '2025-07-17T11:30:00Z',
    }),
    __metadata("design:type", String)
], AnonymousSessionResponseDto.prototype, "expiresAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Statut de la session',
        example: 'ACTIVE',
        enum: ['ACTIVE', 'EXPIRED', 'REVOKED'],
    }),
    __metadata("design:type", String)
], AnonymousSessionResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Informations de l\'utilisateur anonyme',
        example: {
            guestName: 'Ahmed Ben Salem',
            guestEmail: 'ahmed.temp@gmail.com',
            onboardingKey: 'ONB_2025_EVT_XY9Z23',
            incentiveType: 'BONUS_POINTS'
        },
    }),
    __metadata("design:type", Object)
], AnonymousSessionResponseDto.prototype, "anonymousUser", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Date de création de la session',
        example: '2025-07-17T10:30:00Z',
    }),
    __metadata("design:type", String)
], AnonymousSessionResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Dernière activité',
        example: '2025-07-17T10:45:00Z',
    }),
    __metadata("design:type", String)
], AnonymousSessionResponseDto.prototype, "lastActivity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Métadonnées de session',
        example: {
            source: 'purchase-flow',
            lastPage: '/events',
            actions: ['view_event', 'add_to_cart']
        },
    }),
    __metadata("design:type", Object)
], AnonymousSessionResponseDto.prototype, "metadata", void 0);
//# sourceMappingURL=anonymous-session.dto.js.map