import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LoggerService } from '../../../shared/logger/logger.service';
import { MfaService } from '../services/mfa.service';
export declare class MfaRequiredGuard implements CanActivate {
    private reflector;
    private mfaService;
    private readonly logger;
    constructor(reflector: Reflector, mfaService: MfaService, logger: LoggerService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private isHighSensitivityRoute;
    private doesUserRoleRequireMfa;
    private isMfaValidationFresh;
    private getAvailableMfaMethods;
}
