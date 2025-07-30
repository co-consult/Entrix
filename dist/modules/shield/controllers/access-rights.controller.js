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
exports.AccessRightsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const access_rights_service_1 = require("../services/access-rights.service");
const access_rights_1 = require("../dto/access-rights");
const permissions_guard_1 = require("../guards/permissions.guard");
const access_enums_1 = require("../types/access-enums");
let AccessRightsController = class AccessRightsController {
    accessRightsService;
    constructor(accessRightsService) {
        this.accessRightsService = accessRightsService;
    }
    async createAccessRight(createData) {
        const accessRight = await this.accessRightsService.create(createData);
        return {
            success: true,
            data: accessRight,
            message: 'Droit d\'accès créé avec succès',
        };
    }
    async getAccessRight(id) {
        const accessRight = await this.accessRightsService.findById(id);
        return {
            success: true,
            data: accessRight,
        };
    }
    async listAccessRights(query) {
        const result = await this.accessRightsService.findMany(query);
        return {
            success: true,
            data: result,
        };
    }
    async updateAccessRight(id, updateData) {
        const accessRight = await this.accessRightsService.update(id, updateData);
        return {
            success: true,
            data: accessRight,
            message: 'Droit d\'accès mis à jour avec succès',
        };
    }
    async validateAccess(validateData) {
        const result = await this.accessRightsService.validateAccess(validateData);
        return {
            success: true,
            data: result,
        };
    }
    async getAccessRightByCode(accessCode) {
        const accessRight = await this.accessRightsService.findByAccessCode(accessCode);
        return {
            success: true,
            data: accessRight,
        };
    }
    async getUserAccessRights(userId, includeExpired = false) {
        const query = new access_rights_1.AccessRightsQueryDto();
        query.user_id = userId;
        query.include_expired = includeExpired;
        query.limit = 100;
        const result = await this.accessRightsService.findMany(query);
        const summary = result.access_rights.reduce((acc, ar) => {
            acc.total++;
            switch (ar.status) {
                case access_enums_1.AccessRightStatus.VALID:
                    acc.valid++;
                    break;
                case access_enums_1.AccessRightStatus.EXPIRED:
                    acc.expired++;
                    break;
                case access_enums_1.AccessRightStatus.USED:
                    acc.used++;
                    break;
            }
            return acc;
        }, { total: 0, valid: 0, expired: 0, used: 0 });
        return {
            success: true,
            data: {
                ...result,
                summary,
            },
        };
    }
};
exports.AccessRightsController = AccessRightsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Créer un nouveau droit d\'accès',
        description: `
      Crée un nouveau droit d'accès dans le système.
      
      **Fonctionnalités:**
      - Génération automatique d'un code d'accès unique
      - Validation des données métier
      - Support des permissions spéciales
      - Audit complet de la création
      
      **Types de sources supportés:**
      - TICKET : Droit lié à un ticket
      - SUBSCRIPTION : Droit lié à un abonnement
      - INVITATION : Droit lié à une invitation
      - STAFF_PASS : Pass personnel
      - VIP_PASS : Pass VIP
      - Et autres types définis dans le système
    `
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Droit d\'accès créé avec succès',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
                        user_id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174001' },
                        event_id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174002' },
                        source_type: { type: 'string', example: 'TICKET' },
                        access_code: { type: 'string', example: 'A1B2C3D4E5F6G7H8' },
                        status: { type: 'string', example: 'VALID' },
                        valid_from: { type: 'string', example: '2024-03-15T18:00:00.000Z' },
                        valid_until: { type: 'string', example: '2024-03-15T23:00:00.000Z' },
                        max_uses: { type: 'number', example: 1 },
                        current_uses: { type: 'number', example: 0 },
                        access_metadata: {
                            type: 'object',
                            example: {
                                category: 'VIP',
                                benefits: ['lounge_access', 'premium_parking']
                            }
                        },
                        special_permissions: {
                            type: 'object',
                            example: {
                                backstage_access: true,
                                photo_permissions: true
                            }
                        },
                        created_at: { type: 'string', example: '2024-03-10T10:00:00.000Z' },
                        updated_at: { type: 'string', example: '2024-03-10T10:00:00.000Z' }
                    }
                },
                message: { type: 'string', example: 'Droit d\'accès créé avec succès' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Données invalides',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: false },
                error: {
                    type: 'object',
                    properties: {
                        code: { type: 'string', example: 'INVALID_DATA' },
                        message: { type: 'string', example: 'La date de début doit être antérieure à la date de fin' },
                        details: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: { type: 'string', example: 'valid_from' },
                                    message: { type: 'string', example: 'Date invalide' }
                                }
                            }
                        }
                    }
                }
            }
        }
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('access_rights:create', access_enums_1.ResourceType.ACCESS_RIGHT, access_enums_1.PermissionAction.CREATE, {
        context_builder: (req) => ({
            organizer_id: req.body?.organizer_id,
            event_id: req.body?.event_id
        })
    })),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [access_rights_1.CreateAccessRightDto]),
    __metadata("design:returntype", Promise)
], AccessRightsController.prototype, "createAccessRight", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Récupérer un droit d\'accès par ID',
        description: `
      Récupère les détails complets d'un droit d'accès spécifique.
      
      **Informations incluses:**
      - Détails du droit d'accès
      - Informations sur l'utilisateur propriétaire
      - Détails de l'événement associé
      - Zone et siège si spécifiés
      - Métadonnées et permissions spéciales
      - Historique d'utilisation
    `
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Identifiant unique du droit d\'accès',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Droit d\'accès récupéré avec succès',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    description: 'Détails complets du droit d\'accès avec relations'
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Droit d\'accès introuvable',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: false },
                error: {
                    type: 'object',
                    properties: {
                        code: { type: 'string', example: 'NOT_FOUND' },
                        message: { type: 'string', example: 'Droit d\'accès avec l\'ID 123... introuvable' }
                    }
                }
            }
        }
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('access_rights:read', access_enums_1.ResourceType.ACCESS_RIGHT, access_enums_1.PermissionAction.READ, {
        resource_id_param: 'id',
        allow_owner_override: true
    })),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AccessRightsController.prototype, "getAccessRight", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Lister les droits d\'accès avec filtres',
        description: `
      Récupère une liste paginée des droits d'accès avec options de filtrage avancées.
      
      **Filtres disponibles:**
      - Par utilisateur
      - Par événement
      - Par organisateur
      - Par statut
      - Par type de source
      - Par zone
      - Par période de validité
      
      **Tri et pagination:**
      - Tri par date de création (plus récent en premier)
      - Pagination avec limite configurable
      - Support du curseur pour pagination efficace
    `
    }),
    (0, swagger_1.ApiQuery)({ name: 'user_id', required: false, description: 'Filtrer par ID utilisateur' }),
    (0, swagger_1.ApiQuery)({ name: 'event_id', required: false, description: 'Filtrer par ID événement' }),
    (0, swagger_1.ApiQuery)({ name: 'organizer_id', required: false, description: 'Filtrer par ID organisateur' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: access_enums_1.AccessRightStatus, description: 'Filtrer par statut' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: 'Numéro de page (défaut: 1)' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Éléments par page (défaut: 20, max: 100)' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Liste des droits d\'accès récupérée avec succès',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        access_rights: {
                            type: 'array',
                            items: { type: 'object', description: 'Droit d\'accès avec relations de base' }
                        },
                        total: { type: 'number', example: 150 },
                        page: { type: 'number', example: 1 },
                        limit: { type: 'number', example: 20 },
                        has_next: { type: 'boolean', example: true }
                    }
                }
            }
        }
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('access_rights:read', access_enums_1.ResourceType.ACCESS_RIGHT, access_enums_1.PermissionAction.READ)),
    __param(0, (0, common_1.Query)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [access_rights_1.AccessRightsQueryDto]),
    __metadata("design:returntype", Promise)
], AccessRightsController.prototype, "listAccessRights", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Mettre à jour un droit d\'accès',
        description: `
      Met à jour les propriétés d'un droit d'accès existant.
      
      **Propriétés modifiables:**
      - Statut (VALID, SUSPENDED, CANCELLED, etc.)
      - Période de validité
      - Nombre maximum d'utilisations
      - Métadonnées d'accès
      - Permissions spéciales
      
      **Restrictions:**
      - Seul le propriétaire ou un administrateur peut modifier
      - Les droits expirés ou utilisés ont des restrictions
      - Les modifications sont auditées
    `
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Identifiant unique du droit d\'accès à modifier',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Droit d\'accès mis à jour avec succès',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    description: 'Droit d\'accès mis à jour avec toutes ses relations'
                },
                message: { type: 'string', example: 'Droit d\'accès mis à jour avec succès' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.FORBIDDEN,
        description: 'Permissions insuffisantes pour modifier ce droit d\'accès'
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('access_rights:update', access_enums_1.ResourceType.ACCESS_RIGHT, access_enums_1.PermissionAction.UPDATE, {
        resource_id_param: 'id',
        allow_owner_override: true,
        context_builder: (req) => ({
            organizer_id: req.params.organizerId,
            event_id: req.params.eventId
        })
    })),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, access_rights_1.UpdateAccessRightDto]),
    __metadata("design:returntype", Promise)
], AccessRightsController.prototype, "updateAccessRight", null);
__decorate([
    (0, common_1.Post)('validate'),
    (0, swagger_1.ApiOperation)({
        summary: 'Valider un droit d\'accès',
        description: `
      Valide un droit d'accès lors d'une tentative d'entrée ou d'action.
      
      **Processus de validation:**
      1. Vérification de l'existence du code d'accès
      2. Contrôle du statut et de la période de validité
      3. Vérification du nombre d'utilisations
      4. Validation des conditions contextuelles
      5. Enregistrement de l'utilisation si applicable
      6. Audit complet de la tentative
      
      **Actions supportées:**
      - ENTRY : Entrée sur le site
      - EXIT : Sortie du site
      - RE_ENTRY : Ré-entrée
      - ZONE_CHANGE : Changement de zone
      - VALIDATION : Simple validation
      - CHECK : Vérification sans utilisation
      
      **Contexte pris en compte:**
      - Géolocalisation
      - Point d'accès
      - Empreinte d'appareil
      - Adresse IP et User-Agent
      - Données additionnelles
    `
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Validation effectuée - succès ou échec avec détails',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        isValid: { type: 'boolean', example: true },
                        status: {
                            type: 'string',
                            enum: ['SUCCESS', 'DENIED', 'WARNING', 'ERROR'],
                            example: 'SUCCESS'
                        },
                        message: { type: 'string', example: 'Accès autorisé' },
                        access_right: {
                            type: 'object',
                            description: 'Détails du droit d\'accès validé'
                        },
                        metadata: {
                            type: 'object',
                            properties: {
                                remaining_uses: { type: 'number', example: 0 },
                                zone_access: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    example: ['VIP-001', 'GENERAL-A']
                                },
                                special_permissions: {
                                    type: 'object',
                                    example: {
                                        backstage_access: true,
                                        photo_permissions: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Données de validation invalides',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: false },
                error: {
                    type: 'object',
                    properties: {
                        code: { type: 'string', example: 'INVALID_ACCESS_CODE' },
                        message: { type: 'string', example: 'Le code d\'accès doit contenir 8 à 20 caractères alphanumériques majuscules' }
                    }
                }
            }
        }
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('access_rights:validate', access_enums_1.ResourceType.ACCESS_RIGHT, access_enums_1.PermissionAction.APPROVE, {
        context_builder: (req) => ({
            access_point: req.body?.access_point,
            action: req.body?.action
        })
    })),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [access_rights_1.ValidateAccessDto]),
    __metadata("design:returntype", Promise)
], AccessRightsController.prototype, "validateAccess", null);
__decorate([
    (0, common_1.Get)('code/:accessCode'),
    (0, swagger_1.ApiOperation)({
        summary: 'Récupérer un droit d\'accès par code d\'accès',
        description: `
      Récupère un droit d'accès en utilisant son code d'accès unique.
      Utile pour les systèmes de validation rapide.
      
      **Cas d'usage:**
      - Systèmes de scan QR/code-barres
      - Applications mobiles de validation
      - Points de contrôle d'accès
      - Vérification préalable sans validation
    `
    }),
    (0, swagger_1.ApiParam)({
        name: 'accessCode',
        description: 'Code d\'accès unique (8-20 caractères alphanumériques majuscules)',
        example: 'A1B2C3D4E5F6G7H8'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Droit d\'accès trouvé',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    description: 'Droit d\'accès avec relations de base'
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Code d\'accès introuvable'
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('access_rights:read', access_enums_1.ResourceType.ACCESS_RIGHT, access_enums_1.PermissionAction.READ)),
    __param(0, (0, common_1.Param)('accessCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AccessRightsController.prototype, "getAccessRightByCode", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Récupérer tous les droits d\'accès d\'un utilisateur',
        description: `
      Récupère tous les droits d'accès appartenant à un utilisateur spécifique.
      
      **Filtres automatiques:**
      - Droits actifs uniquement par défaut
      - Possibilité d'inclure les expirés
      - Tri par date de création
      
      **Informations incluses:**
      - Statut de chaque droit
      - Événements associés
      - Zones d'accès
      - Utilisation restante
    `
    }),
    (0, swagger_1.ApiParam)({
        name: 'userId',
        description: 'Identifiant unique de l\'utilisateur',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'include_expired',
        required: false,
        type: Boolean,
        description: 'Inclure les droits expirés (défaut: false)'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Droits d\'accès de l\'utilisateur récupérés',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        access_rights: {
                            type: 'array',
                            items: { type: 'object', description: 'Droit d\'accès avec événement associé' }
                        },
                        summary: {
                            type: 'object',
                            properties: {
                                total: { type: 'number', example: 5 },
                                valid: { type: 'number', example: 3 },
                                expired: { type: 'number', example: 1 },
                                used: { type: 'number', example: 1 }
                            }
                        }
                    }
                }
            }
        }
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('access_rights:read', access_enums_1.ResourceType.ACCESS_RIGHT, access_enums_1.PermissionAction.READ, {
        resource_id_param: 'userId',
        allow_owner_override: true
    })),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('include_expired')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], AccessRightsController.prototype, "getUserAccessRights", null);
exports.AccessRightsController = AccessRightsController = __decorate([
    (0, swagger_1.ApiTags)('Access Rights'),
    (0, common_1.Controller)('access-rights'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [access_rights_service_1.AccessRightsService])
], AccessRightsController);
//# sourceMappingURL=access-rights.controller.js.map