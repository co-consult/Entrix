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
exports.SendPhoneVerificationDto = exports.VerifyPhoneDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class VerifyPhoneDto {
    code;
    phoneNumber;
}
exports.VerifyPhoneDto = VerifyPhoneDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Code de vérification reçu par SMS',
        example: '123456',
        minLength: 4,
        maxLength: 8,
        pattern: '^[0-9]+$',
    }),
    (0, class_validator_1.IsString)({
        message: 'Le code doit être une chaîne de caractères'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'Le code de vérification est requis'
    }),
    (0, class_validator_1.MinLength)(4, {
        message: 'Le code doit contenir au moins 4 chiffres'
    }),
    (0, class_validator_1.MaxLength)(8, {
        message: 'Le code ne peut pas dépasser 8 chiffres'
    }),
    (0, class_validator_1.Matches)(/^[0-9]+$/, {
        message: 'Le code ne peut contenir que des chiffres'
    }),
    __metadata("design:type", String)
], VerifyPhoneDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Numéro de téléphone pour validation croisée',
        example: '+216 20 123 456',
        pattern: '^\\+[1-9]\\d{1,14}$',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({
        message: 'Le téléphone doit être une chaîne de caractères'
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.replace(/\s/g, '')),
    (0, class_validator_1.IsPhoneNumber)(null, {
        message: 'Le numéro de téléphone doit être au format international valide'
    }),
    __metadata("design:type", String)
], VerifyPhoneDto.prototype, "phoneNumber", void 0);
class SendPhoneVerificationDto {
    phoneNumber;
}
exports.SendPhoneVerificationDto = SendPhoneVerificationDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Numéro de téléphone au format international',
        example: '+216 20 123 456',
        pattern: '^\\+[1-9]\\d{1,14}$',
    }),
    (0, class_validator_1.IsString)({
        message: 'Le téléphone doit être une chaîne de caractères'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'Le numéro de téléphone est requis'
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.replace(/\s/g, '')),
    (0, class_validator_1.IsPhoneNumber)(null, {
        message: 'Le numéro de téléphone doit être au format international valide (+216...)'
    }),
    __metadata("design:type", String)
], SendPhoneVerificationDto.prototype, "phoneNumber", void 0);
//# sourceMappingURL=verify-phone.dto.js.map