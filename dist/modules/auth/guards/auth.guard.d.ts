import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LoggerService } from '../../../shared/logger/logger.service';
declare const AuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class AuthGuard extends AuthGuard_base implements CanActivate {
    private reflector;
    private readonly logger;
    constructor(reflector: Reflector, logger: LoggerService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    handleRequest(err: any, user: any, info: any, context: ExecutionContext): any;
    private checkPermissions;
    private checkRoles;
    private checkMinimumLevel;
}
export {};
