import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { ITrustedDevice } from '../interfaces/mfa.interface';
import { IDeviceInfo } from '../interfaces/session.interface';
export declare class TrustedDevicesService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService, loggerService: LoggerService);
    trustDevice(userId: string, deviceFingerprint: string, deviceInfo?: Partial<IDeviceInfo>): Promise<ITrustedDevice>;
    isDeviceTrusted(userId: string, deviceFingerprint: string): Promise<boolean>;
    getTrustedDevices(userId: string): Promise<ITrustedDevice[]>;
    getTrustedDevicesCount(userId: string): Promise<number>;
    removeTrustedDevice(userId: string, deviceId: string): Promise<boolean>;
    removeAllTrustedDevices(userId: string): Promise<number>;
    updateLastSeen(userId: string, deviceFingerprint: string): Promise<void>;
    cleanupExpiredDevices(): Promise<number>;
    extendDeviceTrust(userId: string, deviceId: string, additionalDays: number): Promise<boolean>;
    getDeviceStats(userId: string): Promise<{
        total: number;
        active: number;
        expired: number;
        recentlyUsed: number;
    }>;
    private mapToInterface;
    private generateDeviceName;
}
