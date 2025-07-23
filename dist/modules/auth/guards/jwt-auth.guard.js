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
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const core_1 = require("@nestjs/core");
const logger_service_1 = require("../../../shared/logger/logger.service");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
const security_util_1 = require("../utils/security.util");
let JwtAuthGuard = class JwtAuthGuard extends (0, passport_1.AuthGuard)('jwt') {
    reflector;
    logger;
    constructor(reflector, loggerService) {
        super();
        this.reflector = reflector;
        this.logger = loggerService.createChildLogger('JwtAuthGuard');
    }
    canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(current_user_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        return super.canActivate(context);
    }
    handleRequest(err, user, info, context) {
        const request = context.switchToHttp().getRequest();
        const operationId = this.logger.startOperation('jwtAuthGuard', {
            path: request.url,
            method: request.method,
        });
        try {
            if (err || !user) {
                const token = this.extractTokenFromRequest(request);
                const error = err || info;
                this.logger.warn('JWT authentication failed', JSON.stringify({
                    path: request.url,
                    method: request.method,
                    error: error?.message || 'No user found',
                    hasToken: !!token,
                    tokenValid: token ? security_util_1.SecurityUtil.isValidJwtFormat(token) : false,
                }));
                this.logger.logBusinessEvent('JWT_AUTH_FAILED', {
                    path: request.url,
                    method: request.method,
                    error: error?.message || 'authentication_failed',
                    userAgent: request.headers?.['user-agent'],
                    ipAddress: request.ip,
                });
                this.logger.endOperation(operationId, 'unauthorized', false);
                throw new common_1.UnauthorizedException('Token d\'authentification requis');
            }
            const response = context.switchToHttp().getResponse();
            this.addSecurityHeaders(response);
            this.logger.logBusinessEvent('JWT_AUTH_SUCCESS', {
                userId: user.id,
                path: request.url,
                method: request.method,
            }, user.id);
            this.logger.endOperation(operationId, 'success', true);
            return user;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
    extractTokenFromRequest(request) {
        const authHeader = request.headers?.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7);
    }
    addSecurityHeaders(response) {
        const securityHeaders = security_util_1.SecurityUtil.generateSecurityHeaders();
        Object.entries(securityHeaders).forEach(([key, value]) => {
            response.setHeader(key, value);
        });
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        logger_service_1.LoggerService])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map