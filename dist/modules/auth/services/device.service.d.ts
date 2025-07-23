import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { IDeviceInfo } from '../interfaces';
export declare class DeviceService {
    private readonly prisma;
    private readonly redis;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService, loggerService: LoggerService);
    analyzeDevice(rawDeviceInfo: any): Promise<IDeviceInfo>;
    isDeviceTrusted(userId: string, deviceFingerprint: string): Promise<boolean>;
    trustDevice(userId: string, deviceInfo: IDeviceInfo, duration?: number): Promise<void>;
    revokeDeviceTrust(userId: string, deviceFingerprint: string): Promise<boolean>;
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
    }>;
    private calculateDeviceSecurityScore;
}
