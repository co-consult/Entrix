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
exports.AuthResponseDto = exports.SessionInfoDto = exports.TokenPairDto = exports.UserInfoDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class UserInfoDto {
    id;
    email;
    firstName;
    lastName;
    avatar;
    isActive;
    emailVerified;
    phoneVerified;
    roles;
    permissions;
    lastLogin;
}
exports.UserInfoDto = UserInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID utilisateur' }),
    __metadata("design:type", String)
], UserInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Email' }),
    __metadata("design:type", String)
], UserInfoDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Prénom' }),
    __metadata("design:type", String)
], UserInfoDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nom' }),
    __metadata("design:type", String)
], UserInfoDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Avatar URL' }),
    __metadata("design:type", String)
], UserInfoDto.prototype, "avatar", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Compte actif' }),
    __metadata("design:type", Boolean)
], UserInfoDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Email vérifié' }),
    __metadata("design:type", Date)
], UserInfoDto.prototype, "emailVerified", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Téléphone vérifié' }),
    __metadata("design:type", Date)
], UserInfoDto.prototype, "phoneVerified", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Rôles utilisateur', type: [Object] }),
    __metadata("design:type", Array)
], UserInfoDto.prototype, "roles", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Permissions', type: [String] }),
    __metadata("design:type", Array)
], UserInfoDto.prototype, "permissions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Dernière connexion' }),
    __metadata("design:type", Date)
], UserInfoDto.prototype, "lastLogin", void 0);
class TokenPairDto {
    accessToken;
    refreshToken;
    tokenType;
    expiresIn;
    refreshExpiresIn;
}
exports.TokenPairDto = TokenPairDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Access token JWT' }),
    __metadata("design:type", String)
], TokenPairDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Refresh token JWT' }),
    __metadata("design:type", String)
], TokenPairDto.prototype, "refreshToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Type de token', example: 'Bearer' }),
    __metadata("design:type", String)
], TokenPairDto.prototype, "tokenType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Durée de vie access token (secondes)' }),
    __metadata("design:type", Number)
], TokenPairDto.prototype, "expiresIn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Durée de vie refresh token (secondes)' }),
    __metadata("design:type", Number)
], TokenPairDto.prototype, "refreshExpiresIn", void 0);
class SessionInfoDto {
    id;
    ipAddress;
    userAgent;
    deviceFingerprint;
    geolocation;
    createdAt;
    lastActivity;
    expiresAt;
}
exports.SessionInfoDto = SessionInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID session' }),
    __metadata("design:type", String)
], SessionInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Adresse IP' }),
    __metadata("design:type", String)
], SessionInfoDto.prototype, "ipAddress", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'User agent' }),
    __metadata("design:type", String)
], SessionInfoDto.prototype, "userAgent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Empreinte device' }),
    __metadata("design:type", String)
], SessionInfoDto.prototype, "deviceFingerprint", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Géolocalisation' }),
    __metadata("design:type", Object)
], SessionInfoDto.prototype, "geolocation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date création' }),
    __metadata("design:type", Date)
], SessionInfoDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Dernière activité' }),
    __metadata("design:type", Date)
], SessionInfoDto.prototype, "lastActivity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Expiration' }),
    __metadata("design:type", Date)
], SessionInfoDto.prototype, "expiresAt", void 0);
class AuthResponseDto {
    user;
    tokens;
    session;
    mfaRequired;
    mfaMethods;
}
exports.AuthResponseDto = AuthResponseDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Informations utilisateur', type: UserInfoDto }),
    (0, class_transformer_1.Type)(() => UserInfoDto),
    __metadata("design:type", UserInfoDto)
], AuthResponseDto.prototype, "user", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Paire de tokens', type: TokenPairDto }),
    (0, class_transformer_1.Type)(() => TokenPairDto),
    __metadata("design:type", TokenPairDto)
], AuthResponseDto.prototype, "tokens", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Informations session', type: SessionInfoDto }),
    (0, class_transformer_1.Type)(() => SessionInfoDto),
    __metadata("design:type", SessionInfoDto)
], AuthResponseDto.prototype, "session", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'MFA requis', default: false }),
    __metadata("design:type", Boolean)
], AuthResponseDto.prototype, "mfaRequired", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Méthodes MFA disponibles',
        enum: client_1.mfa_method,
        isArray: true
    }),
    __metadata("design:type", Array)
], AuthResponseDto.prototype, "mfaMethods", void 0);
//# sourceMappingURL=auth-response.dto.js.map