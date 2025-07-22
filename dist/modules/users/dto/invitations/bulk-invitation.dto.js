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
exports.BulkInvitationResponseDto = exports.BulkInvitationDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const constants_1 = require("../../constants");
class BulkInviteeDto {
    email;
    userId;
    name;
    role;
    personalMessage;
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Email de la personne à inviter',
        example: 'ami1@example.com',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'Format d\'email invalide' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.toLowerCase()?.trim()),
    __metadata("design:type", String)
], BulkInviteeDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID de l\'utilisateur existant à inviter',
        example: 'user-123-456',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'L\'ID utilisateur doit être une chaîne de caractères' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], BulkInviteeDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nom de la personne (si invitation par email)',
        example: 'Ahmed Ben Ali',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le nom doit être une chaîne de caractères' }),
    (0, class_validator_1.MaxLength)(200, { message: 'Le nom ne peut pas dépasser 200 caractères' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], BulkInviteeDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Rôle proposé pour cette personne',
        example: 'MEMBER',
        enum: Object.values(constants_1.GROUP_CONSTANTS.ROLES),
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le rôle doit être une chaîne de caractères' }),
    (0, class_validator_1.IsIn)(Object.values(constants_1.GROUP_CONSTANTS.ROLES), {
        message: `Le rôle doit être l'un de: ${Object.values(constants_1.GROUP_CONSTANTS.ROLES).join(', ')}`,
    }),
    __metadata("design:type", String)
], BulkInviteeDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Message personnalisé pour cette personne',
        example: 'Salut Ahmed ! Viens rejoindre notre groupe',
        maxLength: constants_1.INVITATION_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le message doit être une chaîne de caractères' }),
    (0, class_validator_1.MaxLength)(constants_1.INVITATION_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH, {
        message: `Le message ne peut pas dépasser ${constants_1.INVITATION_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH} caractères`,
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], BulkInviteeDto.prototype, "personalMessage", void 0);
class BulkInvitationDto {
    type;
    contextId;
    invitations;
    defaultRole = 'MEMBER';
    message;
    expiresInHours = constants_1.INVITATION_CONSTANTS.EXPIRATION.GROUP;
    sendEmail = true;
    sendSms = false;
    continueOnError = true;
    batchSend = true;
    sendDelay = 2;
}
exports.BulkInvitationDto = BulkInvitationDto;
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
], BulkInvitationDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID du contexte (groupe, événement, etc.)',
        example: 'group-123-456',
    }),
    (0, class_validator_1.IsString)({ message: 'L\'ID du contexte doit être une chaîne de caractères' }),
    (0, class_validator_1.MinLength)(1, { message: 'L\'ID du contexte ne peut pas être vide' }),
    __metadata("design:type", String)
], BulkInvitationDto.prototype, "contextId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Liste des personnes à inviter',
        type: [BulkInviteeDto],
    }),
    (0, class_validator_1.IsArray)({ message: 'Les invitations doivent être un tableau' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BulkInviteeDto),
    (0, class_validator_1.ArrayMaxSize)(constants_1.INVITATION_CONSTANTS.LIMITS.MAX_BULK_INVITES, {
        message: `Vous ne pouvez pas inviter plus de ${constants_1.INVITATION_CONSTANTS.LIMITS.MAX_BULK_INVITES} personnes à la fois`,
    }),
    __metadata("design:type", Array)
], BulkInvitationDto.prototype, "invitations", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Rôle par défaut pour toutes les invitations',
        example: 'MEMBER',
        enum: Object.values(constants_1.GROUP_CONSTANTS.ROLES),
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le rôle par défaut doit être une chaîne de caractères' }),
    (0, class_validator_1.IsIn)(Object.values(constants_1.GROUP_CONSTANTS.ROLES), {
        message: `Le rôle doit être l'un de: ${Object.values(constants_1.GROUP_CONSTANTS.ROLES).join(', ')}`,
    }),
    __metadata("design:type", String)
], BulkInvitationDto.prototype, "defaultRole", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Message commun pour toutes les invitations',
        example: 'Vous êtes invités à rejoindre notre groupe !',
        maxLength: constants_1.INVITATION_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le message doit être une chaîne de caractères' }),
    (0, class_validator_1.MaxLength)(constants_1.INVITATION_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH, {
        message: `Le message ne peut pas dépasser ${constants_1.INVITATION_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH} caractères`,
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], BulkInvitationDto.prototype, "message", void 0);
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
], BulkInvitationDto.prototype, "expiresInHours", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Envoyer les invitations par email',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'sendEmail doit être un booléen' }),
    __metadata("design:type", Boolean)
], BulkInvitationDto.prototype, "sendEmail", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Envoyer les invitations par SMS (si numéros disponibles)',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'sendSms doit être un booléen' }),
    __metadata("design:type", Boolean)
], BulkInvitationDto.prototype, "sendSms", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Continuer même si certaines invitations échouent',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'continueOnError doit être un booléen' }),
    __metadata("design:type", Boolean)
], BulkInvitationDto.prototype, "continueOnError", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Grouper les envois par lots (éviter le spam)',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'batchSend doit être un booléen' }),
    __metadata("design:type", Boolean)
], BulkInvitationDto.prototype, "batchSend", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Délai entre les envois en secondes',
        example: 2,
        minimum: 1,
        maximum: 60,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'Le délai doit être un nombre entier' }),
    (0, class_validator_1.Min)(1, { message: 'Le délai doit être d\'au moins 1 seconde' }),
    (0, class_validator_1.Max)(60, { message: 'Le délai ne peut pas dépasser 60 secondes' }),
    __metadata("design:type", Number)
], BulkInvitationDto.prototype, "sendDelay", void 0);
class BulkInvitationResponseDto {
    total;
    successful;
    failed;
    successfulInvitations;
    failedInvitations;
    duplicates;
    processingTime;
    warnings;
    sendingStats;
}
exports.BulkInvitationResponseDto = BulkInvitationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nombre total d\'invitations tentées',
        example: 5,
    }),
    __metadata("design:type", Number)
], BulkInvitationResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nombre d\'invitations envoyées avec succès',
        example: 4,
    }),
    __metadata("design:type", Number)
], BulkInvitationResponseDto.prototype, "successful", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nombre d\'invitations échouées',
        example: 1,
    }),
    __metadata("design:type", Number)
], BulkInvitationResponseDto.prototype, "failed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Liste des invitations réussies',
        example: [
            {
                id: 'inv-123-456',
                email: 'ami1@example.com',
                status: 'PENDING',
                emailSent: true
            }
        ],
    }),
    __metadata("design:type", Array)
], BulkInvitationResponseDto.prototype, "successfulInvitations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Liste des invitations échouées avec raisons',
        example: [
            {
                email: 'invalid@email',
                error: 'Format d\'email invalide',
                code: 'INVALID_EMAIL'
            }
        ],
    }),
    __metadata("design:type", Array)
], BulkInvitationResponseDto.prototype, "failedInvitations", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Invitations en double détectées',
        example: [
            {
                email: 'duplicate@example.com',
                reason: 'Déjà invité récemment'
            }
        ],
    }),
    __metadata("design:type", Array)
], BulkInvitationResponseDto.prototype, "duplicates", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Temps total de traitement en millisecondes',
        example: 2500,
    }),
    __metadata("design:type", Number)
], BulkInvitationResponseDto.prototype, "processingTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Avertissements généraux',
        example: ['Limite quotidienne d\'invitations bientôt atteinte'],
    }),
    __metadata("design:type", Array)
], BulkInvitationResponseDto.prototype, "warnings", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Statistiques d\'envoi',
        example: {
            emailsSent: 4,
            smsSent: 0,
            batchesSent: 2,
            averageDelayMs: 2000
        },
    }),
    __metadata("design:type", Object)
], BulkInvitationResponseDto.prototype, "sendingStats", void 0);
//# sourceMappingURL=bulk-invitation.dto.js.map