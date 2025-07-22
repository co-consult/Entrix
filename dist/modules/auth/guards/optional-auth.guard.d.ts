import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LoggerService } from '../../../shared/logger/logger.service';
import { AuthUser } from '../../../common/types/auth.types';
declare const OptionalAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class OptionalAuthGuard extends OptionalAuthGuard_base implements CanActivate {
    private reflector;
    private readonly logger;
    constructor(reflector: Reflector, logger: LoggerService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    handleRequest(err: any, user: any, info: any, context: ExecutionContext): any;
    private checkPermissions;
    static hasUserPremiumAccess(request: any): boolean;
    static isUserAuthenticated(request: any): boolean;
    static getOptionalUser(request: any): AuthUser | null;
}
export {};
