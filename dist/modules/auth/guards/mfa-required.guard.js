"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MfaRequiredGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const mfa_service_1 = require("../services/mfa.service");
const trusted_devices_service_1 = require("../services/trusted-devices.service");
const risk_assessment_service_1 = require("../services/risk-assessment.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const mfa_required_decorator_1 = require("../decorators/mfa-required.decorator");
const mfa_exceptions_1 = require("../exceptions/mfa.exceptions");
let MfaRequiredGuard = class MfaRequiredGuard {
    reflector;
    mfaService;
    trustedDevicesService;
    riskAssessment;
    logger;
    constructor(reflector, mfaService, trustedDevicesService, riskAssessment, loggerService) {
        this.reflector = reflector;
        this.mfaService = mfaService;
        this.trustedDevicesService = trustedDevicesService;
        this.riskAssessment = riskAssessment;
        this.logger = loggerService.createChildLogger('MfaRequiredGuard');
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.UnauthorizedException('Utilisateur non authentifié');
        }
        const isMfaRequired = this.reflector.getAllAndOverride(mfa_required_decorator_1.MFA_REQUIRED_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!isMfaRequired) {
            return true;
        }
        const operationId = this.logger.startOperation('MfaRequiredGuard.canActivate', {
            userId: user.id,
            endpoint: `${request.method} ${request.path}`
        });
        try {
            const hasMfaSession = await this.checkMfaSession(request);
            if (hasMfaSession) {
                this.logger.endOperation('canActivate', operationId, true, undefined, { reason: 'active_mfa_session' });
                return true;
            }
            const deviceFingerprint = this.extractDeviceFingerprint(request);
            if (deviceFingerprint) {
                const isTrusted = await this.trustedDevicesService.isDeviceTrusted(user.id, deviceFingerprint);
                if (isTrusted) {
                    await this.trustedDevicesService.updateLastSeen(user.id, deviceFingerprint);
                    this.logger.endOperation('canActivate', operationId, true, undefined, { reason: 'trusted_device' });
                    return true;
                }
            }
            const riskScore = await this.riskAssessment.assessLoginRisk(user.id, {
                ipAddress: request.ip,
                userAgent: request.get('User-Agent'),
                deviceFingerprint
            });
            const requiresMfa = await this.mfaService.requiresMfa(user.id, riskScore);
            if (requiresMfa) {
                this.logger.endOperation('canActivate', operationId, false, undefined, {
                    reason: 'mfa_required',
                    riskScore
                });
                throw new mfa_exceptions_1.MfaDeviceNotTrustedException();
            }
            this.logger.endOperation('canActivate', operationId, true, undefined, { reason: 'low_risk' });
            return true;
        }
        catch (error) {
            this.logger.endOperation('canActivate', operationId, false);
            if (error instanceof mfa_exceptions_1.MfaDeviceNotTrustedException) {
                throw error;
            }
            this.logger.error('MFA guard error', error.stack, 'MfaRequiredGuard.canActivate', JSON.stringify({
                userId: user.id,
                error: error.message
            }));
            throw new common_1.ForbiddenException('Erreur lors de la vérification MFA');
        }
    }
    async checkMfaSession(request) {
        try {
            const mfaSessionToken = request.headers['x-mfa-session'];
            if (!mfaSessionToken) {
                return false;
            }
            return false;
        }
        catch {
            return false;
        }
    }
    extractDeviceFingerprint(request) {
        return request.headers['x-device-fingerprint'];
    }
};
exports.MfaRequiredGuard = MfaRequiredGuard;
exports.MfaRequiredGuard = MfaRequiredGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        mfa_service_1.MfaService,
        trusted_devices_service_1.TrustedDevicesService,
        risk_assessment_service_1.RiskAssessmentService,
        logger_service_1.LoggerService])
], MfaRequiredGuard);
//# sourceMappingURL=mfa-required.guard.js.map