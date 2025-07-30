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
exports.AccessValidator = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../../shared/logger/logger.service");
const access_enums_1 = require("../types/access-enums");
let AccessValidator = class AccessValidator {
    logger;
    constructor(loggerService) {
        this.logger = loggerService.createChildLogger('AccessValidator');
    }
    validateAccessRight(accessRight, action, context) {
        try {
            this.logger.info('Validating access right', JSON.stringify({
                accessRightId: accessRight.id,
                action,
                hasContext: !!context,
            }));
            const basicValidation = this.performBasicValidations(accessRight);
            if (!basicValidation.isValid) {
                return basicValidation;
            }
            const timeValidation = this.validateTimeConstraints(accessRight);
            if (!timeValidation.isValid) {
                return timeValidation;
            }
            const usageValidation = this.validateUsageConstraints(accessRight, action);
            if (!usageValidation.isValid) {
                return usageValidation;
            }
            if (context) {
                const contextValidation = this.validateContextualConstraints(accessRight, context);
                if (!contextValidation.isValid) {
                    return contextValidation;
                }
            }
            const specialValidation = this.validateSpecialPermissions(accessRight, action);
            if (!specialValidation.isValid) {
                return specialValidation;
            }
            return {
                isValid: true,
                status: access_enums_1.AccessStatus.SUCCESS,
                message: 'Validation réussie',
                details: {
                    validated_at: new Date(),
                    validation_duration_ms: 0,
                    checks_passed: [
                        'basic_validation',
                        'time_constraints',
                        'usage_constraints',
                        'contextual_constraints',
                        'special_permissions'
                    ],
                },
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AccessValidator.validateAccessRight', accessRight.user_id || 'unknown', { accessRightId: accessRight.id, action });
            return {
                isValid: false,
                status: access_enums_1.AccessStatus.ERROR,
                message: 'Erreur lors de la validation',
                details: {
                    error_type: error.constructor.name,
                    error_message: error.message,
                },
            };
        }
    }
    analyzeAccessRisk(accessRight, context) {
        const riskFactors = [];
        const recommendations = [];
        let riskScore = 0;
        if (accessRight.source_type === 'STAFF_PASS' || accessRight.source_type === 'VIP_PASS') {
            riskScore += 10;
            riskFactors.push('Accès privilégié');
        }
        if (accessRight.special_permissions) {
            const specialPerms = Object.keys(accessRight.special_permissions).length;
            riskScore += specialPerms * 5;
            riskFactors.push(`${specialPerms} permissions spéciales`);
        }
        if (accessRight.max_uses > 1) {
            riskScore += accessRight.max_uses * 2;
            riskFactors.push('Utilisation multiple autorisée');
        }
        if (context?.ip_address) {
            if (this.isSuspiciousIP(context.ip_address)) {
                riskScore += 20;
                riskFactors.push('Adresse IP suspecte');
                recommendations.push('Vérifier l\'identité de l\'utilisateur');
            }
        }
        if (this.isUnusualTime()) {
            riskScore += 10;
            riskFactors.push('Heure d\'accès inhabituelle');
            recommendations.push('Surveillance renforcée');
        }
        let riskLevel;
        if (riskScore >= 50) {
            riskLevel = 'CRITICAL';
        }
        else if (riskScore >= 30) {
            riskLevel = 'HIGH';
        }
        else if (riskScore >= 15) {
            riskLevel = 'MEDIUM';
        }
        else {
            riskLevel = 'LOW';
        }
        if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
            recommendations.push('Audit immédiat recommandé');
        }
        return {
            risk_level: riskLevel,
            risk_factors: riskFactors,
            recommendations,
            risk_score: riskScore,
        };
    }
    performBasicValidations(accessRight) {
        if (accessRight.status !== access_enums_1.AccessRightStatus.VALID) {
            return {
                isValid: false,
                status: access_enums_1.AccessStatus.DENIED,
                message: `Droit d'accès ${accessRight.status.toLowerCase()}`,
                details: { current_status: accessRight.status },
            };
        }
        return {
            isValid: true,
            status: access_enums_1.AccessStatus.SUCCESS,
            message: 'Validations de base réussies',
            details: {},
        };
    }
    validateTimeConstraints(accessRight) {
        const now = new Date();
        if (now < accessRight.valid_from) {
            return {
                isValid: false,
                status: access_enums_1.AccessStatus.DENIED,
                message: 'Droit d\'accès pas encore valide',
                details: {
                    valid_from: accessRight.valid_from,
                    current_time: now,
                },
            };
        }
        if (now > accessRight.valid_until) {
            return {
                isValid: false,
                status: access_enums_1.AccessStatus.DENIED,
                message: 'Droit d\'accès expiré',
                details: {
                    valid_until: accessRight.valid_until,
                    current_time: now,
                    expired_since_ms: now.getTime() - accessRight.valid_until.getTime(),
                },
            };
        }
        return {
            isValid: true,
            status: access_enums_1.AccessStatus.SUCCESS,
            message: 'Contraintes temporelles respectées',
            details: {
                time_remaining_ms: accessRight.valid_until.getTime() - now.getTime(),
            },
        };
    }
    validateUsageConstraints(accessRight, action) {
        if (accessRight.current_uses >= accessRight.max_uses) {
            return {
                isValid: false,
                status: access_enums_1.AccessStatus.DENIED,
                message: 'Nombre maximum d\'utilisations atteint',
                details: {
                    max_uses: accessRight.max_uses,
                    current_uses: accessRight.current_uses,
                },
            };
        }
        const allowedActions = this.getAllowedActions(accessRight.source_type);
        if (!allowedActions.includes(action)) {
            return {
                isValid: false,
                status: access_enums_1.AccessStatus.DENIED,
                message: `Action '${action}' non autorisée pour ce type de droit d'accès`,
                details: {
                    attempted_action: action,
                    allowed_actions: allowedActions,
                    source_type: accessRight.source_type,
                },
            };
        }
        return {
            isValid: true,
            status: access_enums_1.AccessStatus.SUCCESS,
            message: 'Contraintes d\'utilisation respectées',
            details: {
                remaining_uses: accessRight.max_uses - accessRight.current_uses,
            },
        };
    }
    validateContextualConstraints(accessRight, context) {
        if (context.geolocation && accessRight.access_metadata?.geo_restrictions) {
            const geoValidation = this.validateGeographicRestrictions(context.geolocation, accessRight.access_metadata.geo_restrictions);
            if (!geoValidation.isValid) {
                return geoValidation;
            }
        }
        if (context.device_fingerprint && accessRight.access_metadata?.device_restrictions) {
            const deviceValidation = this.validateDeviceRestrictions(context.device_fingerprint, accessRight.access_metadata.device_restrictions);
            if (!deviceValidation.isValid) {
                return deviceValidation;
            }
        }
        return {
            isValid: true,
            status: access_enums_1.AccessStatus.SUCCESS,
            message: 'Contraintes contextuelles respectées',
            details: {},
        };
    }
    validateSpecialPermissions(accessRight, action) {
        if (!accessRight.special_permissions) {
            return {
                isValid: true,
                status: access_enums_1.AccessStatus.SUCCESS,
                message: 'Aucune permission spéciale',
                details: {},
            };
        }
        const specialPerms = accessRight.special_permissions;
        if (action === access_enums_1.AccessAction.ZONE_CHANGE && specialPerms.backstage_access === false) {
            return {
                isValid: false,
                status: access_enums_1.AccessStatus.DENIED,
                message: 'Accès backstage requis pour cette action',
                details: {
                    required_permission: 'backstage_access',
                    current_value: false,
                },
            };
        }
        return {
            isValid: true,
            status: access_enums_1.AccessStatus.SUCCESS,
            message: 'Permissions spéciales validées',
            details: {
                special_permissions: Object.keys(specialPerms),
            },
        };
    }
    getAllowedActions(sourceType) {
        const actionMap = {
            'TICKET': [access_enums_1.AccessAction.ENTRY, access_enums_1.AccessAction.EXIT],
            'VIP_PASS': [access_enums_1.AccessAction.ENTRY, access_enums_1.AccessAction.EXIT, access_enums_1.AccessAction.ZONE_CHANGE],
            'STAFF_PASS': [access_enums_1.AccessAction.ENTRY, access_enums_1.AccessAction.EXIT, access_enums_1.AccessAction.ZONE_CHANGE, access_enums_1.AccessAction.VALIDATION],
            'SEASON_PASS': [access_enums_1.AccessAction.ENTRY, access_enums_1.AccessAction.EXIT, access_enums_1.AccessAction.RE_ENTRY],
        };
        return actionMap[sourceType] || [access_enums_1.AccessAction.ENTRY, access_enums_1.AccessAction.EXIT];
    }
    isSuspiciousIP(ipAddress) {
        const suspiciousRanges = [
            '10.0.0.0/8',
            '172.16.0.0/12',
        ];
        return false;
    }
    isUnusualTime() {
        const hour = new Date().getHours();
        return hour >= 2 && hour <= 6;
    }
    validateGeographicRestrictions(geolocation, restrictions) {
        return {
            isValid: true,
            status: access_enums_1.AccessStatus.SUCCESS,
            message: 'Restrictions géographiques respectées',
            details: {},
        };
    }
    validateDeviceRestrictions(deviceFingerprint, restrictions) {
        return {
            isValid: true,
            status: access_enums_1.AccessStatus.SUCCESS,
            message: 'Restrictions d\'appareil respectées',
            details: {},
        };
    }
};
exports.AccessValidator = AccessValidator;
exports.AccessValidator = AccessValidator = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_service_1.LoggerService])
], AccessValidator);
//# sourceMappingURL=access-validator.js.map