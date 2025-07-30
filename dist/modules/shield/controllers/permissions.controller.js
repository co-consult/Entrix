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
exports.PermissionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const permissions_service_1 = require("../services/permissions.service");
const rbac_service_1 = require("../services/rbac.service");
const permissions_1 = require("../dto/permissions");
const permissions_guard_1 = require("../guards/permissions.guard");
const access_enums_1 = require("../types/access-enums");
let PermissionsController = class PermissionsController {
    permissionsService;
    rbacService;
    constructor(permissionsService, rbacService) {
        this.permissionsService = permissionsService;
        this.rbacService = rbacService;
    }
    async createPermission(createData) {
        const permission = await this.permissionsService.createPermission(createData);
        return {
            success: true,
            data: permission,
            message: 'Permission créée avec succès',
        };
    }
    async listPermissions(resourceType, action, isActive, isSystem) {
        const filters = {
            resource_type: resourceType,
            action,
            is_active: isActive,
            is_system: isSystem,
        };
        const result = await this.permissionsService.findManyPermissions(filters);
        return {
            success: true,
            data: result,
        };
    }
    async getPermission(id) {
        const permission = await this.permissionsService.findPermissionById(id);
        return {
            success: true,
            data: permission,
        };
    }
    async updatePermission(id, updateData) {
        const permission = await this.permissionsService.updatePermission(id, updateData);
        return {
            success: true,
            data: permission,
            message: 'Permission mise à jour avec succès',
        };
    }
    async bulkAssignPermissions(bulkData) {
        await this.permissionsService.bulkAssignPermissions(bulkData);
        const stats = {
            assignments_processed: bulkData.assignments.length,
            permissions_assigned: bulkData.assignments.reduce((acc, assignment) => acc + assignment.permission_ids.length, 0),
            roles_affected: new Set(bulkData.assignments.map(a => a.role_id)).size,
            duplicates_skipped: 0,
        };
        return {
            success: true,
            data: stats,
            message: 'Permissions assignées avec succès',
        };
    }
    async assignPermissionToRole(roleId, permissionId) {
        await this.permissionsService.assignPermissionToRole(roleId, permissionId);
        return {
            success: true,
            message: 'Permission assignée au rôle avec succès',
        };
    }
    async removePermissionFromRole(roleId, permissionId) {
        await this.permissionsService.removePermissionFromRole(roleId, permissionId);
        return {
            success: true,
            message: 'Permission retirée du rôle avec succès',
        };
    }
    async checkPermission(checkData) {
        const result = await this.rbacService.checkPermission({
            user_id: checkData.user_id,
            permission: checkData.permission,
            resource_type: checkData.resource_type,
            resource_id: checkData.resource_id,
            context: checkData.context,
        });
        return {
            success: true,
            data: result,
        };
    }
    async getRolePermissions(roleId) {
        const permissions = await this.permissionsService.getRolePermissions(roleId);
        const groupedByResource = permissions.reduce((acc, permission) => {
            const resourceType = permission.resource_type;
            if (!acc[resourceType]) {
                acc[resourceType] = [];
            }
            acc[resourceType].push(permission);
            return acc;
        }, {});
        return {
            success: true,
            data: {
                role: { id: roleId },
                permissions,
                grouped_by_resource: groupedByResource,
                total: permissions.length,
            },
        };
    }
    async getUserEffectivePermissions(userId) {
        const effectivePermissions = await this.rbacService.getEffectivePermissions(userId);
        return {
            success: true,
            data: effectivePermissions,
        };
    }
    async initializeSystemPermissions() {
        await this.permissionsService.initializeSystemPermissions();
        const stats = {
            permissions_created: 0,
            permissions_updated: 0,
            permissions_skipped: 0,
        };
        return {
            success: true,
            data: stats,
            message: 'Permissions système initialisées avec succès',
        };
    }
};
exports.PermissionsController = PermissionsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Créer une nouvelle permission',
        description: `
      Crée une nouvelle permission dans le système avec conditions contextuelles.
      
      **Fonctionnalités:**
      - Validation de l'unicité du nom
      - Support des conditions contextuelles avancées
      - Gestion des métadonnées personnalisées
      - Actions granulaires par type de ressource
      
      **Types de conditions supportées:**
      - own_resource_only : Limiter aux ressources propres
      - organizer_scope : Limiter à la portée organisateur
      - time_restrictions : Restrictions horaires et jours
      - resource_filters : Filtres sur les propriétés des ressources
      
      **Actions disponibles:**
      - CREATE, READ, UPDATE, DELETE : CRUD standard
      - MANAGE : Gestion complète
      - APPROVE, REJECT : Validation/approbation
      - TRANSFER, SUSPEND, ACTIVATE : Actions spécialisées
    `
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Permission créée avec succès',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
                        name: { type: 'string', example: 'events:manage:create' },
                        display_name: { type: 'string', example: 'Créer des événements' },
                        description: { type: 'string', example: 'Permet de créer de nouveaux événements' },
                        resource_type: { type: 'string', example: 'EVENT' },
                        action: { type: 'string', example: 'CREATE' },
                        conditions: {
                            type: 'object',
                            example: {
                                own_resource_only: true,
                                organizer_scope: true,
                                time_restrictions: {
                                    start_time: '09:00',
                                    end_time: '18:00',
                                    days_of_week: [1, 2, 3, 4, 5]
                                }
                            }
                        },
                        is_system: { type: 'boolean', example: false },
                        is_active: { type: 'boolean', example: true },
                        metadata: {
                            type: 'object',
                            example: {
                                category: 'event_management',
                                priority: 'high'
                            }
                        },
                        created_at: { type: 'string', example: '2024-03-10T10:00:00.000Z' },
                        updated_at: { type: 'string', example: '2024-03-10T10:00:00.000Z' }
                    }
                },
                message: { type: 'string', example: 'Permission créée avec succès' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CONFLICT,
        description: 'Une permission avec ce nom existe déjà'
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('permissions:create', access_enums_1.ResourceType.PERMISSION, access_enums_1.PermissionAction.CREATE)),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [permissions_1.CreatePermissionDto]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "createPermission", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Lister toutes les permissions avec filtres',
        description: `
      Récupère la liste complète des permissions avec options de filtrage avancées.
      
      **Filtres disponibles:**
      - Par type de ressource (USER, EVENT, ORGANIZER, etc.)
      - Par action (CREATE, READ, UPDATE, DELETE, MANAGE, etc.)
      - Par statut actif/inactif
      - Par type système/personnalisé
      
      **Groupement automatique:**
      - Permissions groupées par type de ressource
      - Sous-groupement par action
      - Hiérarchie des permissions
      
      **Informations incluses:**
      - Détails complets de chaque permission
      - Rôles ayant cette permission
      - Conditions d'application
      - Statistiques d'utilisation
    `
    }),
    (0, swagger_1.ApiQuery)({
        name: 'resource_type',
        required: false,
        enum: access_enums_1.ResourceType,
        description: 'Filtrer par type de ressource'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'action',
        required: false,
        enum: access_enums_1.PermissionAction,
        description: 'Filtrer par action'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'is_active',
        required: false,
        type: Boolean,
        description: 'Filtrer par statut actif'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'is_system',
        required: false,
        type: Boolean,
        description: 'Filtrer par type système'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Liste des permissions récupérée avec succès',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        permissions: {
                            type: 'array',
                            items: {
                                type: 'object',
                                description: 'Permission avec rôles assignés'
                            }
                        },
                        grouped_by_resource: {
                            type: 'object',
                            description: 'Permissions groupées par type de ressource',
                            example: {
                                'EVENT': [],
                                'USER': [],
                                'ORGANIZER': []
                            }
                        },
                        total: { type: 'number', example: 45 }
                    }
                }
            }
        }
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('permissions:read', access_enums_1.ResourceType.PERMISSION, access_enums_1.PermissionAction.READ)),
    __param(0, (0, common_1.Query)('resource_type')),
    __param(1, (0, common_1.Query)('action')),
    __param(2, (0, common_1.Query)('is_active')),
    __param(3, (0, common_1.Query)('is_system')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Boolean, Boolean]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "listPermissions", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Récupérer une permission par ID',
        description: `
      Récupère les détails complets d'une permission spécifique.
      
      **Informations incluses:**
      - Détails de la permission
      - Tous les rôles ayant cette permission
      - Conditions d'application détaillées
      - Métadonnées et configuration
      - Statistiques d'utilisation
      - Historique des modifications
    `
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Identifiant unique de la permission',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Permission récupérée avec succès'
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('permissions:read', access_enums_1.ResourceType.PERMISSION, access_enums_1.PermissionAction.READ)),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "getPermission", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Mettre à jour une permission',
        description: `
      Met à jour les propriétés d'une permission existante.
      
      **Propriétés modifiables:**
      - Nom d'affichage et description
      - Conditions d'application
      - Métadonnées personnalisées
      - Statut actif/inactif
      
      **Restrictions:**
      - Les permissions système ne peuvent pas être modifiées
      - Le nom, type de ressource et action sont immutables
      - Les modifications sont auditées
      - Invalidation automatique des caches
    `
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Identifiant unique de la permission à modifier',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Permission mise à jour avec succès'
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('permissions:update', access_enums_1.ResourceType.PERMISSION, access_enums_1.PermissionAction.UPDATE, {
        resource_id_param: 'id'
    })),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "updatePermission", null);
