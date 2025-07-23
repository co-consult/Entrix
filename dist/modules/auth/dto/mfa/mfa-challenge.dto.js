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
exports.MfaChallengeResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class MfaChallengeResponseDto {
    methods;
    challengeToken;
    expiresIn;
    instructions;
    methodsInfo;
}
exports.MfaChallengeResponseDto = MfaChallengeResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Méthodes MFA disponibles',
        enum: ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP'],
        isArray: true,
        example: ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP'],
    }),
    __metadata("design:type", Array)
], MfaChallengeResponseDto.prototype, "methods", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Token temporaire pour MFA',
        example: 'mfa_challenge_1642694400_abc123def',
    }),
    __metadata("design:type", String)
], MfaChallengeResponseDto.prototype, "challengeToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Durée de validité en secondes',
        example: 300,
        minimum: 60,
        maximum: 600,
    }),
    __metadata("design:type", Number)
], MfaChallengeResponseDto.prototype, "expiresIn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Instructions pour l\'utilisateur',
        example: 'Veuillez choisir une méthode de vérification et saisir le code reçu',
    }),
    __metadata("design:type", String)
], MfaChallengeResponseDto.prototype, "instructions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Informations additionnelles par méthode',
        example: {
            SMS_OTP: { masked_phone: '+216***45678', estimated_delivery: '30 seconds' },
            EMAIL_OTP: { masked_email: 'u***@entrix.tn', estimated_delivery: '1 minute' },
            TOTP_APP: { app_name: 'Google Authenticator', setup_required: false }
        },
    }),
    __metadata("design:type", Object)
], MfaChallengeResponseDto.prototype, "methodsInfo", void 0);
//# sourceMappingURL=mfa-challenge.dto.js.map