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
exports.VenueResponseDto = exports.VenueGeoSearchDto = exports.VenueSearchDto = exports.UpdateVenueDto = exports.CreateVenueDto = exports.VenueMetadataDto = exports.CoordinatesDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const venues_constants_1 = require("../constants/venues.constants");
class CoordinatesDto {
    latitude;
    longitude;
}
exports.CoordinatesDto = CoordinatesDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Latitude',
        example: 36.8065,
        minimum: venues_constants_1.VENUE_VALIDATION_LIMITS.LATITUDE_MIN,
        maximum: venues_constants_1.VENUE_VALIDATION_LIMITS.LATITUDE_MAX,
    }),
    (0, class_validator_1.IsLatitude)({ message: 'Latitude invalide' }),
    __metadata("design:type", Number)
], CoordinatesDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Longitude',
        example: 10.1815,
        minimum: venues_constants_1.VENUE_VALIDATION_LIMITS.LONGITUDE_MIN,
        maximum: venues_constants_1.VENUE_VALIDATION_LIMITS.LONGITUDE_MAX,
    }),
    (0, class_validator_1.IsLongitude)({ message: 'Longitude invalide' }),
    __metadata("design:type", Number)
], CoordinatesDto.prototype, "longitude", void 0);
class VenueMetadataDto {
    construction_year;
    renovation_year;
    architect;
    safety_certifications;
    sustainability_features;
}
exports.VenueMetadataDto = VenueMetadataDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Année de construction',
        example: 1967,
        minimum: 1800,
        maximum: new Date().getFullYear(),
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'L\'année de construction doit être un entier' }),
    (0, class_validator_1.Min)(1800, { message: 'L\'année de construction ne peut pas être antérieure à 1800' }),
    (0, class_validator_1.Max)(new Date().getFullYear(), { message: 'L\'année de construction ne peut pas être future' }),
    __metadata("design:type", Number)
], VenueMetadataDto.prototype, "construction_year", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Année de rénovation',
        example: 2010,
        minimum: 1800,
        maximum: new Date().getFullYear(),
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'L\'année de rénovation doit être un entier' }),
    (0, class_validator_1.Min)(1800, { message: 'L\'année de rénovation ne peut pas être antérieure à 1800' }),
    (0, class_validator_1.Max)(new Date().getFullYear(), { message: 'L\'année de rénovation ne peut pas être future' }),
    __metadata("design:type", Number)
], VenueMetadataDto.prototype, "renovation_year", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Architecte',
        example: 'Hassan Fathy',
        maxLength: 200,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le nom de l\'architecte doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(1, 200, { message: 'Le nom de l\'architecte doit contenir entre 1 et 200 caractères' }),
    __metadata("design:type", String)
], VenueMetadataDto.prototype, "architect", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Certifications de sécurité',
        example: ['ISO_14001', 'OHSAS_18001'],
        isArray: true,
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Les certifications doivent être un tableau' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Chaque certification doit être une chaîne de caractères' }),
    (0, class_validator_1.ArrayMaxSize)(20, { message: 'Maximum 20 certifications autorisées' }),
    __metadata("design:type", Array)
], VenueMetadataDto.prototype, "safety_certifications", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Caractéristiques de durabilité',
        example: ['PANNEAUX_SOLAIRES', 'RECUPERATION_EAU_PLUIE'],
        isArray: true,
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Les caractéristiques de durabilité doivent être un tableau' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Chaque caractéristique doit être une chaîne de caractères' }),
    (0, class_validator_1.ArrayMaxSize)(20, { message: 'Maximum 20 caractéristiques autorisées' }),
    __metadata("design:type", Array)
], VenueMetadataDto.prototype, "sustainability_features", void 0);
class CreateVenueDto {
    name;
    slug;
    address;
    city;
    postal_code;
    country = venues_constants_1.VENUE_DEFAULTS.COUNTRY;
    latitude;
    longitude;
    max_capacity;
    description;
    images;
    global_amenities;
    primary_owner_id;
    primary_manager_id;
    metadata;
}
exports.CreateVenueDto = CreateVenueDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nom du lieu',
        example: 'Stade Olympique de Tunis',
        minLength: venues_constants_1.VENUE_VALIDATION_LIMITS.NAME_MIN_LENGTH,
        maxLength: venues_constants_1.VENUE_VALIDATION_LIMITS.NAME_MAX_LENGTH,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le nom est obligatoire' }),
    (0, class_validator_1.IsString)({ message: 'Le nom doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(venues_constants_1.VENUE_VALIDATION_LIMITS.NAME_MIN_LENGTH, venues_constants_1.VENUE_VALIDATION_LIMITS.NAME_MAX_LENGTH, {
        message: `Le nom doit contenir entre ${venues_constants_1.VENUE_VALIDATION_LIMITS.NAME_MIN_LENGTH} et ${venues_constants_1.VENUE_VALIDATION_LIMITS.NAME_MAX_LENGTH} caractères`
    }),
    __metadata("design:type", String)
], CreateVenueDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Slug unique pour l\'URL',
        example: 'stade-olympique-tunis',
        minLength: venues_constants_1.VENUE_VALIDATION_LIMITS.SLUG_MIN_LENGTH,
        maxLength: venues_constants_1.VENUE_VALIDATION_LIMITS.SLUG_MAX_LENGTH,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le slug est obligatoire' }),
    (0, class_validator_1.IsString)({ message: 'Le slug doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(venues_constants_1.VENUE_VALIDATION_LIMITS.SLUG_MIN_LENGTH, venues_constants_1.VENUE_VALIDATION_LIMITS.SLUG_MAX_LENGTH, {
        message: `Le slug doit contenir entre ${venues_constants_1.VENUE_VALIDATION_LIMITS.SLUG_MIN_LENGTH} et ${venues_constants_1.VENUE_VALIDATION_LIMITS.SLUG_MAX_LENGTH} caractères`
    }),
    (0, class_validator_1.Matches)(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: 'Le slug ne peut contenir que des lettres minuscules, des chiffres et des tirets'
    }),
    __metadata("design:type", String)
], CreateVenueDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Adresse complète',
        example: 'Avenue du Stade Olympique, Radès',
        maxLength: venues_constants_1.VENUE_VALIDATION_LIMITS.ADDRESS_MAX_LENGTH,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'L\'adresse est obligatoire' }),
    (0, class_validator_1.IsString)({ message: 'L\'adresse doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(1, venues_constants_1.VENUE_VALIDATION_LIMITS.ADDRESS_MAX_LENGTH, {
        message: `L\'adresse ne peut pas dépasser ${venues_constants_1.VENUE_VALIDATION_LIMITS.ADDRESS_MAX_LENGTH} caractères`
    }),
    __metadata("design:type", String)
], CreateVenueDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Ville',
        example: 'Radès',
        maxLength: venues_constants_1.VENUE_VALIDATION_LIMITS.CITY_MAX_LENGTH,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'La ville est obligatoire' }),
    (0, class_validator_1.IsString)({ message: 'La ville doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(1, venues_constants_1.VENUE_VALIDATION_LIMITS.CITY_MAX_LENGTH, {
        message: `La ville ne peut pas dépasser ${venues_constants_1.VENUE_VALIDATION_LIMITS.CITY_MAX_LENGTH} caractères`
    }),
    __metadata("design:type", String)
], CreateVenueDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Code postal',
        example: '2040',
        maxLength: venues_constants_1.VENUE_VALIDATION_LIMITS.POSTAL_CODE_MAX_LENGTH,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le code postal doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(1, venues_constants_1.VENUE_VALIDATION_LIMITS.POSTAL_CODE_MAX_LENGTH, {
        message: `Le code postal ne peut pas dépasser ${venues_constants_1.VENUE_VALIDATION_LIMITS.POSTAL_CODE_MAX_LENGTH} caractères`
    }),
    __metadata("design:type", String)
], CreateVenueDto.prototype, "postal_code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Code pays ISO 3166-1 alpha-2',
        example: 'TN',
        default: venues_constants_1.VENUE_DEFAULTS.COUNTRY,
        enum: venues_constants_1.SUPPORTED_COUNTRIES,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO31661Alpha2)({ message: 'Code pays invalide' }),
    (0, class_validator_1.IsEnum)(venues_constants_1.SUPPORTED_COUNTRIES, { message: 'Pays non supporté' }),
    __metadata("design:type", String)
], CreateVenueDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Latitude GPS',
        example: 36.8065,
        minimum: venues_constants_1.VENUE_VALIDATION_LIMITS.LATITUDE_MIN,
        maximum: venues_constants_1.VENUE_VALIDATION_LIMITS.LATITUDE_MAX,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsLatitude)({ message: 'Latitude invalide' }),
    __metadata("design:type", Number)
], CreateVenueDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Longitude GPS',
        example: 10.1815,
        minimum: venues_constants_1.VENUE_VALIDATION_LIMITS.LONGITUDE_MIN,
        maximum: venues_constants_1.VENUE_VALIDATION_LIMITS.LONGITUDE_MAX,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsLongitude)({ message: 'Longitude invalide' }),
    __metadata("design:type", Number)
], CreateVenueDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Capacité maximale du lieu',
        example: 60000,
        minimum: venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_CAPACITY_MIN,
        maximum: venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_CAPACITY_MAX,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'La capacité maximale est obligatoire' }),
    (0, class_validator_1.IsInt)({ message: 'La capacité doit être un nombre entier' }),
    (0, class_validator_1.Min)(venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_CAPACITY_MIN, {
        message: `La capacité minimale est de ${venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_CAPACITY_MIN}`
    }),
    (0, class_validator_1.Max)(venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_CAPACITY_MAX, {
        message: `La capacité maximale est de ${venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_CAPACITY_MAX}`
    }),
    __metadata("design:type", Number)
], CreateVenueDto.prototype, "max_capacity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Description du lieu',
        example: 'Le Stade Olympique de Tunis est un stade multi-usage...',
        maxLength: venues_constants_1.VENUE_VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La description doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(0, venues_constants_1.VENUE_VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH, {
        message: `La description ne peut pas dépasser ${venues_constants_1.VENUE_VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH} caractères`
    }),
    __metadata("design:type", String)
], CreateVenueDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'URLs des images du lieu',
        example: ['https://cdn.entrix.tn/venues/stade-olympique-1.jpg'],
        isArray: true,
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Les images doivent être un tableau' }),
    (0, class_validator_1.IsUrl)({}, { each: true, message: 'Chaque image doit être une URL valide' }),
    (0, class_validator_1.ArrayMaxSize)(venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_IMAGES, {
        message: `Maximum ${venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_IMAGES} images autorisées`
    }),
    __metadata("design:type", Array)
], CreateVenueDto.prototype, "images", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Équipements globaux du lieu',
        example: ['PARKING_GENERAL', 'WIFI', 'RESTAURATION'],
        isArray: true,
        type: String,
        enum: venues_constants_1.COMMON_AMENITIES,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Les équipements doivent être un tableau' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Chaque équipement doit être une chaîne de caractères' }),
    (0, class_validator_1.ArrayMaxSize)(venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_AMENITIES, {
        message: `Maximum ${venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_AMENITIES} équipements autorisés`
    }),
    __metadata("design:type", Array)
], CreateVenueDto.prototype, "global_amenities", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID du propriétaire principal',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: 'L\'ID du propriétaire doit être un UUID valide' }),
    __metadata("design:type", String)
], CreateVenueDto.prototype, "primary_owner_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID du gestionnaire principal',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: 'L\'ID du gestionnaire doit être un UUID valide' }),
    __metadata("design:type", String)
], CreateVenueDto.prototype, "primary_manager_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Métadonnées du lieu',
        type: VenueMetadataDto,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Les métadonnées doivent être un objet' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => VenueMetadataDto),
    __metadata("design:type", VenueMetadataDto)
], CreateVenueDto.prototype, "metadata", void 0);
class UpdateVenueDto extends (0, swagger_1.PartialType)(CreateVenueDto) {
    default_mapping_id;
    is_active;
}
exports.UpdateVenueDto = UpdateVenueDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID de la configuration par défaut',
        example: 'mapping-123',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'L\'ID de la configuration doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], UpdateVenueDto.prototype, "default_mapping_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Statut actif du lieu',
        example: true,
        default: venues_constants_1.VENUE_DEFAULTS.IS_ACTIVE,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'Le statut actif doit être un booléen' }),
    __metadata("design:type", Boolean)
], UpdateVenueDto.prototype, "is_active", void 0);
class VenueSearchDto {
    query;
    city;
    country;
    minCapacity;
    maxCapacity;
    amenities;
    isActive = true;
    hasActiveEvents;
    ownerId;
    managerId;
    page = venues_constants_1.VENUE_DEFAULTS.PAGE;
    limit = venues_constants_1.VENUE_DEFAULTS.LIMIT;
    sortField;
    sortDirection = 'asc';
    includeMappings = false;
    includeDefaultMapping = false;
    includeStatistics = false;
}
exports.VenueSearchDto = VenueSearchDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Recherche textuelle',
        example: 'stade olympique',
        minLength: venues_constants_1.VENUE_VALIDATION_LIMITS.SEARCH_MIN_LENGTH,
        maxLength: venues_constants_1.VENUE_VALIDATION_LIMITS.SEARCH_MAX_LENGTH,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La requête de recherche doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(venues_constants_1.VENUE_VALIDATION_LIMITS.SEARCH_MIN_LENGTH, venues_constants_1.VENUE_VALIDATION_LIMITS.SEARCH_MAX_LENGTH, {
        message: `La recherche doit contenir entre ${venues_constants_1.VENUE_VALIDATION_LIMITS.SEARCH_MIN_LENGTH} et ${venues_constants_1.VENUE_VALIDATION_LIMITS.SEARCH_MAX_LENGTH} caractères`
    }),
    __metadata("design:type", String)
], VenueSearchDto.prototype, "query", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Ville',
        example: 'Tunis',
        maxLength: venues_constants_1.VENUE_VALIDATION_LIMITS.CITY_MAX_LENGTH,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La ville doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(1, venues_constants_1.VENUE_VALIDATION_LIMITS.CITY_MAX_LENGTH, {
        message: `La ville ne peut pas dépasser ${venues_constants_1.VENUE_VALIDATION_LIMITS.CITY_MAX_LENGTH} caractères`
    }),
    __metadata("design:type", String)
], VenueSearchDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Code pays',
        example: 'TN',
        enum: venues_constants_1.SUPPORTED_COUNTRIES,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(venues_constants_1.SUPPORTED_COUNTRIES, { message: 'Pays non supporté' }),
    __metadata("design:type", String)
], VenueSearchDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Capacité minimale',
        example: 1000,
        minimum: venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_CAPACITY_MIN,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'La capacité minimale doit être un nombre entier' }),
    (0, class_validator_1.Min)(venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_CAPACITY_MIN, {
        message: `La capacité minimale doit être d'au moins ${venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_CAPACITY_MIN}`
    }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], VenueSearchDto.prototype, "minCapacity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Capacité maximale',
        example: 100000,
        maximum: venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_CAPACITY_MAX,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'La capacité maximale doit être un nombre entier' }),
    (0, class_validator_1.Max)(venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_CAPACITY_MAX, {
        message: `La capacité maximale ne peut pas dépasser ${venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_CAPACITY_MAX}`
    }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], VenueSearchDto.prototype, "maxCapacity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Équipements requis',
        example: ['PARKING_GENERAL', 'WIFI'],
        isArray: true,
        type: String,
        enum: venues_constants_1.COMMON_AMENITIES,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Les équipements doivent être un tableau' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Chaque équipement doit être une chaîne de caractères' }),
    __metadata("design:type", Array)
], VenueSearchDto.prototype, "amenities", void 0);
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
], VenueSearchDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Avec événements actifs uniquement',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'Le filtre événements actifs doit être un booléen' }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], VenueSearchDto.prototype, "hasActiveEvents", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID du propriétaire',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: 'L\'ID du propriétaire doit être un UUID valide' }),
    __metadata("design:type", String)
], VenueSearchDto.prototype, "ownerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID du gestionnaire',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: 'L\'ID du gestionnaire doit être un UUID valide' }),
    __metadata("design:type", String)
], VenueSearchDto.prototype, "managerId", void 0);
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
], VenueSearchDto.prototype, "page", void 0);
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
    (0, class_validator_1.Min)(venues_constants_1.VENUE_VALIDATION_LIMITS.MIN_PAGE_SIZE, {
        message: `La limite doit être d'au moins ${venues_constants_1.VENUE_VALIDATION_LIMITS.MIN_PAGE_SIZE}`
    }),
    (0, class_validator_1.Max)(venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_PAGE_SIZE, {
        message: `La limite ne peut pas dépasser ${venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_PAGE_SIZE}`
    }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value) || venues_constants_1.VENUE_DEFAULTS.LIMIT),
    __metadata("design:type", Number)
], VenueSearchDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Champ de tri',
        example: 'name',
        enum: ['name', 'city', 'max_capacity', 'created_at', 'updated_at'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le champ de tri doit être une chaîne de caractères' }),
    (0, class_validator_1.IsEnum)(['name', 'city', 'max_capacity', 'created_at', 'updated_at'], {
        message: 'Champ de tri non valide'
    }),
    __metadata("design:type", String)
], VenueSearchDto.prototype, "sortField", void 0);
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
], VenueSearchDto.prototype, "sortDirection", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Inclure les configurations',
        example: false,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'L\'inclusion des configurations doit être un booléen' }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], VenueSearchDto.prototype, "includeMappings", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Inclure la configuration par défaut',
        example: true,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'L\'inclusion de la configuration par défaut doit être un booléen' }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], VenueSearchDto.prototype, "includeDefaultMapping", void 0);
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
], VenueSearchDto.prototype, "includeStatistics", void 0);
class VenueGeoSearchDto {
    latitude;
    longitude;
    radiusKm;
    includeDistance = true;
    minCapacity;
    maxCapacity;
    amenities;
    page = venues_constants_1.VENUE_DEFAULTS.PAGE;
    limit = venues_constants_1.VENUE_DEFAULTS.LIMIT;
}
exports.VenueGeoSearchDto = VenueGeoSearchDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Latitude du centre de recherche',
        example: 36.8065,
        minimum: venues_constants_1.VENUE_VALIDATION_LIMITS.LATITUDE_MIN,
        maximum: venues_constants_1.VENUE_VALIDATION_LIMITS.LATITUDE_MAX,
    }),
    (0, class_validator_1.IsLatitude)({ message: 'Latitude invalide' }),
    __metadata("design:type", Number)
], VenueGeoSearchDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Longitude du centre de recherche',
        example: 10.1815,
        minimum: venues_constants_1.VENUE_VALIDATION_LIMITS.LONGITUDE_MIN,
        maximum: venues_constants_1.VENUE_VALIDATION_LIMITS.LONGITUDE_MAX,
    }),
    (0, class_validator_1.IsLongitude)({ message: 'Longitude invalide' }),
    __metadata("design:type", Number)
], VenueGeoSearchDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Rayon de recherche en kilomètres',
        example: 50,
        minimum: venues_constants_1.VENUE_VALIDATION_LIMITS.GEO_RADIUS_MIN,
        maximum: venues_constants_1.VENUE_VALIDATION_LIMITS.GEO_RADIUS_MAX,
    }),
    (0, class_validator_1.IsNumber)({}, { message: 'Le rayon doit être un nombre' }),
    (0, class_validator_1.Min)(venues_constants_1.VENUE_VALIDATION_LIMITS.GEO_RADIUS_MIN, {
        message: `Le rayon minimum est de ${venues_constants_1.VENUE_VALIDATION_LIMITS.GEO_RADIUS_MIN} km`
    }),
    (0, class_validator_1.Max)(venues_constants_1.VENUE_VALIDATION_LIMITS.GEO_RADIUS_MAX, {
        message: `Le rayon maximum est de ${venues_constants_1.VENUE_VALIDATION_LIMITS.GEO_RADIUS_MAX} km`
    }),
    __metadata("design:type", Number)
], VenueGeoSearchDto.prototype, "radiusKm", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Inclure la distance dans les résultats',
        example: true,
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'L\'inclusion de la distance doit être un booléen' }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], VenueGeoSearchDto.prototype, "includeDistance", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Capacité minimale',
        example: 1000,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'La capacité minimale doit être un nombre entier' }),
    (0, class_validator_1.Min)(venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_CAPACITY_MIN),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], VenueGeoSearchDto.prototype, "minCapacity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Capacité maximale',
        example: 100000,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'La capacité maximale doit être un nombre entier' }),
    (0, class_validator_1.Max)(venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_CAPACITY_MAX),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], VenueGeoSearchDto.prototype, "maxCapacity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Équipements requis',
        example: ['PARKING_GENERAL', 'WIFI'],
        isArray: true,
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Les équipements doivent être un tableau' }),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], VenueGeoSearchDto.prototype, "amenities", void 0);
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
], VenueGeoSearchDto.prototype, "page", void 0);
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
], VenueGeoSearchDto.prototype, "limit", void 0);
class VenueResponseDto {
    id;
    name;
    slug;
    address;
    city;
    postal_code;
    country;
    latitude;
    longitude;
    max_capacity;
    description;
    images;
    global_amenities;
    is_active;
    primary_owner_id;
    primary_manager_id;
    default_mapping_id;
    metadata;
    created_at;
    updated_at;
    distance;
    totalEvents;
    avgRating;
}
exports.VenueResponseDto = VenueResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID du lieu' }),
    __metadata("design:type", String)
], VenueResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nom du lieu' }),
    __metadata("design:type", String)
], VenueResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Slug du lieu' }),
    __metadata("design:type", String)
], VenueResponseDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Adresse' }),
    __metadata("design:type", String)
], VenueResponseDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Ville' }),
    __metadata("design:type", String)
], VenueResponseDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Code postal' }),
    __metadata("design:type", String)
], VenueResponseDto.prototype, "postal_code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Code pays' }),
    __metadata("design:type", String)
], VenueResponseDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Latitude' }),
    __metadata("design:type", Number)
], VenueResponseDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Longitude' }),
    __metadata("design:type", Number)
], VenueResponseDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Capacité maximale' }),
    __metadata("design:type", Number)
], VenueResponseDto.prototype, "max_capacity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Description' }),
    __metadata("design:type", String)
], VenueResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Images', isArray: true, type: String }),
    __metadata("design:type", Array)
], VenueResponseDto.prototype, "images", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Équipements globaux', isArray: true, type: String }),
    __metadata("design:type", Array)
], VenueResponseDto.prototype, "global_amenities", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Statut actif' }),
    __metadata("design:type", Boolean)
], VenueResponseDto.prototype, "is_active", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID du propriétaire principal' }),
    __metadata("design:type", String)
], VenueResponseDto.prototype, "primary_owner_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID du gestionnaire principal' }),
    __metadata("design:type", String)
], VenueResponseDto.prototype, "primary_manager_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID de la configuration par défaut' }),
    __metadata("design:type", String)
], VenueResponseDto.prototype, "default_mapping_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Métadonnées' }),
    __metadata("design:type", Object)
], VenueResponseDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date de création' }),
    __metadata("design:type", Date)
], VenueResponseDto.prototype, "created_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date de modification' }),
    __metadata("design:type", Date)
], VenueResponseDto.prototype, "updated_at", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Distance (pour recherche géographique)' }),
    __metadata("design:type", Number)
], VenueResponseDto.prototype, "distance", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nombre total d\'événements' }),
    __metadata("design:type", Number)
], VenueResponseDto.prototype, "totalEvents", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Note moyenne' }),
    __metadata("design:type", Number)
], VenueResponseDto.prototype, "avgRating", void 0);
//# sourceMappingURL=venue.dto.js.map