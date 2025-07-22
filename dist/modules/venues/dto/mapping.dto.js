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
exports.MappingResponseDto = exports.SetDefaultMappingDto = exports.MappingSearchDto = exports.UpdateMappingDto = exports.CreateMappingDto = exports.MappingMetadataDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const venues_constants_1 = require("../constants/venues.constants");
class MappingMetadataDto {
    configuration_notes;
    setup_time_minutes;
    breakdown_time_minutes;
    required_staff;
    technical_requirements;
    safety_considerations;
    weather_dependencies;
}
exports.MappingMetadataDto = MappingMetadataDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Notes de configuration',
        example: 'Configuration optimisée pour les matchs de football',
        maxLength: 1000,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Les notes doivent être une chaîne de caractères' }),
    (0, class_validator_1.Length)(0, 1000, { message: 'Les notes ne peuvent pas dépasser 1000 caractères' }),
    __metadata("design:type", String)
], MappingMetadataDto.prototype, "configuration_notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Temps de montage en minutes',
        example: 120,
        minimum: 0,
        maximum: 1440,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'Le temps de montage doit être un nombre entier' }),
    (0, class_validator_1.Min)(0, { message: 'Le temps de montage ne peut pas être négatif' }),
    (0, class_validator_1.Max)(1440, { message: 'Le temps de montage ne peut pas dépasser 24 heures' }),
    __metadata("design:type", Number)
], MappingMetadataDto.prototype, "setup_time_minutes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Temps de démontage en minutes',
        example: 90,
        minimum: 0,
        maximum: 1440,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'Le temps de démontage doit être un nombre entier' }),
    (0, class_validator_1.Min)(0, { message: 'Le temps de démontage ne peut pas être négatif' }),
    (0, class_validator_1.Max)(1440, { message: 'Le temps de démontage ne peut pas dépasser 24 heures' }),
    __metadata("design:type", Number)
], MappingMetadataDto.prototype, "breakdown_time_minutes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Personnel requis',
        example: 25,
        minimum: 0,
        maximum: 1000,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'Le personnel requis doit être un nombre entier' }),
    (0, class_validator_1.Min)(0, { message: 'Le personnel requis ne peut pas être négatif' }),
    (0, class_validator_1.Max)(1000, { message: 'Le personnel requis ne peut pas dépasser 1000' }),
    __metadata("design:type", Number)
], MappingMetadataDto.prototype, "required_staff", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Exigences techniques',
        example: ['ECLAIRAGE_RENFORCE', 'SONORISATION_STADIUM'],
        isArray: true,
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Les exigences techniques doivent être un tableau' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Chaque exigence doit être une chaîne de caractères' }),
    (0, class_validator_1.ArrayMaxSize)(20, { message: 'Maximum 20 exigences techniques autorisées' }),
    __metadata("design:type", Array)
], MappingMetadataDto.prototype, "technical_requirements", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Considérations de sécurité',
        example: ['CONTROLE_ACCES_RENFORCE', 'SURVEILLANCE_VIDEO'],
        isArray: true,
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Les considérations de sécurité doivent être un tableau' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Chaque considération doit être une chaîne de caractères' }),
    (0, class_validator_1.ArrayMaxSize)(20, { message: 'Maximum 20 considérations de sécurité autorisées' }),
    __metadata("design:type", Array)
], MappingMetadataDto.prototype, "safety_considerations", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Dépendances météorologiques',
        example: ['PAS_DE_PLUIE', 'VENT_FAIBLE'],
        isArray: true,
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Les dépendances météorologiques doivent être un tableau' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Chaque dépendance doit être une chaîne de caractères' }),
    (0, class_validator_1.ArrayMaxSize)(10, { message: 'Maximum 10 dépendances météorologiques autorisées' }),
    __metadata("design:type", Array)
], MappingMetadataDto.prototype, "weather_dependencies", void 0);
class CreateMappingDto {
    venue_id;
    name;
    code;
    description;
    mapping_type;
    event_categories;
    effective_capacity;
    valid_from;
    valid_until;
    metadata;
}
exports.CreateMappingDto = CreateMappingDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID du lieu',
        example: 'venue-123',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'L\'ID du lieu est obligatoire' }),
    (0, class_validator_1.IsString)({ message: 'L\'ID du lieu doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], CreateMappingDto.prototype, "venue_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nom de la configuration',
        example: 'Configuration Football Standard',
        minLength: venues_constants_1.VENUE_VALIDATION_LIMITS.MAPPING_NAME_MIN_LENGTH,
        maxLength: venues_constants_1.VENUE_VALIDATION_LIMITS.MAPPING_NAME_MAX_LENGTH,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le nom est obligatoire' }),
    (0, class_validator_1.IsString)({ message: 'Le nom doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(venues_constants_1.VENUE_VALIDATION_LIMITS.MAPPING_NAME_MIN_LENGTH, venues_constants_1.VENUE_VALIDATION_LIMITS.MAPPING_NAME_MAX_LENGTH, {
        message: `Le nom doit contenir entre ${venues_constants_1.VENUE_VALIDATION_LIMITS.MAPPING_NAME_MIN_LENGTH} et ${venues_constants_1.VENUE_VALIDATION_LIMITS.MAPPING_NAME_MAX_LENGTH} caractères`
    }),
    __metadata("design:type", String)
], CreateMappingDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Code unique de la configuration',
        example: 'FOOTBALL_STD',
        minLength: venues_constants_1.VENUE_VALIDATION_LIMITS.MAPPING_CODE_MIN_LENGTH,
        maxLength: venues_constants_1.VENUE_VALIDATION_LIMITS.MAPPING_CODE_MAX_LENGTH,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le code est obligatoire' }),
    (0, class_validator_1.IsString)({ message: 'Le code doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(venues_constants_1.VENUE_VALIDATION_LIMITS.MAPPING_CODE_MIN_LENGTH, venues_constants_1.VENUE_VALIDATION_LIMITS.MAPPING_CODE_MAX_LENGTH, {
        message: `Le code doit contenir entre ${venues_constants_1.VENUE_VALIDATION_LIMITS.MAPPING_CODE_MIN_LENGTH} et ${venues_constants_1.VENUE_VALIDATION_LIMITS.MAPPING_CODE_MAX_LENGTH} caractères`
    }),
    (0, class_validator_1.Matches)(/^[A-Z0-9_]+$/, {
        message: 'Le code ne peut contenir que des lettres majuscules, des chiffres et des underscores'
    }),
    __metadata("design:type", String)
], CreateMappingDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Description de la configuration',
        example: 'Configuration standard pour les matchs de football avec toutes les tribunes ouvertes',
        maxLength: venues_constants_1.VENUE_VALIDATION_LIMITS.MAPPING_DESCRIPTION_MAX_LENGTH,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La description doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(0, venues_constants_1.VENUE_VALIDATION_LIMITS.MAPPING_DESCRIPTION_MAX_LENGTH, {
        message: `La description ne peut pas dépasser ${venues_constants_1.VENUE_VALIDATION_LIMITS.MAPPING_DESCRIPTION_MAX_LENGTH} caractères`
    }),
    __metadata("design:type", String)
], CreateMappingDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Type de configuration',
        example: client_1.mapping_type.DEFAULT,
        enum: client_1.mapping_type,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le type de configuration est obligatoire' }),
    (0, class_validator_1.IsEnum)(client_1.mapping_type, { message: 'Type de configuration invalide' }),
    __metadata("design:type", String)
], CreateMappingDto.prototype, "mapping_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Catégories d\'événements supportées',
        example: ['FOOTBALL', 'CONCERT'],
        isArray: true,
        type: String,
        enum: venues_constants_1.SUPPORTED_EVENT_CATEGORIES,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Au moins une catégorie d\'événement est obligatoire' }),
    (0, class_validator_1.IsArray)({ message: 'Les catégories d\'événements doivent être un tableau' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Chaque catégorie doit être une chaîne de caractères' }),
    (0, class_validator_1.ArrayMaxSize)(venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_EVENT_CATEGORIES, {
        message: `Maximum ${venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_EVENT_CATEGORIES} catégories autorisées`
    }),
    __metadata("design:type", Array)
], CreateMappingDto.prototype, "event_categories", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Capacité effective de la configuration',
        example: 45000,
        minimum: venues_constants_1.VENUE_VALIDATION_LIMITS.EFFECTIVE_CAPACITY_MIN,
        maximum: venues_constants_1.VENUE_VALIDATION_LIMITS.EFFECTIVE_CAPACITY_MAX,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'La capacité effective est obligatoire' }),
    (0, class_validator_1.IsInt)({ message: 'La capacité doit être un nombre entier' }),
    (0, class_validator_1.Min)(venues_constants_1.VENUE_VALIDATION_LIMITS.EFFECTIVE_CAPACITY_MIN, {
        message: `La capacité minimale est de ${venues_constants_1.VENUE_VALIDATION_LIMITS.EFFECTIVE_CAPACITY_MIN}`
    }),
    (0, class_validator_1.Max)(venues_constants_1.VENUE_VALIDATION_LIMITS.EFFECTIVE_CAPACITY_MAX, {
        message: `La capacité maximale est de ${venues_constants_1.VENUE_VALIDATION_LIMITS.EFFECTIVE_CAPACITY_MAX}`
    }),
    __metadata("design:type", Number)
], CreateMappingDto.prototype, "effective_capacity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date de début de validité',
        example: '2025-01-01T00:00:00.000Z',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDate)({ message: 'La date de début doit être une date valide' }),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], CreateMappingDto.prototype, "valid_from", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date de fin de validité',
        example: '2025-12-31T23:59:59.999Z',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDate)({ message: 'La date de fin doit être une date valide' }),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], CreateMappingDto.prototype, "valid_until", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Métadonnées de la configuration',
        type: MappingMetadataDto,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Les métadonnées doivent être un objet' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MappingMetadataDto),
    __metadata("design:type", MappingMetadataDto)
], CreateMappingDto.prototype, "metadata", void 0);
class UpdateMappingDto extends (0, swagger_1.PartialType)(CreateMappingDto) {
    is_active;
    venue_id;
}
exports.UpdateMappingDto = UpdateMappingDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Statut actif de la configuration',
        example: true,
        default: venues_constants_1.VENUE_DEFAULTS.MAPPING_IS_ACTIVE,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'Le statut actif doit être un booléen' }),
    __metadata("design:type", Boolean)
], UpdateMappingDto.prototype, "is_active", void 0);
class MappingSearchDto {
    query;
    venueId;
    mappingType;
    eventCategories;
    minCapacity;
    maxCapacity;
    isActive = true;
    validAt;
    page = venues_constants_1.VENUE_DEFAULTS.PAGE;
    limit = venues_constants_1.VENUE_DEFAULTS.LIMIT;
    sortField;
    sortDirection = 'asc';
    includeVenue = false;
    includeZones = false;
    includeAccessPoints = false;
    includeStatistics = false;
}
exports.MappingSearchDto = MappingSearchDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Recherche textuelle',
        example: 'football',
        minLength: venues_constants_1.VENUE_VALIDATION_LIMITS.SEARCH_MIN_LENGTH,
        maxLength: venues_constants_1.VENUE_VALIDATION_LIMITS.SEARCH_MAX_LENGTH,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La requête de recherche doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(venues_constants_1.VENUE_VALIDATION_LIMITS.SEARCH_MIN_LENGTH, venues_constants_1.VENUE_VALIDATION_LIMITS.SEARCH_MAX_LENGTH, {
        message: `La recherche doit contenir entre ${venues_constants_1.VENUE_VALIDATION_LIMITS.SEARCH_MIN_LENGTH} et ${venues_constants_1.VENUE_VALIDATION_LIMITS.SEARCH_MAX_LENGTH} caractères`
    }),
    __metadata("design:type", String)
], MappingSearchDto.prototype, "query", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID du lieu',
        example: 'venue-123',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'L\'ID du lieu doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], MappingSearchDto.prototype, "venueId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Type de configuration',
        example: client_1.mapping_type.DEFAULT,
        enum: client_1.mapping_type,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.mapping_type, { message: 'Type de configuration invalide' }),
    __metadata("design:type", String)
], MappingSearchDto.prototype, "mappingType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Catégories d\'événements',
        example: ['FOOTBALL', 'CONCERT'],
        isArray: true,
        type: String,
        enum: venues_constants_1.SUPPORTED_EVENT_CATEGORIES,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Les catégories d\'événements doivent être un tableau' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Chaque catégorie doit être une chaîne de caractères' }),
    __metadata("design:type", Array)
], MappingSearchDto.prototype, "eventCategories", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Capacité minimale',
        example: 1000,
        minimum: venues_constants_1.VENUE_VALIDATION_LIMITS.EFFECTIVE_CAPACITY_MIN,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'La capacité minimale doit être un nombre entier' }),
    (0, class_validator_1.Min)(venues_constants_1.VENUE_VALIDATION_LIMITS.EFFECTIVE_CAPACITY_MIN, {
        message: `La capacité minimale doit être d'au moins ${venues_constants_1.VENUE_VALIDATION_LIMITS.EFFECTIVE_CAPACITY_MIN}`
    }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], MappingSearchDto.prototype, "minCapacity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Capacité maximale',
        example: 100000,
        maximum: venues_constants_1.VENUE_VALIDATION_LIMITS.EFFECTIVE_CAPACITY_MAX,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'La capacité maximale doit être un nombre entier' }),
    (0, class_validator_1.Max)(venues_constants_1.VENUE_VALIDATION_LIMITS.EFFECTIVE_CAPACITY_MAX, {
        message: `La capacité maximale ne peut pas dépasser ${venues_constants_1.VENUE_VALIDATION_LIMITS.EFFECTIVE_CAPACITY_MAX}`
    }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], MappingSearchDto.prototype, "maxCapacity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Statut actif uniquement',
        example: true,
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'Le statut actif doit être un booléen' }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], MappingSearchDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date de validité',
        example: '2025-07-11T00:00:00.000Z',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDate)({ message: 'La date de validité doit être une date valide' }),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], MappingSearchDto.prototype, "validAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Numéro de page',
        example: 1,
        minimum: 1,
        default: venues_constants_1.VENUE_DEFAULTS.PAGE,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'Le numéro de page doit être un entier' }),
    (0, class_validator_1.Min)(1, { message: 'Le numéro de page doit être supérieur à 0' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value) || venues_constants_1.VENUE_DEFAULTS.PAGE),
    __metadata("design:type", Number)
], MappingSearchDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nombre d\'éléments par page',
        example: venues_constants_1.VENUE_DEFAULTS.LIMIT,
        minimum: venues_constants_1.VENUE_VALIDATION_LIMITS.MIN_PAGE_SIZE,
        maximum: venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_PAGE_SIZE,
        default: venues_constants_1.VENUE_DEFAULTS.LIMIT,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'La limite doit être un entier' }),
    (0, class_validator_1.Min)(venues_constants_1.VENUE_VALIDATION_LIMITS.MIN_PAGE_SIZE),
    (0, class_validator_1.Max)(venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_PAGE_SIZE),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value) || venues_constants_1.VENUE_DEFAULTS.LIMIT),
    __metadata("design:type", Number)
], MappingSearchDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Champ de tri',
        example: 'name',
        enum: ['name', 'mapping_type', 'effective_capacity', 'created_at', 'updated_at'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le champ de tri doit être une chaîne de caractères' }),
    (0, class_validator_1.IsEnum)(['name', 'mapping_type', 'effective_capacity', 'created_at', 'updated_at'], {
        message: 'Champ de tri non valide'
    }),
    __metadata("design:type", String)
], MappingSearchDto.prototype, "sortField", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Direction du tri',
        example: 'asc',
        enum: ['asc', 'desc'],
        default: 'asc',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La direction du tri doit être une chaîne de caractères' }),
    (0, class_validator_1.IsEnum)(['asc', 'desc'], { message: 'Direction de tri non valide' }),
    __metadata("design:type", String)
], MappingSearchDto.prototype, "sortDirection", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Inclure les informations du lieu',
        example: false,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'L\'inclusion du lieu doit être un booléen' }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], MappingSearchDto.prototype, "includeVenue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Inclure les zones',
        example: false,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'L\'inclusion des zones doit être un booléen' }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], MappingSearchDto.prototype, "includeZones", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Inclure les points d\'accès',
        example: false,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'L\'inclusion des points d\'accès doit être un booléen' }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], MappingSearchDto.prototype, "includeAccessPoints", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Inclure les statistiques',
        example: false,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'L\'inclusion des statistiques doit être un booléen' }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], MappingSearchDto.prototype, "includeStatistics", void 0);
