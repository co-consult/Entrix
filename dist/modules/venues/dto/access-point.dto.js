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
exports.AccessPointResponseDto = exports.AccessPointSearchDto = exports.UpdateAccessPointDto = exports.CreateAccessPointDto = exports.AccessPointMetadataDto = exports.OperatingHoursDto = exports.BreakPeriodDto = exports.DayScheduleDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const venues_constants_1 = require("../constants/venues.constants");
class DayScheduleDto {
    open;
    close;
    breaks;
}
exports.DayScheduleDto = DayScheduleDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Heure d\'ouverture (format HH:mm)',
        example: '08:00',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'L\'heure d\'ouverture est obligatoire' }),
    (0, class_validator_1.IsString)({ message: 'L\'heure d\'ouverture doit être une chaîne de caractères' }),
    (0, class_validator_1.Matches)(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'L\'heure d\'ouverture doit être au format HH:mm'
    }),
    __metadata("design:type", String)
], DayScheduleDto.prototype, "open", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Heure de fermeture (format HH:mm)',
        example: '22:00',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'L\'heure de fermeture est obligatoire' }),
    (0, class_validator_1.IsString)({ message: 'L\'heure de fermeture doit être une chaîne de caractères' }),
    (0, class_validator_1.Matches)(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'L\'heure de fermeture doit être au format HH:mm'
    }),
    __metadata("design:type", String)
], DayScheduleDto.prototype, "close", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Pauses dans la journée',
        example: [{ start: '12:00', end: '13:00', reason: 'Pause déjeuner' }],
        isArray: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Les pauses doivent être un tableau' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BreakPeriodDto),
    __metadata("design:type", Array)
], DayScheduleDto.prototype, "breaks", void 0);
class BreakPeriodDto {
    start;
    end;
    reason;
}
exports.BreakPeriodDto = BreakPeriodDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Début de la pause (format HH:mm)',
        example: '12:00',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'L\'heure de début de pause est obligatoire' }),
    (0, class_validator_1.IsString)({ message: 'L\'heure de début doit être une chaîne de caractères' }),
    (0, class_validator_1.Matches)(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'L\'heure de début doit être au format HH:mm'
    }),
    __metadata("design:type", String)
], BreakPeriodDto.prototype, "start", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Fin de la pause (format HH:mm)',
        example: '13:00',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'L\'heure de fin de pause est obligatoire' }),
    (0, class_validator_1.IsString)({ message: 'L\'heure de fin doit être une chaîne de caractères' }),
    (0, class_validator_1.Matches)(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'L\'heure de fin doit être au format HH:mm'
    }),
    __metadata("design:type", String)
], BreakPeriodDto.prototype, "end", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Raison de la pause',
        example: 'Pause déjeuner',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La raison doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(1, 100, { message: 'La raison doit contenir entre 1 et 100 caractères' }),
    __metadata("design:type", String)
], BreakPeriodDto.prototype, "reason", void 0);
class OperatingHoursDto {
    monday;
    tuesday;
    wednesday;
    thursday;
    friday;
    saturday;
    sunday;
}
exports.OperatingHoursDto = OperatingHoursDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Horaires du lundi', type: DayScheduleDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DayScheduleDto),
    __metadata("design:type", DayScheduleDto)
], OperatingHoursDto.prototype, "monday", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Horaires du mardi', type: DayScheduleDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DayScheduleDto),
    __metadata("design:type", DayScheduleDto)
], OperatingHoursDto.prototype, "tuesday", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Horaires du mercredi', type: DayScheduleDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DayScheduleDto),
    __metadata("design:type", DayScheduleDto)
], OperatingHoursDto.prototype, "wednesday", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Horaires du jeudi', type: DayScheduleDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DayScheduleDto),
    __metadata("design:type", DayScheduleDto)
], OperatingHoursDto.prototype, "thursday", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Horaires du vendredi', type: DayScheduleDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DayScheduleDto),
    __metadata("design:type", DayScheduleDto)
], OperatingHoursDto.prototype, "friday", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Horaires du samedi', type: DayScheduleDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DayScheduleDto),
    __metadata("design:type", DayScheduleDto)
], OperatingHoursDto.prototype, "saturday", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Horaires du dimanche', type: DayScheduleDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DayScheduleDto),
    __metadata("design:type", DayScheduleDto)
], OperatingHoursDto.prototype, "sunday", void 0);
class AccessPointMetadataDto {
    queue_capacity;
    processing_rate_per_minute;
    staffing_requirements;
    equipment_needed;
    peak_usage_times;
    accessibility_features;
}
exports.AccessPointMetadataDto = AccessPointMetadataDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Capacité de file d\'attente',
        example: 200,
        minimum: 0,
        maximum: 10000,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'La capacité de file d\'attente doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'La capacité de file d\'attente ne peut pas être négative' }),
    (0, class_validator_1.Max)(10000, { message: 'La capacité de file d\'attente ne peut pas dépasser 10000' }),
    __metadata("design:type", Number)
], AccessPointMetadataDto.prototype, "queue_capacity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Taux de traitement par minute',
        example: 60,
        minimum: 1,
        maximum: 1000,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Le taux de traitement doit être un nombre' }),
    (0, class_validator_1.Min)(1, { message: 'Le taux de traitement doit être positif' }),
    (0, class_validator_1.Max)(1000, { message: 'Le taux de traitement ne peut pas dépasser 1000' }),
    __metadata("design:type", Number)
], AccessPointMetadataDto.prototype, "processing_rate_per_minute", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Personnel requis',
        example: 3,
        minimum: 0,
        maximum: 50,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Le personnel requis doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'Le personnel requis ne peut pas être négatif' }),
    (0, class_validator_1.Max)(50, { message: 'Le personnel requis ne peut pas dépasser 50' }),
    __metadata("design:type", Number)
], AccessPointMetadataDto.prototype, "staffing_requirements", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Équipement nécessaire',
        example: ['SCANNER_QR', 'DETECTEUR_METAL'],
        isArray: true,
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'L\'équipement nécessaire doit être un tableau' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Chaque équipement doit être une chaîne de caractères' }),
    (0, class_validator_1.ArrayMaxSize)(20, { message: 'Maximum 20 équipements autorisés' }),
    __metadata("design:type", Array)
], AccessPointMetadataDto.prototype, "equipment_needed", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Heures de pointe',
        example: ['18:00-20:00', '12:00-14:00'],
        isArray: true,
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Les heures de pointe doivent être un tableau' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Chaque créneau doit être une chaîne de caractères' }),
    (0, class_validator_1.ArrayMaxSize)(10, { message: 'Maximum 10 créneaux de pointe autorisés' }),
    __metadata("design:type", Array)
], AccessPointMetadataDto.prototype, "peak_usage_times", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Fonctionnalités d\'accessibilité',
        example: ['RAMPE_ACCES', 'ASSISTANCE_VISUELLE'],
        isArray: true,
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Les fonctionnalités d\'accessibilité doivent être un tableau' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Chaque fonctionnalité doit être une chaîne de caractères' }),
    (0, class_validator_1.ArrayMaxSize)(15, { message: 'Maximum 15 fonctionnalités d\'accessibilité autorisées' }),
    __metadata("design:type", Array)
], AccessPointMetadataDto.prototype, "accessibility_features", void 0);
class CreateAccessPointDto {
    mapping_id;
    name;
    code;
    access_type;
    allowed_zones;
    restricted_zones;
    security_level = venues_constants_1.VENUE_DEFAULTS.SECURITY_LEVEL;
    latitude;
    longitude;
    requires_special_permission = venues_constants_1.VENUE_DEFAULTS.REQUIRES_SPECIAL_PERMISSION;
    operating_hours;
    metadata;
}
exports.CreateAccessPointDto = CreateAccessPointDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID de la configuration',
        example: 'mapping-123',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'L\'ID de la configuration est obligatoire' }),
    (0, class_validator_1.IsString)({ message: 'L\'ID de la configuration doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], CreateAccessPointDto.prototype, "mapping_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nom du point d\'accès',
        example: 'Portail A - Entrée Principale',
        minLength: venues_constants_1.VENUE_VALIDATION_LIMITS.ACCESS_POINT_NAME_MIN_LENGTH,
        maxLength: venues_constants_1.VENUE_VALIDATION_LIMITS.ACCESS_POINT_NAME_MAX_LENGTH,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le nom est obligatoire' }),
    (0, class_validator_1.IsString)({ message: 'Le nom doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(venues_constants_1.VENUE_VALIDATION_LIMITS.ACCESS_POINT_NAME_MIN_LENGTH, venues_constants_1.VENUE_VALIDATION_LIMITS.ACCESS_POINT_NAME_MAX_LENGTH, {
        message: `Le nom doit contenir entre ${venues_constants_1.VENUE_VALIDATION_LIMITS.ACCESS_POINT_NAME_MIN_LENGTH} et ${venues_constants_1.VENUE_VALIDATION_LIMITS.ACCESS_POINT_NAME_MAX_LENGTH} caractères`
    }),
    __metadata("design:type", String)
], CreateAccessPointDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Code unique du point d\'accès',
        example: 'PORTAL_A',
        minLength: venues_constants_1.VENUE_VALIDATION_LIMITS.ACCESS_POINT_CODE_MIN_LENGTH,
        maxLength: venues_constants_1.VENUE_VALIDATION_LIMITS.ACCESS_POINT_CODE_MAX_LENGTH,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le code est obligatoire' }),
    (0, class_validator_1.IsString)({ message: 'Le code doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(venues_constants_1.VENUE_VALIDATION_LIMITS.ACCESS_POINT_CODE_MIN_LENGTH, venues_constants_1.VENUE_VALIDATION_LIMITS.ACCESS_POINT_CODE_MAX_LENGTH, {
        message: `Le code doit contenir entre ${venues_constants_1.VENUE_VALIDATION_LIMITS.ACCESS_POINT_CODE_MIN_LENGTH} et ${venues_constants_1.VENUE_VALIDATION_LIMITS.ACCESS_POINT_CODE_MAX_LENGTH} caractères`
    }),
    (0, class_validator_1.Matches)(/^[A-Z0-9_]+$/, {
        message: 'Le code ne peut contenir que des lettres majuscules, des chiffres et des underscores'
    }),
    __metadata("design:type", String)
], CreateAccessPointDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Type de point d\'accès',
        example: client_1.access_type.MAIN_ENTRANCE,
        enum: client_1.access_type,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le type de point d\'accès est obligatoire' }),
    (0, class_validator_1.IsEnum)(client_1.access_type, { message: 'Type de point d\'accès invalide' }),
    __metadata("design:type", String)
], CreateAccessPointDto.prototype, "access_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Zones autorisées',
        example: ['zone-1', 'zone-2'],
        isArray: true,
        type: String,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Au moins une zone autorisée est obligatoire' }),
    (0, class_validator_1.IsArray)({ message: 'Les zones autorisées doivent être un tableau' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Chaque zone doit être une chaîne de caractères' }),
    (0, class_validator_1.ArrayMaxSize)(venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_ALLOWED_ZONES, {
        message: `Maximum ${venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_ALLOWED_ZONES} zones autorisées`
    }),
    __metadata("design:type", Array)
], CreateAccessPointDto.prototype, "allowed_zones", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Zones restreintes',
        example: ['zone-vip'],
        isArray: true,
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Les zones restreintes doivent être un tableau' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Chaque zone doit être une chaîne de caractères' }),
    (0, class_validator_1.ArrayMaxSize)(venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_RESTRICTED_ZONES, {
        message: `Maximum ${venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_RESTRICTED_ZONES} zones restreintes`
    }),
    __metadata("design:type", Array)
], CreateAccessPointDto.prototype, "restricted_zones", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Niveau de sécurité',
        example: client_1.security_level.STANDARD,
        enum: client_1.security_level,
        default: venues_constants_1.VENUE_DEFAULTS.SECURITY_LEVEL,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.security_level, { message: 'Niveau de sécurité invalide' }),
    __metadata("design:type", String)
], CreateAccessPointDto.prototype, "security_level", void 0);
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
], CreateAccessPointDto.prototype, "latitude", void 0);
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
], CreateAccessPointDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nécessite une permission spéciale',
        example: false,
        default: venues_constants_1.VENUE_DEFAULTS.REQUIRES_SPECIAL_PERMISSION,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'La permission spéciale doit être un booléen' }),
    __metadata("design:type", Boolean)
], CreateAccessPointDto.prototype, "requires_special_permission", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Horaires de fonctionnement',
        type: OperatingHoursDto,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Les horaires doivent être un objet' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => OperatingHoursDto),
    __metadata("design:type", OperatingHoursDto)
], CreateAccessPointDto.prototype, "operating_hours", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Métadonnées du point d\'accès',
        type: AccessPointMetadataDto,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Les métadonnées doivent être un objet' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AccessPointMetadataDto),
    __metadata("design:type", AccessPointMetadataDto)
], CreateAccessPointDto.prototype, "metadata", void 0);
class UpdateAccessPointDto extends (0, swagger_1.PartialType)(CreateAccessPointDto) {
    is_active;
    mapping_id;
}
exports.UpdateAccessPointDto = UpdateAccessPointDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Statut actif du point d\'accès',
        example: true,
        default: venues_constants_1.VENUE_DEFAULTS.ACCESS_POINT_IS_ACTIVE,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'Le statut actif doit être un booléen' }),
    __metadata("design:type", Boolean)
], UpdateAccessPointDto.prototype, "is_active", void 0);
class AccessPointSearchDto {
    query;
    mappingId;
    venueId;
    accessType;
    securityLevel;
    allowedZones;
    restrictedZones;
    isActive = true;
    requiresSpecialPermission;
    page = venues_constants_1.VENUE_DEFAULTS.PAGE;
    limit = venues_constants_1.VENUE_DEFAULTS.LIMIT;
    includeMapping = false;
    includeVenue = false;
    includeAllowedZones = false;
    includeRestrictedZones = false;
    includeStatistics = false;
}
exports.AccessPointSearchDto = AccessPointSearchDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Recherche textuelle',
        example: 'portail',
        minLength: venues_constants_1.VENUE_VALIDATION_LIMITS.SEARCH_MIN_LENGTH,
        maxLength: venues_constants_1.VENUE_VALIDATION_LIMITS.SEARCH_MAX_LENGTH,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La requête de recherche doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(venues_constants_1.VENUE_VALIDATION_LIMITS.SEARCH_MIN_LENGTH, venues_constants_1.VENUE_VALIDATION_LIMITS.SEARCH_MAX_LENGTH, {
        message: `La recherche doit contenir entre ${venues_constants_1.VENUE_VALIDATION_LIMITS.SEARCH_MIN_LENGTH} et ${venues_constants_1.VENUE_VALIDATION_LIMITS.SEARCH_MAX_LENGTH} caractères`
    }),
    __metadata("design:type", String)
], AccessPointSearchDto.prototype, "query", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID de la configuration',
        example: 'mapping-123',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'L\'ID de la configuration doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], AccessPointSearchDto.prototype, "mappingId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID du lieu',
        example: 'venue-123',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'L\'ID du lieu doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], AccessPointSearchDto.prototype, "venueId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Type de point d\'accès',
        example: client_1.access_type.MAIN_ENTRANCE,
        enum: client_1.access_type,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.access_type, { message: 'Type de point d\'accès invalide' }),
    __metadata("design:type", String)
], AccessPointSearchDto.prototype, "accessType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Niveau de sécurité',
        example: client_1.security_level.STANDARD,
        enum: client_1.security_level,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.security_level, { message: 'Niveau de sécurité invalide' }),
    __metadata("design:type", String)
], AccessPointSearchDto.prototype, "securityLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Zones autorisées',
        example: ['zone-1', 'zone-2'],
        isArray: true,
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Les zones autorisées doivent être un tableau' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Chaque zone doit être une chaîne de caractères' }),
    __metadata("design:type", Array)
], AccessPointSearchDto.prototype, "allowedZones", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Zones restreintes',
        example: ['zone-vip'],
        isArray: true,
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Les zones restreintes doivent être un tableau' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Chaque zone doit être une chaîne de caractères' }),
    __metadata("design:type", Array)
], AccessPointSearchDto.prototype, "restrictedZones", void 0);
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
], AccessPointSearchDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nécessite une permission spéciale',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'La permission spéciale doit être un booléen' }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], AccessPointSearchDto.prototype, "requiresSpecialPermission", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Numéro de page',
        example: 1,
        minimum: 1,
        default: venues_constants_1.VENUE_DEFAULTS.PAGE,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Le numéro de page doit être un nombre' }),
    (0, class_validator_1.Min)(1, { message: 'Le numéro de page doit être supérieur à 0' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value) || venues_constants_1.VENUE_DEFAULTS.PAGE),
    __metadata("design:type", Number)
], AccessPointSearchDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nombre d\'éléments par page',
        example: venues_constants_1.VENUE_DEFAULTS.LIMIT,
        minimum: venues_constants_1.VENUE_VALIDATION_LIMITS.MIN_PAGE_SIZE,
        maximum: venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_PAGE_SIZE,
        default: venues_constants_1.VENUE_DEFAULTS.LIMIT,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'La limite doit être un nombre' }),
    (0, class_validator_1.Min)(venues_constants_1.VENUE_VALIDATION_LIMITS.MIN_PAGE_SIZE),
    (0, class_validator_1.Max)(venues_constants_1.VENUE_VALIDATION_LIMITS.MAX_PAGE_SIZE),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value) || venues_constants_1.VENUE_DEFAULTS.LIMIT),
    __metadata("design:type", Number)
], AccessPointSearchDto.prototype, "limit", void 0);
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
], AccessPointSearchDto.prototype, "includeMapping", void 0);
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
], AccessPointSearchDto.prototype, "includeVenue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Inclure les détails des zones autorisées',
        example: false,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'L\'inclusion des zones autorisées doit être un booléen' }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], AccessPointSearchDto.prototype, "includeAllowedZones", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Inclure les détails des zones restreintes',
        example: false,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'L\'inclusion des zones restreintes doit être un booléen' }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], AccessPointSearchDto.prototype, "includeRestrictedZones", void 0);
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
], AccessPointSearchDto.prototype, "includeStatistics", void 0);
class AccessPointResponseDto {
    id;
    mapping_id;
    name;
    code;
    access_type;
    allowed_zones;
    restricted_zones;
    security_level;
    latitude;
    longitude;
    is_active;
    requires_special_permission;
    operating_hours;
    metadata;
    created_at;
    updated_at;
    mapping;
    venue;
    allowedZoneDetails;
    restrictedZoneDetails;
    averageProcessingTime;
    lastUsed;
    todayUsageCount;
}
exports.AccessPointResponseDto = AccessPointResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID du point d\'accès' }),
    __metadata("design:type", String)
], AccessPointResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID de la configuration' }),
    __metadata("design:type", String)
], AccessPointResponseDto.prototype, "mapping_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nom du point d\'accès' }),
    __metadata("design:type", String)
], AccessPointResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Code du point d\'accès' }),
    __metadata("design:type", String)
], AccessPointResponseDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Type de point d\'accès', enum: client_1.access_type }),
    __metadata("design:type", String)
], AccessPointResponseDto.prototype, "access_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Zones autorisées', isArray: true, type: String }),
    __metadata("design:type", Array)
], AccessPointResponseDto.prototype, "allowed_zones", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Zones restreintes', isArray: true, type: String }),
    __metadata("design:type", Array)
], AccessPointResponseDto.prototype, "restricted_zones", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Niveau de sécurité', enum: client_1.security_level }),
    __metadata("design:type", String)
], AccessPointResponseDto.prototype, "security_level", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Latitude' }),
    __metadata("design:type", Number)
], AccessPointResponseDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Longitude' }),
    __metadata("design:type", Number)
], AccessPointResponseDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Statut actif' }),
    __metadata("design:type", Boolean)
], AccessPointResponseDto.prototype, "is_active", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nécessite une permission spéciale' }),
    __metadata("design:type", Boolean)
], AccessPointResponseDto.prototype, "requires_special_permission", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Horaires de fonctionnement' }),
    __metadata("design:type", Object)
], AccessPointResponseDto.prototype, "operating_hours", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Métadonnées' }),
    __metadata("design:type", Object)
], AccessPointResponseDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date de création' }),
    __metadata("design:type", Date)
], AccessPointResponseDto.prototype, "created_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date de modification' }),
    __metadata("design:type", Date)
], AccessPointResponseDto.prototype, "updated_at", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Informations de la configuration' }),
    __metadata("design:type", Object)
], AccessPointResponseDto.prototype, "mapping", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Informations du lieu' }),
    __metadata("design:type", Object)
], AccessPointResponseDto.prototype, "venue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Détails des zones autorisées' }),
    __metadata("design:type", Array)
], AccessPointResponseDto.prototype, "allowedZoneDetails", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Détails des zones restreintes' }),
    __metadata("design:type", Array)
], AccessPointResponseDto.prototype, "restrictedZoneDetails", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Temps de traitement moyen (minutes)' }),
    __metadata("design:type", Number)
], AccessPointResponseDto.prototype, "averageProcessingTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Dernière utilisation' }),
    __metadata("design:type", Date)
], AccessPointResponseDto.prototype, "lastUsed", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nombre d\'utilisations aujourd\'hui' }),
    __metadata("design:type", Number)
], AccessPointResponseDto.prototype, "todayUsageCount", void 0);
//# sourceMappingURL=access-point.dto.js.map