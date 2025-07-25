import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { EmailService } from '../../../shared/email/email.service';
import { IAuthService, ILoginResult, IRegisterResult, ILoginRequest, IRegisterRequest, IUserProfile } from '../interfaces';
import { ITokenPair } from '../interfaces/session.interface';
import { TokenService } from './token.service';
import { SessionService } from './session.service';
import { SecurityService } from './security.service';
import { EmailVerificationService } from './email-verification.service';
import { PasswordService } from './password.service';
import { MfaService } from './mfa.service';
export declare class AuthService implements IAuthService {
    private readonly prisma;
    private readonly redis;
    private readonly email;
    private readonly tokenService;
    private readonly sessionService;
    private readonly emailVerificationService;
    private readonly securityService;
    private readonly passwordService;
    private readonly mfaService;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService, email: EmailService, tokenService: TokenService, sessionService: SessionService, emailVerificationService: EmailVerificationService, securityService: SecurityService, passwordService: PasswordService, mfaService: MfaService, loggerService: LoggerService);
    login(loginData: ILoginRequest, context?: {
        ipAddress: string;
        userAgent: string;
        deviceFingerprint?: string;
    }): Promise<ILoginResult>;
    register(registerData: IRegisterRequest, clientInfo?: {
        ip: string;
        userAgent: string;
    }): Promise<IRegisterResult>;
    private handleSuccessfulLogin;
    validateUser(email: string, password: string, context?: {
        ipAddress?: string;
        userAgent?: string;
        deviceFingerprint?: string;
    }): Promise<IUserProfile | null>;
    logout(sessionId: string, allDevices?: boolean): Promise<boolean>;
    refreshTokens(refreshToken: string): Promise<ITokenPair>;
    verifyMfa(challengeToken: string, code: string, method: any): Promise<ILoginResult>;
    verifyEmail(token: string): Promise<{
        success: boolean;
        verified: boolean;
        message: string;
        userId?: string;
    }>;
    resendVerificationEmail(userId: string): Promise<{
        success: boolean;
        message: string;
        tokenId?: string;
    }>;
    getVerificationStatus(userId: string): Promise<{
        emailVerified: boolean;
        verifiedAt?: string;
        canResend: boolean;
    }>;
    private validatePasswordStrength;
    private checkEmailExists;
    private checkRegistrationRateLimit;
    private handleFailedLogin;
    private updateLastLogin;
    private validateAndNormalizeIp;
    private processOnboardingSecret;
    private getUserProfile;
    private mapDbUserToProfile;
    private generateMfaChallenge;
    private isMfaRequired;
}
