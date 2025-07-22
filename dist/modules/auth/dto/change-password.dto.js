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
exports.ChangePasswordDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const match_decorator_1 = require("../../../common/decorators/match.decorator");
class ChangePasswordDto {
    currentPassword;
    newPassword;
    confirmPassword;
}
exports.ChangePasswordDto = ChangePasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Mot de passe actuel pour vérification',
        example: 'AncienMotDePasse123!',
        minLength: 6,
        maxLength: 128,
    }),
    (0, class_validator_1.IsString)({
        message: 'L\'ancien mot de passe doit être une chaîne de caractères'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'L\'ancien mot de passe est requis'
    }),
    (0, class_validator_1.MinLength)(6, {
        message: 'L\'ancien mot de passe doit contenir au moins 6 caractères'
    }),
    (0, class_validator_1.MaxLength)(128, {
        message: 'L\'ancien mot de passe ne peut pas dépasser 128 caractères'
    }),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "currentPassword", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nouveau mot de passe sécurisé',
        example: 'NouveauMotDePasse123!',
        minLength: 8,
        maxLength: 128,
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
    }),
    (0, class_validator_1.IsString)({
        message: 'Le nouveau mot de passe doit être une chaîne de caractères'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'Le nouveau mot de passe est requis'
    }),
    (0, class_validator_1.MinLength)(8, {
        message: 'Le nouveau mot de passe doit contenir au moins 8 caractères'
    }),
    (0, class_validator_1.MaxLength)(128, {
        message: 'Le nouveau mot de passe ne peut pas dépasser 128 caractères'
    }),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Le nouveau mot de passe doit contenir au moins : 1 minuscule, 1 majuscule, 1 chiffre et 1 caractère spécial (@$!%*?&)'
    }),
    (0, class_validator_1.ValidateIf)((o) => o.newPassword === o.currentPassword),
    (0, class_validator_1.Matches)(/^(?!.*current).*$/, {
        message: 'Le nouveau mot de passe doit être différent de l\'ancien'
    }),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "newPassword", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Confirmation du nouveau mot de passe',
        example: 'NouveauMotDePasse123!',
    }),
    (0, class_validator_1.IsString)({
        message: 'La confirmation doit être une chaîne de caractères'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'La confirmation du nouveau mot de passe est requise'
    }),
    (0, match_decorator_1.Match)('newPassword', {
        message: 'Les mots de passe ne correspondent pas'
    }),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "confirmPassword", void 0);
//# sourceMappingURL=change-password.dto.js.map