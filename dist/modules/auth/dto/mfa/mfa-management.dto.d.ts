import { MfaProvider } from '../../constants/auth.constants';
export declare class MfaToggleDto {
    enable: boolean;
    verificationCode?: string;
    challengeToken?: string;
}
export declare class MfaDisableDto {
    confirmationCode?: string;
    challengeToken?: string;
    reason?: string;
}
export declare class MfaRegenerateBackupCodesDto {
    verificationMethod: Exclude<MfaProvider, 'BACKUP_CODE'>;
    verificationCode: string;
    challengeToken: string;
}
export declare class MfaAdvancedConfigDto {
    isPrimary?: boolean;
    customName?: string;
    backupPhone?: string;
}
export declare class MfaProviderInfoDto {
    provider: MfaProvider;
    isConfigured: boolean;
    name: string;
    description: string;
    setupTime: number;
    isRecommended: boolean;
}
export declare class MfaProvidersResponseDto {
    success: boolean;
    data: {
        providers: MfaProviderInfoDto[];
        recommendedProvider: MfaProvider;
        hasMfaConfigured: boolean;
        methodsInfo: Record<string, any>;
    };
}
export declare class MfaStatusDto {
    isEnabled: boolean;
    configuredMethods: MfaProvider[];
    primaryMethod?: MfaProvider;
    trustedDevicesCount: number;
    backupCodesRemaining: number;
    lastUsed?: string;
    securityScore: number;
}
export declare class MfaStatusResponseDto {
    success: boolean;
    data: MfaStatusDto;
}
export declare class TrustedDeviceDto {
    id: string;
    deviceName: string;
    trustedAt: string;
    lastSeenAt: string;
    expiresAt: string;
    ipAddress?: string;
    isCurrent: boolean;
    isActive: boolean;
}
export declare class TrustedDevicesResponseDto {
    success: boolean;
    data: {
        devices: TrustedDeviceDto[];
        totalCount: number;
    };
}
export declare class MfaSendCodeDto {
    method: 'SMS_OTP' | 'EMAIL_OTP';
    challengeToken?: string;
    alternatePhone?: string;
}
export declare class MfaSendCodeResponseDto {
    success: boolean;
    data: {
        method: 'SMS_OTP' | 'EMAIL_OTP';
        sentTo: string;
        expiresIn: number;
        estimatedDelivery: string;
        canResendAfter: number;
    };
    message?: string;
}
export declare class MfaSessionConfigDto {
    mfaSessionDuration?: number;
    allowDeviceTrust?: boolean;
    deviceTrustDuration?: number;
}
export declare class MfaStatsDto {
    totalVerifications: number;
    successfulVerifications: number;
    failedVerifications: number;
    lastSuccessfulVerification?: string;
    mostUsedMethod: MfaProvider;
    methodUsageStats: Record<MfaProvider, number>;
    trustedDevicesHistory: {
        added: number;
        removed: number;
        expired: number;
    };
}
export declare class MfaStatsResponseDto {
    success: boolean;
    data: MfaStatsDto;
}