class SetDefaultMappingDto {
    mappingId;
}
exports.SetDefaultMappingDto = SetDefaultMappingDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID de la configuration à définir par défaut',
        example: 'mapping-123',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'L\'ID de la configuration est obligatoire' }),
    (0, class_validator_1.IsString)({ message: 'L\'ID de la configuration doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], SetDefaultMappingDto.prototype, "mappingId", void 0);
class MappingResponseDto {
    id;
    venue_id;
    name;
    code;
    description;
    mapping_type;
    event_categories;
    effective_capacity;
    valid_from;
    valid_until;
    is_active;
    metadata;
    created_at;
    updated_at;
    venue;
    totalZones;
    totalAccessPoints;
    totalCapacity;
    activeZones;
    activeAccessPoints;
}
exports.MappingResponseDto = MappingResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID de la configuration' }),
    __metadata("design:type", String)
], MappingResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID du lieu' }),
    __metadata("design:type", String)
], MappingResponseDto.prototype, "venue_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nom de la configuration' }),
    __metadata("design:type", String)
], MappingResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Code de la configuration' }),
    __metadata("design:type", String)
], MappingResponseDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Description' }),
    __metadata("design:type", String)
], MappingResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Type de configuration', enum: client_1.mapping_type }),
    __metadata("design:type", String)
], MappingResponseDto.prototype, "mapping_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Catégories d\'événements', isArray: true, type: String }),
    __metadata("design:type", Array)
], MappingResponseDto.prototype, "event_categories", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Capacité effective' }),
    __metadata("design:type", Number)
], MappingResponseDto.prototype, "effective_capacity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Date de début de validité' }),
    __metadata("design:type", Date)
], MappingResponseDto.prototype, "valid_from", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Date de fin de validité' }),
    __metadata("design:type", Date)
], MappingResponseDto.prototype, "valid_until", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Statut actif' }),
    __metadata("design:type", Boolean)
], MappingResponseDto.prototype, "is_active", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Métadonnées' }),
    __metadata("design:type", Object)
], MappingResponseDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date de création' }),
    __metadata("design:type", Date)
], MappingResponseDto.prototype, "created_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date de modification' }),
    __metadata("design:type", Date)
], MappingResponseDto.prototype, "updated_at", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Informations du lieu' }),
    __metadata("design:type", Object)
], MappingResponseDto.prototype, "venue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nombre de zones' }),
    __metadata("design:type", Number)
], MappingResponseDto.prototype, "totalZones", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nombre de points d\'accès' }),
    __metadata("design:type", Number)
], MappingResponseDto.prototype, "totalAccessPoints", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Capacité totale des zones' }),
    __metadata("design:type", Number)
], MappingResponseDto.prototype, "totalCapacity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Zones actives' }),
    __metadata("design:type", Number)
], MappingResponseDto.prototype, "activeZones", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Points d\'accès actifs' }),
    __metadata("design:type", Number)
], MappingResponseDto.prototype, "activeAccessPoints", void 0);
//# sourceMappingURL=mapping.dto.js.map