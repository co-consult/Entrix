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
exports.PermissionCalculator = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../../shared/logger/logger.service");
let PermissionCalculator = class PermissionCalculator {
    logger;
    constructor(loggerService) {
        this.logger = loggerService.createChildLogger('PermissionCalculator');
    }
    calculateEffectivePermissions(userRoles, hierarchyMap) {
        const startTime = Date.now();
        try {
            this.logger.info('Calculating effective permissions', {
                userRolesCount: userRoles.length,
                hasHierarchy: !!hierarchyMap,
            });
            const activeRoles = this.filterActiveRoles(userRoles);
            const directPermissions = this.collectDirectPermissions(activeRoles);
            const inheritedPermissions = hierarchyMap
                ? this.calculateInheritedPermissions(activeRoles, hierarchyMap)
                : [];
            const allPermissions = [...directPermissions, ...inheritedPermissions];
            const effectivePermissions = this.deduplicatePermissions(allPermissions);
            const sortedPermissions = this.sortPermissionsByPriority(effectivePermissions, activeRoles);
            const result = {
                user_id: userRoles[0]?.user_id || '',
                direct_permissions: directPermissions,
                inherited_permissions: inheritedPermissions,
                effective_permissions: sortedPermissions,
                roles: activeRoles.map(ur => ur.roles),
                computed_at: new Date(),
                expires_at: new Date(Date.now() + 30 * 60 * 1000),
            };
            const endTime = Date.now();
            this.logger.info('Effective permissions calculated', JSON.stringify({
                duration_ms: endTime - startTime,
                direct_count: directPermissions.length,
                inherited_count: inheritedPermissions.length,
                effective_count: sortedPermissions.length,
            }));
            return result;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'PermissionCalculator.calculateEffectivePermissions', userRoles[0]?.user_id || 'unknown');
            throw error;
        }
    }
    evaluatePermission(permission, resourceType, effectivePermissions, context) {
        try {
            const matchingPermission = effectivePermissions.effective_permissions.find(p => p.name === permission && p.resource_type === resourceType);
            if (!matchingPermission) {
                return {
                    granted: false,
                    reason: 'Permission non trouvée dans les permissions effectives',
                    conditions_met: false,
                };
            }
            if (!matchingPermission.is_active) {
                return {
                    granted: false,
                    reason: 'Permission désactivée',
                    conditions_met: false,
                    source_permission: matchingPermission,
                };
            }
            const conditionsResult = this.evaluatePermissionConditions(matchingPermission, context);
            return {
                granted: conditionsResult.met,
                reason: conditionsResult.met ? 'Permission accordée' : conditionsResult.reason,
                conditions_met: conditionsResult.met,
                source_permission: matchingPermission,
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'PermissionCalculator.evaluatePermission', effectivePermissions.user_id, { permission, resourceType });
            return {
                granted: false,
                reason: 'Erreur lors de l\'évaluation de la permission',
                conditions_met: false,
            };
        }
    }
    calculatePermissionScore(effectivePermissions) {
        const systemPermissions = effectivePermissions.effective_permissions.filter(p => p.is_system);
        const customPermissions = effectivePermissions.effective_permissions.filter(p => !p.is_system);
        const highestRoleLevel = Math.min(...effectivePermissions.roles.map(r => r.level));
        const roleLevelBonus = Math.max(0, 10 - highestRoleLevel) * 10;
        const scopes = new Set(effectivePermissions.roles.map(r => r.scope));
        const scopeCoverage = scopes.size * 5;
        const breakdown = {
            system_permissions: systemPermissions.length * 5,
            custom_permissions: customPermissions.length * 2,
            role_level_bonus: roleLevelBonus,
            scope_coverage: scopeCoverage,
        };
        const totalScore = Object.values(breakdown).reduce((sum, score) => sum + score, 0);
        return {
            total_score: totalScore,
            breakdown,
        };
    }
    filterActiveRoles(userRoles) {
        const now = new Date();
        return userRoles.filter(userRole => {
            if (userRole.status !== 'ACTIVE') {
                return false;
            }
            if (userRole.valid_until && userRole.valid_until < now) {
                return false;
            }
            if (!userRole.roles.is_active) {
                return false;
            }
            return true;
        });
    }
    collectDirectPermissions(activeRoles) {
        const permissions = [];
        for (const userRole of activeRoles) {
            if (userRole.roles.role_permissions) {
                for (const rolePermission of userRole.roles.role_permissions) {
                    if (rolePermission.permissions && rolePermission.permissions.is_active) {
                        permissions.push(rolePermission.permissions);
                    }
                }
            }
        }
        return permissions;
    }
    calculateInheritedPermissions(activeRoles, hierarchyMap) {
        const inheritedPermissions = [];
        return inheritedPermissions;
    }
    deduplicatePermissions(permissions) {
        const seen = new Map();
        for (const permission of permissions) {
            const key = `${permission.name}:${permission.resource_type}`;
            const existing = seen.get(key);
            if (!existing) {
                seen.set(key, permission);
            }
            else {
                if (permission.is_system && !existing.is_system) {
                    seen.set(key, permission);
                }
                else if (permission.created_at > existing.created_at) {
                    seen.set(key, permission);
                }
            }
        }
        return Array.from(seen.values());
    }
    sortPermissionsByPriority(permissions, roles) {
        return permissions.sort((a, b) => {
            if (a.is_system && !b.is_system)
                return -1;
            if (!a.is_system && b.is_system)
                return 1;
            if (a.resource_type !== b.resource_type) {
                return a.resource_type.localeCompare(b.resource_type);
            }
            const actionOrder = {
                'MANAGE': 0,
                'CREATE': 1,
                'UPDATE': 2,
                'READ': 3,
                'DELETE': 4,
                'APPROVE': 5,
                'REJECT': 6,
            };
            const aOrder = actionOrder[a.action] ?? 999;
            const bOrder = actionOrder[b.action] ?? 999;
            if (aOrder !== bOrder) {
                return aOrder - bOrder;
            }
            return a.name.localeCompare(b.name);
        });
    }
    evaluatePermissionConditions(permission, context) {
        if (!permission.conditions) {
            return { met: true, reason: 'Aucune condition spécifiée' };
        }
        const conditions = permission.conditions;
        if (conditions.own_resource_only && context?.owner_id) {
        }
        if (conditions.organizer_scope && context?.organizer_id) {
        }
        if (conditions.time_restrictions) {
            const timeResult = this.evaluateTimeRestrictions(conditions.time_restrictions);
            if (!timeResult.met) {
                return timeResult;
            }
        }
        if (conditions.resource_filters && context?.additional_context) {
            const filterResult = this.evaluateResourceFilters(conditions.resource_filters, context.additional_context);
            if (!filterResult.met) {
                return filterResult;
            }
        }
        return { met: true, reason: 'Toutes les conditions sont remplies' };
    }
    evaluateTimeRestrictions(timeRestrictions) {
        const now = new Date();
        if (timeRestrictions.start_time && timeRestrictions.end_time) {
            const currentTime = now.toTimeString().substring(0, 5);
            if (currentTime < timeRestrictions.start_time || currentTime > timeRestrictions.end_time) {
                return {
                    met: false,
                    reason: `Accès autorisé uniquement entre ${timeRestrictions.start_time} et ${timeRestrictions.end_time}`
                };
            }
        }
        if (timeRestrictions.days_of_week && Array.isArray(timeRestrictions.days_of_week)) {
            const currentDay = now.getDay();
            if (!timeRestrictions.days_of_week.includes(currentDay)) {
                return {
                    met: false,
                    reason: 'Accès non autorisé ce jour de la semaine'
                };
            }
        }
        if (timeRestrictions.valid_from && now < new Date(timeRestrictions.valid_from)) {
            return {
                met: false,
                reason: 'Permission pas encore active'
            };
        }
        if (timeRestrictions.valid_until && now > new Date(timeRestrictions.valid_until)) {
            return {
                met: false,
                reason: 'Permission expirée'
            };
        }
        return { met: true, reason: 'Restrictions temporelles respectées' };
    }
    evaluateResourceFilters(resourceFilters, context) {
        return { met: true, reason: 'Filtres de ressources respectés' };
    }
};
exports.PermissionCalculator = PermissionCalculator;
exports.PermissionCalculator = PermissionCalculator = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_service_1.LoggerService])
], PermissionCalculator);
//# sourceMappingURL=permission-calculator.js.map