import { LoggerService } from '../../../shared/logger/logger.service';
import { ValidationTokenService } from './validation-token.service';
export declare class EmailVerificationService {
    private readonly validationTokenService;
    private readonly logger;
    constructor(validationTokenService: ValidationTokenService, loggerService: LoggerService);
    sendVerificationEmail(email: string, userId?: string): Promise<{
        success: boolean;
        tokenId: string;
        expiresAt: Date;
    }>;
    verifyEmail(token: string): Promise<{
        success: boolean;
        userId?: string;
        email?: string;
    }>;
    resendVerificationEmail(email: string): Promise<{
        success: boolean;
        message: string;
    }>;
    isTokenValid(token: string): Promise<boolean>;
    getVerificationStatus(email: string): Promise<{
        hasActiveToken: boolean;
        canResend: boolean;
        attemptsRemaining?: number;
    }>;
}
