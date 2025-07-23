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
exports.DeviceService = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../../shared/logger/logger.service");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const device_util_1 = require("../utils/device.util");
const security_constants_1 = require("../constants/security.constants");
let DeviceService = class DeviceService {
    prisma;
    redis;
    logger;
    constructor(prisma, redis, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.logger = loggerService.createChildLogger('DeviceService');
    }
    async analyzeDevice(rawDeviceInfo) {
        const operationId = this.logger.startOperation('analyzeDevice');
        try {
            const deviceInfo = device_util_1.DeviceUtil.normalizeDeviceInfo(rawDeviceInfo);
            if (!deviceInfo.deviceFingerprint) {
                deviceInfo.deviceFingerprint = device_util_1.DeviceUtil.generateDeviceFingerprint(deviceInfo);
            }
            const entropy = device_util_1.DeviceUtil.calculateDeviceEntropy(deviceInfo);
            const enrichedDevice = {
                ...deviceInfo,
                entropy,
                analyzedAt: new Date().toISOString(),
            };
            this.logger.endOperation(operationId, 'success');
            return enrichedDevice;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.error('Device analysis failed', error.stack);
            throw new Error(`Erreur analyse device: ${error.message}`);
        }
    }
    async isDeviceTrusted(userId, deviceFingerprint) {
        const operationId = this.logger.startOperation('isDeviceTrusted', {
            userId,
            deviceFingerprint: deviceFingerprint.substring(0, 8) + '...',
        });
        try {
            const trustKey = `trusted_device:${userId}:${deviceFingerprint}`;
            const trustData = await this.redis.getCache(trustKey);
            if (trustData) {
                this.logger.endOperation(operationId, 'cache_hit');
                return true;
            }
            const trustedSession = await this.prisma.user_sessions.findFirst({
                where: {
                    user_id: userId,
                    device_fingerprint: deviceFingerprint,
                    is_active: true,
                    created_at: {
                        gte: new Date(Date.now() - security_constants_1.SECURITY_CONSTANTS.DEVICE_FINGERPRINT.TRUST_DURATION * 1000),
                    },
                },
                select: { id: true },
            });
            const isTrusted = !!trustedSession;
            if (isTrusted) {
                await this.redis.setCache(trustKey, { trusted: true }, security_constants_1.SECURITY_CONSTANTS.DEVICE_FINGERPRINT.TRUST_DURATION);
            }
            this.logger.endOperation(operationId, 'db_hit');
            return isTrusted;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.error('Device trust check failed', error.stack, { userId });
            return false;
        }
    }
    async trustDevice(userId, deviceInfo, duration) {
        const operationId = this.logger.startOperation('trustDevice', {
            userId,
            deviceFingerprint: deviceInfo.deviceFingerprint?.substring(0, 8) + '...',
        });
        try {
            const trustDuration = duration || security_constants_1.SECURITY_CONSTANTS.DEVICE_FINGERPRINT.TRUST_DURATION;
            const deviceFingerprint = deviceInfo.deviceFingerprint ||
                device_util_1.DeviceUtil.generateDeviceFingerprint(deviceInfo);
            const trustKey = `trusted_device:${userId}:${deviceFingerprint}`;
            const trustData = {
                userId,
                deviceFingerprint,
                deviceInfo,
                trustedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + trustDuration * 1000).toISOString(),
            };
            await this.redis.setCache(trustKey, trustData, trustDuration);
            this.logger.logBusinessEvent('DEVICE_TRUSTED', {
                userId,
                deviceFingerprint,
                trustDuration,
                ipAddress: deviceInfo.ipAddress,
                userAgent: deviceInfo.userAgent,
            }, userId);
            this.logger.endOperation(operationId, 'success');
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.error('Failed to trust device', error.stack, { userId });
        }
    }
    async revokeDeviceTrust(userId, deviceFingerprint) {
        const operationId = this.logger.startOperation('revokeDeviceTrust', {
            userId,
            deviceFingerprint: deviceFingerprint.substring(0, 8) + '...',
        });
        try {
            const trustKey = `trusted_device:${userId}:${deviceFingerprint}`;
            await this.redis.deleteCache(trustKey);
            const revokedSessions = await this.prisma.user_sessions.updateMany({
                where: {
                    user_id: userId,
                    device_fingerprint: deviceFingerprint,
                    is_active: true,
                },
                data: {
                    is_active: false,
                    updated_at: new Date(),
                },
            });
            this.logger.logBusinessEvent('DEVICE_TRUST_REVOKED', {
                userId,
                deviceFingerprint,
                sessionsRevoked: revokedSessions.count,
            }, userId);
            this.logger.endOperation(operationId, 'success');
            return revokedSessions.count > 0;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.error('Failed to revoke device trust', error.stack, { userId });
            return false;
        }
    }
    async compareDevices(device1, device2) {
        const operationId = this.logger.startOperation('compareDevices');
        try {
            const comparison = device_util_1.DeviceUtil.compareDevices(device1, device2);
            let recommendation;
            if (comparison.similarity >= 90) {
                recommendation = 'SAME_DEVICE';
            }
            else if (comparison.similarity >= 60) {
                recommendation = 'SIMILAR_DEVICE';
            }
            else {
                recommendation = 'DIFFERENT_DEVICE';
            }
            this.logger.endOperation(operationId, 'success');
            return {
                ...comparison,
                recommendation,
            };
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.error('Device comparison failed', error.stack);
            throw new Error(`Erreur comparaison devices: ${error.message}`);
        }
    }
    async getUserDeviceReport(userId) {
        const operationId = this.logger.startOperation('getUserDeviceReport', { userId });
        try {
            const trustPattern = `trusted_device:${userId}:*`;
            const trustedDevices = 0;
            const activeSessions = await this.prisma.user_sessions.count({
                where: {
                    user_id: userId,
                    is_active: true,
                    expires_at: { gt: new Date() },
                },
            });
            const recentSessions = await this.prisma.user_sessions.findMany({
                where: {
                    user_id: userId,
                    created_at: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    },
                },
                orderBy: { created_at: 'desc' },
                take: 10,
                select: {
                    device_fingerprint: true,
                    user_agent: true,
                    ip_address: true,
                    geolocation: true,
                    created_at: true,
                },
            });
            const securityScore = this.calculateDeviceSecurityScore({
                trustedDevices,
                activeSessions,
                recentDevicesCount: recentSessions.length,
            });
            const report = {
                trustedDevices,
                activeSessions,
                recentDevices: recentSessions,
                securityScore,
            };
            this.logger.endOperation(operationId, 'success');
            return report;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.error('Failed to generate device report', error.stack, { userId });
            throw new Error(`Erreur génération rapport devices: ${error.message}`);
        }
    }
    calculateDeviceSecurityScore(data) {
        let score = 50;
        score += Math.min(30, data.trustedDevices * 10);
        if (data.activeSessions > 5) {
            score -= (data.activeSessions - 5) * 5;
        }
        if (data.recentDevicesCount > 3) {
            score -= (data.recentDevicesCount - 3) * 5;
        }
        return Math.max(0, Math.min(100, score));
    }
};
exports.DeviceService = DeviceService;
exports.DeviceService = DeviceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        logger_service_1.LoggerService])
], DeviceService);
//# sourceMappingURL=device.service.js.map