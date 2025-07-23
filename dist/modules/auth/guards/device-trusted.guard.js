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
exports.DeviceTrustedGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const logger_service_1 = require("../../../shared/logger/logger.service");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const device_util_1 = require("../utils/device.util");
const auth_exceptions_1 = require("../exceptions/auth.exceptions");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
let DeviceTrustedGuard = class DeviceTrustedGuard {
    reflector;
    prisma;
    logger;
    constructor(reflector, prisma, loggerService) {
        this.reflector = reflector;
        this.prisma = prisma;
        this.logger = loggerService.createChildLogger('DeviceTrustedGuard');
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const requireTrustedDevice = this.reflector.getAllAndOverride(current_user_decorator_1.TRUST_DEVICE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requireTrustedDevice || !user) {
            return true;
        }
        const operationId = this.logger.startOperation('deviceTrustedGuard', {
            userId: user.id,
            path: request.url,
        });
        try {
            const deviceInfo = this.extractDeviceInfo(request);
            const deviceFingerprint = device_util_1.DeviceUtil.generateDeviceFingerprint(deviceInfo);
            const isTrusted = await this.isDeviceTrusted(user.id, deviceFingerprint);
            if (isTrusted) {
                this.logger.endOperation(operationId, 'success', true);
                return true;
            }
            this.logger.warn('Untrusted device detected', JSON.stringify({
                userId: user.id,
                deviceFingerprint,
                ipAddress: deviceInfo.ipAddress,
            }));
            await this.sendDeviceVerificationCode(user.id, deviceInfo);
            this.logger.logBusinessEvent('DEVICE_VERIFICATION_REQUIRED', {
                userId: user.id,
                deviceFingerprint,
                ipAddress: deviceInfo.ipAddress,
                userAgent: deviceInfo.userAgent,
            }, user.id);
            this.logger.endOperation(operationId, 'device_verification_required', false);
            throw new auth_exceptions_1.DeviceNotTrustedException('email');
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
    extractDeviceInfo(request) {
        return {
            userAgent: request.headers?.['user-agent'] || '',
            ipAddress: request.ip || 'unknown',
            deviceFingerprint: request.headers?.['x-device-fingerprint'],
        };
    }
    async isDeviceTrusted(userId, deviceFingerprint) {
        try {
            const trustedSession = await this.prisma.user_sessions.findFirst({
                where: {
                    user_id: userId,
                    device_fingerprint: deviceFingerprint,
                    is_active: true,
                    created_at: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                },
                select: {
                    id: true,
                },
            });
            return !!trustedSession;
        }
        catch (error) {
            this.logger.error('Error checking device trust', error.stack);
            return false;
        }
    }
    async sendDeviceVerificationCode(userId, deviceInfo) {
        try {
            this.logger.info('Device verification code sent', JSON.stringify({
                userId,
                deviceFingerprint: device_util_1.DeviceUtil.generateDeviceFingerprint(deviceInfo),
            }));
        }
        catch (error) {
            this.logger.error('Error sending device verification code', error.stack);
        }
    }
};
exports.DeviceTrustedGuard = DeviceTrustedGuard;
exports.DeviceTrustedGuard = DeviceTrustedGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService,
        logger_service_1.LoggerService])
], DeviceTrustedGuard);
//# sourceMappingURL=device-trusted.guard.js.map