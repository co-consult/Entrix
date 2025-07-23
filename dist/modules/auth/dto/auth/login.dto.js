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
exports.LoginDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const auth_constants_1 = require("../../constants/auth.constants");
class LoginDto {
    email;
    password;
    rememberMe = false;
    captchaToken;
    deviceFingerprint;
}
exports.LoginDto = LoginDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Email de connexion',
        example: 'user@entrix.tn',
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
], LoginDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Mot de passe utilisateur',
        minLength: auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH,
        maxLength: auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MAX_LENGTH,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Mot de passe requis' }),
    (0, class_validator_1.MinLength)(auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH, {
        message: `Mot de passe minimum ${auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH} caractères`
    }),
    (0, class_validator_1.MaxLength)(auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MAX_LENGTH, {
        message: `Mot de passe maximum ${auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MAX_LENGTH} caractères`
    }),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Session prolongée (30 jours)',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], LoginDto.prototype, "rememberMe", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Token CAPTCHA (requis après échecs)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoginDto.prototype, "captchaToken", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Empreinte device pour sécurité',
        maxLength: 255,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], LoginDto.prototype, "deviceFingerprint", void 0);
//# sourceMappingURL=login.dto.js.map