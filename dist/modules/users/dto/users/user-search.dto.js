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
exports.UserSearchDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const user_constants_1 = require("../../constants/user.constants");
class UserSearchDto {
    query;
    is_active;
    email_verified;
    phone_verified;
    city;
    country;
    language;
    createdAfter;
    createdBefore;
    includeProfile = false;
    includeGroups = false;
    includeRoles = false;
    page = user_constants_1.USER_CONSTANTS.PAGINATION.DEFAULT_PAGE;
    limit = user_constants_1.USER_CONSTANTS.PAGINATION.DEFAULT_LIMIT;
    sortBy = 'created_at';
    sortOrder = 'desc';
}
exports.UserSearchDto = UserSearchDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Terme de recherche (nom, prénom, email)',
        example: 'Ahmed',
        minLength: user_constants_1.USER_CONSTANTS.SEARCH.MIN_QUERY_LENGTH,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La requête doit être une chaîne de caractères' }),
    (0, class_validator_1.MinLength)(user_constants_1.USER_CONSTANTS.SEARCH.MIN_QUERY_LENGTH, {
        message: `La recherche doit contenir au moins ${user_constants_1.USER_CONSTANTS.SEARCH.MIN_QUERY_LENGTH} caractères`,
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], UserSearchDto.prototype, "query", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filtrer par statut actif',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'is_active doit être un booléen' }),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value === 'true')
            return true;
        if (value === 'false')
            return false;
        return value;
    }),
    __metadata("design:type", Boolean)
], UserSearchDto.prototype, "is_active", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filtrer par email vérifié',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'email_verified doit être un booléen' }),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value === 'true')
            return true;
        if (value === 'false')
            return false;
        return value;
    }),
    __metadata("design:type", Boolean)
], UserSearchDto.prototype, "email_verified", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filtrer par téléphone vérifié',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'phone_verified doit être un booléen' }),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value === 'true')
            return true;
        if (value === 'false')
            return false;
        return value;
    }),
    __metadata("design:type", Boolean)
], UserSearchDto.prototype, "phone_verified", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filtrer par ville',
        example: 'Tunis',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La ville doit être une chaîne de caractères' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], UserSearchDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filtrer par pays (code ISO)',
        example: 'TN',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le pays doit être une chaîne de caractères' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.toUpperCase()?.trim()),
    __metadata("design:type", String)
], UserSearchDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filtrer par langue',
        example: 'fr',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La langue doit être une chaîne de caractères' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.toLowerCase()?.trim()),
    __metadata("design:type", String)
], UserSearchDto.prototype, "language", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date de création après',
        example: '2025-01-01',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Format de date invalide (YYYY-MM-DD)' }),
    __metadata("design:type", String)
], UserSearchDto.prototype, "createdAfter", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date de création avant',
        example: '2025-12-31',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Format de date invalide (YYYY-MM-DD)' }),
    __metadata("design:type", String)
], UserSearchDto.prototype, "createdBefore", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Inclure le profil utilisateur',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'includeProfile doit être un booléen' }),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value === 'true')
            return true;
        if (value === 'false')
            return false;
        return value;
    }),
    __metadata("design:type", Boolean)
], UserSearchDto.prototype, "includeProfile", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Inclure les groupes utilisateur',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'includeGroups doit être un booléen' }),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value === 'true')
            return true;
        if (value === 'false')
            return false;
        return value;
    }),
    __metadata("design:type", Boolean)
], UserSearchDto.prototype, "includeGroups", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Inclure les rôles utilisateur',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'includeRoles doit être un booléen' }),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value === 'true')
            return true;
        if (value === 'false')
            return false;
        return value;
    }),
    __metadata("design:type", Boolean)
], UserSearchDto.prototype, "includeRoles", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Numéro de page',
        example: 1,
        minimum: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)({ message: 'La page doit être un nombre entier' }),
    (0, class_validator_1.Min)(1, { message: 'La page doit être supérieure à 0' }),
    __metadata("design:type", Number)
], UserSearchDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nombre d\'éléments par page',
        example: 20,
        minimum: 1,
        maximum: user_constants_1.USER_CONSTANTS.PAGINATION.MAX_LIMIT,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)({ message: 'La limite doit être un nombre entier' }),
    (0, class_validator_1.Min)(1, { message: 'La limite doit être supérieure à 0' }),
    (0, class_validator_1.Max)(user_constants_1.USER_CONSTANTS.PAGINATION.MAX_LIMIT, {
        message: `La limite ne peut pas dépasser ${user_constants_1.USER_CONSTANTS.PAGINATION.MAX_LIMIT}`,
    }),
    __metadata("design:type", Number)
], UserSearchDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Champ de tri',
        example: 'created_at',
        enum: user_constants_1.USER_CONSTANTS.SORTABLE_FIELDS,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le champ de tri doit être une chaîne de caractères' }),
    (0, class_validator_1.IsIn)(user_constants_1.USER_CONSTANTS.SORTABLE_FIELDS, {
        message: `Le champ de tri doit être l'un de: ${user_constants_1.USER_CONSTANTS.SORTABLE_FIELDS.join(', ')}`,
    }),
    __metadata("design:type", String)
], UserSearchDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Ordre de tri',
        example: 'desc',
        enum: ['asc', 'desc'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'L\'ordre de tri doit être une chaîne de caractères' }),
    (0, class_validator_1.IsIn)(['asc', 'desc'], {
        message: 'L\'ordre de tri doit être "asc" ou "desc"',
    }),
    __metadata("design:type", String)
], UserSearchDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=user-search.dto.js.map