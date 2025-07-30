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
exports.RolesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_service_1 = require("../services/roles.service");
const roles_1 = require("../dto/roles");
const permissions_guard_1 = require("../guards/permissions.guard");
const access_enums_1 = require("../types/access-enums");
let RolesController = class RolesController {
    rolesService;
    constructor(rolesService) {
        this.rolesService = rolesService;
    }
    async createRole(createData) {
        const role = await this.rolesService.createRole(createData);
        return {
            success: true,
            data: role,
            message: 'Rôle créé avec succès',
        };
    }
    async listRoles(scope, isActive, isSystem, levelMin, levelMax) {
        const filters = {
            scope,
            is_active: isActive,
            is_system: isSystem,
            level_min: levelMin,
            level_max: levelMax,
        };
        const result = await this.rolesService.findManyRoles(filters);
        return {
            success: true,
            data: result,
        };
    }
    async getRole(id) {
        const role = await this.rolesService.findRoleById(id);
        return {
            success: true,
            data: role,
        };
    }
    async updateRole(id, updateData) {
        const role = await this.rolesService.updateRole(id, updateData);
        return {
            success: true,
            data: role,
            message: 'Rôle mis à jour avec succès',
        };
    }
    async assignRole(assignData) {
        const assignedBy = 'current-user-id';
        const userRole = await this.rolesService.assignRole(assignData, assignedBy);
        return {
            success: true,
            data: userRole,
            message: 'Rôle assigné avec succès',
        };
    }
    async removeRole(userId, roleId) {
        const removedBy = 'current-user-id';
        await this.rolesService.removeRole(userId, roleId, removedBy);
        return {
            success: true,
            message: 'Rôle retiré avec succès',
        };
    }
    async getUserRoles(userId) {
        const userRoles = await this.rolesService.getUserRoles(userId);
        const summary = {
            total_roles: userRoles.length,
            highest_level: Math.min(...userRoles.map(ur => ur.roles.level)),
            scopes: [...new Set(userRoles.map(ur => ur.roles.scope))],
            permissions_count: userRoles.reduce((acc, ur) => acc + (ur.roles.role_permissions?.length || 0), 0),
        };
        return {
            success: true,
            data: {
                user_roles: userRoles,
                summary,
            },
        };
    }
    async getRoleUsers(roleId) {
        const role = await this.rolesService.findRoleById(roleId);
        const users = role.user_roles_user_roles_user_idTousers || [];
        return {
            success: true,
            data: {
                role,
                users: users,
                total: users.length,
            },
        };
    }
};
exports.RolesController = RolesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Créer un nouveau rôle',
        description: `
      Crée un nouveau rôle dans le système avec permissions et hiérarchie.
      
      **Fonctionnalités:**
      - Validation de l'unicité du nom
      - Gestion de la hiérarchie par niveau
      - Support des métadonnées personnalisées
      - Portées configurables (SYSTEM, ORGANIZER, VENUE, etc.)
      
      **Contraintes:**
      - Nom en snake_case obligatoire
      - Niveaux hiérarchiques respectés par portée
      - Maximum 3 rôles par niveau/portée
      - Audit complet de la création
    `
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Rôle créé avec succès',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
                        name: { type: 'string', example: 'event_manager' },
                        display_name: { type: 'string', example: 'Gestionnaire d\'événements' },
                        description: { type: 'string', example: 'Responsable de la gestion des événements' },
                        scope: { type: 'string', example: 'ORGANIZER' },
                        level: { type: 'number', example: 5 },
                        is_system: { type: 'boolean', example: false },
                        is_active: { type: 'boolean', example: true },
                        metadata: {
                            type: 'object',
                            example: {
                                department: 'events',
                                max_events: 50
                            }
                        },
                        created_at: { type: 'string', example: '2024-03-10T10:00:00.000Z' },
                        updated_at: { type: 'string', example: '2024-03-10T10:00:00.000Z' }
                    }
                },
                message: { type: 'string', example: 'Rôle créé avec succès' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CONFLICT,
        description: 'Un rôle avec ce nom existe déjà',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: false },
                error: {
                    type: 'object',
                    properties: {
                        code: { type: 'string', example: 'ROLE_EXISTS' },
                        message: { type: 'string', example: 'Un rôle avec le nom \'event_manager\' existe déjà' }
                    }
                }
            }
        }
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('roles:create', access_enums_1.ResourceType.ROLE, access_enums_1.PermissionAction.CREATE)),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [roles_1.CreateRoleDto]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "createRole", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Lister tous les rôles avec filtres',
        description: `
      Récupère la liste complète des rôles avec options de filtrage avancées.
      
      **Filtres disponibles:**
      - Par portée (SYSTEM, ORGANIZER, VENUE, GROUP, EVENT)
      - Par statut actif/inactif
      - Par type système/personnalisé
      - Par plage de niveaux hiérarchiques
      
      **Informations incluses:**
      - Détails complets de chaque rôle
      - Permissions assignées à chaque rôle
      - Nombre d'utilisateurs ayant le rôle
      - Hiérarchie des rôles
      
      **Tri:**
      - Par niveau hiérarchique (croissant)
      - Par nom alphabétique
    `
    }),
    (0, swagger_1.ApiQuery)({ name: 'scope', required: false, enum: access_enums_1.RoleScope, description: 'Filtrer par portée' }),
    (0, swagger_1.ApiQuery)({ name: 'is_active', required: false, type: Boolean, description: 'Filtrer par statut actif' }),
    (0, swagger_1.ApiQuery)({ name: 'is_system', required: false, type: Boolean, description: 'Filtrer par type système' }),
    (0, swagger_1.ApiQuery)({ name: 'level_min', required: false, type: Number, description: 'Niveau minimum' }),
    (0, swagger_1.ApiQuery)({ name: 'level_max', required: false, type: Number, description: 'Niveau maximum' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Liste des rôles récupérée avec succès',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        roles: {
                            type: 'array',
                            items: {
                                type: 'object',
                                description: 'Rôle avec permissions et statistiques d\'utilisation'
                            }
                        },
                        hierarchy: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    parent_role_id: { type: 'string' },
                                    child_role_id: { type: 'string' },
                                    depth: { type: 'number' }
                                }
                            }
                        },
                        total: { type: 'number', example: 25 }
                    }
                }
            }
        }
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('roles:read', access_enums_1.ResourceType.ROLE, access_enums_1.PermissionAction.READ)),
    __param(0, (0, common_1.Query)('scope')),
    __param(1, (0, common_1.Query)('is_active')),
    __param(2, (0, common_1.Query)('is_system')),
    __param(3, (0, common_1.Query)('level_min')),
    __param(4, (0, common_1.Query)('level_max')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean, Boolean, Number, Number]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "listRoles", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Récupérer un rôle par ID',
        description: `
      Récupère les détails complets d'un rôle spécifique.
      
      **Informations incluses:**
      - Détails du rôle
      - Toutes les permissions assignées
      - Liste des utilisateurs ayant ce rôle
      - Position dans la hiérarchie
      - Métadonnées et configuration
      - Statistiques d'utilisation
    `
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Identifiant unique du rôle',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Rôle récupéré avec succès',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    description: 'Détails complets du rôle avec permissions et utilisateurs'
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Rôle introuvable'
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('roles:read', access_enums_1.ResourceType.ROLE, access_enums_1.PermissionAction.READ)),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "getRole", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Mettre à jour un rôle',
        description: `
      Met à jour les propriétés d'un rôle existant.
      
      **Propriétés modifiables:**
      - Nom d'affichage
      - Description
      - Niveau hiérarchique
      - Statut actif/inactif
      - Métadonnées
      
      **Restrictions:**
      - Les rôles système ne peuvent pas être modifiés
      - Le nom et la portée ne peuvent pas être changés
      - Les modifications sont auditées
      - Invalidation automatique des caches
    `
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Identifiant unique du rôle à modifier',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Rôle mis à jour avec succès',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    description: 'Rôle mis à jour avec toutes ses relations'
                },
                message: { type: 'string', example: 'Rôle mis à jour avec succès' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Les rôles système ne peuvent pas être modifiés'
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('roles:update', access_enums_1.ResourceType.ROLE, access_enums_1.PermissionAction.UPDATE, {
        resource_id_param: 'id'
    })),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, roles_1.UpdateRoleDto]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "updateRole", null);
