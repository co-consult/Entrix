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
exports.ConvertAnonymousResponseDto = exports.ConvertAnonymousDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const user_constants_1 = require("../../constants/user.constants");
class ConversionProfileDataDto {
    city;
    country;
    language;
    dateOfBirth;
    gender;
}
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
], ConversionProfileDataDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Pays de résidence (code ISO)',
        example: 'TN',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le pays doit être une chaîne de caractères' }),
    (0, class_validator_1.MinLength)(2, { message: 'Le code pays doit contenir 2 caractères' }),
    (0, class_validator_1.MaxLength)(2, { message: 'Le code pays doit contenir 2 caractères' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.toUpperCase()?.trim()),
    __metadata("design:type", String)
], ConversionProfileDataDto.prototype, "country", void 0);
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
], ConversionProfileDataDto.prototype, "language", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date de naissance',
        example: '1990-05-15',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Format de date invalide (YYYY-MM-DD)' }),
    __metadata("design:type", String)
], ConversionProfileDataDto.prototype, "dateOfBirth", void 0);
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
], ConversionProfileDataDto.prototype, "gender", void 0);
class ConvertAnonymousDto {
    onboardingKey;
    firstName;
    lastName;
    email;
    phone;
    password;
    profileData;
    acceptedTerms;
    marketingConsent = false;
}
exports.ConvertAnonymousDto = ConvertAnonymousDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Clé d\'onboarding secrète',
        example: 'ONB_2025_EVT_XY9Z23',
    }),
    (0, class_validator_1.IsString)({ message: 'La clé d\'onboarding doit être une chaîne de caractères' }),
    (0, class_validator_1.MinLength)(10, { message: 'La clé d\'onboarding doit contenir au moins 10 caractères' }),
    (0, class_validator_1.MaxLength)(50, { message: 'La clé d\'onboarding ne peut pas dépasser 50 caractères' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()?.toUpperCase()),
    __metadata("design:type", String)
], ConvertAnonymousDto.prototype, "onboardingKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Prénom de l\'utilisateur',
        example: 'Ahmed',
    }),
    (0, class_validator_1.IsString)({ message: 'Le prénom doit être une chaîne de caractères' }),
    (0, class_validator_1.MinLength)(user_constants_1.USER_CONSTANTS.VALIDATION.FIRST_NAME.MIN_LENGTH, {
        message: `Le prénom doit contenir au moins ${user_constants_1.USER_CONSTANTS.VALIDATION.FIRST_NAME.MIN_LENGTH} caractères`,
    }),
    (0, class_validator_1.MaxLength)(user_constants_1.USER_CONSTANTS.VALIDATION.FIRST_NAME.MAX_LENGTH, {
        message: `Le prénom ne peut pas dépasser ${user_constants_1.USER_CONSTANTS.VALIDATION.FIRST_NAME.MAX_LENGTH} caractères`,
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], ConvertAnonymousDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nom de famille de l\'utilisateur',
        example: 'Ben Salem',
    }),
    (0, class_validator_1.IsString)({ message: 'Le nom doit être une chaîne de caractères' }),
    (0, class_validator_1.MinLength)(user_constants_1.USER_CONSTANTS.VALIDATION.LAST_NAME.MIN_LENGTH, {
        message: `Le nom doit contenir au moins ${user_constants_1.USER_CONSTANTS.VALIDATION.LAST_NAME.MIN_LENGTH} caractères`,
    }),
    (0, class_validator_1.MaxLength)(user_constants_1.USER_CONSTANTS.VALIDATION.LAST_NAME.MAX_LENGTH, {
        message: `Le nom ne peut pas dépasser ${user_constants_1.USER_CONSTANTS.VALIDATION.LAST_NAME.MAX_LENGTH} caractères`,
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], ConvertAnonymousDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Adresse email (doit correspondre à l\'email anonyme)',
        example: 'ahmed.temp@gmail.com',
    }),
    (0, class_validator_1.IsEmail)({}, { message: 'Format d\'email invalide' }),
    (0, class_validator_1.MaxLength)(user_constants_1.USER_CONSTANTS.VALIDATION.EMAIL.MAX_LENGTH, {
        message: `L'email ne peut pas dépasser ${user_constants_1.USER_CONSTANTS.VALIDATION.EMAIL.MAX_LENGTH} caractères`,
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.toLowerCase()?.trim()),
    __metadata("design:type", String)
], ConvertAnonymousDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Numéro de téléphone',
        example: '+21697123456',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le téléphone doit être une chaîne de caractères' }),
    (0, class_validator_1.MaxLength)(user_constants_1.USER_CONSTANTS.VALIDATION.PHONE.MAX_LENGTH, {
        message: `Le téléphone ne peut pas dépasser ${user_constants_1.USER_CONSTANTS.VALIDATION.PHONE.MAX_LENGTH} caractères`,
    }),
    (0, class_validator_1.Matches)(user_constants_1.USER_CONSTANTS.VALIDATION.PHONE.REGEX, {
        message: 'Format de téléphone invalide',
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], ConvertAnonymousDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Mot de passe',
        minLength: user_constants_1.USER_CONSTANTS.VALIDATION.PASSWORD.MIN_LENGTH,
        maxLength: user_constants_1.USER_CONSTANTS.VALIDATION.PASSWORD.MAX_LENGTH,
    }),
    (0, class_validator_1.IsString)({ message: 'Le mot de passe doit être une chaîne de caractères' }),
    (0, class_validator_1.MinLength)(user_constants_1.USER_CONSTANTS.VALIDATION.PASSWORD.MIN_LENGTH, {
        message: `Le mot de passe doit contenir au moins ${user_constants_1.USER_CONSTANTS.VALIDATION.PASSWORD.MIN_LENGTH} caractères`,
    }),
    (0, class_validator_1.MaxLength)(user_constants_1.USER_CONSTANTS.VALIDATION.PASSWORD.MAX_LENGTH, {
        message: `Le mot de passe ne peut pas dépasser ${user_constants_1.USER_CONSTANTS.VALIDATION.PASSWORD.MAX_LENGTH} caractères`,
    }),
    __metadata("design:type", String)
], ConvertAnonymousDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Données de profil additionnelles',
        type: ConversionProfileDataDto,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ConversionProfileDataDto),
    __metadata("design:type", ConversionProfileDataDto)
], ConvertAnonymousDto.prototype, "profileData", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Acceptation des conditions générales',
        example: true,
    }),
    (0, class_validator_1.IsBoolean)({ message: 'L\'acceptation des conditions doit être un booléen' }),
    __metadata("design:type", Boolean)
], ConvertAnonymousDto.prototype, "acceptedTerms", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Consentement marketing',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'Le consentement marketing doit être un booléen' }),
    __metadata("design:type", Boolean)
], ConvertAnonymousDto.prototype, "marketingConsent", void 0);
class ConvertAnonymousResponseDto {
    success;
    user;
    incentiveApplied;
    incentiveDetails;
    errors;
    migrationSummary;
    accessToken;
    nextSteps;
}
exports.ConvertAnonymousResponseDto = ConvertAnonymousResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Succès de la conversion',
        example: true,
    }),
    __metadata("design:type", Boolean)
], ConvertAnonymousResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Utilisateur créé',
        example: {
            id: 'user-123-456',
            email: 'ahmed.temp@gmail.com',
            firstName: 'Ahmed',
            lastName: 'Ben Salem'
        },
    }),
    __metadata("design:type", Object)
], ConvertAnonymousResponseDto.prototype, "user", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Incentive appliqué avec succès',
        example: true,
    }),
    __metadata("design:type", Boolean)
], ConvertAnonymousResponseDto.prototype, "incentiveApplied", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Détails de l\'incentive appliqué',
        example: {
            type: 'BONUS_POINTS',
            value: 100,
            description: '100 points bonus pour votre inscription'
        },
    }),
    __metadata("design:type", Object)
], ConvertAnonymousResponseDto.prototype, "incentiveDetails", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Erreurs rencontrées lors de la conversion',
        example: [],
    }),
    __metadata("design:type", Array)
], ConvertAnonymousResponseDto.prototype, "errors", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Résumé de la migration des données',
        example: {
            ticketsMigrated: 2,
            subscriptionsMigrated: 1,
            ordersMigrated: 3
        },
    }),
    __metadata("design:type", Object)
], ConvertAnonymousResponseDto.prototype, "migrationSummary", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Token d\'authentification pour connexion automatique',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    }),
    __metadata("design:type", String)
], ConvertAnonymousResponseDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Prochaines étapes recommandées',
        example: [
            'Compléter votre profil',
            'Ajouter une photo',
            'Explorer les événements recommandés'
        ],
    }),
    __metadata("design:type", Array)
], ConvertAnonymousResponseDto.prototype, "nextSteps", void 0);
//# sourceMappingURL=convert-anonymous.dto.js.map