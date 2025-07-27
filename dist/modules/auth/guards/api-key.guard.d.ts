import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PersistentTokenService } from '../services/persistent-token.service';
export declare class ApiKeyGuard implements CanActivate {
    private readonly persistentTokenService;
    private readonly reflector;
    private readonly logger;
    constructor(persistentTokenService: PersistentTokenService, reflector: Reflector, loggerService: LoggerService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractApiKey;
    private hasRequiredScopes;
    private sanitizeHeaders;
}
export declare const RequireScopes: (...scopes: string[]) => import("@nestjs/common").CustomDecorator<string>;
