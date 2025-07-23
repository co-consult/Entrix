import { ExecutionContext, CanActivate } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { LoggerService } from '../../../shared/logger/logger.service';
declare const JwtAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class JwtAuthGuard extends JwtAuthGuard_base implements CanActivate {
    private readonly reflector;
    private readonly logger;
    constructor(reflector: Reflector, loggerService: LoggerService);
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean>;
    handleRequest(err: any, user: any, info: any, context: ExecutionContext): any;
    private extractTokenFromRequest;
    private addSecurityHeaders;
}
export {};