__decorate([
    (0, common_1.Post)('assign'),
    (0, swagger_1.ApiOperation)({
        summary: 'Assigner un rôle à un utilisateur',
        description: `
      Assigne un rôle spécifique à un utilisateur avec gestion de la validité temporelle.
      
      **Fonctionnalités:**
      - Assignation avec date d'expiration optionnelle
      - Gestion des conflits (utilisateur ayant déjà le rôle)
      - Validation des limites (max rôles par utilisateur)
      - Notes d'assignation pour audit
      - Invalidation automatique des caches de permissions
      
      **Processus:**
      1. Validation de l'utilisateur et du rôle
      2. Vérification des limites système
      3. Gestion des assignations existantes
      4. Création de la nouvelle assignation
      5. Audit et logging complets
    `
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Rôle assigné avec succès',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
                        user_id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174001' },
                        role_id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174002' },
                        assigned_at: { type: 'string', example: '2024-03-10T10:00:00.000Z' },
                        valid_until: { type: 'string', example: '2024-12-31T23:59:59.999Z' },
                        status: { type: 'string', example: 'ACTIVE' },
                        assigned_by: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174003' },
                        notes: { type: 'string', example: 'Promotion temporaire' },
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                email: { type: 'string' },
                                first_name: { type: 'string' },
                                last_name: { type: 'string' }
                            }
                        },
                        role: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                display_name: { type: 'string' },
                                scope: { type: 'string' },
                                level: { type: 'number' }
                            }
                        }
                    }
                },
                message: { type: 'string', example: 'Rôle assigné avec succès' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CONFLICT,
        description: 'L\'utilisateur possède déjà ce rôle actif'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Limite de rôles par utilisateur atteinte'
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('roles:assign', access_enums_1.ResourceType.ROLE, access_enums_1.PermissionAction.MANAGE)),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [roles_1.AssignRoleDto]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "assignRole", null);
__decorate([
    (0, common_1.Delete)('assign/:userId/:roleId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Retirer un rôle d\'un utilisateur',
        description: `
      Retire un rôle spécifique d'un utilisateur.
      
      **Processus de retrait:**
      1. Vérification de l'existence de l'assignation
      2. Validation des contraintes (rôles système critiques)
      3. Désactivation de l'assignation (soft delete)
      4. Invalidation des caches de permissions
      5. Audit et logging complets
      
      **Restrictions:**
      - Les rôles système critiques (niveau ≤ 2) ne peuvent pas être retirés
      - Seuls les administrateurs peuvent retirer des rôles
      - L'action est irréversible
    `
    }),
    (0, swagger_1.ApiParam)({
        name: 'userId',
        description: 'Identifiant unique de l\'utilisateur',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, swagger_1.ApiParam)({
        name: 'roleId',
        description: 'Identifiant unique du rôle à retirer',
        example: '123e4567-e89b-12d3-a456-426614174001'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Rôle retiré avec succès',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Rôle retiré avec succès' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Assignation de rôle active introuvable'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Les rôles système critiques ne peuvent pas être retirés'
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('roles:remove', access_enums_1.ResourceType.ROLE, access_enums_1.PermissionAction.MANAGE)),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('roleId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "removeRole", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Récupérer tous les rôles d\'un utilisateur',
        description: `
      Récupère la liste complète des rôles assignés à un utilisateur spécifique.
      
      **Filtres automatiques:**
      - Rôles actifs uniquement
      - Non expirés uniquement
      - Tri par niveau hiérarchique puis date d'assignation
      
      **Informations incluses:**
      - Détails de chaque rôle
      - Permissions effectives
      - Dates d'assignation et d'expiration
      - Qui a assigné le rôle
      - Notes d'assignation
      
      **Calculs automatiques:**
      - Permissions cumulées
      - Niveau hiérarchique le plus élevé
      - Portées d'autorisation
    `
    }),
    (0, swagger_1.ApiParam)({
        name: 'userId',
        description: 'Identifiant unique de l\'utilisateur',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Rôles de l\'utilisateur récupérés avec succès',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        user_roles: {
                            type: 'array',
                            items: {
                                type: 'object',
                                description: 'Assignation de rôle avec détails complets'
                            }
                        },
                        summary: {
                            type: 'object',
                            properties: {
                                total_roles: { type: 'number', example: 3 },
                                highest_level: { type: 'number', example: 2 },
                                scopes: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    example: ['ORGANIZER', 'VENUE']
                                },
                                permissions_count: { type: 'number', example: 15 }
                            }
                        }
                    }
                }
            }
        }
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('roles:read', access_enums_1.ResourceType.ROLE, access_enums_1.PermissionAction.READ, {
        resource_id_param: 'userId',
        allow_owner_override: true
    })),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "getUserRoles", null);
