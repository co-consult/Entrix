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
exports.MfaVerifyResponseDto = exports.MfaVerifyDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class MfaVerifyDto {
    challengeToken;
    method;
    code;
    trustDevice = false;
}
exports.MfaVerifyDto = MfaVerifyDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Token de challenge MFA',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MfaVerifyDto.prototype, "challengeToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Méthode de vérification MFA',
        enum: ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP', 'BACKUP_CODE'],
    }),
    (0, class_validator_1.IsEnum)(['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP', 'BACKUP_CODE'], {
        message: 'Méthode MFA invalide'
    }),
    __metadata("design:type", String)
], MfaVerifyDto.prototype, "method", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Code de vérification à 6 chiffres',
        minLength: 6,
        maxLength: 8,
        example: '123456',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 8, { message: 'Code doit faire entre 6 et 8 caractères' }),
    __metadata("design:type", String)
], MfaVerifyDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Marquer cet appareil comme fiable',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], MfaVerifyDto.prototype, "trustDevice", void 0);
class MfaVerifyResponseDto {
    success;
    data;
}
exports.MfaVerifyResponseDto = MfaVerifyResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], MfaVerifyResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], MfaVerifyResponseDto.prototype, "data", void 0);
//# sourceMappingURL=mfa-verify.dto.js.map