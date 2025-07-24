import { LoggerService } from '../../../shared/logger/logger.service';
import { AuthService } from '../services/auth.service';
import { LoginDto, RegisterDto, LoginResponseDto, RegisterResponseDto } from '../dto';
import { IUserProfile, IVerificationStatus } from '../interfaces';
export declare class AuthController {
    private readonly authService;
    private readonly logger;
    constructor(authService: AuthService, loggerService: LoggerService);
    login(loginDto: LoginDto, clientInfo: {
        ip: string;
        userAgent: string;
        deviceFingerprint?: string;
    }): Promise<LoginResponseDto>;
    register(registerDto: RegisterDto, clientInfo: {
        ip: string;
        userAgent: string;
    }): Promise<RegisterResponseDto>;
    logout(user: IUserProfile, sessionId: string, logoutDto?: {
        allDevices?: boolean;
    }): Promise<{
        success: boolean;
        data: {
            message: string;
            tokensInvalidated: number;
            sessionsTerminated: number;
        };
    }>;
    verifyEmail(token: string): Promise<{
        success: boolean;
        verified: boolean;
        message: string;
        userId?: string;
    }>;
    resendVerificationEmail(user: IUserProfile): Promise<{
        success: boolean;
        message: string;
        tokenId?: string;
    }>;
    getVerificationStatus(user: IUserProfile): Promise<IVerificationStatus>;
}
