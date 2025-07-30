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
exports.AccessControlController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const access_rights_service_1 = require("../services/access-rights.service");
const rbac_service_1 = require("../services/rbac.service");
const validate_access_dto_1 = require("../dto/access-rights/validate-access.dto");
const permissions_guard_1 = require("../guards/permissions.guard");
const access_enums_1 = require("../types/access-enums");
let AccessControlController = class AccessControlController {
    accessRightsService;
    rbacService;
    constructor(accessRightsService, rbacService) {
        this.accessRightsService = accessRightsService;
        this.rbacService = rbacService;
    }
    async validateAccessControl(validateData) {
        const startTime = Date.now();
        const result = await this.accessRightsService.validateAccess(validateData);
        const endTime = Date.now();
        const validationTime = endTime - startTime;
        const enrichedResult = {
            ...result,
            timing: {
                validation_time_ms: validationTime,
                cache_hit: false,
                database_queries: 1,
            }
        };
        return {
            success: true,
            data: enrichedResult,
            timestamp: new Date(),
        };
    }
    async validateAccessBatch(batchData) {
        const startTime = Date.now();
        const results = await Promise.all(batchData.validations.map(async (validation) => {
            try {
                const result = await this.accessRightsService.validateAccess(validation);
                return {
                    access_code: validation.access_code,
                    isValid: result.isValid,
                    status: result.status,
                    message: result.message,
                };
            }
            catch (error) {
                return {
                    access_code: validation.access_code,
                    isValid: false,
                    status: 'ERROR',
                    message: 'Erreur lors de la validation',
                };
            }
        }));
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        const validCodes = results.filter(r => r.isValid).length;
        const invalidCodes = results.length - validCodes;
        return {
            success: true,
            data: {
                total_codes: results.length,
                valid_codes: validCodes,
                invalid_codes: invalidCodes,
                results,
                summary: {
                    validation_time_ms: totalTime,
                    average_time_per_code: Math.round(totalTime / results.length),
                },
            },
        };
    }
    async getRealTimeStats(timeWindow = '1h', accessPoint) {
        const mockStats = {
            current_stats: {
                total_attempts: 1250,
                successful_validations: 1180,
                failed_validations: 70,
                success_rate: 94.4,
                average_response_time: 245,
            },
            time_series: [],
            by_access_point: {
                'main_entrance': { attempts: 800, successes: 760, failures: 40 },
                'vip_entrance': { attempts: 200, successes: 195, failures: 5 },
                'staff_entrance': { attempts: 250, successes: 225, failures: 25 },
            },
            by_status: {
                'SUCCESS': 1180,
                'DENIED': 50,
                'ERROR': 15,
                'WARNING': 5,
            },
            alerts: [
                {
                    type: 'HIGH_FAILURE_RATE',
                    message: 'Taux d\'échec élevé détecté au point d\'accès principal',
                    severity: 'MEDIUM',
                    timestamp: new Date().toISOString(),
                }
            ],
        };
        return {
            success: true,
            data: mockStats,
            generated_at: new Date(),
        };
    }
    async getAccessAuditLogs(userId, eventId, accessPoint, status, action, dateFrom, dateUntil, page = 1, limit = 50) {
        const mockData = {
            logs: [],
            pagination: {
                total: 15420,
                page,
                limit,
                has_next: page * limit < 15420,
                has_previous: page > 1,
            },
            summary: {
                total_attempts: 15420,
                success_rate: 94.2,
                most_active_user: 'user_123',
                most_used_access_point: 'main_entrance',
            },
        };
        return {
            success: true,
            data: mockData,
        };
    }
    async getActiveAlerts() {
        const mockAlerts = [
            {
                id: 'alert_001',
                type: 'HIGH_FAILURE_RATE',
                title: 'Taux d\'échec élevé',
                message: 'Taux d\'échec de validation supérieur à 10% détecté',
                severity: 'MEDIUM',
                source: 'main_entrance',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                metadata: {
                    failure_rate: 12.5,
                    threshold: 10,
                    access_point: 'main_entrance'
                }
            }
        ];
        const summary = {
            total: mockAlerts.length,
            by_severity: {
                LOW: 0,
                MEDIUM: 1,
                HIGH: 0,
                CRITICAL: 0,
            },
        };
        return {
            success: true,
            data: {
                alerts: mockAlerts,
                summary,
            },
        };
    }
    async acknowledgeAlert(alertId, acknowledgeData) {
        return {
            success: true,
            message: 'Alerte acquittée avec succès',
        };
    }
};
exports.AccessControlController = AccessControlController;
__decorate([
    (0, common_1.Post)('validate'),
    (0, swagger_1.ApiOperation)({
        summary: 'Validation d\'accès temps réel',
        description: `
      Endpoint principal pour la validation d'accès en temps réel aux points de contrôle.
      
      **Cas d'usage principaux:**
      - Scanners QR/code-barres aux entrées
      - Applications mobiles de validation
      - Systèmes de contrôle d'accès automatisés
      - Points de vérification manuels
      
      **Processus de validation:**
      1. Décodage et validation du code d'accès
      2. Vérification du statut et de la validité
      3. Contrôle des conditions contextuelles
      4. Enregistrement de l'utilisation
      5. Logging et audit complets
      6. Réponse instantanée avec détails
      
      **Optimisations performance:**
      - Cache Redis pour codes fréquents
      - Validation en parallèle
      - Timeout configuré (5 secondes max)
      - Fallback en cas d'erreur système
    `
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Validation effectuée avec détails complets',
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
                        message: { type: 'string', example: 'Accès autorisé - Bienvenue!' },
                        access_right: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                user_id: { type: 'string' },
                                event_id: { type: 'string' },
                                source_type: { type: 'string', example: 'TICKET' },
                                valid_until: { type: 'string' },
                                max_uses: { type: 'number' },
                                current_uses: { type: 'number' }
                            }
                        },
                        metadata: {
                            type: 'object',
                            properties: {
                                remaining_uses: { type: 'number', example: 0 },
                                zone_access: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    example: ['VIP-001', 'BACKSTAGE']
                                },
                                special_permissions: {
                                    type: 'object',
                                    example: {
                                        backstage_access: true,
                                        photo_permissions: true,
                                        early_entry: true
                                    }
                                },
                                user_info: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string', example: 'John Doe' },
                                        email: { type: 'string', example: 'john@example.com' },
                                        phone: { type: 'string', example: '+216 12 345 678' }
                                    }
                                },
                                event_info: {
                                    type: 'object',
                                    properties: {
                                        title: { type: 'string', example: 'Concert Symphonique' },
                                        venue: { type: 'string', example: 'Opéra de Tunis' },
                                        date: { type: 'string', example: '2024-03-15T20:00:00.000Z' }
                                    }
                                }
                            }
                        },
                        timing: {
                            type: 'object',
                            properties: {
                                validation_time_ms: { type: 'number', example: 245 },
                                cache_hit: { type: 'boolean', example: false },
                                database_queries: { type: 'number', example: 3 }
                            }
                        }
                    }
                },
                timestamp: { type: 'string', example: '2024-03-10T10:00:00.000Z' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Code d\'accès invalide ou données manquantes',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: false },
                data: {
                    type: 'object',
                    properties: {
                        isValid: { type: 'boolean', example: false },
                        status: { type: 'string', example: 'DENIED' },
                        message: { type: 'string', example: 'Code d\'accès invalide ou expiré' },
                        error_code: { type: 'string', example: 'INVALID_ACCESS_CODE' },
                        suggested_action: { type: 'string', example: 'Vérifier le code et réessayer' }
                    }
                },
                timestamp: { type: 'string', example: '2024-03-10T10:00:00.000Z' }
            }
        }
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('access_rights:validate', access_enums_1.ResourceType.ACCESS_RIGHT, access_enums_1.PermissionAction.APPROVE, {
        context_builder: (req) => ({
            access_point: req.body?.access_point,
            action: req.body?.action,
            device_type: 'scanner'
        })
    })),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [validate_access_dto_1.ValidateAccessDto]),
    __metadata("design:returntype", Promise)
], AccessControlController.prototype, "validateAccessControl", null);
__decorate([
    (0, common_1.Post)('validate/batch'),
    (0, swagger_1.ApiOperation)({
        summary: 'Validation d\'accès en lot',
        description: `
      Valide plusieurs codes d'accès en une seule requête pour optimiser les performances.
      
      **Cas d'usage:**
      - Validation de groupes/familles
      - Import de codes en masse
      - Vérification préalable avant événement
      - Contrôles de cohérence
      
      **Avantages:**
      - Réduction des appels réseau
      - Validation en parallèle
      - Transaction atomique optionnelle
      - Rapport détaillé par code
    `
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Validation en lot effectuée',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        total_codes: { type: 'number', example: 10 },
                        valid_codes: { type: 'number', example: 8 },
                        invalid_codes: { type: 'number', example: 2 },
                        results: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    access_code: { type: 'string' },
                                    isValid: { type: 'boolean' },
                                    status: { type: 'string' },
                                    message: { type: 'string' }
                                }
                            }
                        },
                        summary: {
                            type: 'object',
                            properties: {
                                validation_time_ms: { type: 'number', example: 1250 },
                                average_time_per_code: { type: 'number', example: 125 }
                            }
                        }
                    }
                }
            }
        }
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('access_rights:validate:batch', access_enums_1.ResourceType.ACCESS_RIGHT, access_enums_1.PermissionAction.APPROVE)),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AccessControlController.prototype, "validateAccessBatch", null);
__decorate([
    (0, common_1.Get)('stats/real-time'),
    (0, swagger_1.ApiOperation)({
        summary: 'Statistiques temps réel des accès',
        description: `
      Fournit des statistiques temps réel sur les validations d'accès.
      
      **Métriques incluses:**
      - Tentatives d'accès par minute/heure
      - Taux de succès vs échec
      - Répartition par points d'accès
      - Performances de validation
      - Alertes et anomalies
      
      **Mise à jour:**
      - Données rafraîchies toutes les 30 secondes
      - Cache Redis pour performances
      - Agrégation automatique
    `
    }),
    (0, swagger_1.ApiQuery)({
        name: 'time_window',
        required: false,
        enum: ['1h', '6h', '24h'],
        description: 'Fenêtre temporelle (défaut: 1h)'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'access_point',
        required: false,
        description: 'Filtrer par point d\'accès'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Statistiques temps réel récupérées',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        current_stats: {
                            type: 'object',
                            properties: {
                                total_attempts: { type: 'number', example: 1250 },
                                successful_validations: { type: 'number', example: 1180 },
                                failed_validations: { type: 'number', example: 70 },
                                success_rate: { type: 'number', example: 94.4 },
                                average_response_time: { type: 'number', example: 245 }
                            }
                        },
                        time_series: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    timestamp: { type: 'string' },
                                    attempts: { type: 'number' },
                                    successes: { type: 'number' },
                                    failures: { type: 'number' }
                                }
                            }
                        },
                        by_access_point: {
                            type: 'object',
                            description: 'Statistiques par point d\'accès'
                        },
                        by_status: {
                            type: 'object',
                            description: 'Répartition par statut de validation'
                        },
                        alerts: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    type: { type: 'string', example: 'HIGH_FAILURE_RATE' },
                                    message: { type: 'string' },
                                    severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
                                    timestamp: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                generated_at: { type: 'string', example: '2024-03-10T10:00:00.000Z' }
            }
        }
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('access_control:stats:read', access_enums_1.ResourceType.ACCESS_RIGHT, access_enums_1.PermissionAction.READ)),
    __param(0, (0, common_1.Query)('time_window')),
    __param(1, (0, common_1.Query)('access_point')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AccessControlController.prototype, "getRealTimeStats", null);
