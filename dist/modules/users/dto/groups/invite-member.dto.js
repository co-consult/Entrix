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
exports.InviteMemberDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const constants_1 = require("../../constants");
class SingleInviteDto {
    email;
    userId;
    name;
    role;
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Email de la personne à inviter',
        example: 'nouvel.ami@gmail.com',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'Format d\'email invalide' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.toLowerCase()?.trim()),
    __metadata("design:type", String)
], SingleInviteDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID de l\'utilisateur existant à inviter',
        example: 'user-123-456',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'L\'ID utilisateur doit être une chaîne de caractères' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], SingleInviteDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nom de la personne (si invitation par email)',
        example: 'Ahmed Ben Ali',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le nom doit être une chaîne de caractères' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], SingleInviteDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Rôle proposé dans le groupe',
        example: 'MEMBER',
        enum: Object.values(constants_1.GROUP_CONSTANTS.ROLES),
    }),
    (0, class_validator_1.IsString)({ message: 'Le rôle doit être une chaîne de caractères' }),
    (0, class_validator_1.IsIn)(Object.values(constants_1.GROUP_CONSTANTS.ROLES), {
        message: `Le rôle doit être l'un de: ${Object.values(constants_1.GROUP_CONSTANTS.ROLES).join(', ')}`,
    }),
    __metadata("design:type", String)
], SingleInviteDto.prototype, "role", void 0);
class InviteMemberDto {
    email;
    userId;
    name;
    role;
    invitations;
    message;
    expiresInHours = constants_1.INVITATION_CONSTANTS.EXPIRATION.GROUP;
    sendEmail = true;
    sendSms = false;
}
exports.InviteMemberDto = InviteMemberDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Email de la personne à inviter (invitation unique)',
        example: 'ami@example.com',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'Format d\'email invalide' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.toLowerCase()?.trim()),
    __metadata("design:type", String)
], InviteMemberDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID de l\'utilisateur existant à inviter (invitation unique)',
        example: 'user-123-456',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'L\'ID utilisateur doit être une chaîne de caractères' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], InviteMemberDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nom de la personne (si invitation par email)',
        example: 'Ahmed Ben Ali',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le nom doit être une chaîne de caractères' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], InviteMemberDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Rôle proposé dans le groupe (pour invitation unique)',
        example: 'MEMBER',
        enum: Object.values(constants_1.GROUP_CONSTANTS.ROLES),
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le rôle doit être une chaîne de caractères' }),
    (0, class_validator_1.IsIn)(Object.values(constants_1.GROUP_CONSTANTS.ROLES), {
        message: `Le rôle doit être l'un de: ${Object.values(constants_1.GROUP_CONSTANTS.ROLES).join(', ')}`,
    }),
    __metadata("design:type", String)
], InviteMemberDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Liste d\'invitations multiples',
        type: [SingleInviteDto],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Les invitations doivent être un tableau' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SingleInviteDto),
    __metadata("design:type", Array)
], InviteMemberDto.prototype, "invitations", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Message personnalisé d\'invitation',
        example: 'Rejoins notre groupe pour acheter nos billets ensemble !',
        maxLength: constants_1.INVITATION_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le message doit être une chaîne de caractères' }),
    (0, class_validator_1.MaxLength)(constants_1.INVITATION_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH, {
        message: `Le message ne peut pas dépasser ${constants_1.INVITATION_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH} caractères`,
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], InviteMemberDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Durée de validité de l\'invitation en heures',
        example: 168,
        minimum: 1,
        maximum: 720,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'La durée doit être un nombre entier' }),
    (0, class_validator_1.Min)(1, { message: 'L\'invitation doit être valide au moins 1 heure' }),
    (0, class_validator_1.Max)(720, { message: 'L\'invitation ne peut pas être valide plus de 30 jours' }),
    __metadata("design:type", Number)
], InviteMemberDto.prototype, "expiresInHours", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Envoyer l\'invitation par email',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], InviteMemberDto.prototype, "sendEmail", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Envoyer l\'invitation par SMS (si numéro disponible)',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], InviteMemberDto.prototype, "sendSms", void 0);
//# sourceMappingURL=invite-member.dto.js.map