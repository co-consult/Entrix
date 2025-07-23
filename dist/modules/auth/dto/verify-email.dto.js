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
exports.ResendVerificationEmailDto = exports.VerifyEmailDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class VerifyEmailDto {
    token;
}
exports.VerifyEmailDto = VerifyEmailDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Token de vérification reçu par email',
        example: 'b8lMhZhdeZEaqHcHkTWKXTFfQc1Q4tPU',
        minLength: 32,
        maxLength: 128,
    }),
    (0, class_validator_1.IsString)({
        message: 'Le token doit être une chaîne de caractères'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'Le token de vérification est requis'
    }),
    (0, class_validator_1.MinLength)(32, {
        message: 'Le token doit contenir au moins 32 caractères'
    }),
    (0, class_validator_1.MaxLength)(128, {
        message: 'Le token ne peut pas dépasser 128 caractères'
    }),
    (0, class_validator_1.Matches)(/^[a-zA-Z0-9]+$/, {
        message: 'Le token ne peut contenir que des lettres et des chiffres'
    }),
    __metadata("design:type", String)
], VerifyEmailDto.prototype, "token", void 0);
class ResendVerificationEmailDto {
    email;
}
exports.ResendVerificationEmailDto = ResendVerificationEmailDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Adresse email pour renvoyer le lien de vérification',
        example: 'user@example.com',
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
], ResendVerificationEmailDto.prototype, "email", void 0);
//# sourceMappingURL=verify-email.dto.js.map