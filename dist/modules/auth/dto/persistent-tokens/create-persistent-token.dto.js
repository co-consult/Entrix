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
exports.ValidatePersistentTokenResponseDto = exports.ValidatePersistentTokenDto = exports.PersistentTokenStatsResponseDto = exports.GeneratedPersistentTokenResponseDto = exports.PersistentTokenResponseDto = exports.PersistentTokenFiltersDto = exports.RevokePersistentTokenDto = exports.GenerateApiKeyDto = exports.UpdatePersistentTokenDto = exports.CreatePersistentTokenDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CreatePersistentTokenDto {
    token_type;
    name;
    description;
    scopes;
    expires_at;
    device_info;
    metadata;
}
exports.CreatePersistentTokenDto = CreatePersistentTokenDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: client_1.persistent_token_type,
        description: 'Type de token persistant'
    }),
    (0, class_validator_1.IsEnum)(client_1.persistent_token_type),
    __metadata("design:type", String)
], CreatePersistentTokenDto.prototype, "token_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nom du token (affiché à l\'utilisateur)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePersistentTokenDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Description du token' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePersistentTokenDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [String],
        description: 'Portées/permissions du token',
        example: ['read:events', 'write:bookings']
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreatePersistentTokenDto.prototype, "scopes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: String,
        description: 'Date d\'expiration (ISO 8601), null = pas d\'expiration'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Transform)(({ value }) => value ? new Date(value) : null),
    __metadata("design:type", Date)
], CreatePersistentTokenDto.prototype, "expires_at", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Informations sur le device (pour tokens mobiles)',
        example: {
            deviceFingerprint: 'abc123',
            userAgent: 'Mozilla/5.0...',
            platform: 'ios',
            appVersion: '1.2.3'
        }
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreatePersistentTokenDto.prototype, "device_info", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Métadonnées additionnelles' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreatePersistentTokenDto.prototype, "metadata", void 0);
class UpdatePersistentTokenDto {
    name;
    description;
    scopes;
    expires_at;
    is_active;
    metadata;
}
exports.UpdatePersistentTokenDto = UpdatePersistentTokenDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nouveau nom du token' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePersistentTokenDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nouvelle description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePersistentTokenDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [String],
        description: 'Nouvelles portées/permissions'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdatePersistentTokenDto.prototype, "scopes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: String,
        description: 'Nouvelle date d\'expiration'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Transform)(({ value }) => value ? new Date(value) : null),
    __metadata("design:type", Date)
], UpdatePersistentTokenDto.prototype, "expires_at", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Activer/désactiver le token' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdatePersistentTokenDto.prototype, "is_active", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nouvelles métadonnées' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdatePersistentTokenDto.prototype, "metadata", void 0);
class GenerateApiKeyDto {
    name;
    scopes;
    description;
}
exports.GenerateApiKeyDto = GenerateApiKeyDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nom de la clé API' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateApiKeyDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [String],
        description: 'Portées de la clé API',
        example: ['read:profile', 'read:events', 'write:bookings']
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], GenerateApiKeyDto.prototype, "scopes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Description de l\'usage' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateApiKeyDto.prototype, "description", void 0);
class RevokePersistentTokenDto {
    reason;
}
exports.RevokePersistentTokenDto = RevokePersistentTokenDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Raison de la révocation' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RevokePersistentTokenDto.prototype, "reason", void 0);
class PersistentTokenFiltersDto {
    token_type;
    is_active;
    is_revoked;
    expires_before;
    expires_after;
    search;
}
exports.PersistentTokenFiltersDto = PersistentTokenFiltersDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: client_1.persistent_token_type,
        description: 'Filtrer par type de token'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.persistent_token_type),
    __metadata("design:type", String)
], PersistentTokenFiltersDto.prototype, "token_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filtrer par statut actif' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true'),
    __metadata("design:type", Boolean)
], PersistentTokenFiltersDto.prototype, "is_active", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filtrer par statut révoqué' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true'),
    __metadata("design:type", Boolean)
], PersistentTokenFiltersDto.prototype, "is_revoked", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tokens expirant avant cette date' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Transform)(({ value }) => new Date(value)),
    __metadata("design:type", Date)
], PersistentTokenFiltersDto.prototype, "expires_before", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tokens expirant après cette date' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Transform)(({ value }) => new Date(value)),
    __metadata("design:type", Date)
], PersistentTokenFiltersDto.prototype, "expires_after", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Recherche dans nom/description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PersistentTokenFiltersDto.prototype, "search", void 0);
class PersistentTokenResponseDto {
    id;
    token_type;
    token_prefix;
    name;
    description;
    scopes;
    expires_at;
    last_used_at;
    usage_count;
    is_active;
    created_at;
}
exports.PersistentTokenResponseDto = PersistentTokenResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID du token' }),
    __metadata("design:type", String)
], PersistentTokenResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Type de token' }),
    __metadata("design:type", String)
], PersistentTokenResponseDto.prototype, "token_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Préfixe visible du token' }),
    __metadata("design:type", String)
], PersistentTokenResponseDto.prototype, "token_prefix", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nom du token' }),
    __metadata("design:type", String)
], PersistentTokenResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Description du token' }),
    __metadata("design:type", String)
], PersistentTokenResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Portées du token' }),
    __metadata("design:type", Array)
], PersistentTokenResponseDto.prototype, "scopes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Date d\'expiration (ISO 8601)' }),
    __metadata("design:type", String)
], PersistentTokenResponseDto.prototype, "expires_at", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Dernière utilisation (ISO 8601)' }),
    __metadata("design:type", String)
], PersistentTokenResponseDto.prototype, "last_used_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nombre d\'utilisations' }),
    __metadata("design:type", Number)
], PersistentTokenResponseDto.prototype, "usage_count", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Token actif' }),
    __metadata("design:type", Boolean)
], PersistentTokenResponseDto.prototype, "is_active", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date de création (ISO 8601)' }),
    __metadata("design:type", String)
], PersistentTokenResponseDto.prototype, "created_at", void 0);
class GeneratedPersistentTokenResponseDto {
    id;
    token;
    token_prefix;
    token_type;
    scopes;
    expires_at;
    created_at;
    security_warning;
}
exports.GeneratedPersistentTokenResponseDto = GeneratedPersistentTokenResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID du token généré' }),
    __metadata("design:type", String)
], GeneratedPersistentTokenResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Token complet (ATTENTION : ne sera affiché qu\'une seule fois)',
        example: 'ent_api_abcd1234...'
    }),
    __metadata("design:type", String)
], GeneratedPersistentTokenResponseDto.prototype, "token", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Préfixe du token' }),
    __metadata("design:type", String)
], GeneratedPersistentTokenResponseDto.prototype, "token_prefix", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Type de token' }),
    __metadata("design:type", String)
], GeneratedPersistentTokenResponseDto.prototype, "token_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Portées du token' }),
    __metadata("design:type", Array)
], GeneratedPersistentTokenResponseDto.prototype, "scopes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Date d\'expiration (ISO 8601)' }),
    __metadata("design:type", String)
], GeneratedPersistentTokenResponseDto.prototype, "expires_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date de création (ISO 8601)' }),
    __metadata("design:type", String)
], GeneratedPersistentTokenResponseDto.prototype, "created_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message d\'avertissement sécurité',
        example: 'Sauvegardez ce token immédiatement. Il ne sera plus affiché.'
    }),
    __metadata("design:type", String)
], GeneratedPersistentTokenResponseDto.prototype, "security_warning", void 0);
class PersistentTokenStatsResponseDto {
    total;
    active;
    expired;
    revoked;
    by_type;
    recent_usage;
}
exports.PersistentTokenStatsResponseDto = PersistentTokenStatsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nombre total de tokens' }),
    __metadata("design:type", Number)
], PersistentTokenStatsResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tokens actifs' }),
    __metadata("design:type", Number)
], PersistentTokenStatsResponseDto.prototype, "active", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tokens expirés' }),
    __metadata("design:type", Number)
], PersistentTokenStatsResponseDto.prototype, "expired", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tokens révoqués' }),
    __metadata("design:type", Number)
], PersistentTokenStatsResponseDto.prototype, "revoked", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Répartition par type',
        example: {
            'API_KEY': 5,
            'REFRESH_LONG': 2,
            'ACCESS_LONG': 1
        }
    }),
    __metadata("design:type", Object)
], PersistentTokenStatsResponseDto.prototype, "by_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Utilisation récente',
        example: {
            last_24h: 3,
            last_7d: 15,
            last_30d: 42
        }
    }),
    __metadata("design:type", Object)
], PersistentTokenStatsResponseDto.prototype, "recent_usage", void 0);
class ValidatePersistentTokenDto {
    token;
}
exports.ValidatePersistentTokenDto = ValidatePersistentTokenDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Token à valider' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ValidatePersistentTokenDto.prototype, "token", void 0);
class ValidatePersistentTokenResponseDto {
    isValid;
    userId;
    scopes;
    errors;
    lastUsed;
    usageCount;
    user;
}
exports.ValidatePersistentTokenResponseDto = ValidatePersistentTokenResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Token valide' }),
    __metadata("design:type", Boolean)
], ValidatePersistentTokenResponseDto.prototype, "isValid", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID utilisateur si valide' }),
    __metadata("design:type", String)
], ValidatePersistentTokenResponseDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Portées du token si valide' }),
    __metadata("design:type", Array)
], ValidatePersistentTokenResponseDto.prototype, "scopes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Erreurs de validation' }),
    __metadata("design:type", Array)
], ValidatePersistentTokenResponseDto.prototype, "errors", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Dernière utilisation' }),
    __metadata("design:type", String)
], ValidatePersistentTokenResponseDto.prototype, "lastUsed", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nombre d\'utilisations' }),
    __metadata("design:type", Number)
], ValidatePersistentTokenResponseDto.prototype, "usageCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Informations utilisateur' }),
    __metadata("design:type", Object)
], ValidatePersistentTokenResponseDto.prototype, "user", void 0);
//# sourceMappingURL=create-persistent-token.dto.js.map