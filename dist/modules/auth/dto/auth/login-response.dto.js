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
exports.UserProfileMapper = exports.LoginResponseDto = exports.MfaChallengeDto = exports.SessionInfoDto = exports.TokenPairDto = exports.UserProfileDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class UserProfileDto {
    id;
    email;
    firstName;
    lastName;
    phone;
    avatar;
    isActive;
    emailVerified;
    phoneVerified;
    lastLoginAt;
    roles;
    permissions;
    subscription;
    preferences;
    metadata;
}
exports.UserProfileDto = UserProfileDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Identifiant unique utilisateur' }),
    __metadata("design:type", String)
], UserProfileDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Adresse email utilisateur' }),
    __metadata("design:type", String)
], UserProfileDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Prénom utilisateur' }),
    __metadata("design:type", String)
], UserProfileDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nom utilisateur' }),
    __metadata("design:type", String)
], UserProfileDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Numéro de téléphone' }),
    __metadata("design:type", String)
], UserProfileDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'URL avatar utilisateur' }),
    __metadata("design:type", String)
], UserProfileDto.prototype, "avatar", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Compte actif' }),
    __metadata("design:type", Boolean)
], UserProfileDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Email vérifié' }),
    __metadata("design:type", Boolean)
], UserProfileDto.prototype, "emailVerified", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Téléphone vérifié' }),
    __metadata("design:type", Boolean)
], UserProfileDto.prototype, "phoneVerified", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Dernière connexion (ISO 8601)' }),
    __metadata("design:type", String)
], UserProfileDto.prototype, "lastLoginAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Rôles utilisateur' }),
    __metadata("design:type", Array)
], UserProfileDto.prototype, "roles", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Permissions utilisateur' }),
    __metadata("design:type", Array)
], UserProfileDto.prototype, "permissions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Informations abonnement' }),
    __metadata("design:type", Object)
], UserProfileDto.prototype, "subscription", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Préférences utilisateur' }),
    __metadata("design:type", Object)
], UserProfileDto.prototype, "preferences", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Métadonnées utilisateur' }),
    __metadata("design:type", Object)
], UserProfileDto.prototype, "metadata", void 0);
class TokenPairDto {
    accessToken;
    refreshToken;
    tokenType;
    expiresIn;
}
exports.TokenPairDto = TokenPairDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Token d\'accès JWT' }),
    __metadata("design:type", String)
], TokenPairDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Token de rafraîchissement' }),
    __metadata("design:type", String)
], TokenPairDto.prototype, "refreshToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['Bearer'], description: 'Type de token' }),
    __metadata("design:type", String)
], TokenPairDto.prototype, "tokenType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Durée de validité en secondes' }),
    __metadata("design:type", Number)
], TokenPairDto.prototype, "expiresIn", void 0);
class SessionInfoDto {
    sessionId;
    expiresAt;
    deviceInfo;
    isActive;
    lastActivity;
    isReused;
    sessionType;
}
exports.SessionInfoDto = SessionInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Identifiant de session' }),
    __metadata("design:type", String)
], SessionInfoDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date d\'expiration (ISO 8601)' }),
    __metadata("design:type", String)
], SessionInfoDto.prototype, "expiresAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Informations device' }),
    __metadata("design:type", Object)
], SessionInfoDto.prototype, "deviceInfo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Session active' }),
    __metadata("design:type", Boolean)
], SessionInfoDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Dernière activité (ISO 8601)' }),
    __metadata("design:type", String)
], SessionInfoDto.prototype, "lastActivity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Session réutilisée' }),
    __metadata("design:type", Boolean)
], SessionInfoDto.prototype, "isReused", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['reused', 'refreshed', 'new'],
        description: 'Type de session'
    }),
    __metadata("design:type", String)
], SessionInfoDto.prototype, "sessionType", void 0);
class MfaChallengeDto {
    methods;
    challengeToken;
    expiresIn;
}
exports.MfaChallengeDto = MfaChallengeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP'],
        description: 'Méthodes MFA disponibles',
        isArray: true
    }),
    __metadata("design:type", Array)
], MfaChallengeDto.prototype, "methods", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Token de challenge MFA' }),
    __metadata("design:type", String)
], MfaChallengeDto.prototype, "challengeToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Durée de validité en secondes' }),
    __metadata("design:type", Number)
], MfaChallengeDto.prototype, "expiresIn", void 0);
class LoginResponseDto {
    success;
    data;
    meta;
    message;
}
exports.LoginResponseDto = LoginResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Statut de la requête' }),
    __metadata("design:type", Boolean)
], LoginResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Données de connexion' }),
    __metadata("design:type", Object)
], LoginResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Métadonnées de sécurité' }),
    __metadata("design:type", Object)
], LoginResponseDto.prototype, "meta", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Message informatif' }),
    __metadata("design:type", String)
], LoginResponseDto.prototype, "message", void 0);
class UserProfileMapper {
    static toDto(userProfile) {
        return {
            id: userProfile.id,
            email: userProfile.email,
            firstName: userProfile.firstName,
            lastName: userProfile.lastName,
            phone: userProfile.phone,
            avatar: userProfile.avatar,
            isActive: userProfile.isActive,
            emailVerified: !!userProfile.emailVerified,
            phoneVerified: !!userProfile.phoneVerified,
            lastLoginAt: userProfile.lastLogin?.toISOString(),
            roles: userProfile.roles,
            permissions: userProfile.permissions,
            subscription: userProfile.subscription,
            preferences: userProfile.preferences,
            metadata: userProfile.metadata,
        };
    }
}
exports.UserProfileMapper = UserProfileMapper;
//# sourceMappingURL=login-response.dto.js.map