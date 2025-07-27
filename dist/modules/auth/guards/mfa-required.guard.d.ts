import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MfaService } from '../services/mfa.service';
import { TrustedDevicesService } from '../services/trusted-devices.service';
import { RiskAssessmentService } from '../services/risk-assessment.service';
import { LoggerService } from '../../../shared/logger/logger.service';
export declare class MfaRequiredGuard implements CanActivate {
    private readonly reflector;
    private readonly mfaService;
    private readonly trustedDevicesService;
    private readonly riskAssessment;
    private readonly logger;
    constructor(reflector: Reflector, mfaService: MfaService, trustedDevicesService: TrustedDevicesService, riskAssessment: RiskAssessmentService, loggerService: LoggerService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private checkMfaSession;
    private extractDeviceFingerprint;
}
