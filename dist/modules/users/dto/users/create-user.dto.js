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
exports.CreateUserDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const user_constants_1 = require("../../constants/user.constants");
class CreateUserDto {
    email;
    password;
    first_name;
    last_name;
    phone;
    avatar;
    is_active = true;
    email_verified = false;
    phone_verified = false;
    metadata;
}
exports.CreateUserDto = CreateUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Adresse email de l\'utilisateur',
        example: 'ahmed.ben.salem@gmail.com',
        maxLength: user_constants_1.USER_CONSTANTS.VALIDATION.EMAIL.MAX_LENGTH,
    }),
    (0, class_validator_1.IsEmail)({}, { message: 'Format d\'email invalide' }),
    (0, class_validator_1.MaxLength)(user_constants_1.USER_CONSTANTS.VALIDATION.EMAIL.MAX_LENGTH, {
        message: `L'email ne peut pas dépasser ${user_constants_1.USER_CONSTANTS.VALIDATION.EMAIL.MAX_LENGTH} caractères`,
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.toLowerCase()?.trim()),
    __metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Mot de passe de l\'utilisateur',
        example: 'MotdepasseSecurise2024!',
        minLength: 8,
        maxLength: 128,
    }),
    (0, class_validator_1.IsString)({ message: 'Le mot de passe doit être une chaîne de caractères' }),
    (0, class_validator_1.MinLength)(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' }),
    (0, class_validator_1.MaxLength)(128, { message: 'Le mot de passe ne peut pas dépasser 128 caractères' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Prénom de l\'utilisateur',
        example: 'Ahmed',
        minLength: user_constants_1.USER_CONSTANTS.VALIDATION.FIRST_NAME.MIN_LENGTH,
        maxLength: user_constants_1.USER_CONSTANTS.VALIDATION.FIRST_NAME.MAX_LENGTH,
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
], CreateUserDto.prototype, "first_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nom de famille de l\'utilisateur',
        example: 'Ben Salem',
        minLength: user_constants_1.USER_CONSTANTS.VALIDATION.LAST_NAME.MIN_LENGTH,
        maxLength: user_constants_1.USER_CONSTANTS.VALIDATION.LAST_NAME.MAX_LENGTH,
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
], CreateUserDto.prototype, "last_name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Numéro de téléphone de l\'utilisateur',
        example: '+21697123456',
        maxLength: user_constants_1.USER_CONSTANTS.VALIDATION.PHONE.MAX_LENGTH,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le téléphone doit être une chaîne de caractères' }),
    (0, class_validator_1.MaxLength)(user_constants_1.USER_CONSTANTS.VALIDATION.PHONE.MAX_LENGTH, {
        message: `Le téléphone ne peut pas dépasser ${user_constants_1.USER_CONSTANTS.VALIDATION.PHONE.MAX_LENGTH} caractères`,
    }),
    (0, class_validator_1.Matches)(user_constants_1.USER_CONSTANTS.VALIDATION.PHONE.REGEX, {
        message: 'Format de téléphone invalide (ex: +21697123456)',
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], CreateUserDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'URL de l\'avatar de l\'utilisateur',
        example: 'https://cdn.entrix.tn/avatars/user123.jpg',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'L\'avatar doit être une URL valide' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], CreateUserDto.prototype, "avatar", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Statut d\'activation du compte',
        example: true,
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'is_active doit être un booléen' }),
    __metadata("design:type", Boolean)
], CreateUserDto.prototype, "is_active", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Email vérifié',
        example: false,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'email_verified doit être un booléen' }),
    __metadata("design:type", Boolean)
], CreateUserDto.prototype, "email_verified", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Téléphone vérifié',
        example: false,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'phone_verified doit être un booléen' }),
    __metadata("design:type", Boolean)
], CreateUserDto.prototype, "phone_verified", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Métadonnées additionnelles en format JSON',
        example: { source: 'web', campaign: 'summer2025' },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Les métadonnées doivent être un objet JSON valide' }),
    __metadata("design:type", Object)
], CreateUserDto.prototype, "metadata", void 0);
//# sourceMappingURL=create-user.dto.js.map