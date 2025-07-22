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
exports.MfaDisableDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class MfaDisableDto {
    method;
    password;
    confirmationCode;
    reason;
}
exports.MfaDisableDto = MfaDisableDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Méthode MFA spécifique à désactiver. Si non fourni, désactive toutes les méthodes',
        enum: client_1.mfa_method,
        example: 'SMS',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.mfa_method, {
        message: 'La méthode MFA doit être valide'
    }),
    __metadata("design:type", String)
], MfaDisableDto.prototype, "method", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Mot de passe actuel pour confirmer la désactivation',
        example: 'MonMotDePasse123!',
        minLength: 6,
        maxLength: 128,
    }),
    (0, class_validator_1.IsString)({
        message: 'Le mot de passe doit être une chaîne de caractères'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'Le mot de passe est requis pour désactiver MFA'
    }),
    (0, class_validator_1.MinLength)(6, {
        message: 'Le mot de passe doit contenir au moins 6 caractères'
    }),
    (0, class_validator_1.MaxLength)(128, {
        message: 'Le mot de passe ne peut pas dépasser 128 caractères'
    }),
    __metadata("design:type", String)
], MfaDisableDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Code MFA actuel pour confirmer la désactivation',
        example: '123456',
        minLength: 4,
        maxLength: 10,
    }),
    (0, class_validator_1.IsString)({
        message: 'Le code MFA doit être une chaîne de caractères'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'Le code MFA est requis pour confirmer la désactivation'
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
], MfaDisableDto.prototype, "confirmationCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Raison de la désactivation MFA',
        example: 'Changement de téléphone',
        maxLength: 500,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({
        message: 'La raison doit être une chaîne de caractères'
    }),
    (0, class_validator_1.MaxLength)(500, {
        message: 'La raison ne peut pas dépasser 500 caractères'
    }),
    __metadata("design:type", String)
], MfaDisableDto.prototype, "reason", void 0);
//# sourceMappingURL=mfa-disable.dto.js.map