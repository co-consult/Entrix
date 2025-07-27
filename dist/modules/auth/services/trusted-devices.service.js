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
exports.TrustedDevicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
let TrustedDevicesService = class TrustedDevicesService {
    prisma;
    logger;
    constructor(prisma, loggerService) {
        this.prisma = prisma;
        this.logger = loggerService.createChildLogger('TrustedDevicesService');
    }
    async trustDevice(userId, deviceFingerprint, deviceInfo) {
        const operationId = this.logger.startOperation('trustDevice', {
            userId,
            deviceFingerprint: deviceFingerprint.slice(0, 8) + '...'
        });
        try {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);
            const trustedDevice = await this.prisma.user_trusted_devices.upsert({
                where: {
                    user_id_device_fingerprint: {
                        user_id: userId,
                        device_fingerprint: deviceFingerprint
                    }
                },
                update: {
                    trusted_at: new Date(),
                    expires_at: expiresAt,
                    last_seen_at: new Date(),
                    ip_address: deviceInfo?.ipAddress,
                    user_agent: deviceInfo?.userAgent,
                    device_name: this.generateDeviceName(deviceInfo),
                    is_active: true,
                    metadata: {
                        browser: deviceInfo?.browser,
                        os: deviceInfo?.os,
                        isMobile: deviceInfo?.isMobile,
                        geolocation: deviceInfo?.geolocation
                    }
                },
                create: {
                    user_id: userId,
                    device_fingerprint: deviceFingerprint,
                    device_name: this.generateDeviceName(deviceInfo),
                    expires_at: expiresAt,
                    ip_address: deviceInfo?.ipAddress,
                    user_agent: deviceInfo?.userAgent,
                    is_active: true,
                    metadata: {
                        browser: deviceInfo?.browser,
                        os: deviceInfo?.os,
                        isMobile: deviceInfo?.isMobile,
                        geolocation: deviceInfo?.geolocation
                    }
                }
            });
            this.logger.endOperation('trustDevice', operationId, true);
            return this.mapToInterface(trustedDevice);
        }
        catch (error) {
            this.logger.endOperation('trustDevice', operationId, false);
            this.logger.error('Failed to trust device', error.stack, 'TrustedDevicesService.trustDevice', JSON.stringify({
                userId,
                error: error.message
            }));
            throw error;
        }
    }
    async isDeviceTrusted(userId, deviceFingerprint) {
        try {
            const device = await this.prisma.user_trusted_devices.findUnique({
                where: {
                    user_id_device_fingerprint: {
                        user_id: userId,
                        device_fingerprint: deviceFingerprint
                    }
                },
                select: {
                    is_active: true,
                    expires_at: true
                }
            });
            if (!device || !device.is_active) {
                return false;
            }
            return device.expires_at > new Date();
        }
        catch (error) {
            this.logger.error('Failed to check device trust', error.stack);
            return false;
        }
    }
    async getTrustedDevices(userId) {
        const operationId = this.logger.startOperation('getTrustedDevices', { userId });
        try {
            const devices = await this.prisma.user_trusted_devices.findMany({
                where: {
                    user_id: userId,
                    is_active: true
                },
                orderBy: {
                    last_seen_at: 'desc'
                }
            });
            this.logger.endOperation('getTrustedDevices', operationId, true);
            return devices.map(device => this.mapToInterface(device));
        }
        catch (error) {
            this.logger.endOperation('getTrustedDevices', operationId, false);
            throw error;
        }
    }
    async getTrustedDevicesCount(userId) {
        try {
            return await this.prisma.user_trusted_devices.count({
                where: {
                    user_id: userId,
                    is_active: true,
                    expires_at: {
                        gt: new Date()
                    }
                }
            });
        }
        catch (error) {
            this.logger.error('Failed to count trusted devices', error.stack);
            return 0;
        }
    }
    async removeTrustedDevice(userId, deviceId) {
        const operationId = this.logger.startOperation('removeTrustedDevice', {
            userId,
            deviceId
        });
        try {
            const result = await this.prisma.user_trusted_devices.updateMany({
                where: {
                    id: deviceId,
                    user_id: userId
                },
                data: {
                    is_active: false
                }
            });
            const success = result.count > 0;
            if (!success) {
                throw new common_1.NotFoundException('Appareil de confiance non trouvé');
            }
            this.logger.endOperation('removeTrustedDevice', operationId, true);
            return true;
        }
        catch (error) {
            this.logger.endOperation('removeTrustedDevice', operationId, false);
            throw error;
        }
    }
    async removeAllTrustedDevices(userId) {
        const operationId = this.logger.startOperation('removeAllTrustedDevices', { userId });
        try {
            const result = await this.prisma.user_trusted_devices.updateMany({
                where: {
                    user_id: userId,
                    is_active: true
                },
                data: {
                    is_active: false
                }
            });
            this.logger.endOperation('removeAllTrustedDevices', operationId, true);
            return result.count;
        }
        catch (error) {
            this.logger.endOperation('removeAllTrustedDevices', operationId, false);
            throw error;
        }
    }
    async updateLastSeen(userId, deviceFingerprint) {
        try {
            await this.prisma.user_trusted_devices.updateMany({
                where: {
                    user_id: userId,
                    device_fingerprint: deviceFingerprint,
                    is_active: true
                },
                data: {
                    last_seen_at: new Date()
                }
            });
        }
        catch (error) {
            this.logger.error('Failed to update last seen', error.stack);
        }
    }
    async cleanupExpiredDevices() {
        const operationId = this.logger.startOperation('cleanupExpiredDevices');
        try {
            const result = await this.prisma.user_trusted_devices.updateMany({
                where: {
                    expires_at: {
                        lt: new Date()
                    },
                    is_active: true
                },
                data: {
                    is_active: false
                }
            });
            this.logger.endOperation('cleanupExpiredDevices', operationId, true, undefined, {
                cleanedCount: result.count
            });
            return result.count;
        }
        catch (error) {
            this.logger.endOperation('cleanupExpiredDevices', operationId, false);
            this.logger.error('Failed to cleanup expired devices', error.stack);
            return 0;
        }
    }
    async extendDeviceTrust(userId, deviceId, additionalDays) {
        const operationId = this.logger.startOperation('extendDeviceTrust', {
            userId,
            deviceId,
            additionalDays
        });
        try {
            const device = await this.prisma.user_trusted_devices.findFirst({
                where: {
                    id: deviceId,
                    user_id: userId,
                    is_active: true
                }
            });
            if (!device) {
                throw new common_1.NotFoundException('Appareil de confiance non trouvé');
            }
            const newExpirationDate = new Date(device.expires_at);
            newExpirationDate.setDate(newExpirationDate.getDate() + additionalDays);
            await this.prisma.user_trusted_devices.update({
                where: { id: deviceId },
                data: {
                    expires_at: newExpirationDate
                }
            });
            this.logger.endOperation('extendDeviceTrust', operationId, true);
            return true;
        }
        catch (error) {
            this.logger.endOperation('extendDeviceTrust', operationId, false);
            throw error;
        }
    }
    async getDeviceStats(userId) {
        try {
            const now = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const [total, active, expired, recentlyUsed] = await Promise.all([
                this.prisma.user_trusted_devices.count({
                    where: { user_id: userId }
                }),
                this.prisma.user_trusted_devices.count({
                    where: {
                        user_id: userId,
                        is_active: true,
                        expires_at: { gt: now }
                    }
                }),
                this.prisma.user_trusted_devices.count({
                    where: {
                        user_id: userId,
                        expires_at: { lt: now }
                    }
                }),
                this.prisma.user_trusted_devices.count({
                    where: {
                        user_id: userId,
                        is_active: true,
                        last_seen_at: { gte: sevenDaysAgo }
                    }
                })
            ]);
            return { total, active, expired, recentlyUsed };
        }
        catch (error) {
            this.logger.error('Failed to get device stats', error.stack);
            return { total: 0, active: 0, expired: 0, recentlyUsed: 0 };
        }
    }
    mapToInterface(device) {
        return {
            id: device.id,
            userId: device.user_id,
            deviceFingerprint: device.device_fingerprint,
            deviceName: device.device_name,
            trustedAt: device.trusted_at,
            expiresAt: device.expires_at,
            lastSeenAt: device.last_seen_at,
            ipAddress: device.ip_address,
            userAgent: device.user_agent,
            metadata: device.metadata,
            isActive: device.is_active,
            createdAt: device.created_at
        };
    }
    generateDeviceName(deviceInfo) {
        if (!deviceInfo) {
            return 'Appareil inconnu';
        }
        const parts = [];
        if (deviceInfo.isMobile) {
            parts.push('Mobile');
        }
        else {
            parts.push('Ordinateur');
        }
        if (deviceInfo.os) {
            parts.push(deviceInfo.os);
        }
        if (deviceInfo.browser) {
            parts.push(deviceInfo.browser);
        }
        if (deviceInfo.geolocation?.city) {
            parts.push(`(${deviceInfo.geolocation.city})`);
        }
        return parts.length > 0 ? parts.join(' ') : 'Appareil inconnu';
    }
};
exports.TrustedDevicesService = TrustedDevicesService;
exports.TrustedDevicesService = TrustedDevicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        logger_service_1.LoggerService])
], TrustedDevicesService);
//# sourceMappingURL=trusted-devices.service.js.map