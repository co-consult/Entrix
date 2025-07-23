import { LoggerService } from '../../../shared/logger/logger.service';
import { AuthService } from '../services/auth.service';
import { LoginDto, RegisterDto, LoginResponseDto, RegisterResponseDto, LogoutDto, LogoutResponseDto } from '../dto/auth';
import { IUserProfile } from '../interfaces';
export declare class AuthController {
    private readonly authService;
    private readonly logger;
    constructor(authService: AuthService, loggerService: LoggerService);
    login(loginDto: LoginDto, req: any, clientInfo: {
        ip: string;
        userAgent: string;
    }): Promise<LoginResponseDto>;
    register(registerDto: RegisterDto, clientInfo: {
        ip: string;
        userAgent: string;
    }): Promise<RegisterResponseDto>;
    logout(logoutDto: LogoutDto, userId: string, sessionId: string): Promise<LogoutResponseDto>;
    verifyEmail(token: string): Promise<{
        success: boolean;
        message: string;
    }>;
    resendVerification(user: IUserProfile): Promise<{
        success: boolean;
        message: string;
    }>;
    private getActiveSessionsCount;
}
