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
const redis_service_1 = require("../../../shared/redis/redis.service");
const auth_exceptions_1 = require("../exceptions/auth.exceptions");
const require_mfa_decorator_1 = require("../decorators/require-mfa.decorator");
let MfaRequiredGuard = class MfaRequiredGuard {
    reflector;
    redis;
    logger;
    constructor(reflector, redis, loggerService) {
        this.reflector = reflector;
        this.redis = redis;
        this.logger = loggerService.createChildLogger('MfaRequiredGuard');
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const requireMfa = this.reflector.getAllAndOverride(require_mfa_decorator_1.REQUIRE_MFA_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requireMfa || !user) {
            return true;
        }
        const operationId = this.logger.startOperation('mfaRequiredGuard', {
            userId: user.id,
            path: request.url,
        });
        try {
            const mfaValidated = await this.isMfaValidatedInSession(user.id, request.sessionId);
            if (mfaValidated) {
                this.logger.endOperation(operationId, 'success', true);
                return true;
            }
            this.logger.warn('MFA required but not validated', JSON.stringify({
                userId: user.id,
                path: request.url,
            }));
            const challengeToken = await this.generateMfaChallenge(user.id);
            const availableMethods = await this.getAvailableMfaMethods(user.id);
            this.logger.logBusinessEvent('MFA_CHALLENGE_REQUIRED', {
                userId: user.id,
                path: request.url,
                methods: availableMethods,
            }, user.id);
            this.logger.endOperation(operationId, 'mfa_required', false);
            throw new auth_exceptions_1.MfaRequiredException(challengeToken, availableMethods, 300);
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
    async isMfaValidatedInSession(userId, sessionId) {
        try {
            const mfaKey = `mfa_validated:${userId}:${sessionId}`;
            const isValidated = await this.redis.exists(mfaKey);
            return isValidated;
        }
        catch (error) {
            this.logger.error('Error checking MFA validation status', error.stack);
            return false;
        }
    }
    async generateMfaChallenge(userId) {
        try {
            const challengeToken = `mfa_challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const challengeKey = `mfa_challenge:${challengeToken}`;
            await this.redis.setCache(challengeKey, userId, 300);
            return challengeToken;
        }
        catch (error) {
            this.logger.error('Error generating MFA challenge', error.stack);
            throw new common_1.UnauthorizedException('Erreur génération challenge MFA');
        }
    }
    async getAvailableMfaMethods(userId) {
        return ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP'];
    }
};
exports.MfaRequiredGuard = MfaRequiredGuard;
exports.MfaRequiredGuard = MfaRequiredGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        redis_service_1.RedisService,
        logger_service_1.LoggerService])
], MfaRequiredGuard);
//# sourceMappingURL=mfa-required.guard.js.map