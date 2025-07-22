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
exports.MfaVerifyDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class MfaVerifyDto {
    method;
    code;
    rememberDevice;
}
exports.MfaVerifyDto = MfaVerifyDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Méthode MFA utilisée pour la vérification',
        enum: client_1.mfa_method,
        example: 'SMS',
    }),
    (0, class_validator_1.IsEnum)(client_1.mfa_method, {
        message: 'La méthode MFA doit être valide'
    }),
    __metadata("design:type", String)
], MfaVerifyDto.prototype, "method", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Code de vérification MFA',
        example: '123456',
        minLength: 4,
        maxLength: 10,
    }),
    (0, class_validator_1.IsString)({
        message: 'Le code doit être une chaîne de caractères'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'Le code de vérification est requis'
    }),
    (0, class_validator_1.MinLength)(4, {
        message: 'Le code doit contenir au moins 4 caractères'
    }),
    (0, class_validator_1.MaxLength)(10, {
        message: 'Le code ne peut pas dépasser 10 caractères'
    }),
    (0, class_validator_1.ValidateIf)(o => o.method === 'SMS' || o.method === 'EMAIL' || o.method === 'TOTP'),
    (0, class_validator_1.Matches)(/^[0-9]+$/, {
        message: 'Le code ne peut contenir que des chiffres'
    }),
    __metadata("design:type", String)
], MfaVerifyDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Se souvenir de cet appareil pour éviter MFA répétés',
        example: false,
        default: false,
    }),
    (0, class_validator_1.ValidateIf)(o => o.rememberDevice !== undefined),
    (0, class_validator_1.IsString)({
        message: 'La valeur doit être un booléen'
    }),
    __metadata("design:type", Boolean)
], MfaVerifyDto.prototype, "rememberDevice", void 0);
//# sourceMappingURL=mfa-verify.dto.js.map