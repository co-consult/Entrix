import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { EmailService } from '../../../shared/email/email.service';
import { IDeviceInfo } from '../interfaces';
export declare class DeviceService {
    private readonly prisma;
    private readonly redis;
    private readonly email;
    private readonly logger;
    private readonly TRUSTED_DEVICE_TTL;
    constructor(prisma: PrismaService, redis: RedisService, email: EmailService, loggerService: LoggerService);
    isDeviceTrusted(userId: string, deviceFingerprint: string): Promise<boolean>;
    trustDevice(userId: string, deviceInfo: IDeviceInfo, verifiedBy2FA?: boolean): Promise<boolean>;
    revokeDeviceTrust(userId: string, deviceFingerprint: string): Promise<boolean>;
    getUserTrustedDevices(userId: string): Promise<Array<{
        deviceFingerprint: string;
        deviceName: string;
        ipAddress: string;
        userAgent: string;
        location: string;
        trustedAt: string;
        lastUsed: string;
        expiresAt: string;
        isActive: boolean;
    }>>;
    compareDevices(device1: IDeviceInfo, device2: IDeviceInfo): Promise<{
        similarity: number;
        factors: string[];
        recommendation: 'SAME_DEVICE' | 'SIMILAR_DEVICE' | 'DIFFERENT_DEVICE';
    }>;
    getUserDeviceReport(userId: string): Promise<{
        trustedDevices: number;
        activeSessions: number;
        recentDevices: any[];
        securityScore: number;
        suspiciousActivity: boolean;
    }>;
    cleanupExpiredDevices(): Promise<number>;
    private formatLocation;
    private calculateDeviceSecurityScore;
    private detectSuspiciousActivity;
}
