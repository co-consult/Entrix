import { LoggerService } from '../../../shared/logger/logger.service';
import { MfaService } from '../services/mfa.service';
import { MfaSetupDto, MfaSetupResponseDto, MfaVerifyDto, MfaVerifyResponseDto, MfaChallengeResponseDto } from '../dto';
import { IUserProfile } from '../interfaces';
import { MfaProvider } from '../constants/auth.constants';
export declare class MfaController {
    private readonly mfaService;
    private readonly logger;
    constructor(mfaService: MfaService, loggerService: LoggerService);
    getAvailableProviders(userId: string): Promise<{
        success: boolean;
        data: {
            available: MfaProvider[];
            configured: MfaProvider[];
            recommended: MfaProvider;
        };
    }>;
    setupMfa(mfaSetupDto: MfaSetupDto, userId: string): Promise<MfaSetupResponseDto>;
    verifyMfa(mfaVerifyDto: MfaVerifyDto, user: IUserProfile): Promise<MfaVerifyResponseDto>;
    disableMfa(provider: MfaProvider, userId: string): Promise<{
        success: boolean;
        data: {
            disabled: boolean;
            provider: MfaProvider;
            message: string;
        };
    }>;
    getMfaStatus(userId: string): Promise<{
        success: boolean;
        data: {
            enabled: boolean;
            providers: MfaProvider[];
            requiredByPolicy: boolean;
            lastUsed?: string;
        };
    }>;
    generateMfaChallenge(userId: string): Promise<{
        success: boolean;
        data: MfaChallengeResponseDto;
    }>;
    private generateSetupInstructions;
    private getRecommendedProvider;
    private generateMethodsInfo;
}
