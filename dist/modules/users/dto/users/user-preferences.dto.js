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
exports.UserPreferencesDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class PriceRangeDto {
    min;
    max;
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Prix minimum (TND)',
        example: 10,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Le prix minimum doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'Le prix minimum doit être positif' }),
    __metadata("design:type", Number)
], PriceRangeDto.prototype, "min", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Prix maximum (TND)',
        example: 500,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Le prix maximum doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'Le prix maximum doit être positif' }),
    __metadata("design:type", Number)
], PriceRangeDto.prototype, "max", void 0);
class LocationPreferenceDto {
    city;
    radius;
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Ville préférée',
        example: 'Tunis',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La ville doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], LocationPreferenceDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Rayon de recherche (km)',
        example: 50,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Le rayon doit être un nombre' }),
    (0, class_validator_1.Min)(1, { message: 'Le rayon doit être au moins 1 km' }),
    (0, class_validator_1.Max)(500, { message: 'Le rayon ne peut pas dépasser 500 km' }),
    __metadata("design:type", Number)
], LocationPreferenceDto.prototype, "radius", void 0);
class EventPreferencesDto {
    eventTypes;
    favoriteVenues;
    priceRange;
    location;
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Types d\'événements préférés',
        example: ['SPORT', 'MUSIC', 'CULTURE'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Les types d\'événements doivent être un tableau' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Chaque type d\'événement doit être une chaîne' }),
    __metadata("design:type", Array)
], EventPreferencesDto.prototype, "eventTypes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Lieux favoris',
        example: ['venue-001', 'venue-002'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Les lieux favoris doivent être un tableau' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Chaque lieu doit être une chaîne' }),
    __metadata("design:type", Array)
], EventPreferencesDto.prototype, "favoriteVenues", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Gamme de prix préférée',
        type: PriceRangeDto,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PriceRangeDto),
    __metadata("design:type", PriceRangeDto)
], EventPreferencesDto.prototype, "priceRange", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Préférence de localisation',
        type: LocationPreferenceDto,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => LocationPreferenceDto),
    __metadata("design:type", LocationPreferenceDto)
], EventPreferencesDto.prototype, "location", void 0);
class AccessibilityPreferencesDto {
    largeText;
    highContrast;
    screenReader;
    wheelchairAccess;
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Texte agrandi',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'largeText doit être un booléen' }),
    __metadata("design:type", Boolean)
], AccessibilityPreferencesDto.prototype, "largeText", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Contraste élevé',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'highContrast doit être un booléen' }),
    __metadata("design:type", Boolean)
], AccessibilityPreferencesDto.prototype, "highContrast", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Lecteur d\'écran',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'screenReader doit être un booléen' }),
    __metadata("design:type", Boolean)
], AccessibilityPreferencesDto.prototype, "screenReader", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Accès fauteuil roulant requis',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'wheelchairAccess doit être un booléen' }),
    __metadata("design:type", Boolean)
], AccessibilityPreferencesDto.prototype, "wheelchairAccess", void 0);
class UserPreferencesDto {
    language;
    timezone;
    currency;
    dateFormat;
    eventPreferences;
    accessibility;
    customFields;
}
exports.UserPreferencesDto = UserPreferencesDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Langue préférée',
        example: 'fr',
        enum: ['fr', 'ar', 'en'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La langue doit être une chaîne de caractères' }),
    (0, class_validator_1.IsIn)(['fr', 'ar', 'en'], {
        message: 'La langue doit être fr, ar ou en',
    }),
    __metadata("design:type", String)
], UserPreferencesDto.prototype, "language", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Fuseau horaire',
        example: 'Africa/Tunis',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le fuseau horaire doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], UserPreferencesDto.prototype, "timezone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Devise préférée',
        example: 'TND',
        enum: ['TND', 'EUR', 'USD'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La devise doit être une chaîne de caractères' }),
    (0, class_validator_1.IsIn)(['TND', 'EUR', 'USD'], {
        message: 'La devise doit être TND, EUR ou USD',
    }),
    __metadata("design:type", String)
], UserPreferencesDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Format de date',
        example: 'DD/MM/YYYY',
        enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le format de date doit être une chaîne de caractères' }),
    (0, class_validator_1.IsIn)(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'], {
        message: 'Format de date invalide',
    }),
    __metadata("design:type", String)
], UserPreferencesDto.prototype, "dateFormat", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Préférences d\'événements',
        type: EventPreferencesDto,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => EventPreferencesDto),
    __metadata("design:type", EventPreferencesDto)
], UserPreferencesDto.prototype, "eventPreferences", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Préférences d\'accessibilité',
        type: AccessibilityPreferencesDto,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AccessibilityPreferencesDto),
    __metadata("design:type", AccessibilityPreferencesDto)
], UserPreferencesDto.prototype, "accessibility", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Champs personnalisés',
        example: { newsletter: true, smsAlerts: false },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Les champs personnalisés doivent être un objet' }),
    __metadata("design:type", Object)
], UserPreferencesDto.prototype, "customFields", void 0);
//# sourceMappingURL=user-preferences.dto.js.map