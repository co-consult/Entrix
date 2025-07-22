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
const logger_service_1 = require("../../../shared/logger/logger.service");
const mfa_service_1 = require("../services/mfa.service");
let MfaRequiredGuard = class MfaRequiredGuard {
    reflector;
    mfaService;
    logger;
    constructor(reflector, mfaService, logger) {
        this.reflector = reflector;
        this.mfaService = mfaService;
        this.logger = logger.createChildLogger('MfaRequiredGuard');
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        try {
            const user = request.user;
            if (!user) {
                this.logger.warn(`Tentative d'accès à une ressource MFA sans authentification sur ${request.url}`);
                throw new common_1.UnauthorizedException('Authentification requise');
            }
            const isMfaRequired = this.reflector.get('mfa-required', context.getHandler()) ||
                this.reflector.get('mfa-required', context.getClass());
            if (isMfaRequired === false) {
                return true;
            }
            const authContext = request.authContext;
            if (!authContext) {
                this.logger.warn(`Contexte d'authentification manquant pour ${user.id} sur ${request.url}`);
                throw new common_1.UnauthorizedException('Contexte d\'authentification invalide');
            }
            if (authContext.mfaVerified) {
                this.logger.log(`Accès MFA autorisé pour ${user.id} sur ${request.url}`);
                return true;
            }
            const mfaConfig = await this.mfaService.getUserMfaConfig(user.id);
            if (!mfaConfig || !mfaConfig.enabled) {
                this.logger.warn(`MFA requis mais non configuré pour ${user.id} sur ${request.url}`);
                throw new common_1.ForbiddenException({
                    error: 'MFA_REQUIRED',
                    message: 'L\'authentification multi-facteurs est requise pour accéder à cette ressource',
                    action: 'SETUP_MFA',
                    user: {
                        id: user.id,
                        email: user.email,
                    }
                });
            }
            this.logger.warn(`MFA configuré mais non validé pour ${user.id} sur ${request.url}`);
            throw new common_1.ForbiddenException({
                error: 'MFA_VERIFICATION_REQUIRED',
                message: 'Veuillez valider votre authentification multi-facteurs',
                action: 'VERIFY_MFA',
                mfaMethod: mfaConfig.method,
                user: {
                    id: user.id,
                    email: user.email,
                }
            });
        }
        catch (error) {
            this.logger.error(`Erreur dans MfaRequiredGuard pour ${request.url}:`, error);
            if (error instanceof common_1.UnauthorizedException || error instanceof common_1.ForbiddenException) {
                throw error;
            }
            throw new common_1.ForbiddenException('Vérification MFA échouée');
        }
    }
    isHighSensitivityRoute(request) {
        const url = request.url;
        const method = request.method;
        const criticalPatterns = [
            /\/admin\/.*/,
            /\/users\/.*\/delete/,
            /\/payments\/.*/,
            /\/sensitive\/.*/,
            /\/export\/.*/,
        ];
        const criticalActions = ['DELETE', 'PUT'];
        if (criticalPatterns.some(pattern => pattern.test(url))) {
            return true;
        }
        if (criticalActions.includes(method) && url.includes('/users/')) {
            return true;
        }
        return false;
    }
    doesUserRoleRequireMfa(user) {
        const mfaRequiredRoles = ['ADMIN', 'SUPER_ADMIN', 'FINANCIAL_MANAGER', 'ORGANIZER_ADMIN'];
        return user.roles.some(role => mfaRequiredRoles.includes(role.code));
    }
    isMfaValidationFresh(authContext) {
        if (!authContext.mfaVerifiedAt) {
            return false;
        }
        const maxMfaAge = 2 * 60 * 60 * 1000;
        const mfaAge = Date.now() - new Date(authContext.mfaVerifiedAt).getTime();
        return mfaAge <= maxMfaAge;
    }
    async getAvailableMfaMethods(userId) {
        try {
            const mfaConfig = await this.mfaService.getUserMfaConfig(userId);
            return mfaConfig ? [mfaConfig.method] : ['SMS', 'EMAIL'];
        }
        catch (error) {
            this.logger.error(`Erreur récupération méthodes MFA pour ${userId}:`, error);
            return ['SMS'];
        }
    }
};
exports.MfaRequiredGuard = MfaRequiredGuard;
exports.MfaRequiredGuard = MfaRequiredGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        mfa_service_1.MfaService,
        logger_service_1.LoggerService])
], MfaRequiredGuard);
//# sourceMappingURL=mfa-required.guard.js.map