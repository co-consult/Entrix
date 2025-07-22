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
exports.BackupCodesResponseDto = exports.RevokeBackupCodesDto = exports.UseBackupCodeDto = exports.GenerateBackupCodesDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class GenerateBackupCodesDto {
    password;
    forceRegenerate;
}
exports.GenerateBackupCodesDto = GenerateBackupCodesDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Mot de passe actuel pour générer les codes de secours',
        example: 'MonMotDePasse123!',
        minLength: 6,
        maxLength: 128,
    }),
    (0, class_validator_1.IsString)({
        message: 'Le mot de passe doit être une chaîne de caractères'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'Le mot de passe est requis pour générer les codes de secours'
    }),
    (0, class_validator_1.MinLength)(6, {
        message: 'Le mot de passe doit contenir au moins 6 caractères'
    }),
    (0, class_validator_1.MaxLength)(128, {
        message: 'Le mot de passe ne peut pas dépasser 128 caractères'
    }),
    __metadata("design:type", String)
], GenerateBackupCodesDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Forcer la régénération des codes (remplace les anciens)',
        example: false,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], GenerateBackupCodesDto.prototype, "forceRegenerate", void 0);
class UseBackupCodeDto {
    backupCode;
}
exports.UseBackupCodeDto = UseBackupCodeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Code de secours MFA à utiliser',
        example: 'ABC123-DEF456',
        minLength: 8,
        maxLength: 20,
    }),
    (0, class_validator_1.IsString)({
        message: 'Le code de secours doit être une chaîne de caractères'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'Le code de secours est requis'
    }),
    (0, class_validator_1.MinLength)(8, {
        message: 'Le code de secours doit contenir au moins 8 caractères'
    }),
    (0, class_validator_1.MaxLength)(20, {
        message: 'Le code de secours ne peut pas dépasser 20 caractères'
    }),
    (0, class_validator_1.Matches)(/^[A-Z0-9-]+$/, {
        message: 'Le code de secours ne peut contenir que des lettres majuscules, chiffres et tirets'
    }),
    __metadata("design:type", String)
], UseBackupCodeDto.prototype, "backupCode", void 0);
class RevokeBackupCodesDto {
    password;
    reason;
}
exports.RevokeBackupCodesDto = RevokeBackupCodesDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Mot de passe actuel pour révoquer les codes de secours',
        example: 'MonMotDePasse123!',
        minLength: 6,
        maxLength: 128,
    }),
    (0, class_validator_1.IsString)({
        message: 'Le mot de passe doit être une chaîne de caractères'
    }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'Le mot de passe est requis pour révoquer les codes de secours'
    }),
    (0, class_validator_1.MinLength)(6, {
        message: 'Le mot de passe doit contenir au moins 6 caractères'
    }),
    (0, class_validator_1.MaxLength)(128, {
        message: 'Le mot de passe ne peut pas dépasser 128 caractères'
    }),
    __metadata("design:type", String)
], RevokeBackupCodesDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Raison de la révocation des codes',
        example: 'Codes compromis',
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
], RevokeBackupCodesDto.prototype, "reason", void 0);
class BackupCodesResponseDto {
    codes;
    generatedAt;
    totalCodes;
    usedCodes;
    expiresAt;
    instructions;
}
exports.BackupCodesResponseDto = BackupCodesResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Liste des codes de secours générés',
        example: ['ABC123-DEF456', 'GHI789-JKL012', 'MNO345-PQR678'],
        type: [String],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(10),
    __metadata("design:type", Array)
], BackupCodesResponseDto.prototype, "codes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Date de génération des codes',
        example: '2025-01-07T10:30:00.000Z'
    }),
    __metadata("design:type", String)
], BackupCodesResponseDto.prototype, "generatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nombre de codes générés',
        example: 8
    }),
    __metadata("design:type", Number)
], BackupCodesResponseDto.prototype, "totalCodes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Codes utilisés (nombre)',
        example: 0
    }),
    __metadata("design:type", Number)
], BackupCodesResponseDto.prototype, "usedCodes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date d\'expiration des codes',
        example: '2026-01-07T10:30:00.000Z'
    }),
    __metadata("design:type", String)
], BackupCodesResponseDto.prototype, "expiresAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Instructions d\'utilisation',
        example: 'Conservez ces codes en lieu sûr. Chaque code ne peut être utilisé qu\'une seule fois.'
    }),
    __metadata("design:type", String)
], BackupCodesResponseDto.prototype, "instructions", void 0);
//# sourceMappingURL=mfa-backup-codes.dto.js.map