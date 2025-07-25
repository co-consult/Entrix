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
exports.RegisterResponseMapper = exports.RegisterResponseDto = exports.OnboardingInfoDto = exports.VerificationInfoDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const login_response_dto_1 = require("./login-response.dto");
class VerificationInfoDto {
    emailSent;
    verificationRequired;
    tokenId;
}
exports.VerificationInfoDto = VerificationInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Email de vérification envoyé' }),
    __metadata("design:type", Boolean)
], VerificationInfoDto.prototype, "emailSent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Vérification email requise' }),
    __metadata("design:type", Boolean)
], VerificationInfoDto.prototype, "verificationRequired", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID du token de vérification' }),
    __metadata("design:type", String)
], VerificationInfoDto.prototype, "tokenId", void 0);
class OnboardingInfoDto {
    incentiveApplied;
    incentiveType;
    incentiveValue;
    migratedTickets;
}
exports.OnboardingInfoDto = OnboardingInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Incentive appliqué lors de l\'inscription' }),
    __metadata("design:type", Boolean)
], OnboardingInfoDto.prototype, "incentiveApplied", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Type d\'incentive appliqué' }),
    __metadata("design:type", String)
], OnboardingInfoDto.prototype, "incentiveType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Valeur de l\'incentive' }),
    __metadata("design:type", Number)
], OnboardingInfoDto.prototype, "incentiveValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nombre de tickets migrés' }),
    __metadata("design:type", Number)
], OnboardingInfoDto.prototype, "migratedTickets", void 0);
class RegisterResponseDto {
    success;
    data;
    message;
    meta;
}
exports.RegisterResponseDto = RegisterResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Statut de la requête' }),
    __metadata("design:type", Boolean)
], RegisterResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Données d\'inscription' }),
    __metadata("design:type", Object)
], RegisterResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Message informatif' }),
    __metadata("design:type", String)
], RegisterResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Métadonnées' }),
    __metadata("design:type", Object)
], RegisterResponseDto.prototype, "meta", void 0);
class RegisterResponseMapper {
    static toDto(registerResult) {
        return {
            success: registerResult.success,
            data: registerResult.user ? {
                user: login_response_dto_1.UserProfileMapper.toDto(registerResult.user),
                tokens: registerResult.tokens,
                session: registerResult.session,
                verification: registerResult.verification || {
                    emailSent: false,
                    verificationRequired: false,
                    tokenId: '',
                },
                onboarding: registerResult.onboarding,
            } : undefined,
            message: registerResult.message || (registerResult.success
                ? 'Inscription réussie. Vérifiez votre email pour activer votre compte.'
                : 'Erreur lors de l\'inscription.'),
            meta: {
                autoLoginEnabled: !!(registerResult.tokens && registerResult.session),
                sessionCreated: !!registerResult.session,
            },
        };
    }
}
exports.RegisterResponseMapper = RegisterResponseMapper;
//# sourceMappingURL=register-response.dto.js.map