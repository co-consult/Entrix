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
exports.SessionStatsDto = exports.CurrentSessionDto = exports.UserSessionsDto = exports.SessionInfoDto = exports.SessionSecurityInfoDto = exports.DeviceInfoDto = exports.GeolocationDto = exports.GeolocationCoordinatesDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class GeolocationCoordinatesDto {
    latitude;
    longitude;
}
exports.GeolocationCoordinatesDto = GeolocationCoordinatesDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Latitude',
        example: 36.8065,
        minimum: -90,
        maximum: 90,
    }),
    (0, class_validator_1.IsNumber)({}, { message: 'La latitude doit être un nombre' }),
    (0, class_validator_1.Min)(-90, { message: 'La latitude doit être supérieure ou égale à -90' }),
    (0, class_validator_1.Max)(90, { message: 'La latitude doit être inférieure ou égale à 90' }),
    __metadata("design:type", Number)
], GeolocationCoordinatesDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Longitude',
        example: 10.1815,
        minimum: -180,
        maximum: 180,
    }),
    (0, class_validator_1.IsNumber)({}, { message: 'La longitude doit être un nombre' }),
    (0, class_validator_1.Min)(-180, { message: 'La longitude doit être supérieure ou égale à -180' }),
    (0, class_validator_1.Max)(180, { message: 'La longitude doit être inférieure ou égale à 180' }),
    __metadata("design:type", Number)
], GeolocationCoordinatesDto.prototype, "longitude", void 0);
class GeolocationDto {
    country;
    region;
    city;
    coordinates;
    provider;
}
exports.GeolocationDto = GeolocationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Pays',
        example: 'Tunisia',
        maxLength: 100,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le pays doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], GeolocationDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Région/État',
        example: 'Tunis Governorate',
        maxLength: 100,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La région doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], GeolocationDto.prototype, "region", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Ville',
        example: 'Tunis',
        maxLength: 100,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La ville doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], GeolocationDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Coordonnées géographiques exactes',
        type: GeolocationCoordinatesDto,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Les coordonnées doivent être un objet valide' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => GeolocationCoordinatesDto),
    __metadata("design:type", GeolocationCoordinatesDto)
], GeolocationDto.prototype, "coordinates", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Fournisseur de géolocalisation utilisé',
        example: 'ipapi',
        maxLength: 50,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le fournisseur doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], GeolocationDto.prototype, "provider", void 0);
class DeviceInfoDto {
    browser;
    browserVersion;
    os;
    osVersion;
    device;
    deviceVendor;
}
exports.DeviceInfoDto = DeviceInfoDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nom du navigateur',
        example: 'Chrome',
        maxLength: 50,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le navigateur doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], DeviceInfoDto.prototype, "browser", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Version du navigateur',
        example: '119.0.0.0',
        maxLength: 20,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La version du navigateur doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], DeviceInfoDto.prototype, "browserVersion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Système d\'exploitation',
        example: 'Windows',
        maxLength: 50,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le système d\'exploitation doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], DeviceInfoDto.prototype, "os", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Version du système d\'exploitation',
        example: '10',
        maxLength: 20,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La version de l\'OS doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], DeviceInfoDto.prototype, "osVersion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Type de device',
        example: 'Desktop',
        enum: ['Desktop', 'Mobile', 'Tablet', 'TV', 'Unknown'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['Desktop', 'Mobile', 'Tablet', 'TV', 'Unknown'], {
        message: 'Le type de device doit être Desktop, Mobile, Tablet, TV ou Unknown'
    }),
    __metadata("design:type", String)
], DeviceInfoDto.prototype, "device", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Fabricant du device',
        example: 'Apple',
        maxLength: 50,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le fabricant doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], DeviceInfoDto.prototype, "deviceVendor", void 0);
