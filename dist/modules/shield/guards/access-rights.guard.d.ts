import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LoggerService } from '../../../shared/logger/logger.service';
import { AccessRightsService } from '../services/access-rights.service';
import { AccessSourceType } from '../types/access-enums';
interface AccessRightRequirement {
    source_types?: AccessSourceType[];
    require_valid?: boolean;
    require_unused?: boolean;
    event_context?: boolean;
    zone_context?: boolean;
}
export declare const ACCESS_RIGHTS_KEY = "access_rights";
export declare class AccessRightsGuard implements CanActivate {
    private readonly reflector;
    private readonly accessRightsService;
    private readonly logger;
    constructor(reflector: Reflector, accessRightsService: AccessRightsService, loggerService: LoggerService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private getAccessRightRequirement;
    private validateAuthentication;
    private getUserAccessRights;
    private checkAccessRights;
    private logAccessRightGranted;
    private logAccessRightDenied;
    private handleError;
}
export declare const RequireAccessRights: (requirement: AccessRightRequirement) => any;
export {};
