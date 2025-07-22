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
exports.ZoneResponseDto = exports.ZoneHierarchyDto = exports.ZoneSearchDto = exports.UpdateZoneDto = exports.CreateZoneDto = exports.ZoneMetadataDto = exports.ZoneCoordinatesDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const venues_constants_1 = require("../constants/venues.constants");
class ZoneCoordinatesDto {
    coordinates;
    center;
    area_sqm;
}
exports.ZoneCoordinatesDto = ZoneCoordinatesDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Coordonnées des points de la zone (GeoJSON Polygon)',
        example: {
            type: 'Polygon',
            coordinates: [[[0, 0], [100, 0], [100, 100], [0, 100], [0, 0]]]
        }
    }),
    (0, class_validator_1.IsObject)({ message: 'Les coordonnées doivent être un objet GeoJSON valide' }),
    __metadata("design:type", Object)
], ZoneCoordinatesDto.prototype, "coordinates", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Centre de la zone',
        example: { latitude: 36.8065, longitude: 10.1815 }
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Le centre doit être un objet avec latitude et longitude' }),
    __metadata("design:type", Object)
], ZoneCoordinatesDto.prototype, "center", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Surface en mètres carrés',
        example: 2500,
        minimum: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'La surface doit être un nombre' }),
    (0, class_validator_1.Min)(1, { message: 'La surface doit être positive' }),
    __metadata("design:type", Number)
], ZoneCoordinatesDto.prototype, "area_sqm", void 0);
class ZoneMetadataDto {
    view_quality;
    noise_level;
    sun_exposure;
    entry_points;
    exit_points;
    nearest_facilities;
    special_features;
}
exports.ZoneMetadataDto = ZoneMetadataDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Qualité de la vue',
        example: 'EXCELLENT',
        enum: ['EXCELLENT', 'GOOD', 'FAIR', 'OBSTRUCTED'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['EXCELLENT', 'GOOD', 'FAIR', 'OBSTRUCTED'], {
        message: 'Qualité de vue invalide'
    }),
    __metadata("design:type", String)
], ZoneMetadataDto.prototype, "view_quality", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Niveau de bruit',
        example: 'MODERATE',
        enum: ['QUIET', 'MODERATE', 'LOUD'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['QUIET', 'MODERATE', 'LOUD'], {
        message: 'Niveau de bruit invalide'
    }),
    __metadata("design:type", String)
], ZoneMetadataDto.prototype, "noise_level", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Exposition au soleil',
        example: 'PARTIAL_SUN',
        enum: ['FULL_SUN', 'PARTIAL_SUN', 'SHADE'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['FULL_SUN', 'PARTIAL_SUN', 'SHADE'], {
        message: 'Exposition au soleil invalide'
    }),
    __metadata("design:type", String)
], ZoneMetadataDto.prototype, "sun_exposure", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Points d\'entrée',
        example: ['PORTAIL_A', 'PORTAIL_B'],
        isArray: true,
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Les points d\'entrée doivent être un tableau' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Chaque point d\'entrée doit être une chaîne de caractères' }),
    (0, class_validator_1.ArrayMaxSize)(10, { message: 'Maximum 10 points d\'entrée autorisés' }),
    __metadata("design:type", Array)
], ZoneMetadataDto.prototype, "entry_points", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Points de sortie',
        example: ['SORTIE_1', 'SORTIE_2'],
        isArray: true,
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Les points de sortie doivent être un tableau' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Chaque point de sortie doit être une chaîne de caractères' }),
    (0, class_validator_1.ArrayMaxSize)(10, { message: 'Maximum 10 points de sortie autorisés' }),
    __metadata("design:type", Array)
], ZoneMetadataDto.prototype, "exit_points", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Installations les plus proches',
        example: ['TOILETTES_A1', 'BUVETTE_B2'],
        isArray: true,
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Les installations doivent être un tableau' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Chaque installation doit être une chaîne de caractères' }),
    (0, class_validator_1.ArrayMaxSize)(20, { message: 'Maximum 20 installations autorisées' }),
    __metadata("design:type", Array)
], ZoneMetadataDto.prototype, "nearest_facilities", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Caractéristiques spéciales',
        example: ['VUE_PANORAMIQUE', 'ACCES_VIP'],
        isArray: true,
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Les caractéristiques spéciales doivent être un tableau' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Chaque caractéristique doit être une chaîne de caractères' }),
    (0, class_validator_1.ArrayMaxSize)(15, { message: 'Maximum 15 caractéristiques spéciales autorisées' }),
    __metadata("design:type", Array)
], ZoneMetadataDto.prototype, "special_features", void 0);
class CreateZoneDto {
    mapping_id;
    parent_zone_id;
    name;
    code;
    zone_type;
    category;
    level = venues_constants_1.VENUE_DEFAULTS.ZONE_LEVEL;
    capacity;
    base_price = venues_constants_1.VENUE_DEFAULTS.ZONE_BASE_PRICE;
    currency = venues_constants_1.VENUE_DEFAULTS.ZONE_CURRENCY;
    coordinates;
    description;
    amenities;
    is_accessible = venues_constants_1.VENUE_DEFAULTS.ZONE_IS_ACCESSIBLE;
    requires_special_access = venues_constants_1.VENUE_DEFAULTS.ZONE_REQUIRES_SPECIAL_ACCESS;
    metadata;
}
exports.CreateZoneDto = CreateZoneDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID de la configuration',
        example: 'mapping-123',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'L\'ID de la configuration est obligatoire' }),
    (0, class_validator_1.IsString)({ message: 'L\'ID de la configuration doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], CreateZoneDto.prototype, "mapping_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID de la zone parent',
        example: 'zone-parent-123',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'L\'ID de la zone parent doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], CreateZoneDto.prototype, "parent_zone_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nom de la zone',
        example: 'Tribune Nord',
        minLength: venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_NAME_MIN_LENGTH,
        maxLength: venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_NAME_MAX_LENGTH,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le nom est obligatoire' }),
    (0, class_validator_1.IsString)({ message: 'Le nom doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_NAME_MIN_LENGTH, venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_NAME_MAX_LENGTH, {
        message: `Le nom doit contenir entre ${venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_NAME_MIN_LENGTH} et ${venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_NAME_MAX_LENGTH} caractères`
    }),
    __metadata("design:type", String)
], CreateZoneDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Code unique de la zone',
        example: 'TN_A',
        minLength: venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_CODE_MIN_LENGTH,
        maxLength: venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_CODE_MAX_LENGTH,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le code est obligatoire' }),
    (0, class_validator_1.IsString)({ message: 'Le code doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_CODE_MIN_LENGTH, venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_CODE_MAX_LENGTH, {
        message: `Le code doit contenir entre ${venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_CODE_MIN_LENGTH} et ${venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_CODE_MAX_LENGTH} caractères`
    }),
    (0, class_validator_1.Matches)(/^[A-Z0-9_]+$/, {
        message: 'Le code ne peut contenir que des lettres majuscules, des chiffres et des underscores'
    }),
    __metadata("design:type", String)
], CreateZoneDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Type de zone',
        example: client_1.zone_type.SEATING_AREA,
        enum: client_1.zone_type,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le type de zone est obligatoire' }),
    (0, class_validator_1.IsEnum)(client_1.zone_type, { message: 'Type de zone invalide' }),
    __metadata("design:type", String)
], CreateZoneDto.prototype, "zone_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Catégorie de zone',
        example: client_1.zone_category.STANDARD,
        enum: client_1.zone_category,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'La catégorie de zone est obligatoire' }),
    (0, class_validator_1.IsEnum)(client_1.zone_category, { message: 'Catégorie de zone invalide' }),
    __metadata("design:type", String)
], CreateZoneDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Niveau de la zone',
        example: 0,
        minimum: venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_LEVEL_MIN,
        maximum: venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_LEVEL_MAX,
        default: venues_constants_1.VENUE_DEFAULTS.ZONE_LEVEL,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'Le niveau doit être un nombre entier' }),
    (0, class_validator_1.Min)(venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_LEVEL_MIN, {
        message: `Le niveau minimum est ${venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_LEVEL_MIN}`
    }),
    (0, class_validator_1.Max)(venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_LEVEL_MAX, {
        message: `Le niveau maximum est ${venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_LEVEL_MAX}`
    }),
    __metadata("design:type", Number)
], CreateZoneDto.prototype, "level", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Capacité de la zone',
        example: 15000,
        minimum: venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_CAPACITY_MIN,
        maximum: venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_CAPACITY_MAX,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'La capacité est obligatoire' }),
    (0, class_validator_1.IsInt)({ message: 'La capacité doit être un nombre entier' }),
    (0, class_validator_1.Min)(venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_CAPACITY_MIN, {
        message: `La capacité minimale est ${venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_CAPACITY_MIN}`
    }),
    (0, class_validator_1.Max)(venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_CAPACITY_MAX, {
        message: `La capacité maximale est ${venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_CAPACITY_MAX}`
    }),
    __metadata("design:type", Number)
], CreateZoneDto.prototype, "capacity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Prix de base de la zone',
        example: 25.50,
        minimum: venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_PRICE_MIN,
        maximum: venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_PRICE_MAX,
        default: venues_constants_1.VENUE_DEFAULTS.ZONE_BASE_PRICE,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }, { message: 'Le prix doit être un nombre avec maximum 2 décimales' }),
    (0, class_validator_1.Min)(venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_PRICE_MIN, {
        message: `Le prix minimum est ${venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_PRICE_MIN}`
    }),
    (0, class_validator_1.Max)(venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_PRICE_MAX, {
        message: `Le prix maximum est ${venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_PRICE_MAX}`
    }),
    __metadata("design:type", Number)
], CreateZoneDto.prototype, "base_price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Devise',
        example: 'TND',
        default: venues_constants_1.VENUE_DEFAULTS.ZONE_CURRENCY,
        enum: venues_constants_1.SUPPORTED_CURRENCIES,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La devise doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(venues_constants_1.VENUE_VALIDATION_LIMITS.CURRENCY_LENGTH, venues_constants_1.VENUE_VALIDATION_LIMITS.CURRENCY_LENGTH, {
        message: `La devise doit contenir exactement ${venues_constants_1.VENUE_VALIDATION_LIMITS.CURRENCY_LENGTH} caractères`
    }),
    (0, class_validator_1.IsEnum)(venues_constants_1.SUPPORTED_CURRENCIES, { message: 'Devise non supportée' }),
    __metadata("design:type", String)
], CreateZoneDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Coordonnées géographiques de la zone',
        type: ZoneCoordinatesDto,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Les coordonnées doivent être un objet' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ZoneCoordinatesDto),
    __metadata("design:type", ZoneCoordinatesDto)
], CreateZoneDto.prototype, "coordinates", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Description de la zone',
        example: 'Tribune Nord avec vue panoramique sur le terrain',
        maxLength: venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_DESCRIPTION_MAX_LENGTH,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La description doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(0, venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_DESCRIPTION_MAX_LENGTH, {
        message: `La description ne peut pas dépasser ${venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_DESCRIPTION_MAX_LENGTH} caractères`
    }),
    __metadata("design:type", String)
], CreateZoneDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Équipements de la zone',
        example: ['TOILETTES', 'BUVETTE', 'WIFI'],
        isArray: true,
        type: String,
        enum: venues_constants_1.COMMON_AMENITIES,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Les équipements doivent être un tableau' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Chaque équipement doit être une chaîne de caractères' }),
    (0, class_validator_1.ArrayMaxSize)(venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_ZONE_AMENITIES, {
        message: `Maximum ${venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_ZONE_AMENITIES} équipements autorisés`
    }),
    __metadata("design:type", Array)
], CreateZoneDto.prototype, "amenities", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Zone accessible aux personnes à mobilité réduite',
        example: false,
        default: venues_constants_1.VENUE_DEFAULTS.ZONE_IS_ACCESSIBLE,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'L\'accessibilité doit être un booléen' }),
    __metadata("design:type", Boolean)
], CreateZoneDto.prototype, "is_accessible", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nécessite un accès spécial',
        example: false,
        default: venues_constants_1.VENUE_DEFAULTS.ZONE_REQUIRES_SPECIAL_ACCESS,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'L\'accès spécial doit être un booléen' }),
    __metadata("design:type", Boolean)
], CreateZoneDto.prototype, "requires_special_access", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Métadonnées de la zone',
        type: ZoneMetadataDto,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Les métadonnées doivent être un objet' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ZoneMetadataDto),
    __metadata("design:type", ZoneMetadataDto)
], CreateZoneDto.prototype, "metadata", void 0);
class UpdateZoneDto extends (0, swagger_1.PartialType)(CreateZoneDto) {
    mapping_id;
}
exports.UpdateZoneDto = UpdateZoneDto;
class ZoneSearchDto {
    query;
    mappingId;
    venueId;
    zoneType;
    category;
    level;
    minCapacity;
    maxCapacity;
    minPrice;
    maxPrice;
    currency;
    isAccessible;
    amenities;
    parentZoneId;
    page = venues_constants_1.VENUE_DEFAULTS.PAGE;
    limit = venues_constants_1.VENUE_DEFAULTS.LIMIT;
    sortField;
    sortDirection = 'asc';
    includeMapping = false;
    includeParentZone = false;
    includeChildZones = false;
    includeStatistics = false;
}
exports.ZoneSearchDto = ZoneSearchDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Recherche textuelle',
        example: 'tribune nord',
        minLength: venues_constants_1.VENUE_VALIDATION_LIMITS.SEARCH_MIN_LENGTH,
        maxLength: venues_constants_1.VENUE_VALIDATION_LIMITS.SEARCH_MAX_LENGTH,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La requête de recherche doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(venues_constants_1.VENUE_VALIDATION_LIMITS.SEARCH_MIN_LENGTH, venues_constants_1.VENUE_VALIDATION_LIMITS.SEARCH_MAX_LENGTH, {
        message: `La recherche doit contenir entre ${venues_constants_1.VENUE_VALIDATION_LIMITS.SEARCH_MIN_LENGTH} et ${venues_constants_1.VENUE_VALIDATION_LIMITS.SEARCH_MAX_LENGTH} caractères`
    }),
    __metadata("design:type", String)
], ZoneSearchDto.prototype, "query", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID de la configuration',
        example: 'mapping-123',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'L\'ID de la configuration doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], ZoneSearchDto.prototype, "mappingId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID du lieu',
        example: 'venue-123',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'L\'ID du lieu doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], ZoneSearchDto.prototype, "venueId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Type de zone',
        example: client_1.zone_type.SEATING_AREA,
        enum: client_1.zone_type,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.zone_type, { message: 'Type de zone invalide' }),
    __metadata("design:type", String)
], ZoneSearchDto.prototype, "zoneType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Catégorie de zone',
        example: client_1.zone_category.STANDARD,
        enum: client_1.zone_category,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.zone_category, { message: 'Catégorie de zone invalide' }),
    __metadata("design:type", String)
], ZoneSearchDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Niveau de zone',
        example: 0,
        minimum: venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_LEVEL_MIN,
        maximum: venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_LEVEL_MAX,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'Le niveau doit être un nombre entier' }),
    (0, class_validator_1.Min)(venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_LEVEL_MIN),
    (0, class_validator_1.Max)(venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_LEVEL_MAX),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], ZoneSearchDto.prototype, "level", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Capacité minimale',
        example: 1000,
        minimum: venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_CAPACITY_MIN,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'La capacité minimale doit être un nombre entier' }),
    (0, class_validator_1.Min)(venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_CAPACITY_MIN),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], ZoneSearchDto.prototype, "minCapacity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Capacité maximale',
        example: 50000,
        maximum: venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_CAPACITY_MAX,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'La capacité maximale doit être un nombre entier' }),
    (0, class_validator_1.Max)(venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_CAPACITY_MAX),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], ZoneSearchDto.prototype, "maxCapacity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Prix minimum',
        example: 10.00,
        minimum: venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_PRICE_MIN,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }, { message: 'Le prix minimum doit être un nombre' }),
    (0, class_validator_1.Min)(venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_PRICE_MIN),
    (0, class_transformer_1.Transform)(({ value }) => parseFloat(value)),
    __metadata("design:type", Number)
], ZoneSearchDto.prototype, "minPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Prix maximum',
        example: 100.00,
        maximum: venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_PRICE_MAX,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }, { message: 'Le prix maximum doit être un nombre' }),
    (0, class_validator_1.Max)(venues_constants_1.VENUE_VALIDATION_LIMITS.ZONE_PRICE_MAX),
    (0, class_transformer_1.Transform)(({ value }) => parseFloat(value)),
    __metadata("design:type", Number)
], ZoneSearchDto.prototype, "maxPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Devise',
        example: 'TND',
        enum: venues_constants_1.SUPPORTED_CURRENCIES,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(venues_constants_1.SUPPORTED_CURRENCIES, { message: 'Devise non supportée' }),
    __metadata("design:type", String)
], ZoneSearchDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Zones accessibles uniquement',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'L\'accessibilité doit être un booléen' }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], ZoneSearchDto.prototype, "isAccessible", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Équipements requis',
        example: ['TOILETTES', 'WIFI'],
        isArray: true,
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Les équipements doivent être un tableau' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Chaque équipement doit être une chaîne de caractères' }),
    __metadata("design:type", Array)
], ZoneSearchDto.prototype, "amenities", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID de la zone parent',
        example: 'zone-parent-123',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'L\'ID de la zone parent doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], ZoneSearchDto.prototype, "parentZoneId", void 0);
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
], ZoneSearchDto.prototype, "page", void 0);
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
], ZoneSearchDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Champ de tri',
        example: 'name',
        enum: ['name', 'zone_type', 'category', 'capacity', 'base_price', 'level', 'created_at'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le champ de tri doit être une chaîne de caractères' }),
    (0, class_validator_1.IsEnum)(['name', 'zone_type', 'category', 'capacity', 'base_price', 'level', 'created_at'], {
        message: 'Champ de tri non valide'
    }),
    __metadata("design:type", String)
], ZoneSearchDto.prototype, "sortField", void 0);
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
], ZoneSearchDto.prototype, "sortDirection", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Inclure la configuration',
        example: false,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'L\'inclusion de la configuration doit être un booléen' }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], ZoneSearchDto.prototype, "includeMapping", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Inclure la zone parent',
        example: false,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'L\'inclusion de la zone parent doit être un booléen' }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], ZoneSearchDto.prototype, "includeParentZone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Inclure les zones enfants',
        example: false,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'L\'inclusion des zones enfants doit être un booléen' }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], ZoneSearchDto.prototype, "includeChildZones", void 0);
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
], ZoneSearchDto.prototype, "includeStatistics", void 0);
class ZoneHierarchyDto {
    mappingId;
    maxLevel;
    includeInactive = false;
}
exports.ZoneHierarchyDto = ZoneHierarchyDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID de la configuration',
        example: 'mapping-123',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'L\'ID de la configuration est obligatoire' }),
    (0, class_validator_1.IsString)({ message: 'L\'ID de la configuration doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], ZoneHierarchyDto.prototype, "mappingId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Niveau maximum à inclure',
        example: 3,
        minimum: 0,
        maximum: 10,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'Le niveau maximum doit être un nombre entier' }),
    (0, class_validator_1.Min)(0, { message: 'Le niveau maximum doit être positif' }),
    (0, class_validator_1.Max)(10, { message: 'Le niveau maximum ne peut pas dépasser 10' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], ZoneHierarchyDto.prototype, "maxLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Inclure les zones inactives',
        example: false,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'L\'inclusion des zones inactives doit être un booléen' }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], ZoneHierarchyDto.prototype, "includeInactive", void 0);
