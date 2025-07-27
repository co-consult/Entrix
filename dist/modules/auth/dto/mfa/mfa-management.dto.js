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
exports.MfaStatsResponseDto = exports.MfaStatsDto = exports.MfaSessionConfigDto = exports.MfaSendCodeResponseDto = exports.MfaSendCodeDto = exports.TrustedDevicesResponseDto = exports.TrustedDeviceDto = exports.MfaStatusResponseDto = exports.MfaStatusDto = exports.MfaProvidersResponseDto = exports.MfaProviderInfoDto = exports.MfaAdvancedConfigDto = exports.MfaRegenerateBackupCodesDto = exports.MfaDisableDto = exports.MfaToggleDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class MfaToggleDto {
    enable;
    verificationCode;
    challengeToken;
}
exports.MfaToggleDto = MfaToggleDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Activer ou désactiver la méthode MFA',
        example: true
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], MfaToggleDto.prototype, "enable", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Code de vérification pour désactivation (requis pour désactiver)',
        minLength: 6,
        maxLength: 8
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 8),
    (0, class_validator_1.ValidateIf)((o) => o.enable === false),
    __metadata("design:type", String)
], MfaToggleDto.prototype, "verificationCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Token de challenge pour vérification'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.ValidateIf)((o) => o.enable === false),
    __metadata("design:type", String)
], MfaToggleDto.prototype, "challengeToken", void 0);
class MfaDisableDto {
    confirmationCode;
    challengeToken;
    reason;
}
exports.MfaDisableDto = MfaDisableDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Code de confirmation pour suppression',
        minLength: 6,
        maxLength: 8
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 8),
    __metadata("design:type", String)
], MfaDisableDto.prototype, "confirmationCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Token de challenge pour vérification'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MfaDisableDto.prototype, "challengeToken", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Raison de la suppression (optionnel)',
        maxLength: 200
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MfaDisableDto.prototype, "reason", void 0);
class MfaRegenerateBackupCodesDto {
    verificationMethod;
    verificationCode;
    challengeToken;
}
exports.MfaRegenerateBackupCodesDto = MfaRegenerateBackupCodesDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Méthode MFA pour vérification',
        enum: ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP']
    }),
    (0, class_validator_1.IsEnum)(['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP']),
    __metadata("design:type", Object)
], MfaRegenerateBackupCodesDto.prototype, "verificationMethod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Code de vérification',
        minLength: 6,
        maxLength: 8
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 8),
    __metadata("design:type", String)
], MfaRegenerateBackupCodesDto.prototype, "verificationCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Token de challenge pour vérification'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MfaRegenerateBackupCodesDto.prototype, "challengeToken", void 0);
class MfaAdvancedConfigDto {
    isPrimary = false;
    customName;
    backupPhone;
}
exports.MfaAdvancedConfigDto = MfaAdvancedConfigDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Définir comme méthode primaire',
        default: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], MfaAdvancedConfigDto.prototype, "isPrimary", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nom personnalisé pour la méthode'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 100),
    __metadata("design:type", String)
], MfaAdvancedConfigDto.prototype, "customName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Numéro de téléphone de secours (pour SMS)'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(8, 20),
    __metadata("design:type", String)
], MfaAdvancedConfigDto.prototype, "backupPhone", void 0);
class MfaProviderInfoDto {
    provider;
    isConfigured;
    name;
    description;
    setupTime;
    isRecommended;
}
exports.MfaProviderInfoDto = MfaProviderInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MfaProviderInfoDto.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], MfaProviderInfoDto.prototype, "isConfigured", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MfaProviderInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MfaProviderInfoDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MfaProviderInfoDto.prototype, "setupTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], MfaProviderInfoDto.prototype, "isRecommended", void 0);
class MfaProvidersResponseDto {
    success;
    data;
}
exports.MfaProvidersResponseDto = MfaProvidersResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], MfaProvidersResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], MfaProvidersResponseDto.prototype, "data", void 0);
class MfaStatusDto {
    isEnabled;
    configuredMethods;
    primaryMethod;
    trustedDevicesCount;
    backupCodesRemaining;
    lastUsed;
    securityScore;
}
exports.MfaStatusDto = MfaStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], MfaStatusDto.prototype, "isEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], MfaStatusDto.prototype, "configuredMethods", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], MfaStatusDto.prototype, "primaryMethod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MfaStatusDto.prototype, "trustedDevicesCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MfaStatusDto.prototype, "backupCodesRemaining", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], MfaStatusDto.prototype, "lastUsed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Score de sécurité de 0 à 100',
        minimum: 0,
        maximum: 100
    }),
    __metadata("design:type", Number)
], MfaStatusDto.prototype, "securityScore", void 0);
class MfaStatusResponseDto {
    success;
    data;
}
exports.MfaStatusResponseDto = MfaStatusResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], MfaStatusResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", MfaStatusDto)
], MfaStatusResponseDto.prototype, "data", void 0);
class TrustedDeviceDto {
    id;
    deviceName;
    trustedAt;
    lastSeenAt;
    expiresAt;
    ipAddress;
    isCurrent;
    isActive;
}
exports.TrustedDeviceDto = TrustedDeviceDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TrustedDeviceDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TrustedDeviceDto.prototype, "deviceName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TrustedDeviceDto.prototype, "trustedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TrustedDeviceDto.prototype, "lastSeenAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TrustedDeviceDto.prototype, "expiresAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], TrustedDeviceDto.prototype, "ipAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], TrustedDeviceDto.prototype, "isCurrent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], TrustedDeviceDto.prototype, "isActive", void 0);
class TrustedDevicesResponseDto {
    success;
    data;
}
exports.TrustedDevicesResponseDto = TrustedDevicesResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], TrustedDevicesResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], TrustedDevicesResponseDto.prototype, "data", void 0);
class MfaSendCodeDto {
    method;
    challengeToken;
    alternatePhone;
}
exports.MfaSendCodeDto = MfaSendCodeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Méthode pour envoyer le code',
        enum: ['SMS_OTP', 'EMAIL_OTP']
    }),
    (0, class_validator_1.IsEnum)(['SMS_OTP', 'EMAIL_OTP']),
    __metadata("design:type", String)
], MfaSendCodeDto.prototype, "method", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Token de challenge (si dans un flow d\'auth)'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MfaSendCodeDto.prototype, "challengeToken", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Numéro alternatif pour SMS (si configuré)'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(8, 20),
    __metadata("design:type", String)
], MfaSendCodeDto.prototype, "alternatePhone", void 0);
class MfaSendCodeResponseDto {
    success;
    data;
    message;
}
exports.MfaSendCodeResponseDto = MfaSendCodeResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], MfaSendCodeResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], MfaSendCodeResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], MfaSendCodeResponseDto.prototype, "message", void 0);
class MfaSessionConfigDto {
    mfaSessionDuration;
    allowDeviceTrust = true;
    deviceTrustDuration;
}
exports.MfaSessionConfigDto = MfaSessionConfigDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Durée avant re-demande MFA (secondes)',
        minimum: 300,
        maximum: 86400
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], MfaSessionConfigDto.prototype, "mfaSessionDuration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Permettre mémorisation appareil',
        default: true
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], MfaSessionConfigDto.prototype, "allowDeviceTrust", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Durée mémorisation appareil (jours)',
        minimum: 1,
        maximum: 90
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], MfaSessionConfigDto.prototype, "deviceTrustDuration", void 0);
class MfaStatsDto {
    totalVerifications;
    successfulVerifications;
    failedVerifications;
    lastSuccessfulVerification;
    mostUsedMethod;
    methodUsageStats;
    trustedDevicesHistory;
}
exports.MfaStatsDto = MfaStatsDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MfaStatsDto.prototype, "totalVerifications", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MfaStatsDto.prototype, "successfulVerifications", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MfaStatsDto.prototype, "failedVerifications", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MfaStatsDto.prototype, "lastSuccessfulVerification", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MfaStatsDto.prototype, "mostUsedMethod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], MfaStatsDto.prototype, "methodUsageStats", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], MfaStatsDto.prototype, "trustedDevicesHistory", void 0);
class MfaStatsResponseDto {
    success;
    data;
}
exports.MfaStatsResponseDto = MfaStatsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], MfaStatsResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", MfaStatsDto)
], MfaStatsResponseDto.prototype, "data", void 0);
//# sourceMappingURL=mfa-management.dto.js.map