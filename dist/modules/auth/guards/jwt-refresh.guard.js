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
exports.JwtRefreshGuard = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const logger_service_1 = require("../../../shared/logger/logger.service");
let JwtRefreshGuard = class JwtRefreshGuard extends (0, passport_1.AuthGuard)('jwt-refresh') {
    logger;
    constructor(loggerService) {
        super();
        this.logger = loggerService.createChildLogger('JwtRefreshGuard');
    }
    handleRequest(err, user, info, context) {
        const request = context.switchToHttp().getRequest();
        const operationId = this.logger.startOperation('jwtRefreshGuard', {
            path: request.url,
        });
        try {
            if (err || !user) {
                this.logger.warn('JWT refresh authentication failed', JSON.stringify({
                    error: err?.message || info?.message || 'No user found',
                    path: request.url,
                }));
                this.logger.logBusinessEvent('REFRESH_AUTH_FAILED', {
                    error: err?.message || 'authentication_failed',
                    ipAddress: request.ip,
                });
                this.logger.endOperation(operationId, 'unauthorized', false);
                throw new common_1.UnauthorizedException('Token de rafraîchissement invalide');
            }
            this.logger.endOperation(operationId, 'success', true);
            return user;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
};
exports.JwtRefreshGuard = JwtRefreshGuard;
exports.JwtRefreshGuard = JwtRefreshGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_service_1.LoggerService])
], JwtRefreshGuard);
//# sourceMappingURL=jwt-refresh.guard.js.map