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
exports.MfaConfigDto = exports.BackupCodesInfoDto = exports.MfaMethodConfigDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class MfaMethodConfigDto {
    method;
    enabled;
    verified;
    configuredAt;
    lastUsed;
    metadata;
}
exports.MfaMethodConfigDto = MfaMethodConfigDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Méthode MFA',
        enum: client_1.mfa_method,
        example: 'SMS'
    }),
    __metadata("design:type", String)
], MfaMethodConfigDto.prototype, "method", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Méthode activée',
        example: true
    }),
    __metadata("design:type", Boolean)
], MfaMethodConfigDto.prototype, "enabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Méthode vérifiée',
        example: true
    }),
    __metadata("design:type", Boolean)
], MfaMethodConfigDto.prototype, "verified", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Date de configuration',
        example: '2025-01-07T10:30:00.000Z'
    }),
    __metadata("design:type", Date)
], MfaMethodConfigDto.prototype, "configuredAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Dernière utilisation',
        example: '2025-01-07T09:45:00.000Z'
    }),
    __metadata("design:type", Date)
], MfaMethodConfigDto.prototype, "lastUsed", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Informations spécifiques à la méthode (masquées)',
        example: { phoneNumber: '+216**\*\***456' }
    }),
    __metadata("design:type", Object)
], MfaMethodConfigDto.prototype, "metadata", void 0);
class BackupCodesInfoDto {
    generated;
    generatedAt;
    totalCodes;
    usedCodes;
    remainingCodes;
    expiresAt;
}
exports.BackupCodesInfoDto = BackupCodesInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Codes de secours générés',
        example: true
    }),
    __metadata("design:type", Boolean)
], BackupCodesInfoDto.prototype, "generated", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Date de génération',
        example: '2025-01-07T10:30:00.000Z'
    }),
    __metadata("design:type", Date)
], BackupCodesInfoDto.prototype, "generatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nombre total de codes',
        example: 8
    }),
    __metadata("design:type", Number)
], BackupCodesInfoDto.prototype, "totalCodes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nombre de codes utilisés',
        example: 2
    }),
    __metadata("design:type", Number)
], BackupCodesInfoDto.prototype, "usedCodes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Codes restants',
        example: 6
    }),
    __metadata("design:type", Number)
], BackupCodesInfoDto.prototype, "remainingCodes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date d\'expiration des codes',
        example: '2026-01-07T10:30:00.000Z'
    }),
    __metadata("design:type", Date)
], BackupCodesInfoDto.prototype, "expiresAt", void 0);
class MfaConfigDto {
    enabled;
    methods;
    defaultMethod;
    backupCodes;
    lastVerified;
    statistics;
    securityRequirements;
    recommendedMethods;
    nextStepRequired;
    restrictions;
}
exports.MfaConfigDto = MfaConfigDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Indique si MFA est activé pour l\'utilisateur',
        example: true,
    }),
    __metadata("design:type", Boolean)
], MfaConfigDto.prototype, "enabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Liste des méthodes MFA configurées',
        type: [MfaMethodConfigDto],
    }),
    (0, class_transformer_1.Type)(() => MfaMethodConfigDto),
    __metadata("design:type", Array)
], MfaConfigDto.prototype, "methods", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Méthode MFA par défaut utilisée',
        enum: client_1.mfa_method,
        example: 'SMS',
    }),
    __metadata("design:type", String)
], MfaConfigDto.prototype, "defaultMethod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Informations sur les codes de secours',
        type: BackupCodesInfoDto,
    }),
    (0, class_transformer_1.Type)(() => BackupCodesInfoDto),
    __metadata("design:type", BackupCodesInfoDto)
], MfaConfigDto.prototype, "backupCodes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date de la dernière vérification MFA réussie',
        example: '2025-01-07T09:45:00.000Z',
    }),
    __metadata("design:type", Date)
], MfaConfigDto.prototype, "lastVerified", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Statistiques d\'utilisation MFA',
        example: {
            totalVerifications: 145,
            failedAttempts: 3,
            lastFailedAttempt: '2025-01-06T15:30:00.000Z'
        },
    }),
    __metadata("design:type", Object)
], MfaConfigDto.prototype, "statistics", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Exigences de sécurité pour cet utilisateur',
        example: {
            required: true,
            reason: 'Compte à privilèges élevés',
            enforced: true,
            canDisable: false
        },
    }),
    __metadata("design:type", Object)
], MfaConfigDto.prototype, "securityRequirements", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Méthodes MFA recommandées pour cet utilisateur',
        example: ['TOTP', 'SMS'],
        type: [String],
    }),
    __metadata("design:type", Array)
], MfaConfigDto.prototype, "recommendedMethods", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Prochaine étape de configuration MFA requise',
        example: 'Configurer une méthode de secours',
    }),
    __metadata("design:type", String)
], MfaConfigDto.prototype, "nextStepRequired", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Restrictions actives sur le compte',
        example: {
            temporaryLock: false,
            suspiciousActivity: false,
            requiresAdditionalVerification: false
        },
    }),
    __metadata("design:type", Object)
], MfaConfigDto.prototype, "restrictions", void 0);
//# sourceMappingURL=mfa-config.dto.js.map