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
exports.MfaEnableDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class MfaEnableDto {
    method;
    phoneNumber;
    backupEmail;
    verificationCode;
}
exports.MfaEnableDto = MfaEnableDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Méthode d\'authentification multi-facteurs à activer',
        enum: client_1.mfa_method,
        example: 'SMS',
    }),
    (0, class_validator_1.IsEnum)(client_1.mfa_method, {
        message: 'La méthode MFA doit être valide (SMS, EMAIL, TOTP, APP_PUSH, HARDWARE_TOKEN, BIOMETRIC, BACKUP_CODES)'
    }),
    __metadata("design:type", String)
], MfaEnableDto.prototype, "method", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Numéro de téléphone au format international (requis pour SMS)',
        example: '+216 20 123 456',
        pattern: '^\\+[1-9]\\d{1,14}$',
    }),
    (0, class_validator_1.ValidateIf)(o => o.method === 'SMS'),
    (0, class_validator_1.IsPhoneNumber)(null, {
        message: 'Le numéro de téléphone doit être au format international valide'
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.replace(/\s/g, '')),
    __metadata("design:type", String)
], MfaEnableDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Email de backup pour la récupération',
        example: 'backup@example.com',
        format: 'email',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, {
        message: 'L\'email de backup doit être valide'
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.toLowerCase().trim()),
    (0, class_validator_1.MaxLength)(255, {
        message: 'L\'email de backup ne peut pas dépasser 255 caractères'
    }),
    __metadata("design:type", String)
], MfaEnableDto.prototype, "backupEmail", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Code de vérification initial pour valider la configuration',
        example: '123456',
        minLength: 4,
        maxLength: 10,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({
        message: 'Le code de vérification doit être une chaîne de caractères'
    }),
    (0, class_validator_1.MaxLength)(10, {
        message: 'Le code de vérification ne peut pas dépasser 10 caractères'
    }),
    __metadata("design:type", String)
], MfaEnableDto.prototype, "verificationCode", void 0);
//# sourceMappingURL=mfa-enable.dto.js.map