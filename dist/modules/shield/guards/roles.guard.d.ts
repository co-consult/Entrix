import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RolesService } from '../services/roles.service';
import { RoleScope } from '../types/access-enums';
export declare const ROLES_KEY = "roles";
export declare class RolesGuard implements CanActivate {
    private readonly reflector;
    private readonly rolesService;
    private readonly logger;
    constructor(reflector: Reflector, rolesService: RolesService, loggerService: LoggerService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private getRoleRequirement;
    private validateAuthentication;
    private checkRoles;
    private logRoleGranted;
    private logRoleDenied;
    private handleError;
}
export declare const RequireRoles: (roles: string[], options?: {
    scope?: RoleScope;
    require_all?: boolean;
    min_level?: number;
}) => import("@nestjs/common").CustomDecorator<string>;
