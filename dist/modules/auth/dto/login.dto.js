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
exports.OAuthLoginDto = exports.LoginCheckDto = exports.LoginDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class LoginDto {
    email;
    password;
    rememberMe;
    deviceFingerprint;
    mfaCode;
}
exports.LoginDto = LoginDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Adresse email de l\'utilisateur',
        example: 'mohamed.supporter@gmail.com',
        format: 'email',
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
], LoginDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Mot de passe de l\'utilisateur',
        example: 'MonMotDePasse123!',
        minLength: 6,
        maxLength: 128,
    }),
    (0, class_validator_1.IsString)({
        message: 'Le mot de passe doit être une chaîne de caractères'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'Le mot de passe est requis'
    }),
    (0, class_validator_1.MinLength)(6, {
        message: 'Le mot de passe doit contenir au moins 6 caractères'
    }),
    (0, class_validator_1.MaxLength)(128, {
        message: 'Le mot de passe ne peut pas dépasser 128 caractères'
    }),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Se souvenir de moi pour une session étendue',
        example: true,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({
        message: 'La valeur doit être un booléen'
    }),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (typeof value === 'string') {
            return value.toLowerCase() === 'true';
        }
        return Boolean(value);
    }),
    __metadata("design:type", Boolean)
], LoginDto.prototype, "rememberMe", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Empreinte unique du device pour la sécurité',
        example: 'fp_1234567890abcdef',
        maxLength: 255,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({
        message: 'L\'empreinte device doit être une chaîne de caractères'
    }),
    (0, class_validator_1.MaxLength)(255, {
        message: 'L\'empreinte device ne peut pas dépasser 255 caractères'
    }),
    (0, class_validator_1.Matches)(/^[a-zA-Z0-9_-]+$/, {
        message: 'L\'empreinte device contient des caractères invalides'
    }),
    __metadata("design:type", String)
], LoginDto.prototype, "deviceFingerprint", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Code MFA si l\'authentification multi-facteurs est activée',
        example: '123456',
        minLength: 4,
        maxLength: 10,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({
        message: 'Le code MFA doit être une chaîne de caractères'
    }),
    (0, class_validator_1.MinLength)(4, {
        message: 'Le code MFA doit contenir au moins 4 caractères'
    }),
    (0, class_validator_1.MaxLength)(10, {
        message: 'Le code MFA ne peut pas dépasser 10 caractères'
    }),
    (0, class_validator_1.Matches)(/^[0-9]+$/, {
        message: 'Le code MFA ne peut contenir que des chiffres'
    }),
    __metadata("design:type", String)
], LoginDto.prototype, "mfaCode", void 0);
class LoginCheckDto {
    email;
}
exports.LoginCheckDto = LoginCheckDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Email à vérifier',
        example: 'user@example.com',
    }),
    (0, class_validator_1.IsEmail)({}, {
        message: 'L\'adresse email doit être valide'
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.toLowerCase().trim()),
    __metadata("design:type", String)
], LoginCheckDto.prototype, "email", void 0);
class OAuthLoginDto {
    provider;
    accessToken;
    rememberMe;
}
exports.OAuthLoginDto = OAuthLoginDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Fournisseur OAuth',
        enum: ['google', 'facebook', 'apple'],
        example: 'google',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], OAuthLoginDto.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Token d\'accès OAuth',
        example: 'ya29.a0ARrdaM...',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], OAuthLoginDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Se souvenir de moi',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], OAuthLoginDto.prototype, "rememberMe", void 0);
//# sourceMappingURL=login.dto.js.map