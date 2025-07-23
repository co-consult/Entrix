export declare class TrustedDeviceDto {
    verificationCode: string;
    deviceName?: string;
    trustDevice?: boolean;
}
export declare class TrustedDeviceResponseDto {
    success: boolean;
    data: {
        deviceTrusted: boolean;
        deviceId: string;
        expiresAt: string;
    };
}