class ZoneResponseDto {
    id;
    mapping_id;
    parent_zone_id;
    name;
    code;
    zone_type;
    category;
    level;
    capacity;
    base_price;
    currency;
    coordinates;
    description;
    amenities;
    is_accessible;
    requires_special_access;
    metadata;
    created_at;
    updated_at;
    mapping;
    parentZone;
    childZones;
    availableCapacity;
    utilization;
    activeAccessRights;
}
exports.ZoneResponseDto = ZoneResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID de la zone' }),
    __metadata("design:type", String)
], ZoneResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID de la configuration' }),
    __metadata("design:type", String)
], ZoneResponseDto.prototype, "mapping_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID de la zone parent' }),
    __metadata("design:type", String)
], ZoneResponseDto.prototype, "parent_zone_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nom de la zone' }),
    __metadata("design:type", String)
], ZoneResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Code de la zone' }),
    __metadata("design:type", String)
], ZoneResponseDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Type de zone', enum: client_1.zone_type }),
    __metadata("design:type", String)
], ZoneResponseDto.prototype, "zone_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Catégorie de zone', enum: client_1.zone_category }),
    __metadata("design:type", String)
], ZoneResponseDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Niveau de la zone' }),
    __metadata("design:type", Number)
], ZoneResponseDto.prototype, "level", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Capacité de la zone' }),
    __metadata("design:type", Number)
], ZoneResponseDto.prototype, "capacity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Prix de base' }),
    __metadata("design:type", Number)
], ZoneResponseDto.prototype, "base_price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Devise' }),
    __metadata("design:type", String)
], ZoneResponseDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Coordonnées' }),
    __metadata("design:type", Object)
], ZoneResponseDto.prototype, "coordinates", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Description' }),
    __metadata("design:type", String)
], ZoneResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Équipements', isArray: true, type: String }),
    __metadata("design:type", Array)
], ZoneResponseDto.prototype, "amenities", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Zone accessible' }),
    __metadata("design:type", Boolean)
], ZoneResponseDto.prototype, "is_accessible", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nécessite un accès spécial' }),
    __metadata("design:type", Boolean)
], ZoneResponseDto.prototype, "requires_special_access", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Métadonnées' }),
    __metadata("design:type", Object)
], ZoneResponseDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date de création' }),
    __metadata("design:type", Date)
], ZoneResponseDto.prototype, "created_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date de modification' }),
    __metadata("design:type", Date)
], ZoneResponseDto.prototype, "updated_at", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Informations de la configuration' }),
    __metadata("design:type", Object)
], ZoneResponseDto.prototype, "mapping", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Zone parent' }),
    __metadata("design:type", Object)
], ZoneResponseDto.prototype, "parentZone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Zones enfants' }),
    __metadata("design:type", Array)
], ZoneResponseDto.prototype, "childZones", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Capacité disponible' }),
    __metadata("design:type", Number)
], ZoneResponseDto.prototype, "availableCapacity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Taux d\'utilisation (%)' }),
    __metadata("design:type", Number)
], ZoneResponseDto.prototype, "utilization", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nombre de droits d\'accès actifs' }),
    __metadata("design:type", Number)
], ZoneResponseDto.prototype, "activeAccessRights", void 0);
//# sourceMappingURL=zone.dto.js.map