class SessionSecurityInfoDto {
    isSuspicious;
    riskScore;
    newLocation;
    newDevice;
    vpnDetected;
    threatLevel;
}
exports.SessionSecurityInfoDto = SessionSecurityInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Session marquée comme suspecte',
        example: false,
    }),
    (0, class_validator_1.IsBoolean)({ message: 'isSuspicious doit être un booléen' }),
    __metadata("design:type", Boolean)
], SessionSecurityInfoDto.prototype, "isSuspicious", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Score de risque de 0 à 100',
        example: 15,
        minimum: 0,
        maximum: 100,
    }),
    (0, class_validator_1.IsNumber)({}, { message: 'Le score de risque doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'Le score de risque doit être supérieur ou égal à 0' }),
    (0, class_validator_1.Max)(100, { message: 'Le score de risque doit être inférieur ou égal à 100' }),
    __metadata("design:type", Number)
], SessionSecurityInfoDto.prototype, "riskScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Connexion depuis une nouvelle localisation',
        example: false,
    }),
    (0, class_validator_1.IsBoolean)({ message: 'newLocation doit être un booléen' }),
    __metadata("design:type", Boolean)
], SessionSecurityInfoDto.prototype, "newLocation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Connexion depuis un nouveau device',
        example: false,
    }),
    (0, class_validator_1.IsBoolean)({ message: 'newDevice doit être un booléen' }),
    __metadata("design:type", Boolean)
], SessionSecurityInfoDto.prototype, "newDevice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'VPN détecté pour cette session',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'vpnDetected doit être un booléen' }),
    __metadata("design:type", Boolean)
], SessionSecurityInfoDto.prototype, "vpnDetected", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Niveau de menace évalué',
        example: 'LOW',
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    }),
    (0, class_validator_1.IsEnum)(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
        message: 'Le niveau de menace doit être LOW, MEDIUM, HIGH ou CRITICAL'
    }),
    __metadata("design:type", String)
], SessionSecurityInfoDto.prototype, "threatLevel", void 0);
class SessionInfoDto {
    id;
    ipAddress;
    userAgent;
    deviceFingerprint;
    geolocation;
    isActive;
    isCurrent;
    createdAt;
    lastActivity;
    expiresAt;
    deviceInfo;
    securityInfo;
    durationMinutes;
    lastAction;
    requestCount;
}
exports.SessionInfoDto = SessionInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Identifiant unique de la session',
        example: '123e4567-e89b-12d3-a456-426614174000',
        format: 'uuid',
    }),
    (0, class_validator_1.IsString)({ message: 'L\'ID de session doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], SessionInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Adresse IP de la session',
        example: '197.28.145.67',
        format: 'ipv4',
    }),
    (0, class_validator_1.IsString)({ message: 'L\'adresse IP doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], SessionInfoDto.prototype, "ipAddress", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User Agent du navigateur/application',
        example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        maxLength: 1000,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le User Agent doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], SessionInfoDto.prototype, "userAgent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Empreinte unique du device pour sécurité',
        example: 'fp_1234567890abcdef',
        maxLength: 255,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'L\'empreinte device doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], SessionInfoDto.prototype, "deviceFingerprint", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Informations de géolocalisation de la session',
        type: GeolocationDto,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'La géolocalisation doit être un objet valide' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => GeolocationDto),
    __metadata("design:type", GeolocationDto)
], SessionInfoDto.prototype, "geolocation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Indique si la session est actuellement active',
        example: true,
    }),
    (0, class_validator_1.IsBoolean)({ message: 'isActive doit être un booléen' }),
    __metadata("design:type", Boolean)
], SessionInfoDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Indique si c\'est la session courante de l\'utilisateur',
        example: true,
    }),
    (0, class_validator_1.IsBoolean)({ message: 'isCurrent doit être un booléen' }),
    __metadata("design:type", Boolean)
], SessionInfoDto.prototype, "isCurrent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Date et heure de création de la session',
        example: '2025-01-07T10:30:00.000Z',
        type: 'string',
        format: 'date-time',
    }),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)({ message: 'createdAt doit être une date valide' }),
    __metadata("design:type", Date)
], SessionInfoDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Date et heure de la dernière activité',
        example: '2025-01-07T11:45:00.000Z',
        type: 'string',
        format: 'date-time',
    }),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)({ message: 'lastActivity doit être une date valide' }),
    __metadata("design:type", Date)
], SessionInfoDto.prototype, "lastActivity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Date et heure d\'expiration de la session',
        example: '2025-01-08T10:30:00.000Z',
        type: 'string',
        format: 'date-time',
    }),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)({ message: 'expiresAt doit être une date valide' }),
    __metadata("design:type", Date)
], SessionInfoDto.prototype, "expiresAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Informations parsées sur le device utilisé',
        type: DeviceInfoDto,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Les informations device doivent être un objet valide' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DeviceInfoDto),
    __metadata("design:type", DeviceInfoDto)
], SessionInfoDto.prototype, "deviceInfo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Indicateurs de sécurité de la session',
        type: SessionSecurityInfoDto,
    }),
    (0, class_validator_1.IsObject)({ message: 'Les informations de sécurité doivent être un objet valide' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => SessionSecurityInfoDto),
    __metadata("design:type", SessionSecurityInfoDto)
], SessionInfoDto.prototype, "securityInfo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Durée de la session en minutes',
        example: 75,
        minimum: 0,
    }),
    (0, class_validator_1.IsNumber)({}, { message: 'La durée doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'La durée doit être positive' }),
    __metadata("design:type", Number)
], SessionInfoDto.prototype, "durationMinutes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Dernière action effectuée dans cette session',
        example: 'GET /api/v1/users/me',
        maxLength: 500,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La dernière action doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], SessionInfoDto.prototype, "lastAction", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nombre total de requêtes effectuées dans cette session',
        example: 42,
        minimum: 0,
    }),
    (0, class_validator_1.IsNumber)({}, { message: 'Le nombre de requêtes doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'Le nombre de requêtes doit être positif' }),
    __metadata("design:type", Number)
], SessionInfoDto.prototype, "requestCount", void 0);
class UserSessionsDto {
    sessions;
    totalActiveSessions;
    maxConcurrentSessions;
    suspiciousSessions;
    currentSessionId;
    lastUpdated;
}
exports.UserSessionsDto = UserSessionsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Liste des sessions actives de l\'utilisateur',
        type: [SessionInfoDto],
    }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SessionInfoDto),
    __metadata("design:type", Array)
], UserSessionsDto.prototype, "sessions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nombre total de sessions actives',
        example: 3,
        minimum: 0,
    }),
    (0, class_validator_1.IsNumber)({}, { message: 'Le nombre total de sessions doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'Le nombre total de sessions doit être positif' }),
    __metadata("design:type", Number)
], UserSessionsDto.prototype, "totalActiveSessions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Limite de sessions concurrentes autorisées',
        example: 5,
        minimum: 1,
    }),
    (0, class_validator_1.IsNumber)({}, { message: 'La limite de sessions doit être un nombre' }),
    (0, class_validator_1.Min)(1, { message: 'La limite de sessions doit être au moins 1' }),
    __metadata("design:type", Number)
], UserSessionsDto.prototype, "maxConcurrentSessions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nombre de sessions suspectes détectées',
        example: 0,
        minimum: 0,
    }),
    (0, class_validator_1.IsNumber)({}, { message: 'Le nombre de sessions suspectes doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'Le nombre de sessions suspectes doit être positif' }),
    __metadata("design:type", Number)
], UserSessionsDto.prototype, "suspiciousSessions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID de la session courante dans la liste',
        example: '123e4567-e89b-12d3-a456-426614174000',
        format: 'uuid',
    }),
    (0, class_validator_1.IsString)({ message: 'L\'ID de session courante doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], UserSessionsDto.prototype, "currentSessionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Timestamp de la dernière vérification des sessions',
        example: '2025-01-07T11:45:00.000Z',
        type: 'string',
        format: 'date-time',
    }),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)({ message: 'lastUpdated doit être une date valide' }),
    __metadata("design:type", Date)
], UserSessionsDto.prototype, "lastUpdated", void 0);
class CurrentSessionDto {
    session;
    totalActiveSessions;
}
exports.CurrentSessionDto = CurrentSessionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Informations de la session courante',
        type: SessionInfoDto,
    }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => SessionInfoDto),
    __metadata("design:type", SessionInfoDto)
], CurrentSessionDto.prototype, "session", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nombre total de sessions actives pour cet utilisateur',
        example: 3,
        minimum: 1,
    }),
    (0, class_validator_1.IsNumber)({}, { message: 'Le nombre total de sessions doit être un nombre' }),
    (0, class_validator_1.Min)(1, { message: 'Le nombre total de sessions doit être au moins 1' }),
    __metadata("design:type", Number)
], CurrentSessionDto.prototype, "totalActiveSessions", void 0);
class SessionStatsDto {
    totalActive;
    desktop;
    mobile;
    suspicious;
    countries;
    oldestSession;
    newestSession;
}
exports.SessionStatsDto = SessionStatsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nombre total de sessions actives',
        example: 3,
    }),
    (0, class_validator_1.IsNumber)({}, { message: 'Le nombre total doit être un nombre' }),
    __metadata("design:type", Number)
], SessionStatsDto.prototype, "totalActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nombre de sessions desktop',
        example: 2,
    }),
    (0, class_validator_1.IsNumber)({}, { message: 'Le nombre desktop doit être un nombre' }),
    __metadata("design:type", Number)
], SessionStatsDto.prototype, "desktop", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nombre de sessions mobile',
        example: 1,
    }),
    (0, class_validator_1.IsNumber)({}, { message: 'Le nombre mobile doit être un nombre' }),
    __metadata("design:type", Number)
], SessionStatsDto.prototype, "mobile", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nombre de sessions suspectes',
        example: 0,
    }),
    (0, class_validator_1.IsNumber)({}, { message: 'Le nombre de sessions suspectes doit être un nombre' }),
    __metadata("design:type", Number)
], SessionStatsDto.prototype, "suspicious", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Pays d\'origine des sessions',
        example: ['Tunisia', 'France'],
        type: [String],
    }),
    __metadata("design:type", Array)
], SessionStatsDto.prototype, "countries", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Session la plus ancienne',
        example: '2025-01-06T10:30:00.000Z',
        type: 'string',
        format: 'date-time',
    }),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)({ message: 'oldestSession doit être une date valide' }),
    __metadata("design:type", Date)
], SessionStatsDto.prototype, "oldestSession", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Session la plus récente',
        example: '2025-01-07T11:45:00.000Z',
        type: 'string',
        format: 'date-time',
    }),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)({ message: 'newestSession doit être une date valide' }),
    __metadata("design:type", Date)
], SessionStatsDto.prototype, "newestSession", void 0);
//# sourceMappingURL=session-info.dto.js.map