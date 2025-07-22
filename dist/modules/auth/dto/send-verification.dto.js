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
exports.SendVerificationResponseDto = exports.SendVerificationDto = exports.VerificationType = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
var VerificationType;
(function (VerificationType) {
    VerificationType["EMAIL"] = "email";
    VerificationType["SMS"] = "sms";
    VerificationType["CALL"] = "call";
})(VerificationType || (exports.VerificationType = VerificationType = {}));
class SendVerificationDto {
    type;
    email;
    phoneNumber;
    language;
}
exports.SendVerificationDto = SendVerificationDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Type de vérification à envoyer',
        enum: VerificationType,
        example: VerificationType.EMAIL,
    }),
    (0, class_validator_1.IsEnum)(VerificationType, {
        message: 'Le type de vérification doit être email, sms ou call'
    }),
    __metadata("design:type", String)
], SendVerificationDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Adresse email pour vérification (requis si type=email)',
        example: 'user@example.com',
        format: 'email',
    }),
    (0, class_validator_1.ValidateIf)(o => o.type === VerificationType.EMAIL),
    (0, class_validator_1.IsEmail)({}, {
        message: 'L\'adresse email doit être valide'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'L\'email est requis pour la vérification email'
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.toLowerCase().trim()),
    (0, class_validator_1.MaxLength)(255, {
        message: 'L\'email ne peut pas dépasser 255 caractères'
    }),
    __metadata("design:type", String)
], SendVerificationDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Numéro de téléphone pour vérification (requis si type=sms ou call)',
        example: '+216 20 123 456',
        pattern: '^\\+[1-9]\\d{1,14}$',
    }),
    (0, class_validator_1.ValidateIf)(o => o.type === VerificationType.SMS || o.type === VerificationType.CALL),
    (0, class_validator_1.IsPhoneNumber)(null, {
        message: 'Le numéro de téléphone doit être au format international valide'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'Le téléphone est requis pour la vérification SMS/call'
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.replace(/\s/g, '')),
    __metadata("design:type", String)
], SendVerificationDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Langue pour le message de vérification',
        example: 'fr',
        enum: ['fr', 'ar', 'en'],
        default: 'fr',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({
        message: 'La langue doit être une chaîne de caractères'
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.toLowerCase()),
    __metadata("design:type", String)
], SendVerificationDto.prototype, "language", void 0);
class SendVerificationResponseDto {
    success;
    message;
    cooldownSeconds;
    attemptsRemaining;
    expiresAt;
}
exports.SendVerificationResponseDto = SendVerificationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Indique si l\'envoi a réussi',
        example: true
    }),
    __metadata("design:type", Boolean)
], SendVerificationResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message de confirmation',
        example: 'Code de vérification envoyé par SMS'
    }),
    __metadata("design:type", String)
], SendVerificationResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Temps d\'attente avant prochain envoi (secondes)',
        example: 60
    }),
    __metadata("design:type", Number)
], SendVerificationResponseDto.prototype, "cooldownSeconds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nombre de tentatives restantes',
        example: 2
    }),
    __metadata("design:type", Number)
], SendVerificationResponseDto.prototype, "attemptsRemaining", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Expiration du code (ISO string)',
        example: '2025-01-07T11:05:00.000Z'
    }),
    __metadata("design:type", String)
], SendVerificationResponseDto.prototype, "expiresAt", void 0);
//# sourceMappingURL=send-verification.dto.js.map