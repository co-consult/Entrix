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
exports.LoginResponseDto = exports.MfaChallengeDto = exports.SessionInfoDto = exports.TokenPairDto = exports.UserProfileDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class UserProfileDto {
    id;
    email;
    first_name;
    last_name;
    phone;
    avatar;
    is_active;
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
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserProfileDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserProfileDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserProfileDto.prototype, "first_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserProfileDto.prototype, "last_name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], UserProfileDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], UserProfileDto.prototype, "avatar", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], UserProfileDto.prototype, "is_active", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Boolean)
], UserProfileDto.prototype, "emailVerified", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Boolean)
], UserProfileDto.prototype, "phoneVerified", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], UserProfileDto.prototype, "lastLoginAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], UserProfileDto.prototype, "roles", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], UserProfileDto.prototype, "permissions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], UserProfileDto.prototype, "subscription", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], UserProfileDto.prototype, "preferences", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
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
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TokenPairDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TokenPairDto.prototype, "refreshToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['Bearer'] }),
    __metadata("design:type", String)
], TokenPairDto.prototype, "tokenType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TokenPairDto.prototype, "expiresIn", void 0);
class SessionInfoDto {
    sessionId;
    expiresAt;
    deviceInfo;
    isActive;
    lastActivity;
}
exports.SessionInfoDto = SessionInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SessionInfoDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SessionInfoDto.prototype, "expiresAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], SessionInfoDto.prototype, "deviceInfo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], SessionInfoDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SessionInfoDto.prototype, "lastActivity", void 0);
class MfaChallengeDto {
    methods;
    challengeToken;
    expiresIn;
}
exports.MfaChallengeDto = MfaChallengeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP'] }),
    __metadata("design:type", Array)
], MfaChallengeDto.prototype, "methods", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MfaChallengeDto.prototype, "challengeToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MfaChallengeDto.prototype, "expiresIn", void 0);
class LoginResponseDto {
    success;
    data;
    meta;
}
exports.LoginResponseDto = LoginResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], LoginResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], LoginResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], LoginResponseDto.prototype, "meta", void 0);
//# sourceMappingURL=login-response.dto.js.map