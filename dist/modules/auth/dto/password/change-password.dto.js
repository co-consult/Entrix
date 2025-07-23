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
exports.ChangePasswordResponseDto = exports.ChangePasswordDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const auth_constants_1 = require("../../constants/auth.constants");
class ChangePasswordDto {
    currentPassword;
    newPassword;
    confirmPassword;
}
exports.ChangePasswordDto = ChangePasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Mot de passe actuel',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Mot de passe actuel requis' }),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "currentPassword", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nouveau mot de passe',
        minLength: auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH,
        maxLength: auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MAX_LENGTH,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nouveau mot de passe requis' }),
    (0, class_validator_1.MinLength)(auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH, {
        message: `Mot de passe minimum ${auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH} caractères`
    }),
    (0, class_validator_1.MaxLength)(auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MAX_LENGTH, {
        message: `Mot de passe maximum ${auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MAX_LENGTH} caractères`
    }),
    (0, class_validator_1.Matches)(auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_REGEX, {
        message: 'Mot de passe doit contenir majuscule, minuscule, chiffre et symbole'
    }),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "newPassword", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Confirmation du nouveau mot de passe',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Confirmation mot de passe requise' }),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "confirmPassword", void 0);
class ChangePasswordResponseDto {
    success;
    data;
    message;
}
exports.ChangePasswordResponseDto = ChangePasswordResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], ChangePasswordResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], ChangePasswordResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ChangePasswordResponseDto.prototype, "message", void 0);
//# sourceMappingURL=change-password.dto.js.map