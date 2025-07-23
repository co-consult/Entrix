import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { ResetPasswordDto, ConfirmResetPasswordDto } from './dtos/reset-password.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';
import { MfaLoginDto } from './dtos/mfa.dto';
import { UsersService } from '../users/services/users.service';
import { HashingService } from '../../shared/hashing/hashing.service';
import { MfaService } from './services/mfa.service';
import { SessionsService } from './services/session.service';
import { EmailService } from '../../shared/email/email.service';
import { LoggerService } from '../../shared/logger/logger.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../shared/prisma/prisma.service';
export declare class AuthService {
    private readonly usersService;
    private readonly mfaService;
    private readonly sessionsService;
    private readonly emailService;
    private readonly logger;
    private readonly config;
    private readonly prisma;
    private readonly hashingService;
    constructor(usersService: UsersService, mfaService: MfaService, sessionsService: SessionsService, emailService: EmailService, logger: LoggerService, config: ConfigService, prisma: PrismaService, hashingService: HashingService);
    login(dto: LoginDto, ip?: string, userAgent?: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        session: {
            id: any;
        };
    }>;
    mfaLogin(dto: MfaLoginDto & {
        email: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    register(dto: RegisterDto): Promise<{
        id: string;
        email: string;
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    confirmResetPassword(dto: ConfirmResetPasswordDto): Promise<{
        message: string;
    }>;
    verifyEmail(dto: VerifyEmailDto): Promise<{
        message: string;
        verified: boolean;
    }>;
    resendVerificationEmail(email: string): Promise<{
        message: string;
    }>;
    logout(sessionId: string): Promise<{
        message: string;
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
    }>;
    private createVerificationToken;
    private verifyAndConsumeToken;
    private invalidateUserTokens;
    cleanupExpiredTokens(): Promise<number>;
    private generateToken;
    private generateSessionId;
    getTokenStats(): Promise<{
        active: number;
        expired: number;
        used: number;
        byType: Record<string, number>;
    }>;
}
