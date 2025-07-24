import { LoggerService } from '../../../shared/logger/logger.service';
import { AuthService } from '../services/auth.service';
import { LoginDto, RegisterDto, LoginResponseDto, RegisterResponseDto } from '../dto';
import { IUserProfile } from '../interfaces';
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
    verifyEmail(verifyDto: {
        token: string;
    }): Promise<{
        success: boolean;
        data: {
            verified: boolean;
            message: string;
        };
    }>;
    resendVerification(resendDto: {
        email: string;
    }): Promise<{
        success: boolean;
        data: {
            sent: boolean;
            message: string;
        };
    }>;
}
