import { LoggerService } from '../../../shared/logger/logger.service';
import { MfaService } from '../services/mfa.service';
import { MfaSetupDto, MfaSetupResponseDto, MfaVerifyDto, MfaVerifyResponseDto } from '../dto/mfa';
import { IUserProfile, MfaProvider } from '../interfaces';
export declare class MfaController {
    private readonly mfaService;
    private readonly logger;
    constructor(mfaService: MfaService, loggerService: LoggerService);
    getAvailableProviders(userId: string): Promise<{
        success: boolean;
        data: {
            available: ("SMS_OTP" | "EMAIL_OTP" | "TOTP_APP" | "BACKUP_CODE")[];
            configured: MfaProvider[];
            recommended: any;
        };
    }>;
    setupMfa(mfaSetupDto: MfaSetupDto, userId: string): Promise<MfaSetupResponseDto>;
    verifyMfa(mfaVerifyDto: MfaVerifyDto, user: IUserProfile): Promise<MfaVerifyResponseDto>;
    generateMfaChallenge(userId: string): Promise<{
        success: boolean;
        data: {
            challengeToken: string;
            availableMethods: ("SMS_OTP" | "EMAIL_OTP" | "TOTP_APP" | "BACKUP_CODE")[];
            expiresIn: number;
        };
    }>;
    disableMfa(provider: MfaProvider, userId: string): Promise<{
        success: boolean;
        error: {
            code: string;
            message: string;
        };
        data?: undefined;
    } | {
        success: boolean;
        data: {
            provider: MfaProvider;
            disabled: boolean;
            remainingMethods: ("SMS_OTP" | "EMAIL_OTP" | "TOTP_APP" | "BACKUP_CODE")[];
        };
        error?: undefined;
    }>;
    generateBackupCodes(userId: string): Promise<{
        success: boolean;
        data: {
            backupCodes: string[];
            previousCodesRevoked: boolean;
            warning: string;
        };
    }>;
    private getRecommendedProvider;
}
