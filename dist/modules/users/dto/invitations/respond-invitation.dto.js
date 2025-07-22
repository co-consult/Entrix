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
exports.RespondInvitationResponseDto = exports.ValidateInvitationResponseDto = exports.ValidateInvitationDto = exports.RespondInvitationDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class RespondInvitationDto {
    response;
    reason;
    message;
}
exports.RespondInvitationDto = RespondInvitationDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Réponse à l\'invitation',
        example: 'ACCEPTED',
        enum: ['ACCEPTED', 'DECLINED'],
    }),
    (0, class_validator_1.IsString)({ message: 'La réponse doit être une chaîne de caractères' }),
    (0, class_validator_1.IsIn)(['ACCEPTED', 'DECLINED'], {
        message: 'La réponse doit être ACCEPTED ou DECLINED',
    }),
    __metadata("design:type", String)
], RespondInvitationDto.prototype, "response", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Raison du refus (optionnel si DECLINED)',
        example: 'Déjà membre d\'un autre groupe',
        maxLength: 500,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La raison doit être une chaîne de caractères' }),
    (0, class_validator_1.MaxLength)(500, { message: 'La raison ne peut pas dépasser 500 caractères' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], RespondInvitationDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Message de remerciement (optionnel si ACCEPTED)',
        example: 'Merci pour l\'invitation ! Hâte de rejoindre le groupe',
        maxLength: 500,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le message doit être une chaîne de caractères' }),
    (0, class_validator_1.MaxLength)(500, { message: 'Le message ne peut pas dépasser 500 caractères' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], RespondInvitationDto.prototype, "message", void 0);
class ValidateInvitationDto {
    checkEligibility = true;
    includeContext = true;
}
exports.ValidateInvitationDto = ValidateInvitationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Vérifier si l\'utilisateur peut accepter',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ValidateInvitationDto.prototype, "checkEligibility", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Inclure les détails du contexte',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ValidateInvitationDto.prototype, "includeContext", void 0);
class ValidateInvitationResponseDto {
    isValid;
    isExpired;
    isAlreadyMember;
    canAccept;
    errors;
    warnings;
    invitation;
    context;
}
exports.ValidateInvitationResponseDto = ValidateInvitationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Invitation valide',
        example: true,
    }),
    __metadata("design:type", Boolean)
], ValidateInvitationResponseDto.prototype, "isValid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Invitation expirée',
        example: false,
    }),
    __metadata("design:type", Boolean)
], ValidateInvitationResponseDto.prototype, "isExpired", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Utilisateur déjà membre',
        example: false,
    }),
    __metadata("design:type", Boolean)
], ValidateInvitationResponseDto.prototype, "isAlreadyMember", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Peut accepter l\'invitation',
        example: true,
    }),
    __metadata("design:type", Boolean)
], ValidateInvitationResponseDto.prototype, "canAccept", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Erreurs empêchant l\'acceptation',
        example: [],
    }),
    __metadata("design:type", Array)
], ValidateInvitationResponseDto.prototype, "errors", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Avertissements',
        example: ['Le groupe sera bientôt complet'],
    }),
    __metadata("design:type", Array)
], ValidateInvitationResponseDto.prototype, "warnings", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Détails de l\'invitation',
        example: {
            id: 'inv-123-456',
            type: 'GROUP',
            contextName: 'Groupe CA Supporters',
            inviterName: 'Ahmed Ben Salem',
            proposedRole: 'MEMBER',
            message: 'Rejoins notre groupe !',
            expiresAt: '2025-07-24T10:30:00Z'
        },
    }),
    __metadata("design:type", Object)
], ValidateInvitationResponseDto.prototype, "invitation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Informations sur le contexte (groupe, événement)',
        example: {
            id: 'group-123-456',
            name: 'Groupe CA Supporters',
            type: 'FRIENDS',
            memberCount: 8,
            maxMembers: 20,
            isPrivate: true
        },
    }),
    __metadata("design:type", Object)
], ValidateInvitationResponseDto.prototype, "context", void 0);
class RespondInvitationResponseDto {
    success;
    response;
    invitation;
    result;
    additionalActions;
    nextSteps;
    errors;
}
exports.RespondInvitationResponseDto = RespondInvitationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Succès de la réponse',
        example: true,
    }),
    __metadata("design:type", Boolean)
], RespondInvitationResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Réponse donnée',
        example: 'ACCEPTED',
    }),
    __metadata("design:type", String)
], RespondInvitationResponseDto.prototype, "response", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Invitation mise à jour',
        example: {
            id: 'inv-123-456',
            status: 'ACCEPTED',
            respondedAt: '2025-07-17T10:30:00Z'
        },
    }),
    __metadata("design:type", Object)
], RespondInvitationResponseDto.prototype, "invitation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Résultat de l\'acceptation (membre créé, etc.)',
        example: {
            groupMember: {
                id: 'member-789-012',
                role: 'MEMBER',
                joinedAt: '2025-07-17T10:30:00Z'
            }
        },
    }),
    __metadata("design:type", Object)
], RespondInvitationResponseDto.prototype, "result", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Actions supplémentaires effectuées',
        example: ['notification_sent_to_group', 'welcome_email_sent'],
    }),
    __metadata("design:type", Array)
], RespondInvitationResponseDto.prototype, "additionalActions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Prochaines étapes suggérées',
        example: [
            'Complétez votre profil de groupe',
            'Découvrez les événements à venir',
            'Invitez d\'autres amis'
        ],
    }),
    __metadata("design:type", Array)
], RespondInvitationResponseDto.prototype, "nextSteps", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Messages d\'erreur éventuels',
        example: [],
    }),
    __metadata("design:type", Array)
], RespondInvitationResponseDto.prototype, "errors", void 0);
//# sourceMappingURL=respond-invitation.dto.js.map