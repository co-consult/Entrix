import { LoggerService } from '../../../shared/logger/logger.service';
import { AccessRight, AccessContext } from '../interfaces/rbac.interface';
import { AccessStatus, AccessAction } from '../types/access-enums';
export declare class AccessValidator {
    private readonly logger;
    constructor(loggerService: LoggerService);
    validateAccessRight(accessRight: AccessRight, action: AccessAction, context?: AccessContext): {
        isValid: boolean;
        status: AccessStatus;
        message: string;
        details: any;
    };
    analyzeAccessRisk(accessRight: AccessRight, context?: AccessContext): {
        risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        risk_factors: string[];
        recommendations: string[];
        risk_score: number;
    };
    private performBasicValidations;
    private validateTimeConstraints;
    private validateUsageConstraints;
    private validateContextualConstraints;
    private validateSpecialPermissions;
    private getAllowedActions;
    private isSuspiciousIP;
    private isUnusualTime;
    private validateGeographicRestrictions;
    private validateDeviceRestrictions;
}