__decorate([
    (0, common_1.Get)(':roleId/users'),
    (0, swagger_1.ApiOperation)({
        summary: 'Récupérer tous les utilisateurs ayant un rôle spécifique',
        description: `
      Récupère la liste de tous les utilisateurs qui ont un rôle spécifique assigné.
      
      **Filtres automatiques:**
      - Assignations actives uniquement
      - Non expirées uniquement
      - Utilisateurs actifs uniquement
      
      **Informations incluses:**
      - Informations de base des utilisateurs
      - Date d'assignation du rôle
      - Date d'expiration si applicable
      - Qui a assigné le rôle
      - Notes d'assignation
      
      **Tri:**
      - Par date d'assignation (plus récent en premier)
      - Puis par nom d'utilisateur alphabétique
    `
    }),
    (0, swagger_1.ApiParam)({
        name: 'roleId',
        description: 'Identifiant unique du rôle',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Utilisateurs ayant le rôle récupérés avec succès',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        role: {
                            type: 'object',
                            description: 'Détails du rôle'
                        },
                        users: {
                            type: 'array',
                            items: {
                                type: 'object',
                                description: 'Utilisateur avec détails d\'assignation'
                            }
                        },
                        total: { type: 'number', example: 12 }
                    }
                }
            }
        }
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('roles:read', access_enums_1.ResourceType.ROLE, access_enums_1.PermissionAction.READ)),
    __param(0, (0, common_1.Param)('roleId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "getRoleUsers", null);
exports.RolesController = RolesController = __decorate([
    (0, swagger_1.ApiTags)('Roles Management'),
    (0, common_1.Controller)('roles'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [roles_service_1.RolesService])
], RolesController);
//# sourceMappingURL=roles.controller.js.map