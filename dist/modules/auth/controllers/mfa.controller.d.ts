import { MfaService } from '../services/mfa.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { IUserProfile } from '../interfaces/user.interface';
import { MfaProvider } from '../constants/auth.constants';
import { MfaSetupDto, MfaSetupResponseDto } from '../dto/mfa/mfa-setup.dto';
import { MfaVerifyDto, MfaVerifyResponseDto } from '../dto/mfa/mfa-verify.dto';
import { MfaDisableDto, MfaToggleDto, MfaProvidersResponseDto, MfaStatusResponseDto, MfaRegenerateBackupCodesDto } from '../dto/mfa/mfa-management.dto';
export declare class MfaController {
    private readonly mfaService;
    private readonly logger;
    constructor(mfaService: MfaService, loggerService: LoggerService);
    getAvailableProviders(user: IUserProfile): Promise<MfaProvidersResponseDto>;
    getMfaStatus(user: IUserProfile): Promise<MfaStatusResponseDto>;
    setupMfa(mfaSetupDto: MfaSetupDto, user: IUserProfile): Promise<MfaSetupResponseDto>;
    verifyMfa(mfaVerifyDto: MfaVerifyDto, user: IUserProfile): Promise<MfaVerifyResponseDto>;
    toggleMfa(provider: MfaProvider, toggleDto: MfaToggleDto, user: IUserProfile): Promise<{
        success: boolean;
        message: string;
        data: {
            provider: "SMS_OTP" | "EMAIL_OTP" | "TOTP_APP" | "BACKUP_CODE";
            isEnabled: boolean;
        };
    }>;
    deleteMfa(provider: MfaProvider, disableDto: MfaDisableDto, user: IUserProfile): Promise<{
        success: boolean;
        message: string;
        data: {
            provider: "SMS_OTP" | "EMAIL_OTP" | "TOTP_APP" | "BACKUP_CODE";
            deletedAt: string;
        };
    }>;
    regenerateBackupCodes(regenerateDto: MfaRegenerateBackupCodesDto, user: IUserProfile): Promise<{
        success: boolean;
        message: string;
        data: {
            backupCodes: string[];
            generatedAt: string;
            warning: string;
        };
    }>;
    getTrustedDevices(user: IUserProfile): Promise<{
        success: boolean;
        data: {
            devices: {
                id: any;
                deviceName: any;
                trustedAt: any;
                lastSeenAt: any;
                expiresAt: any;
                ipAddress: any;
                isCurrent: boolean;
                isActive: any;
            }[];
            totalCount: number;
        };
    }>;
    removeTrustedDevice(deviceId: string, user: IUserProfile): Promise<{
        success: boolean;
        message: string;
        data: {
            deviceId: string;
            removedAt: string;
        };
    }>;
    private getProviderDisplayName;
    private getProviderDescription;
    private getProviderSetupTime;
    private isProviderRecommended;
    private getRecommendedProvider;
    private getSetupInstructions;
    private calculateSecurityScore;
    private generateMethodsInfo;
    private maskPhone;
    private maskEmail;
    private generatePostMfaTokens;
    private getSessionInfo;
    private getCurrentDeviceFingerprint;
}
