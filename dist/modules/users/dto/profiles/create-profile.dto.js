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
exports.CreateProfileDto = exports.ProfilePreferencesDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class ProfilePreferencesDto {
    emailNotifications;
    pushNotifications;
    publicProfile;
    privacy;
}
exports.ProfilePreferencesDto = ProfilePreferencesDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Autoriser les notifications par email',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'La valeur doit être un booléen' }),
    __metadata("design:type", Boolean)
], ProfilePreferencesDto.prototype, "emailNotifications", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Autoriser les notifications push',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'La valeur doit être un booléen' }),
    __metadata("design:type", Boolean)
], ProfilePreferencesDto.prototype, "pushNotifications", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Profil visible publiquement',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'La valeur doit être un booléen' }),
    __metadata("design:type", Boolean)
], ProfilePreferencesDto.prototype, "publicProfile", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Paramètres de confidentialité',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], ProfilePreferencesDto.prototype, "privacy", void 0);
class CreateProfileDto {
    userId;
    dateOfBirth;
    gender;
    city;
    country;
    language;
    occupation;
    educationLevel;
    bio;
    website;
    favoriteTeamId;
    supporterSince;
    fanId;
    preferences;
}
exports.CreateProfileDto = CreateProfileDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID de l\'utilisateur associé',
        example: 'user-123-456',
    }),
    (0, class_validator_1.IsString)({ message: 'L\'ID utilisateur doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], CreateProfileDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date de naissance',
        example: '1990-05-15',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Format de date invalide (YYYY-MM-DD)' }),
    __metadata("design:type", String)
], CreateProfileDto.prototype, "dateOfBirth", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Genre',
        example: 'M',
        enum: ['M', 'F', 'OTHER', 'PREFER_NOT_TO_SAY'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le genre doit être une chaîne de caractères' }),
    (0, class_validator_1.IsIn)(['M', 'F', 'OTHER', 'PREFER_NOT_TO_SAY'], {
        message: 'Le genre doit être M, F, OTHER ou PREFER_NOT_TO_SAY',
    }),
    __metadata("design:type", String)
], CreateProfileDto.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Ville de résidence',
        example: 'Tunis',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La ville doit être une chaîne de caractères' }),
    (0, class_validator_1.MaxLength)(100, { message: 'La ville ne peut pas dépasser 100 caractères' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], CreateProfileDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Pays de résidence (code ISO 2 lettres)',
        example: 'TN',
    }),
    (0, class_validator_1.IsString)({ message: 'Le pays doit être une chaîne de caractères' }),
    (0, class_validator_1.MinLength)(2, { message: 'Le code pays doit contenir 2 caractères' }),
    (0, class_validator_1.MaxLength)(2, { message: 'Le code pays doit contenir 2 caractères' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.toUpperCase()?.trim()),
    __metadata("design:type", String)
], CreateProfileDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Langue principale',
        example: 'fr',
        enum: ['fr', 'ar', 'en'],
    }),
    (0, class_validator_1.IsString)({ message: 'La langue doit être une chaîne de caractères' }),
    (0, class_validator_1.IsIn)(['fr', 'ar', 'en'], {
        message: 'La langue doit être fr, ar ou en',
    }),
    __metadata("design:type", String)
], CreateProfileDto.prototype, "language", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Profession/Métier',
        example: 'Ingénieur informatique',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La profession doit être une chaîne de caractères' }),
    (0, class_validator_1.MaxLength)(100, { message: 'La profession ne peut pas dépasser 100 caractères' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], CreateProfileDto.prototype, "occupation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Niveau d\'éducation',
        example: 'BAC+5',
        enum: ['PRIMARY', 'SECONDARY', 'BAC', 'BAC+2', 'BAC+3', 'BAC+5', 'BAC+8', 'OTHER'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le niveau d\'éducation doit être une chaîne de caractères' }),
    (0, class_validator_1.IsIn)(['PRIMARY', 'SECONDARY', 'BAC', 'BAC+2', 'BAC+3', 'BAC+5', 'BAC+8', 'OTHER'], {
        message: 'Niveau d\'éducation invalide',
    }),
    __metadata("design:type", String)
], CreateProfileDto.prototype, "educationLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Biographie/Description personnelle',
        example: 'Passionné de football et supporter du Club Africain depuis toujours !',
        maxLength: 500,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La biographie doit être une chaîne de caractères' }),
    (0, class_validator_1.MaxLength)(500, { message: 'La biographie ne peut pas dépasser 500 caractères' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], CreateProfileDto.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Site web personnel',
        example: 'https://mon-site.com',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({}, { message: 'L\'URL du site web n\'est pas valide' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], CreateProfileDto.prototype, "website", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID de l\'équipe favorite',
        example: 'team-club-africain',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'L\'ID de l\'équipe favorite doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], CreateProfileDto.prototype, "favoriteTeamId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date depuis laquelle supporter de l\'équipe',
        example: '2010-01-01',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Format de date invalide (YYYY-MM-DD)' }),
    __metadata("design:type", String)
], CreateProfileDto.prototype, "supporterSince", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID Fan - Identifiant unique du supporter',
        example: 'FAN_2025_001',
        maxLength: 50,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le fan ID doit être une chaîne de caractères' }),
    (0, class_validator_1.MaxLength)(50, { message: 'Le fan ID ne peut pas dépasser 50 caractères' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim().toUpperCase()),
    __metadata("design:type", String)
], CreateProfileDto.prototype, "fanId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Préférences utilisateur',
        type: ProfilePreferencesDto,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ProfilePreferencesDto),
    __metadata("design:type", ProfilePreferencesDto)
], CreateProfileDto.prototype, "preferences", void 0);
//# sourceMappingURL=create-profile.dto.js.map