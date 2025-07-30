import { AccessRightsService } from '../services/access-rights.service';
import { CreateAccessRightDto, UpdateAccessRightDto, ValidateAccessDto, AccessRightsQueryDto } from '../dto/access-rights';
import { AccessRight, AccessValidationResult, AccessRightsListResponse } from '../interfaces/rbac.interface';
export declare class AccessRightsController {
    private readonly accessRightsService;
    constructor(accessRightsService: AccessRightsService);
    createAccessRight(createData: CreateAccessRightDto): Promise<{
        success: boolean;
        data: AccessRight;
        message: string;
    }>;
    getAccessRight(id: string): Promise<{
        success: boolean;
        data: AccessRight;
    }>;
    listAccessRights(query: AccessRightsQueryDto): Promise<{
        success: boolean;
        data: AccessRightsListResponse;
    }>;
    updateAccessRight(id: string, updateData: UpdateAccessRightDto): Promise<{
        success: boolean;
        data: AccessRight;
        message: string;
    }>;
    validateAccess(validateData: ValidateAccessDto): Promise<{
        success: boolean;
        data: AccessValidationResult;
    }>;
    getAccessRightByCode(accessCode: string): Promise<{
        success: boolean;
        data: AccessRight;
    }>;
    getUserAccessRights(userId: string, includeExpired?: boolean): Promise<{
        success: boolean;
        data: AccessRightsListResponse & {
            summary: any;
        };
    }>;
}