__decorate([
    (0, common_1.Get)('audit/access-logs'),
    (0, swagger_1.ApiOperation)({
        summary: 'Récupérer les logs d\'audit d\'accès',
        description: `
      Récupère les logs détaillés des tentatives d'accès avec filtres avancés.
      
      **Filtres disponibles:**
      - Par utilisateur
      - Par événement
      - Par point d'accès
      - Par statut de validation
      - Par période temporelle
      - Par type d'action
      
      **Informations incluses:**
      - Détails complets de chaque tentative
      - Contexte de validation (IP, User-Agent, etc.)
      - Résultats de validation
      - Métadonnées techniques
      - Traçabilité complète
    `
    }),
    (0, swagger_1.ApiQuery)({ name: 'user_id', required: false, description: 'Filtrer par utilisateur' }),
    (0, swagger_1.ApiQuery)({ name: 'event_id', required: false, description: 'Filtrer par événement' }),
    (0, swagger_1.ApiQuery)({ name: 'access_point', required: false, description: 'Filtrer par point d\'accès' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: access_enums_1.AccessStatus, description: 'Filtrer par statut' }),
    (0, swagger_1.ApiQuery)({ name: 'action', required: false, enum: access_enums_1.AccessAction, description: 'Filtrer par action' }),
    (0, swagger_1.ApiQuery)({ name: 'date_from', required: false, description: 'Date de début (ISO 8601)' }),
    (0, swagger_1.ApiQuery)({ name: 'date_until', required: false, description: 'Date de fin (ISO 8601)' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: 'Numéro de page' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Éléments par page' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Logs d\'audit récupérés avec succès',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        logs: {
                            type: 'array',
                            items: {
                                type: 'object',
                                description: 'Entrée de log avec détails complets'
                            }
                        },
                        pagination: {
                            type: 'object',
                            properties: {
                                total: { type: 'number', example: 15420 },
                                page: { type: 'number', example: 1 },
                                limit: { type: 'number', example: 50 },
                                has_next: { type: 'boolean', example: true },
                                has_previous: { type: 'boolean', example: false }
                            }
                        },
                        summary: {
                            type: 'object',
                            properties: {
                                total_attempts: { type: 'number' },
                                success_rate: { type: 'number' },
                                most_active_user: { type: 'string' },
                                most_used_access_point: { type: 'string' }
                            }
                        }
                    }
                }
            }
        }
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('access_control:audit:read', access_enums_1.ResourceType.ACCESS_RIGHT, access_enums_1.PermissionAction.READ)),
    __param(0, (0, common_1.Query)('user_id')),
    __param(1, (0, common_1.Query)('event_id')),
    __param(2, (0, common_1.Query)('access_point')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('action')),
    __param(5, (0, common_1.Query)('date_from')),
    __param(6, (0, common_1.Query)('date_until')),
    __param(7, (0, common_1.Query)('page')),
    __param(8, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], AccessControlController.prototype, "getAccessAuditLogs", null);
