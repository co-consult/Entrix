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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const send_invitation_dto_1 = require("../dto/invitations/send-invitation.dto");
const bulk_invitation_dto_1 = require("../dto/invitations/bulk-invitation.dto");
const respond_invitation_dto_1 = require("../dto/invitations/respond-invitation.dto");
const invitations_service_1 = require("../services/invitations.service");
const common_2 = require("@nestjs/common");
let InvitationsController = class InvitationsController {
    invitationsService;
    constructor(invitationsService) {
        this.invitationsService = invitationsService;
    }
    async sendInvitation(dto, invitedBy, req) {
        try {
            const result = await this.invitationsService.send(dto, invitedBy);
            return {
                success: true,
                data: result,
                message: `Invitation ${dto.type.toLowerCase()} envoyée avec succès`,
            };
        }
        catch (error) {
            if (error.message.includes('already member')) {
                throw new common_2.ConflictException('L\'utilisateur est déjà membre');
            }
            if (error.message.includes('already invited')) {
                throw new common_2.ConflictException('Une invitation est déjà en attente pour cette personne');
            }
            if (error.message.includes('permission')) {
                throw new common_2.ForbiddenException('Permissions insuffisantes pour envoyer cette invitation');
            }
            if (error.message.includes('limit')) {
                throw new common_2.BadRequestException('Limite d\'invitations atteinte');
            }
            throw error;
        }
    }
    async sendBulkInvitations(dto, invitedBy, req) {
        try {
            const result = await this.invitationsService.sendBulk(dto, invitedBy);
            const successMessage = result.failed.length === 0
                ? `${result.successful.length} invitations envoyées avec succès`
                : `${result.successful.length} invitations envoyées, ${result.failed.length} échecs`;
            return {
                success: true,
                data: result,
                message: successMessage,
            };
        }
        catch (error) {
            if (error.message.includes('limit')) {
                throw new common_2.BadRequestException('Limite d\'invitations en masse atteinte');
            }
            throw error;
        }
    }
    async getInvitationByToken(token) {
        const invitation = await this.invitationsService.findByToken(token);
        if (!invitation) {
            throw new common_2.NotFoundException('Invitation introuvable ou expirée');
        }
        return {
            success: true,
            data: invitation,
        };
    }
    async acceptInvitation(token, userId, req) {
        try {
            const result = await this.invitationsService.accept(token, userId, req.ip, req.get('User-Agent'));
            return {
                success: true,
                data: result,
                message: 'Invitation acceptée avec succès',
            };
        }
        catch (error) {
            if (error.message.includes('expired')) {
                throw new common_2.BadRequestException('Cette invitation a expiré');
            }
            if (error.message.includes('already responded')) {
                throw new common_2.BadRequestException('Vous avez déjà répondu à cette invitation');
            }
            if (error.message.includes('not found')) {
                throw new common_2.NotFoundException('Invitation introuvable');
            }
            throw error;
        }
    }
    async declineInvitation(id, dto, userId, req) {
        try {
            await this.invitationsService.decline(id, userId, dto.reason);
            return {
                success: true,
                data: null,
                message: 'Invitation refusée',
            };
        }
        catch (error) {
            if (error.message.includes('expired')) {
                throw new common_2.BadRequestException('Cette invitation a expiré');
            }
            if (error.message.includes('already responded')) {
                throw new common_2.BadRequestException('Vous avez déjà répondu à cette invitation');
            }
            if (error.message.includes('not found')) {
                throw new common_2.NotFoundException('Invitation introuvable');
            }
            throw error;
        }
    }
};
exports.InvitationsController = InvitationsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Envoyer une invitation',
        description: 'Envoyer une invitation à rejoindre un groupe, événement ou pour une amitié',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Invitation envoyée avec succès',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Données d\'invitation invalides',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Permissions insuffisantes pour inviter',
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Invitation déjà existante ou utilisateur déjà membre',
    }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('invitedBy')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_invitation_dto_1.SendInvitationDto, String, Object]),
    __metadata("design:returntype", Promise)
], InvitationsController.prototype, "sendInvitation", null);
__decorate([
    (0, common_1.Post)('bulk'),
    (0, swagger_1.ApiOperation)({
        summary: 'Envoyer des invitations en masse',
        description: 'Envoyer plusieurs invitations simultanément',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Invitations en masse traitées',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Données d\'invitations invalides',
    }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('invitedBy')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bulk_invitation_dto_1.BulkInvitationDto, String, Object]),
    __metadata("design:returntype", Promise)
], InvitationsController.prototype, "sendBulkInvitations", null);
__decorate([
    (0, common_1.Get)('token/:token'),
    (0, swagger_1.ApiOperation)({
        summary: 'Récupérer invitation par token',
        description: 'Récupérer les détails d\'une invitation via son token public',
    }),
    (0, swagger_1.ApiParam)({
        name: 'token',
        description: 'Token d\'invitation',
        example: 'abc123def456'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Invitation trouvée'
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Invitation introuvable ou expirée'
    }),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvitationsController.prototype, "getInvitationByToken", null);
__decorate([
    (0, common_1.Post)('accept/:token'),
    (0, swagger_1.ApiOperation)({
        summary: 'Accepter une invitation par token',
        description: 'Accepter une invitation directement via son token',
    }),
    (0, swagger_1.ApiParam)({
        name: 'token',
        description: 'Token d\'invitation'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Invitation acceptée avec succès'
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invitation ne peut pas être acceptée'
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Invitation introuvable'
    }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Query)('userId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], InvitationsController.prototype, "acceptInvitation", null);
__decorate([
    (0, common_1.Post)('decline/:id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Refuser une invitation',
        description: 'Refuser une invitation reçue',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'ID de l\'invitation'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Invitation refusée'
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invitation ne peut pas être refusée'
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Invitation introuvable'
    }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Query)('userId')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, respond_invitation_dto_1.RespondInvitationDto, String, Object]),
    __metadata("design:returntype", Promise)
], InvitationsController.prototype, "declineInvitation", null);
exports.InvitationsController = InvitationsController = __decorate([
    (0, swagger_1.ApiTags)('Invitations'),
    (0, common_1.Controller)('invitations'),
    __metadata("design:paramtypes", [invitations_service_1.InvitationsService])
], InvitationsController);
//# sourceMappingURL=invitations.controller.js.map