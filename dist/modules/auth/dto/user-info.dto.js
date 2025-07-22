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
exports.UserInfoDto = exports.UserRoleDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class UserRoleDto {
    id;
    code;
    name;
    level;
    assignedAt;
    validUntil;
    status;
}
exports.UserRoleDto = UserRoleDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID du rôle',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    __metadata("design:type", String)
], UserRoleDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Code du rôle',
        example: 'USER'
    }),
    __metadata("design:type", String)
], UserRoleDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nom du rôle',
        example: 'Utilisateur'
    }),
    __metadata("design:type", String)
], UserRoleDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Niveau hiérarchique du rôle',
        example: 10,
        minimum: 0,
        maximum: 100
    }),
    __metadata("design:type", Number)
], UserRoleDto.prototype, "level", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Date d\'assignation du rôle',
        example: '2025-01-07T10:30:00.000Z'
    }),
    __metadata("design:type", Date)
], UserRoleDto.prototype, "assignedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date d\'expiration du rôle',
        example: '2026-01-07T10:30:00.000Z'
    }),
    __metadata("design:type", Date)
], UserRoleDto.prototype, "validUntil", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Statut du rôle',
        example: 'ACTIVE',
        enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED', 'TERMINATED']
    }),
    __metadata("design:type", String)
], UserRoleDto.prototype, "status", void 0);
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
    createdAt;
    updatedAt;
    verificationStatus;
    mfaEnabled;
    activeSessions;
    preferences;
}
exports.UserInfoDto = UserInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Identifiant unique de l\'utilisateur',
        example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        format: 'uuid',
    }),
    __metadata("design:type", String)
], UserInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Adresse email de l\'utilisateur',
        example: 'user@example.com',
        format: 'email',
    }),
    __metadata("design:type", String)
], UserInfoDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Prénom de l\'utilisateur',
        example: 'Mohamed',
    }),
    __metadata("design:type", String)
], UserInfoDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nom de famille de l\'utilisateur',
        example: 'Ben Ali',
    }),
    __metadata("design:type", String)
], UserInfoDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'URL de la photo de profil',
        example: 'https://cdn.entrix.tn/avatars/user123.jpg',
        format: 'uri',
    }),
    __metadata("design:type", String)
], UserInfoDto.prototype, "avatar", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Indique si le compte utilisateur est actif',
        example: true,
    }),
    __metadata("design:type", Boolean)
], UserInfoDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date de vérification de l\'email',
        example: '2025-01-07T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], UserInfoDto.prototype, "emailVerified", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date de vérification du téléphone',
        example: '2025-01-07T11:15:00.000Z',
    }),
    __metadata("design:type", Date)
], UserInfoDto.prototype, "phoneVerified", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Liste des rôles assignés à l\'utilisateur',
        type: [UserRoleDto],
    }),
    (0, class_transformer_1.Type)(() => UserRoleDto),
    __metadata("design:type", Array)
], UserInfoDto.prototype, "roles", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Liste des permissions de l\'utilisateur (agrégées depuis les rôles)',
        example: ['users.read.self', 'users.update.self', 'events.read'],
        type: [String],
    }),
    __metadata("design:type", Array)
], UserInfoDto.prototype, "permissions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date et heure de la dernière connexion réussie',
        example: '2025-01-07T09:45:00.000Z',
    }),
    __metadata("design:type", Date)
], UserInfoDto.prototype, "lastLogin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Date de création du compte',
        example: '2024-12-01T14:20:00.000Z',
    }),
    __metadata("design:type", Date)
], UserInfoDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Date de dernière mise à jour du profil',
        example: '2025-01-07T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], UserInfoDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Statut de vérification global du compte',
        example: 'PARTIALLY_VERIFIED',
        enum: ['UNVERIFIED', 'PARTIALLY_VERIFIED', 'FULLY_VERIFIED'],
    }),
    __metadata("design:type", String)
], UserInfoDto.prototype, "verificationStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Indique si l\'authentification multi-facteurs est activée',
        example: true,
    }),
    __metadata("design:type", Boolean)
], UserInfoDto.prototype, "mfaEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nombre de sessions actives de l\'utilisateur',
        example: 2,
        minimum: 0,
    }),
    __metadata("design:type", Number)
], UserInfoDto.prototype, "activeSessions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Préférences de base de l\'utilisateur',
        example: {
            language: 'fr',
            timezone: 'Africa/Tunis',
            notifications: true,
            newsletter: false
        },
    }),
    __metadata("design:type", Object)
], UserInfoDto.prototype, "preferences", void 0);
//# sourceMappingURL=user-info.dto.js.map