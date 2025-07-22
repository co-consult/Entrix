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
exports.GroupsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const create_group_dto_1 = require("../dto/groups/create-group.dto");
const update_group_dto_1 = require("../dto/groups/update-group.dto");
const groups_service_1 = require("../services/groups.service");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
const common_2 = require("@nestjs/common");
let GroupsController = class GroupsController {
    groupsService;
    constructor(groupsService) {
        this.groupsService = groupsService;
    }
    async create(createGroupDto, user) {
        try {
            const result = await this.groupsService.create(createGroupDto, user.id);
            return {
                success: true,
                data: result,
                message: 'Groupe créé avec succès',
            };
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_2.ConflictException('Code de groupe déjà utilisé');
            }
            throw error;
        }
    }
    async getMyGroups(user, status, role, limit, offset) {
        const groups = await this.groupsService.findUserGroups(user.id, {
            status,
            role,
            limit: limit || 20,
            offset: offset || 0,
        });
        return {
            success: true,
            data: groups,
        };
    }
    async getPublicGroups(query, type, hasSpace, limit, offset) {
        const groups = await this.groupsService.findPublicGroups({
            query,
            type,
            hasSpace: hasSpace === true,
            limit: limit || 20,
            offset: offset || 0,
        });
        return {
            success: true,
            data: groups,
        };
    }
    async findById(id) {
        const group = await this.groupsService.findById(id);
        if (!group) {
            throw new common_2.NotFoundException('Groupe introuvable');
        }
        return {
            success: true,
            data: group,
        };
    }
    async findByCode(code) {
        const group = await this.groupsService.findByCode(code);
        if (!group) {
            throw new common_2.NotFoundException('Groupe introuvable');
        }
        return {
            success: true,
            data: group,
        };
    }
    async getGroupStats(id) {
        const stats = await this.groupsService.getGroupStats(id);
        return {
            success: true,
            data: stats,
        };
    }
    async update(id, updateGroupDto, user) {
        const updatedGroup = await this.groupsService.update(id, updateGroupDto, user.id);
        return {
            success: true,
            data: updatedGroup,
            message: 'Groupe mis à jour avec succès',
        };
    }
    async addMember(groupId, memberData, user) {
        const canInvite = await this.groupsService.hasPermission(groupId, user.id, 'canInvite');
        if (!canInvite) {
            throw new common_2.ForbiddenException('Vous n\'avez pas la permission d\'ajouter des membres');
        }
        const member = await this.groupsService.addMember(groupId, memberData.userId, memberData.role || 'MEMBER', user.id);
        return {
            success: true,
            data: member,
            message: 'Membre ajouté avec succès',
        };
    }
    async removeMember(groupId, userId, user) {
        const canManageMembers = await this.groupsService.hasPermission(groupId, user.id, 'canManageMembers');
        if (!canManageMembers) {
            throw new common_2.ForbiddenException('Vous n\'avez pas la permission de gérer les membres');
        }
        await this.groupsService.removeMember(groupId, userId, user.id);
        return {
            success: true,
            data: null,
            message: 'Membre retiré avec succès',
        };
    }
    async updateMemberRole(groupId, userId, roleData, user) {
        const canManageMembers = await this.groupsService.hasPermission(groupId, user.id, 'canManageMembers');
        if (!canManageMembers) {
            throw new common_2.ForbiddenException('Vous n\'avez pas la permission de gérer les membres');
        }
        const result = await this.groupsService.updateMemberRole(groupId, userId, roleData.newRole, user.id);
        return {
            success: true,
            data: result,
            message: 'Rôle mis à jour avec succès',
        };
    }
    async updateMemberPermissions(groupId, userId, permissionsData, user) {
        const canManageMembers = await this.groupsService.hasPermission(groupId, user.id, 'canManageMembers');
        if (!canManageMembers) {
            throw new common_2.ForbiddenException('Vous n\'avez pas la permission de gérer les membres');
        }
        const result = await this.groupsService.updateMemberPermissions(groupId, userId, permissionsData.permissions, user.id);
        return {
            success: true,
            data: result,
            message: 'Permissions mises à jour avec succès',
        };
    }
    async inviteUser(groupId, inviteData, user) {
        const canInvite = await this.groupsService.hasPermission(groupId, user.id, 'canInvite');
        if (!canInvite) {
            throw new common_2.ForbiddenException('Vous n\'avez pas la permission d\'inviter des membres');
        }
        const result = await this.groupsService.inviteUser(groupId, inviteData, user.id);
        return {
            success: true,
            data: result,
            message: 'Invitation envoyée avec succès',
        };
    }
    async checkPermissions(groupId, userId, permission) {
        if (permission) {
            const hasPermission = await this.groupsService.hasPermission(groupId, userId, permission);
            return {
                success: true,
                data: { permission, hasPermission },
            };
        }
        const userRole = await this.groupsService.getUserRole(groupId, userId);
        return {
            success: true,
            data: { role: userRole },
        };
    }
    async canPerformAction(groupId, userId, action) {
        const result = await this.groupsService.canPerformAction(groupId, userId, action);
        return {
            success: true,
            data: result,
        };
    }
    async remove(id, user) {
        await this.groupsService.delete(id, user.id);
        return {
            success: true,
            data: null,
            message: 'Groupe supprimé avec succès',
        };
    }
};
exports.GroupsController = GroupsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Créer un nouveau groupe',
        description: 'Créer un groupe avec configuration et invitations initiales optionnelles',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Groupe créé avec succès',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Données invalides',
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Code de groupe déjà utilisé',
    }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_group_dto_1.CreateGroupDto, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('my-groups'),
    (0, swagger_1.ApiOperation)({
        summary: 'Mes groupes',
        description: 'Récupérer tous les groupes dont je suis membre',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        description: 'Filtrer par statut de membership',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'role',
        required: false,
        description: 'Filtrer par rôle dans le groupe',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Liste de mes groupes',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('role')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getMyGroups", null);
__decorate([
    (0, common_1.Get)('public'),
    (0, swagger_1.ApiOperation)({
        summary: 'Groupes publics',
        description: 'Rechercher dans les groupes publics disponibles',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'query',
        required: false,
        description: 'Terme de recherche',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'type',
        required: false,
        description: 'Type de groupe',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'hasSpace',
        required: false,
        description: 'Groupes avec de la place disponible',
        type: 'boolean',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Groupes publics trouvés',
    }),
    __param(0, (0, common_1.Query)('query')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('hasSpace')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Boolean, Number, Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getPublicGroups", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Détails d\'un groupe',
        description: 'Récupérer les informations détaillées d\'un groupe',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'ID du groupe',
        example: 'group-123-456',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Détails du groupe',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Groupe introuvable',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)('code/:code'),
    (0, swagger_1.ApiOperation)({
        summary: 'Trouver un groupe par code',
        description: 'Récupérer un groupe via son code unique',
    }),
    (0, swagger_1.ApiParam)({
        name: 'code',
        description: 'Code du groupe',
        example: 'CA_SUPPORTERS_2025',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Groupe trouvé',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Groupe introuvable',
    }),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "findByCode", null);
__decorate([
    (0, common_1.Get)(':id/stats'),
    (0, swagger_1.ApiOperation)({
        summary: 'Statistiques du groupe',
        description: 'Récupérer les statistiques détaillées d\'un groupe',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'ID du groupe',
        example: 'group-123-456',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Statistiques du groupe',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getGroupStats", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Mettre à jour un groupe',
        description: 'Modifier les informations d\'un groupe',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'ID du groupe',
        example: 'group-123-456',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Groupe mis à jour',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Groupe non trouvé',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Permission insuffisante',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_group_dto_1.UpdateGroupDto, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/members'),
    (0, swagger_1.ApiOperation)({
        summary: 'Ajouter un membre au groupe',
        description: 'Ajouter un nouvel utilisateur au groupe',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'ID du groupe',
        example: 'group-123-456',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Membre ajouté avec succès',
    }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "addMember", null);
__decorate([
    (0, common_1.Delete)(':id/members/:userId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Retirer un membre du groupe',
        description: 'Supprimer un membre du groupe',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'ID du groupe',
        example: 'group-123-456',
    }),
    (0, swagger_1.ApiParam)({
        name: 'userId',
        description: 'ID de l\'utilisateur à retirer',
        example: 'user-789-012',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Membre retiré avec succès',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Put)(':id/members/:userId/role'),
    (0, swagger_1.ApiOperation)({
        summary: 'Modifier le rôle d\'un membre',
        description: 'Changer le rôle d\'un membre dans le groupe',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'ID du groupe',
        example: 'group-123-456',
    }),
    (0, swagger_1.ApiParam)({
        name: 'userId',
        description: 'ID de l\'utilisateur',
        example: 'user-789-012',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Rôle mis à jour avec succès',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "updateMemberRole", null);
__decorate([
    (0, common_1.Put)(':id/members/:userId/permissions'),
    (0, swagger_1.ApiOperation)({
        summary: 'Modifier les permissions d\'un membre',
        description: 'Mettre à jour les permissions spécifiques d\'un membre',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'ID du groupe',
        example: 'group-123-456',
    }),
    (0, swagger_1.ApiParam)({
        name: 'userId',
        description: 'ID de l\'utilisateur',
        example: 'user-789-012',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Permissions mises à jour avec succès',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "updateMemberPermissions", null);
__decorate([
    (0, common_1.Post)(':id/invite'),
    (0, swagger_1.ApiOperation)({
        summary: 'Inviter un utilisateur',
        description: 'Envoyer une invitation à rejoindre le groupe',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'ID du groupe',
        example: 'group-123-456',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Invitation envoyée',
    }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "inviteUser", null);
__decorate([
    (0, common_1.Get)(':id/permissions/:userId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Vérifier les permissions d\'un utilisateur',
        description: 'Obtenir les permissions d\'un utilisateur dans le groupe',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'ID du groupe',
        example: 'group-123-456',
    }),
    (0, swagger_1.ApiParam)({
        name: 'userId',
        description: 'ID de l\'utilisateur',
        example: 'user-789-012',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'permission',
        required: false,
        description: 'Permission spécifique à vérifier',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Permissions de l\'utilisateur',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Query)('permission')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "checkPermissions", null);
__decorate([
    (0, common_1.Get)(':id/actions/:userId/:action'),
    (0, swagger_1.ApiOperation)({
        summary: 'Vérifier si une action est autorisée',
        description: 'Vérifier si un utilisateur peut effectuer une action spécifique',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'ID du groupe',
        example: 'group-123-456',
    }),
    (0, swagger_1.ApiParam)({
        name: 'userId',
        description: 'ID de l\'utilisateur',
        example: 'user-789-012',
    }),
    (0, swagger_1.ApiParam)({
        name: 'action',
        description: 'Action à vérifier',
        example: 'EDIT',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Résultat de la vérification',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Param)('action')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "canPerformAction", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Supprimer un groupe',
        description: 'Supprimer définitivement un groupe',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'ID du groupe',
        example: 'group-123-456',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Groupe supprimé',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "remove", null);
exports.GroupsController = GroupsController = __decorate([
    (0, swagger_1.ApiTags)('Groups'),
    (0, common_1.Controller)('groups'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [groups_service_1.GroupsService])
], GroupsController);
//# sourceMappingURL=groups.controller.js.map