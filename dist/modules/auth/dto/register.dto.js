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
exports.CheckPasswordStrengthDto = exports.CheckEmailAvailabilityDto = exports.RegisterDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const match_decorator_1 = require("../../../common/decorators/match.decorator");
class RegisterDto {
    email;
    password;
    passwordConfirm;
    firstName;
    lastName;
    phone;
    acceptTerms;
    marketingConsent;
    language;
    source;
    referralCode;
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Adresse email unique de l\'utilisateur',
        example: 'nouveau.supporter@gmail.com',
        format: 'email',
        uniqueItems: true,
    }),
    (0, class_validator_1.IsEmail)({}, {
        message: 'L\'adresse email doit être valide'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'L\'email est requis'
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.toLowerCase().trim()),
    (0, class_validator_1.MaxLength)(255, {
        message: 'L\'email ne peut pas dépasser 255 caractères'
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Mot de passe sécurisé (min 8 caractères, majuscule, minuscule, chiffre, caractère spécial)',
        example: 'MonMotDePasse123!',
        minLength: 8,
        maxLength: 128,
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
    }),
    (0, class_validator_1.IsString)({
        message: 'Le mot de passe doit être une chaîne de caractères'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'Le mot de passe est requis'
    }),
    (0, class_validator_1.MinLength)(8, {
        message: 'Le mot de passe doit contenir au moins 8 caractères'
    }),
    (0, class_validator_1.MaxLength)(128, {
        message: 'Le mot de passe ne peut pas dépasser 128 caractères'
    }),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Le mot de passe doit contenir au moins : 1 minuscule, 1 majuscule, 1 chiffre et 1 caractère spécial (@$!%*?&)'
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Confirmation du mot de passe (doit être identique)',
        example: 'MonMotDePasse123!',
    }),
    (0, class_validator_1.IsString)({
        message: 'La confirmation doit être une chaîne de caractères'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'La confirmation du mot de passe est requise'
    }),
    (0, match_decorator_1.Match)('password', {
        message: 'Les mots de passe ne correspondent pas'
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "passwordConfirm", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Prénom de l\'utilisateur',
        example: 'Mohamed',
        minLength: 2,
        maxLength: 100,
    }),
    (0, class_validator_1.IsString)({
        message: 'Le prénom doit être une chaîne de caractères'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'Le prénom est requis'
    }),
    (0, class_validator_1.MinLength)(2, {
        message: 'Le prénom doit contenir au moins 2 caractères'
    }),
    (0, class_validator_1.MaxLength)(100, {
        message: 'Le prénom ne peut pas dépasser 100 caractères'
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    (0, class_validator_1.Matches)(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
        message: 'Le prénom ne peut contenir que des lettres, espaces, apostrophes et tirets'
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nom de famille de l\'utilisateur',
        example: 'Ben Ali',
        minLength: 2,
        maxLength: 100,
    }),
    (0, class_validator_1.IsString)({
        message: 'Le nom doit être une chaîne de caractères'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'Le nom est requis'
    }),
    (0, class_validator_1.MinLength)(2, {
        message: 'Le nom doit contenir au moins 2 caractères'
    }),
    (0, class_validator_1.MaxLength)(100, {
        message: 'Le nom ne peut pas dépasser 100 caractères'
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    (0, class_validator_1.Matches)(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
        message: 'Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets'
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Numéro de téléphone au format international',
        example: '+216 20 123 456',
        pattern: '^\\+[1-9]\\d{1,14}$',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({
        message: 'Le téléphone doit être une chaîne de caractères'
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.replace(/\s/g, '')),
    (0, class_validator_1.IsPhoneNumber)(null, {
        message: 'Le numéro de téléphone doit être au format international valide (+216...)'
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Acceptation des conditions d\'utilisation et politique de confidentialité',
        example: true,
    }),
    (0, class_validator_1.IsBoolean)({
        message: 'L\'acceptation des conditions doit être un booléen'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'L\'acceptation des conditions est requise'
    }),
    (0, class_validator_1.ValidateIf)((o) => o.acceptTerms !== true),
    (0, class_validator_1.Matches)(/^true$/, {
        message: 'Vous devez accepter les conditions d\'utilisation pour vous inscrire'
    }),
    __metadata("design:type", Boolean)
], RegisterDto.prototype, "acceptTerms", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Consentement pour recevoir des communications marketing',
        example: false,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({
        message: 'Le consentement marketing doit être un booléen'
    }),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (typeof value === 'string') {
            return value.toLowerCase() === 'true';
        }
        return Boolean(value);
    }),
    __metadata("design:type", Boolean)
], RegisterDto.prototype, "marketingConsent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Langue préférée de l\'utilisateur',
        example: 'fr',
        enum: ['fr', 'ar', 'en'],
        default: 'fr',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({
        message: 'La langue doit être une chaîne de caractères'
    }),
    (0, class_validator_1.Matches)(/^(fr|ar|en)$/, {
        message: 'La langue doit être fr, ar ou en'
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "language", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Source d\'inscription pour le tracking',
        example: 'website',
        enum: ['website', 'mobile', 'facebook', 'google', 'referral'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^(website|mobile|facebook|google|referral)$/, {
        message: 'La source doit être website, mobile, facebook, google ou referral'
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Code de parrainage d\'un utilisateur existant',
        example: 'REF123456',
        minLength: 6,
        maxLength: 20,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6, {
        message: 'Le code de parrainage doit contenir au moins 6 caractères'
    }),
    (0, class_validator_1.MaxLength)(20, {
        message: 'Le code de parrainage ne peut pas dépasser 20 caractères'
    }),
    (0, class_validator_1.Matches)(/^[A-Z0-9]+$/, {
        message: 'Le code de parrainage ne peut contenir que des lettres majuscules et des chiffres'
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "referralCode", void 0);
class CheckEmailAvailabilityDto {
    email;
}
exports.CheckEmailAvailabilityDto = CheckEmailAvailabilityDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Email à vérifier',
        example: 'test@example.com',
    }),
    (0, class_validator_1.IsEmail)({}, {
        message: 'L\'adresse email doit être valide'
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.toLowerCase().trim()),
    __metadata("design:type", String)
], CheckEmailAvailabilityDto.prototype, "email", void 0);
class CheckPasswordStrengthDto {
    password;
}
exports.CheckPasswordStrengthDto = CheckPasswordStrengthDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Mot de passe à analyser',
        example: 'MonMotDePasse123!',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CheckPasswordStrengthDto.prototype, "password", void 0);
//# sourceMappingURL=register.dto.js.map