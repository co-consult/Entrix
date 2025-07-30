import { AccessRightsService } from '../services/access-rights.service';
import { RbacService } from '../services/rbac.service';
import { ValidateAccessDto } from '../dto/access-rights/validate-access.dto';
import { AccessValidationResult } from '../interfaces/rbac.interface';
import { AccessStatus, AccessAction } from '../types/access-enums';
export declare class AccessControlController {
    private readonly accessRightsService;
    private readonly rbacService;
    constructor(accessRightsService: AccessRightsService, rbacService: RbacService);
    validateAccessControl(validateData: ValidateAccessDto): Promise<{
        success: boolean;
        data: AccessValidationResult & {
            timing?: any;
        };
        timestamp: Date;
    }>;
    validateAccessBatch(batchData: {
        validations: ValidateAccessDto[];
        atomic?: boolean;
    }): Promise<{
        success: boolean;
        data: {
            total_codes: number;
            valid_codes: number;
            invalid_codes: number;
            results: Array<{
                access_code: string;
                isValid: boolean;
                status: string;
                message: string;
            }>;
            summary: {
                validation_time_ms: number;
                average_time_per_code: number;
            };
        };
    }>;
    getRealTimeStats(timeWindow?: '1h' | '6h' | '24h', accessPoint?: string): Promise<{
        success: boolean;
        data: any;
        generated_at: Date;
    }>;
    getAccessAuditLogs(userId?: string, eventId?: string, accessPoint?: string, status?: AccessStatus, action?: AccessAction, dateFrom?: string, dateUntil?: string, page?: number, limit?: number): Promise<{
        success: boolean;
        data: {
            logs: any[];
            pagination: any;
            summary: any;
        };
    }>;
    getActiveAlerts(): Promise<{
        success: boolean;
        data: {
            alerts: any[];
            summary: {
                total: number;
                by_severity: Record<string, number>;
            };
        };
    }>;
    acknowledgeAlert(alertId: string, acknowledgeData: {
        notes?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
