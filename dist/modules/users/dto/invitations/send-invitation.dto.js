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
exports.SendInvitationResponseDto = exports.SendInvitationDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const constants_1 = require("../../constants");
class SendInvitationDto {
    type;
    contextId;
    invitedEmail;
    invitedUserId;
    invitedName;
    proposedRole;
    message;
    expiresInHours;
    sendEmail = true;
    sendSms = false;
    sendReminders = true;
    priority = 'NORMAL';
}
exports.SendInvitationDto = SendInvitationDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Type d\'invitation',
        example: 'GROUP',
        enum: Object.values(constants_1.INVITATION_CONSTANTS.TYPES),
    }),
    (0, class_validator_1.IsString)({ message: 'Le type doit être une chaîne de caractères' }),
    (0, class_validator_1.IsIn)(Object.values(constants_1.INVITATION_CONSTANTS.TYPES), {
        message: `Le type doit être l'un de: ${Object.values(constants_1.INVITATION_CONSTANTS.TYPES).join(', ')}`,
    }),
    __metadata("design:type", String)
], SendInvitationDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID du contexte (groupe, événement, etc.)',
        example: 'group-123-456',
    }),
    (0, class_validator_1.IsString)({ message: 'L\'ID du contexte doit être une chaîne de caractères' }),
    (0, class_validator_1.MinLength)(1, { message: 'L\'ID du contexte ne peut pas être vide' }),
    __metadata("design:type", String)
], SendInvitationDto.prototype, "contextId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Email de la personne à inviter',
        example: 'ami@example.com',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'Format d\'email invalide' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.toLowerCase()?.trim()),
    __metadata("design:type", String)
], SendInvitationDto.prototype, "invitedEmail", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID de l\'utilisateur existant à inviter',
        example: 'user-789-012',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'L\'ID utilisateur doit être une chaîne de caractères' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], SendInvitationDto.prototype, "invitedUserId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nom de la personne (si invitation par email)',
        example: 'Sarah Ben Ali',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le nom doit être une chaîne de caractères' }),
    (0, class_validator_1.MaxLength)(200, { message: 'Le nom ne peut pas dépasser 200 caractères' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], SendInvitationDto.prototype, "invitedName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Rôle proposé (pour invitations de groupe)',
        example: 'MEMBER',
        enum: Object.values(constants_1.GROUP_CONSTANTS.ROLES),
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le rôle doit être une chaîne de caractères' }),
    (0, class_validator_1.IsIn)(Object.values(constants_1.GROUP_CONSTANTS.ROLES), {
        message: `Le rôle doit être l'un de: ${Object.values(constants_1.GROUP_CONSTANTS.ROLES).join(', ')}`,
    }),
    __metadata("design:type", String)
], SendInvitationDto.prototype, "proposedRole", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Message personnalisé d\'invitation',
        example: 'Salut ! Tu veux rejoindre notre groupe pour les matchs du CA ?',
        maxLength: constants_1.INVITATION_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le message doit être une chaîne de caractères' }),
    (0, class_validator_1.MaxLength)(constants_1.INVITATION_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH, {
        message: `Le message ne peut pas dépasser ${constants_1.INVITATION_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH} caractères`,
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], SendInvitationDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Durée de validité en heures',
        example: 168,
        minimum: 1,
        maximum: 720,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'La durée doit être un nombre entier' }),
    (0, class_validator_1.Min)(1, { message: 'L\'invitation doit être valide au moins 1 heure' }),
    (0, class_validator_1.Max)(720, { message: 'L\'invitation ne peut pas être valide plus de 30 jours' }),
    __metadata("design:type", Number)
], SendInvitationDto.prototype, "expiresInHours", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Envoyer l\'invitation par email',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'sendEmail doit être un booléen' }),
    __metadata("design:type", Boolean)
], SendInvitationDto.prototype, "sendEmail", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Envoyer l\'invitation par SMS',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'sendSms doit être un booléen' }),
    __metadata("design:type", Boolean)
], SendInvitationDto.prototype, "sendSms", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Envoyer des rappels automatiques',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'sendReminders doit être un booléen' }),
    __metadata("design:type", Boolean)
], SendInvitationDto.prototype, "sendReminders", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Priorité de l\'invitation',
        example: 'NORMAL',
        enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La priorité doit être une chaîne de caractères' }),
    (0, class_validator_1.IsIn)(['LOW', 'NORMAL', 'HIGH', 'URGENT'], {
        message: 'La priorité doit être LOW, NORMAL, HIGH ou URGENT',
    }),
    __metadata("design:type", String)
], SendInvitationDto.prototype, "priority", void 0);
class SendInvitationResponseDto {
    success;
    invitation;
    emailSent;
    smsSent;
    invitationUrl;
    errors;
    warnings;
}
exports.SendInvitationResponseDto = SendInvitationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Succès de l\'envoi',
        example: true,
    }),
    __metadata("design:type", Boolean)
], SendInvitationResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Invitation créée',
        example: {
            id: 'inv-123-456',
            token: 'inv_token_abc123',
            type: 'GROUP',
            status: 'PENDING',
            expiresAt: '2025-07-24T10:30:00Z'
        },
    }),
    __metadata("design:type", Object)
], SendInvitationResponseDto.prototype, "invitation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Email envoyé avec succès',
        example: true,
    }),
    __metadata("design:type", Boolean)
], SendInvitationResponseDto.prototype, "emailSent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'SMS envoyé avec succès',
        example: false,
    }),
    __metadata("design:type", Boolean)
], SendInvitationResponseDto.prototype, "smsSent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Lien public de l\'invitation',
        example: 'https://entrix.tn/invitations/inv_token_abc123',
    }),
    __metadata("design:type", String)
], SendInvitationResponseDto.prototype, "invitationUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Messages d\'erreur éventuels',
        example: [],
    }),
    __metadata("design:type", Array)
], SendInvitationResponseDto.prototype, "errors", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Avertissements',
        example: ['L\'utilisateur est déjà membre d\'un autre groupe similaire'],
    }),
    __metadata("design:type", Array)
], SendInvitationResponseDto.prototype, "warnings", void 0);
//# sourceMappingURL=send-invitation.dto.js.map