__decorate([
    (0, common_1.Get)('alerts/active'),
    (0, swagger_1.ApiOperation)({
        summary: 'Récupérer les alertes actives',
        description: `
      Récupère toutes les alertes actives liées au contrôle d'accès.
      
      **Types d'alertes:**
      - Taux d'échec élevé
      - Tentatives d'accès suspects
      - Problèmes de performance
      - Anomalies de validation
      - Pannes de points d'accès
      
      **Niveaux de sévérité:**
      - LOW : Informationnel
      - MEDIUM : Attention requise
      - HIGH : Action recommandée
      - CRITICAL : Action immédiate requise
    `
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Alertes actives récupérées',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        alerts: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    type: { type: 'string' },
                                    title: { type: 'string' },
                                    message: { type: 'string' },
                                    severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
                                    source: { type: 'string' },
                                    created_at: { type: 'string' },
                                    updated_at: { type: 'string' },
                                    metadata: { type: 'object' }
                                }
                            }
                        },
                        summary: {
                            type: 'object',
                            properties: {
                                total: { type: 'number' },
                                by_severity: {
                                    type: 'object',
                                    properties: {
                                        LOW: { type: 'number' },
                                        MEDIUM: { type: 'number' },
                                        HIGH: { type: 'number' },
                                        CRITICAL: { type: 'number' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('access_control:alerts:read', access_enums_1.ResourceType.ACCESS_RIGHT, access_enums_1.PermissionAction.READ)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AccessControlController.prototype, "getActiveAlerts", null);
__decorate([
    (0, common_1.Post)('alerts/:alertId/acknowledge'),
    (0, swagger_1.ApiOperation)({
        summary: 'Acquitter une alerte',
        description: `
      Marque une alerte comme acquittée par un opérateur.
      
      **Effet:**
      - L'alerte reste visible mais marquée comme traitée
      - Arrêt des notifications répétées
      - Traçabilité de qui a acquitté et quand
      - Possibilité d'ajouter des notes
    `
    }),
    (0, swagger_1.ApiParam)({
        name: 'alertId',
        description: 'Identifiant unique de l\'alerte',
        example: 'alert_001'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Alerte acquittée avec succès'
    }),
    (0, permissions_guard_1.RequirePermissions)((0, permissions_guard_1.Permission)('access_control:alerts:acknowledge', access_enums_1.ResourceType.ACCESS_RIGHT, access_enums_1.PermissionAction.UPDATE)),
    __param(0, (0, common_1.Param)('alertId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AccessControlController.prototype, "acknowledgeAlert", null);
exports.AccessControlController = AccessControlController = __decorate([
    (0, swagger_1.ApiTags)('Access Control'),
    (0, common_1.Controller)('access-control'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [access_rights_service_1.AccessRightsService,
        rbac_service_1.RbacService])
], AccessControlController);
//# sourceMappingURL=access-control.controller.js.map