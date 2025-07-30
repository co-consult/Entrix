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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const create_user_dto_1 = require("../dto/users/create-user.dto");
const update_user_dto_1 = require("../dto/users/update-user.dto");
const user_search_dto_1 = require("../dto/users/user-search.dto");
const update_privacy_dto_1 = require("../dto/users/update-privacy.dto");
const user_preferences_dto_1 = require("../dto/users/user-preferences.dto");
const users_service_1 = require("../services/users.service");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
const common_2 = require("@nestjs/common");
let UsersController = class UsersController {
    usersService;
    prisma;
    constructor(usersService, prisma) {
        this.usersService = usersService;
        this.prisma = prisma;
    }
    async createUser(dto) {
        try {
            const user = await this.usersService.create({
                email: dto.email,
                password: dto.password,
                firstName: dto.first_name,
                lastName: dto.last_name,
                phone: dto.phone,
                avatar: dto.avatar,
                isActive: dto.is_active ?? true,
                emailVerified: dto.email_verified ?? false,
                phoneVerified: dto.phone_verified ?? false,
                metadata: dto.metadata,
            });
            return {
                success: true,
                data: user,
                message: 'Utilisateur créé avec succès'
            };
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_2.ConflictException('Email déjà utilisé');
            }
            throw error;
        }
    }
    async searchUsers(searchDto) {
        const searchParams = {
            query: searchDto.query,
            filters: {
                isActive: searchDto.is_active,
                emailVerified: searchDto.email_verified,
                phoneVerified: searchDto.phone_verified,
                country: searchDto.country,
                city: searchDto.city,
                language: searchDto.language,
                createdAfter: searchDto.createdAfter ? new Date(searchDto.createdAfter) : undefined,
                createdBefore: searchDto.createdBefore ? new Date(searchDto.createdBefore) : undefined,
            },
            pagination: {
                page: searchDto.page || 1,
                limit: searchDto.limit || 20,
            },
            sorting: searchDto.sortBy && searchDto.sortOrder
                ? { field: searchDto.sortBy, order: searchDto.sortOrder }
                : undefined,
        };
        const result = await this.usersService.search(searchParams);
        return {
            success: true,
            data: result.data,
            pagination: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
                hasNext: result.hasNext,
                hasPrev: result.hasPrev,
            },
        };
    }
    async getMyProfile(user) {
        const fullUser = await this.usersService.findById(user.id);
        if (!fullUser) {
            throw new common_2.NotFoundException('Utilisateur non trouvé');
        }
        return {
            success: true,
            data: fullUser,
        };
    }
    async getUserStats(filters) {
        const stats = await this.usersService.getStats(filters);
        return {
            success: true,
            data: stats,
        };
    }
    async getAllRoles() {
        const roles = await this.prisma.roles.findMany({
            select: { id: true, code: true, name: true, description: true, is_active: true }
        });
        return { success: true, data: roles };
    }
    async getUserById(id) {
        const user = await this.usersService.findById(id);
        if (!user) {
            throw new common_2.NotFoundException('Utilisateur non trouvé');
        }
        return {
            success: true,
            data: user,
        };
    }
    async updateUser(id, dto) {
        const user = await this.usersService.update(id, {
            firstName: dto.first_name,
            lastName: dto.last_name,
            phone: dto.phone,
            avatar: dto.avatar,
            isActive: dto.is_active,
            emailVerified: dto.email_verified,
            phoneVerified: dto.phone_verified,
            metadata: dto.metadata,
        });
        return {
            success: true,
            data: user,
            message: 'Utilisateur mis à jour avec succès',
        };
    }
    async updateMyProfile(user, dto) {
        const updatedUser = await this.usersService.update(user.id, {
            firstName: dto.first_name,
            lastName: dto.last_name,
            phone: dto.phone,
            avatar: dto.avatar,
            metadata: dto.metadata,
        });
        return {
            success: true,
            data: updatedUser,
            message: 'Profil mis à jour avec succès',
        };
    }
    async updatePrivacySettings(user, dto) {
        const updatedUser = await this.usersService.update(user.id, {
            metadata: {
                ...user.metadata,
                privacy: dto,
            },
        });
        return {
            success: true,
            data: updatedUser,
            message: 'Paramètres de confidentialité mis à jour',
        };
    }
    async updatePreferences(user, dto) {
        const updatedUser = await this.usersService.update(user.id, {
            metadata: {
                ...user.metadata,
                preferences: dto,
            },
        });
        return {
            success: true,
            data: updatedUser,
            message: 'Préférences mises à jour',
        };
    }
    async activateUser(id) {
        const user = await this.usersService.activate(id);
        return {
            success: true,
            data: user,
            message: 'Utilisateur activé avec succès',
        };
    }
    async deactivateUser(id) {
        const user = await this.usersService.deactivate(id);
        return {
            success: true,
            data: user,
            message: 'Utilisateur désactivé avec succès',
        };
    }
    async verifyUser(id) {
        const user = await this.usersService.verify(id);
        return {
            success: true,
            data: user,
            message: 'Utilisateur vérifié avec succès',
        };
    }
    async getUserGroups(id) {
        const groups = await this.usersService.getUserGroups(id);
        return {
            success: true,
            data: groups,
        };
    }
    async getUserRoles(id) {
        const roles = await this.usersService.getUserRoles(id);
        return {
            success: true,
            data: roles,
        };
    }
    async changePassword(id, passwordData, currentUser) {
        if (currentUser.id !== id) {
            throw new common_2.ForbiddenException('Vous ne pouvez changer que votre propre mot de passe');
        }
        if (!passwordData.oldPassword || !passwordData.newPassword) {
            throw new common_2.BadRequestException('Ancien et nouveau mot de passe requis');
        }
        const updatedUser = await this.usersService.changePassword(id, passwordData.oldPassword, passwordData.newPassword);
        return {
            success: true,
            data: updatedUser,
            message: 'Mot de passe modifié avec succès',
        };
    }
    async deleteUser(id) {
        await this.usersService.delete(id);
        return {
            success: true,
            data: null,
            message: 'Utilisateur supprimé avec succès',
        };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Créer un nouvel utilisateur',
        description: 'Créer un compte utilisateur avec les informations de base',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Utilisateur créé avec succès',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Données invalides',
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Email déjà utilisé',
    }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "createUser", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Rechercher des utilisateurs',
        description: 'Rechercher et filtrer la liste des utilisateurs',
    }),
    (0, swagger_1.ApiQuery)({ name: 'query', required: false, description: 'Terme de recherche', example: 'ahmed' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Numéro de page', example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Nombre d\'éléments par page', example: 20 }),
    (0, swagger_1.ApiQuery)({ name: 'isActive', required: false, description: 'Filtrer par statut actif', example: true }),
    (0, swagger_1.ApiQuery)({ name: 'emailVerified', required: false, description: 'Filtrer par email vérifié', example: true }),
    (0, swagger_1.ApiQuery)({ name: 'country', required: false, description: 'Filtrer par pays', example: 'TN' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Liste des utilisateurs' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_search_dto_1.UserSearchDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "searchUsers", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtenir mon profil',
        description: 'Récupérer les informations de l\'utilisateur connecté',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profil utilisateur' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Statistiques des utilisateurs',
        description: 'Obtenir les statistiques générales des utilisateurs',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Statistiques' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserStats", null);
__decorate([
    (0, common_1.Get)('roles'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Liste de tous les rôles', description: 'Récupérer tous les rôles disponibles' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Liste des rôles' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getAllRoles", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtenir un utilisateur par ID',
        description: 'Récupérer les détails d\'un utilisateur spécifique',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID de l\'utilisateur' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Utilisateur trouvé' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Utilisateur non trouvé' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Mettre à jour un utilisateur',
        description: 'Modifier les informations d\'un utilisateur',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID de l\'utilisateur' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Utilisateur mis à jour' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Utilisateur non trouvé' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Put)('me/profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Mettre à jour mon profil',
        description: 'Modifier les informations de mon profil',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profil mis à jour' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateMyProfile", null);
__decorate([
    (0, common_1.Put)('me/privacy'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Mettre à jour mes paramètres de confidentialité',
        description: 'Modifier les paramètres de confidentialité de mon compte',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paramètres mis à jour' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_privacy_dto_1.UpdatePrivacyDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updatePrivacySettings", null);
__decorate([
    (0, common_1.Put)('me/preferences'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Mettre à jour mes préférences',
        description: 'Modifier les préférences utilisateur',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Préférences mises à jour' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, user_preferences_dto_1.UserPreferencesDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updatePreferences", null);
__decorate([
    (0, common_1.Post)(':id/activate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Activer un utilisateur',
        description: 'Réactiver un compte utilisateur désactivé',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID de l\'utilisateur' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Utilisateur activé' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "activateUser", null);
__decorate([
    (0, common_1.Post)(':id/deactivate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Désactiver un utilisateur',
        description: 'Désactiver temporairement un compte utilisateur',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID de l\'utilisateur' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Utilisateur désactivé' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deactivateUser", null);
__decorate([
    (0, common_1.Post)(':id/verify'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Vérifier un utilisateur',
        description: 'Marquer un utilisateur comme vérifié',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID de l\'utilisateur' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Utilisateur vérifié' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "verifyUser", null);
__decorate([
    (0, common_1.Get)(':id/groups'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Groupes d\'un utilisateur',
        description: 'Récupérer la liste des groupes d\'un utilisateur',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID de l\'utilisateur' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Liste des groupes de l\'utilisateur' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserGroups", null);
__decorate([
    (0, common_1.Get)(':id/roles'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Rôles d\'un utilisateur',
        description: 'Récupérer la liste des rôles d\'un utilisateur',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID de l\'utilisateur' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Liste des rôles de l\'utilisateur' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserRoles", null);
__decorate([
    (0, common_1.Put)(':id/password'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Changer le mot de passe',
        description: 'Modifier le mot de passe d\'un utilisateur',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID de l\'utilisateur' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Mot de passe modifié' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Ancien mot de passe incorrect' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Accès refusé' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Supprimer un utilisateur',
        description: 'Supprimer définitivement un compte utilisateur',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID de l\'utilisateur' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Utilisateur supprimé' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteUser", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, common_1.Controller)('users'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [users_service_1.UsersService, prisma_service_1.PrismaService])
], UsersController);
//# sourceMappingURL=users.controller.js.map