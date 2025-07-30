import { LoggerService } from '../../../shared/logger/logger.service';
import { Permission, UserRole, EffectivePermissions, PermissionContext } from '../interfaces/rbac.interface';
import { ResourceType } from '../types/access-enums';
export declare class PermissionCalculator {
    private readonly logger;
    constructor(loggerService: LoggerService);
    calculateEffectivePermissions(userRoles: UserRole[], hierarchyMap?: Map<string, string[]>): EffectivePermissions;
    evaluatePermission(permission: string, resourceType: ResourceType, effectivePermissions: EffectivePermissions, context?: PermissionContext): {
        granted: boolean;
        reason: string;
        conditions_met: boolean;
        source_permission?: Permission;
    };
    calculatePermissionScore(effectivePermissions: EffectivePermissions): {
        total_score: number;
        breakdown: {
            system_permissions: number;
            custom_permissions: number;
            role_level_bonus: number;
            scope_coverage: number;
        };
    };
    private filterActiveRoles;
    private collectDirectPermissions;
    private calculateInheritedPermissions;
    private deduplicatePermissions;
    private sortPermissionsByPriority;
    private evaluatePermissionConditions;
    private evaluateTimeRestrictions;
    private evaluateResourceFilters;
}
