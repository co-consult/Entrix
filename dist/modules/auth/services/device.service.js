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
const email_service_1 = require("../../../shared/email/email.service");
const device_util_1 = require("../utils/device.util");
let DeviceService = class DeviceService {
    prisma;
    redis;
    email;
    logger;
    TRUSTED_DEVICE_TTL = 30 * 24 * 60 * 60;
    constructor(prisma, redis, email, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.email = email;
        this.logger = loggerService.createChildLogger('DeviceService');
    }
    async isDeviceTrusted(userId, deviceFingerprint) {
        const operationId = this.logger.startOperation('isDeviceTrusted', {
            userId,
            deviceFingerprint: deviceFingerprint?.substring(0, 8) + '...',
        });
        try {
            if (!deviceFingerprint) {
                this.logger.endOperation('isDeviceTrusted', operationId, true, undefined, { trusted: false, reason: 'no_fingerprint' });
                return false;
            }
            const trustKey = `trusted_device:${userId}:${deviceFingerprint}`;
            const cachedTrust = await this.redis.getCache(trustKey);
            if (cachedTrust !== null) {
                const isValid = new Date(cachedTrust.expiresAt) > new Date();
                this.logger.endOperation('isDeviceTrusted', operationId, true, undefined, {
                    trusted: isValid,
                    source: 'cache',
                    expiresAt: cachedTrust.expiresAt
                });
                return isValid;
            }
            const recentTrustedSession = await this.prisma.user_sessions.findFirst({
                where: {
                    user_id: userId,
                    device_fingerprint: deviceFingerprint,
                    is_active: true,
                    expires_at: { gt: new Date() },
                    created_at: {
                        gte: new Date(Date.now() - this.TRUSTED_DEVICE_TTL * 1000)
                    }
                },
                select: { id: true, created_at: true },
                orderBy: { last_activity: 'desc' }
            });
            if (recentTrustedSession) {
                const trustData = {
                    userId,
                    deviceFingerprint,
                    trustedAt: recentTrustedSession.created_at.toISOString(),
                    expiresAt: new Date(Date.now() + this.TRUSTED_DEVICE_TTL * 1000).toISOString(),
                };
                await this.redis.setCache(trustKey, trustData, this.TRUSTED_DEVICE_TTL);
                this.logger.endOperation('isDeviceTrusted', operationId, true, undefined, {
                    trusted: true,
                    source: 'database',
                    sessionId: recentTrustedSession.id
                });
                return true;
            }
            this.logger.endOperation('isDeviceTrusted', operationId, true, undefined, {
                trusted: false,
                source: 'not_found'
            });
            return false;
        }
        catch (error) {
            this.logger.endOperation('isDeviceTrusted', operationId, false, undefined, { error: error.message });
            this.logger.error('Device trust check failed', error.stack, 'DeviceService', JSON.stringify({
                userId,
                deviceFingerprint: deviceFingerprint?.substring(0, 8) + '...',
            }));
            return false;
        }
    }
    async trustDevice(userId, deviceInfo, verifiedBy2FA = false) {
        const operationId = this.logger.startOperation('trustDevice', {
            userId,
            ipAddress: deviceInfo.ipAddress,
            verifiedBy2FA,
        });
        try {
            if (!deviceInfo.deviceFingerprint) {
                throw new Error('Device fingerprint requis pour marquer comme fiable');
            }
            const trustKey = `trusted_device:${userId}:${deviceInfo.deviceFingerprint}`;
            const trustData = {
                userId,
                deviceFingerprint: deviceInfo.deviceFingerprint,
                deviceName: device_util_1.DeviceUtil.generateDeviceName(deviceInfo),
                ipAddress: deviceInfo.ipAddress,
                userAgent: deviceInfo.userAgent,
                geolocation: deviceInfo.geolocation,
                verifiedBy2FA,
                trustedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + this.TRUSTED_DEVICE_TTL * 1000).toISOString(),
            };
            await this.redis.setCache(trustKey, trustData, this.TRUSTED_DEVICE_TTL);
            const user = await this.prisma.users.findUnique({
                where: { id: userId },
                select: {
                    email: true,
                    first_name: true,
                    last_name: true
                }
            });
            if (!user) {
                throw new Error('Utilisateur introuvable');
            }
            try {
                await this.email.sendEmail({
                    to: user.email,
                    subject: '🔒 Nouvel appareil de confiance ajouté',
                    template: 'device-trusted',
                    context: {
                        firstName: user.first_name,
                        deviceName: trustData.deviceName,
                        ipAddress: deviceInfo.ipAddress,
                        location: deviceInfo.geolocation?.city || 'Localisation inconnue',
                        trustedAt: new Date().toLocaleString('fr-TN', {
                            timeZone: 'Africa/Tunis',
                            dateStyle: 'full',
                            timeStyle: 'short'
                        }),
                        securityUrl: `${process.env.FRONTEND_URL}/security/devices`,
                    }
                });
            }
            catch (emailError) {
                this.logger.warn('Failed to send device trusted email', JSON.stringify({
                    userId,
                    error: emailError.message,
                }));
            }
            this.logger.logBusinessEvent('DEVICE_TRUSTED', {
                userId,
                deviceFingerprint: deviceInfo.deviceFingerprint,
                deviceName: trustData.deviceName,
                ipAddress: deviceInfo.ipAddress,
                verifiedBy2FA,
                location: deviceInfo.geolocation?.city,
            }, userId);
            this.logger.endOperation('trustDevice', operationId, true, undefined, {
                deviceFingerprint: deviceInfo.deviceFingerprint?.substring(0, 8) + '...',
                expiresAt: trustData.expiresAt,
            });
            return true;
        }
        catch (error) {
            this.logger.endOperation('trustDevice', operationId, false, undefined, { error: error.message });
            this.logger.error('Failed to trust device', error.stack, 'DeviceService', JSON.stringify({
                userId,
                ipAddress: deviceInfo.ipAddress,
            }));
            return false;
        }
    }
    async revokeDeviceTrust(userId, deviceFingerprint) {
        const operationId = this.logger.startOperation('revokeDeviceTrust', {
            userId,
            deviceFingerprint: deviceFingerprint?.substring(0, 8) + '...',
        });
        try {
            if (!deviceFingerprint) {
                throw new Error('Device fingerprint requis pour révocation');
            }
            const trustKey = `trusted_device:${userId}:${deviceFingerprint}`;
            await this.redis.delCache(trustKey);
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
                deviceFingerprint: deviceFingerprint?.substring(0, 8) + '...',
                sessionsRevoked: revokedSessions.count,
            }, userId);
            this.logger.endOperation('revokeDeviceTrust', operationId, true, undefined, {
                sessionsRevoked: revokedSessions.count,
            });
            return revokedSessions.count > 0;
        }
        catch (error) {
            this.logger.endOperation('revokeDeviceTrust', operationId, false, undefined, { error: error.message });
            this.logger.error('Failed to revoke device trust', error.stack, 'DeviceService', JSON.stringify({
                userId,
                deviceFingerprint: deviceFingerprint?.substring(0, 8) + '...',
            }));
            return false;
        }
    }
    async getUserTrustedDevices(userId) {
        const operationId = this.logger.startOperation('getUserTrustedDevices', { userId });
        try {
            const recentSessions = await this.prisma.user_sessions.findMany({
                where: {
                    user_id: userId,
                    device_fingerprint: { not: null },
                    created_at: {
                        gte: new Date(Date.now() - this.TRUSTED_DEVICE_TTL * 1000)
                    }
                },
                select: {
                    device_fingerprint: true,
                    ip_address: true,
                    user_agent: true,
                    geolocation: true,
                    created_at: true,
                    last_activity: true,
                    is_active: true,
                },
                orderBy: { last_activity: 'desc' },
                distinct: ['device_fingerprint']
            });
            const trustedDevices = [];
            for (const session of recentSessions) {
                if (!session.device_fingerprint)
                    continue;
                const isTrusted = await this.isDeviceTrusted(userId, session.device_fingerprint);
                if (!isTrusted)
                    continue;
                const trustKey = `trusted_device:${userId}:${session.device_fingerprint}`;
                const trustData = await this.redis.getCache(trustKey);
                trustedDevices.push({
                    deviceFingerprint: session.device_fingerprint,
                    deviceName: trustData?.deviceName || device_util_1.DeviceUtil.generateDeviceName({
                        userAgent: session.user_agent || '',
                        ipAddress: session.ip_address,
                    }),
                    ipAddress: session.ip_address,
                    userAgent: session.user_agent || '',
                    location: this.formatLocation(session.geolocation),
                    trustedAt: trustData?.trustedAt || session.created_at.toISOString(),
                    lastUsed: session.last_activity.toISOString(),
                    expiresAt: trustData?.expiresAt || new Date(Date.now() + this.TRUSTED_DEVICE_TTL * 1000).toISOString(),
                    isActive: session.is_active,
                });
            }
            this.logger.endOperation('getUserTrustedDevices', operationId, true, undefined, {
                devicesFound: trustedDevices.length,
            });
            return trustedDevices;
        }
        catch (error) {
            this.logger.endOperation('getUserTrustedDevices', operationId, false, undefined, { error: error.message });
            this.logger.error('Failed to get user trusted devices', error.stack, 'DeviceService', JSON.stringify({ userId }));
            return [];
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
            this.logger.endOperation('compareDevices', operationId, true, undefined, {
                similarity: comparison.similarity,
                recommendation,
            });
            return {
                ...comparison,
                recommendation,
            };
        }
        catch (error) {
            this.logger.endOperation('compareDevices', operationId, false, undefined, { error: error.message });
            this.logger.error('Device comparison failed', error.stack, 'DeviceService');
            throw new Error(`Erreur comparaison devices: ${error.message}`);
        }
    }
    async getUserDeviceReport(userId) {
        const operationId = this.logger.startOperation('getUserDeviceReport', { userId });
        try {
            const trustedDevices = await this.getUserTrustedDevices(userId);
            const activeSessions = await this.prisma.user_sessions.count({
                where: {
                    user_id: userId,
                    is_active: true,
                    expires_at: { gt: new Date() },
                },
            });
            const recentDevices = await this.prisma.user_sessions.findMany({
                where: {
                    user_id: userId,
                    created_at: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                },
                select: {
                    device_fingerprint: true,
                    ip_address: true,
                    user_agent: true,
                    geolocation: true,
                    created_at: true,
                    last_activity: true,
                },
                orderBy: { created_at: 'desc' },
                take: 10,
                distinct: ['device_fingerprint']
            });
            const securityScore = this.calculateDeviceSecurityScore({
                trustedDevicesCount: trustedDevices.length,
                activeSessionsCount: activeSessions,
                recentDevicesCount: recentDevices.length,
                hasRecentSuspiciousActivity: false,
            });
            const suspiciousActivity = this.detectSuspiciousActivity(recentDevices);
            this.logger.endOperation('getUserDeviceReport', operationId, true, undefined, {
                trustedDevices: trustedDevices.length,
                activeSessions,
                securityScore,
                suspiciousActivity,
            });
            return {
                trustedDevices: trustedDevices.length,
                activeSessions,
                recentDevices,
                securityScore,
                suspiciousActivity,
            };
        }
        catch (error) {
            this.logger.endOperation('getUserDeviceReport', operationId, false, undefined, { error: error.message });
            this.logger.error('Failed to generate device report', error.stack, 'DeviceService', JSON.stringify({ userId }));
            throw new Error(`Erreur génération rapport: ${error.message}`);
        }
    }
    async cleanupExpiredDevices() {
        const operationId = this.logger.startOperation('cleanupExpiredDevices');
        try {
            let cleanedCount = 0;
            this.logger.endOperation('cleanupExpiredDevices', operationId, true, undefined, {
                cleanedCount,
            });
            return cleanedCount;
        }
        catch (error) {
            this.logger.endOperation('cleanupExpiredDevices', operationId, false, undefined, { error: error.message });
            this.logger.error('Device cleanup failed', error.stack, 'DeviceService');
            return 0;
        }
    }
    formatLocation(geolocation) {
        if (!geolocation)
            return 'Localisation inconnue';
        try {
            const location = typeof geolocation === 'string'
                ? JSON.parse(geolocation)
                : geolocation;
            return `${location.city || 'Ville inconnue'}, ${location.country || 'Pays inconnu'}`;
        }
        catch {
            return 'Localisation inconnue';
        }
    }
    calculateDeviceSecurityScore(metrics) {
        let score = 100;
        if (metrics.trustedDevicesCount === 0)
            score -= 30;
        if (metrics.activeSessionsCount > 5)
            score -= 15;
        if (metrics.recentDevicesCount > 10)
            score -= 20;
        if (metrics.hasRecentSuspiciousActivity)
            score -= 40;
        if (metrics.trustedDevicesCount >= 2 && metrics.trustedDevicesCount <= 4)
            score += 10;
        return Math.max(0, Math.min(100, score));
    }
    detectSuspiciousActivity(recentDevices) {
        if (recentDevices.length === 0)
            return false;
        const last24h = recentDevices.filter(device => new Date(device.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000));
        return last24h.length > 5;
    }
};
exports.DeviceService = DeviceService;
exports.DeviceService = DeviceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        email_service_1.EmailService,
        logger_service_1.LoggerService])
], DeviceService);
//# sourceMappingURL=device.service.js.map