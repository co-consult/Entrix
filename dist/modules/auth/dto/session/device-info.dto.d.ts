import { IDeviceInfo } from '../../interfaces/session.interface';
export declare class DeviceInfoDto implements IDeviceInfo {
    deviceId?: string;
    userAgent: string;
    browser?: string;
    os?: string;
    isMobile: boolean;
    ipAddress: string;
    geolocation?: {
        country: string;
        city: string;
        coordinates?: [number, number];
    };
}
