import { IDeviceInfo } from '../interfaces/session.interface';
export declare class DeviceUtil {
    static parseUserAgent(userAgent: string): {
        browser: string;
        browserVersion: string;
        os: string;
        osVersion: string;
        isMobile: boolean;
        isBot: boolean;
    };
    static generateDeviceFingerprint(deviceInfo: Partial<IDeviceInfo>): string;
    static calculateDeviceEntropy(deviceInfo: IDeviceInfo): number;
    static normalizeDeviceInfo(rawDeviceInfo: any): IDeviceInfo;
    static compareDevices(device1: IDeviceInfo, device2: IDeviceInfo): {
        similarity: number;
        factors: string[];
    };
    static generateDeviceName(deviceInfo: Partial<IDeviceInfo>): string;
}
