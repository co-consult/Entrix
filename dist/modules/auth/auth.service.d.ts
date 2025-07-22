import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { ResetPasswordDto, ConfirmResetPasswordDto } from './dtos/reset-password.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';
import { MfaLoginDto } from './dtos/mfa.dto';
import { UsersService } from '../users/services/users.service';
import { MfaService } from './services/mfa.service';
import { SessionsService } from './services/session.service';
import { EmailService } from '../../shared/email/email.service';
import { LoggerService } from '../../shared/logger/logger.service';
import { ConfigService } from '@nestjs/config';
export declare class AuthService {
    private readonly usersService;
    private readonly mfaService;
    private readonly sessionsService;
    private readonly emailService;
    private readonly logger;
    private readonly config;
    constructor(usersService: UsersService, mfaService: MfaService, sessionsService: SessionsService, emailService: EmailService, logger: LoggerService, config: ConfigService);
    login(dto: LoginDto, ip?: string, userAgent?: string): Promise<{
        mfaRequired: boolean;
        method: string;
        accessToken?: undefined;
        refreshToken?: undefined;
    } | {
        accessToken: string;
        refreshToken: string;
        mfaRequired?: undefined;
        method?: undefined;
    }>;
    mfaLogin(dto: MfaLoginDto & {
        email: string;
    }, ip?: string, userAgent?: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    register(dto: RegisterDto): Promise<{
        id: string;
        email: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<void>;
    confirmResetPassword(dto: ConfirmResetPasswordDto): Promise<{
        message: string;
    }>;
    verifyEmail(dto: VerifyEmailDto): Promise<{
        message: string;
    }>;
    logout(sessionId: string): Promise<{
        message: string;
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
    }>;
    private generateToken;
}
