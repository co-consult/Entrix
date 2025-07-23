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
exports.RegisterDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const auth_constants_1 = require("../constants/auth.constants");
class RegisterDto {
    email;
    password;
    firstName;
    lastName;
    phone;
    dateOfBirth;
    marketingConsent = false;
    onboardingSecret;
    termsAccepted;
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Email utilisateur',
        example: 'nouveau@entrix.tn',
        format: 'email',
        maxLength: auth_constants_1.AUTH_CONSTANTS.VALIDATION.EMAIL_MAX_LENGTH,
    }),
    (0, class_validator_1.IsEmail)({}, { message: 'Format email invalide' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Email requis' }),
    (0, class_validator_1.MaxLength)(auth_constants_1.AUTH_CONSTANTS.VALIDATION.EMAIL_MAX_LENGTH, {
        message: `Email trop long (max ${auth_constants_1.AUTH_CONSTANTS.VALIDATION.EMAIL_MAX_LENGTH} caractères)`
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.toLowerCase().trim()),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Mot de passe sécurisé',
        minLength: auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH,
        maxLength: auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MAX_LENGTH,
        pattern: auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_REGEX.source,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Mot de passe requis' }),
    (0, class_validator_1.MinLength)(auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH, {
        message: `Mot de passe minimum ${auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH} caractères`
    }),
    (0, class_validator_1.MaxLength)(auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MAX_LENGTH, {
        message: `Mot de passe maximum ${auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MAX_LENGTH} caractères`
    }),
    (0, class_validator_1.Matches)(auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_REGEX, {
        message: 'Mot de passe doit contenir majuscule, minuscule, chiffre et symbole'
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Prénom utilisateur',
        minLength: 2,
        maxLength: 100,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Prénom requis' }),
    (0, class_validator_1.MinLength)(2, { message: 'Prénom minimum 2 caractères' }),
    (0, class_validator_1.MaxLength)(100, { message: 'Prénom maximum 100 caractères' }),
    (0, class_validator_1.Matches)(/^[a-zA-ZÀ-ÿ\s'-]+$/, { message: 'Prénom: caractères alphabétiques uniquement' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], RegisterDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nom de famille utilisateur',
        minLength: 2,
        maxLength: 100,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nom requis' }),
    (0, class_validator_1.MinLength)(2, { message: 'Nom minimum 2 caractères' }),
    (0, class_validator_1.MaxLength)(100, { message: 'Nom maximum 100 caractères' }),
    (0, class_validator_1.Matches)(/^[a-zA-ZÀ-ÿ\s'-]+$/, { message: 'Nom: caractères alphabétiques uniquement' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], RegisterDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Numéro de téléphone tunisien',
        pattern: auth_constants_1.AUTH_CONSTANTS.VALIDATION.PHONE_REGEX.source,
        example: '+21612345678',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsPhoneNumber)('TN', { message: 'Numéro tunisien valide requis' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date de naissance',
        format: 'date',
        example: '1990-01-01',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Format date invalide (YYYY-MM-DD)' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "dateOfBirth", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Accepter communications marketing',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], RegisterDto.prototype, "marketingConsent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Clé secrète onboarding (conversion anonyme)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "onboardingSecret", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Acceptation conditions obligatoire',
        default: true,
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsTrue)({ message: 'Acceptation des conditions obligatoire' }),
    __metadata("design:type", Boolean)
], RegisterDto.prototype, "termsAccepted", void 0);
//# sourceMappingURL=register.dto.js.map