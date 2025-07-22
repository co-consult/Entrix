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
exports.ResetPasswordDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const match_decorator_1 = require("../../../common/decorators/match.decorator");
class ResetPasswordDto {
    token;
    newPassword;
    confirmPassword;
}
exports.ResetPasswordDto = ResetPasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Token de réinitialisation reçu par email',
        example: 'abc123def456...',
        minLength: 32,
        maxLength: 128,
    }),
    (0, class_validator_1.IsString)({
        message: 'Le token doit être une chaîne de caractères'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'Le token de réinitialisation est requis'
    }),
    (0, class_validator_1.MinLength)(32, {
        message: 'Le token doit contenir au moins 32 caractères'
    }),
    (0, class_validator_1.MaxLength)(128, {
        message: 'Le token ne peut pas dépasser 128 caractères'
    }),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "token", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nouveau mot de passe sécurisé',
        example: 'NouveauMotDePasse123!',
        minLength: 8,
        maxLength: 128,
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
    }),
    (0, class_validator_1.IsString)({
        message: 'Le mot de passe doit être une chaîne de caractères'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'Le nouveau mot de passe est requis'
    }),
    (0, class_validator_1.MinLength)(8, {
        message: 'Le mot de passe doit contenir au moins 8 caractères'
    }),
    (0, class_validator_1.MaxLength)(128, {
        message: 'Le mot de passe ne peut pas dépasser 128 caractères'
    }),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Le mot de passe doit contenir au moins : 1 minuscule, 1 majuscule, 1 chiffre et 1 caractère spécial (@$!%*?&)'
    }),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "newPassword", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Confirmation du nouveau mot de passe',
        example: 'NouveauMotDePasse123!',
    }),
    (0, class_validator_1.IsString)({
        message: 'La confirmation doit être une chaîne de caractères'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'La confirmation du mot de passe est requise'
    }),
    (0, match_decorator_1.Match)('newPassword', {
        message: 'Les mots de passe ne correspondent pas'
    }),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "confirmPassword", void 0);
//# sourceMappingURL=reset-password.dto.js.map