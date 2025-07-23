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
exports.LocalStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_local_1 = require("passport-local");
const logger_service_1 = require("../../../shared/logger/logger.service");
const auth_service_1 = require("../services/auth.service");
const auth_exceptions_1 = require("../exceptions/auth.exceptions");
let LocalStrategy = class LocalStrategy extends (0, passport_1.PassportStrategy)(passport_local_1.Strategy, 'local') {
    authService;
    logger;
    constructor(authService, loggerService) {
        super({
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true,
        });
        this.authService = authService;
        this.logger = loggerService.createChildLogger('LocalStrategy');
    }
    async validate(req, email, password) {
        const operationId = this.logger.startOperation('validateCredentials', { email });
        try {
            const ipAddress = this.extractIpAddress(req);
            const userAgent = req.headers?.['user-agent'] || '';
            const deviceFingerprint = req.headers?.['x-device-fingerprint'];
            this.logger.info('Local authentication attempt', JSON.stringify({
                email,
                ipAddress,
                hasDeviceFingerprint: !!deviceFingerprint,
            }));
            const user = await this.authService.validateUser(email, password, {
                ipAddress,
                userAgent,
                deviceFingerprint,
            });
            if (!user) {
                this.logger.warn('Invalid credentials provided', JSON.stringify({
                    email,
                    ipAddress
                }));
                this.logger.logBusinessEvent('LOGIN_FAILED', {
                    email,
                    ipAddress,
                    userAgent,
                    reason: 'invalid_credentials',
                });
                throw new auth_exceptions_1.InvalidCredentialsException();
            }
            this.logger.logBusinessEvent('CREDENTIALS_VALIDATED', {
                userId: user.id,
                email: user.email,
                ipAddress,
                userAgent,
            }, user.id);
            this.logger.endOperation(operationId, 'success', true);
            return user;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.logBusinessEvent('LOCAL_AUTH_FAILED', {
                email,
                error: error.message,
            });
            throw error;
        }
    }
    extractIpAddress(req) {
        return req.ip ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            req.headers?.['x-forwarded-for']?.split(',')[0] ||
            req.headers?.['x-real-ip'] ||
            'unknown';
    }
};
exports.LocalStrategy = LocalStrategy;
exports.LocalStrategy = LocalStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        logger_service_1.LoggerService])
], LocalStrategy);
//# sourceMappingURL=local.strategy.js.map