__decorate([
    (0, common_1.Post)('assign'),
    (0, swagger_1.ApiOperation)({
        summary: 'Assigner des permissions à des rôles en masse',
        description: `
      Assigne multiple permissions à multiple rôles en une seule opération.
      
      **Fonctionnalités:**
      - Assignation en masse pour efficacité
      - Validation de tous les rôles et permissions
      - Gestion des doublons (ignore les assignations existantes)
      - Transaction atomique (tout ou rien)
      - Invalidation automatique des caches
      
      **Limites:**
      - Maximum 10 assignations par requête
      - Maximum 50 permissions par rôle
      - Validation des contraintes système
      
      **Processus:**
      1. Validation de toutes les données
      2. Vérification des limites système
      3. Exécution en transaction
      4. Invalidation des caches
      5. Audit complet
    `
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Permissions assignées avec succès',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        assignments_processed: { type: 'number', example: 3 },
                        permissions_assigned: { type: 'number', example: 15 },
                        roles_affected: { type: 'number', example: 3 },
                        duplicates_skipped: { type: 'number', example: 2 }
                    }
                },
                message: { type: 'string', example: 'Permissions assignées avec succès' }
            }
        }
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('permissions:assign', access_enums_1.ResourceType.PERMISSION, access_enums_1.PermissionAction.MANAGE)),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [permissions_1.BulkAssignPermissionsDto]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "bulkAssignPermissions", null);
__decorate([
    (0, common_1.Post)('assign/:roleId/:permissionId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Assigner une permission à un rôle',
        description: `
      Assigne une permission spécifique à un rôle spécifique.
      
      **Validation automatique:**
      - Existence du rôle et de la permission
      - Statut actif des deux entités
      - Limite de permissions par rôle
      - Vérification des doublons
    `
    }),
    (0, swagger_1.ApiParam)({
        name: 'roleId',
        description: 'Identifiant unique du rôle',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, swagger_1.ApiParam)({
        name: 'permissionId',
        description: 'Identifiant unique de la permission',
        example: '123e4567-e89b-12d3-a456-426614174001'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Permission assignée au rôle avec succès'
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('permissions:assign', access_enums_1.ResourceType.PERMISSION, access_enums_1.PermissionAction.MANAGE)),
    __param(0, (0, common_1.Param)('roleId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('permissionId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "assignPermissionToRole", null);
__decorate([
    (0, common_1.Delete)('assign/:roleId/:permissionId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Retirer une permission d\'un rôle',
        description: `
      Retire une permission spécifique d'un rôle spécifique.
      
      **Restrictions:**
      - Les permissions système critiques ne peuvent pas être retirées
      - Seuls les administrateurs peuvent retirer des permissions
      - Action irréversible avec audit complet
    `
    }),
    (0, swagger_1.ApiParam)({
        name: 'roleId',
        description: 'Identifiant unique du rôle',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, swagger_1.ApiParam)({
        name: 'permissionId',
        description: 'Identifiant unique de la permission',
        example: '123e4567-e89b-12d3-a456-426614174001'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Permission retirée du rôle avec succès'
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('permissions:remove', access_enums_1.ResourceType.PERMISSION, access_enums_1.PermissionAction.MANAGE)),
    __param(0, (0, common_1.Param)('roleId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('permissionId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "removePermissionFromRole", null);
__decorate([
    (0, common_1.Post)('check'),
    (0, swagger_1.ApiOperation)({
        summary: 'Vérifier une permission utilisateur',
        description: `
      Vérifie si un utilisateur possède une permission spécifique pour une ressource.
      
      **Processus de vérification:**
      1. Calcul des permissions effectives de l'utilisateur
      2. Recherche de la permission spécifique
      3. Évaluation des conditions contextuelles
      4. Vérification des restrictions temporelles
      5. Audit de la vérification
      
      **Contexte pris en compte:**
      - Propriété des ressources
      - Portée organisateur/venue
      - Restrictions temporelles
      - Filtres sur les ressources
      - Conditions métier spécifiques
      
      **Performance:**
      - Utilisation du cache Redis
      - Résultats mis en cache
      - Optimisation des requêtes
    `
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Vérification de permission effectuée',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        granted: { type: 'boolean', example: true },
                        reason: { type: 'string', example: 'Permission accordée' },
                        computed_permissions: {
                            type: 'array',
                            items: { type: 'string' },
                            example: ['events:read', 'events:create', 'events:update']
                        },
                        effective_roles: {
                            type: 'array',
                            items: { type: 'string' },
                            example: ['event_manager', 'organizer_admin']
                        },
                        conditions_met: { type: 'boolean', example: true },
                        cache_hit: { type: 'boolean', example: false },
                        checked_at: { type: 'string', example: '2024-03-10T10:00:00.000Z' }
                    }
                }
            }
        }
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('permissions:check', access_enums_1.ResourceType.PERMISSION, access_enums_1.PermissionAction.READ)),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [permissions_1.CheckPermissionDto]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "checkPermission", null);
__decorate([
    (0, common_1.Get)('role/:roleId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Récupérer toutes les permissions d\'un rôle',
        description: `
      Récupère la liste complète des permissions assignées à un rôle spécifique.
      
      **Informations incluses:**
      - Permissions directes du rôle
      - Permissions héritées (si hiérarchie)
      - Détails de chaque permission
      - Conditions d'application
      - Tri par type de ressource puis action
    `
    }),
    (0, swagger_1.ApiParam)({
        name: 'roleId',
        description: 'Identifiant unique du rôle',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Permissions du rôle récupérées avec succès',
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
                        permissions: {
                            type: 'array',
                            items: {
                                type: 'object',
                                description: 'Permission avec conditions'
                            }
                        },
                        grouped_by_resource: {
                            type: 'object',
                            description: 'Permissions groupées par type de ressource'
                        },
                        total: { type: 'number', example: 12 }
                    }
                }
            }
        }
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('permissions:read', access_enums_1.ResourceType.PERMISSION, access_enums_1.PermissionAction.READ)),
    __param(0, (0, common_1.Param)('roleId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "getRolePermissions", null);
__decorate([
    (0, common_1.Get)('user/:userId/effective'),
    (0, swagger_1.ApiOperation)({
        summary: 'Récupérer les permissions effectives d\'un utilisateur',
        description: `
      Calcule et récupère toutes les permissions effectives d'un utilisateur.
      
      **Calcul des permissions effectives:**
      - Permissions directes des rôles de l'utilisateur
      - Permissions héritées via hiérarchie des rôles
      - Déduplication et fusion intelligente
      - Application des conditions contextuelles
      
      **Informations détaillées:**
      - Permissions directes vs héritées
      - Rôles contribuant à chaque permission
      - Conditions d'application de chaque permission
      - Métadonnées de calcul (cache, performance)
    `
    }),
    (0, swagger_1.ApiParam)({
        name: 'userId',
        description: 'Identifiant unique de l\'utilisateur',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Permissions effectives de l\'utilisateur récupérées avec succès',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    description: 'Permissions effectives avec détails de calcul'
                }
            }
        }
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('permissions:read', access_enums_1.ResourceType.PERMISSION, access_enums_1.PermissionAction.READ, {
        resource_id_param: 'userId',
        allow_owner_override: true
    })),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "getUserEffectivePermissions", null);
__decorate([
    (0, common_1.Post)('initialize-system'),
    (0, swagger_1.ApiOperation)({
        summary: 'Initialiser les permissions système',
        description: `
      Initialise ou met à jour les permissions système de base.
      
      **Permissions système créées:**
      - Gestion des utilisateurs (CRUD)
      - Gestion des événements (CRUD + manage)
      - Gestion des organisateurs
      - Gestion des droits d'accès
      - Gestion des rôles et permissions
      
      **Sécurité:**
      - Seuls les super-administrateurs peuvent exécuter
      - Action auditée
      - Permissions existantes préservées
      - Validation de l'intégrité après création
    `
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Permissions système initialisées avec succès',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        permissions_created: { type: 'number', example: 25 },
                        permissions_updated: { type: 'number', example: 3 },
                        permissions_skipped: { type: 'number', example: 12 }
                    }
                },
                message: { type: 'string', example: 'Permissions système initialisées avec succès' }
            }
        }
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('permissions:manage:system', access_enums_1.ResourceType.PERMISSION, access_enums_1.PermissionAction.MANAGE)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "initializeSystemPermissions", null);
exports.PermissionsController = PermissionsController = __decorate([
    (0, swagger_1.ApiTags)('Permissions Management'),
    (0, common_1.Controller)('permissions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [permissions_service_1.PermissionsService,
        rbac_service_1.RbacService])
], PermissionsController);
//# sourceMappingURL=permissions.controller.js.map