import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { EmailService } from '../../../shared/email/email.service';
import { IAuthService, ILoginResult, IRegisterResult, ILoginRequest, IRegisterRequest, IUserProfile } from '../interfaces';
import { TokenService } from './token.service';
import { SessionService } from './session.service';
import { SecurityService } from './security.service';
export declare class AuthService implements IAuthService {
    private readonly prisma;
    private readonly redis;
    private readonly email;
    private readonly tokenService;
    private readonly sessionService;
    private readonly securityService;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService, email: EmailService, tokenService: TokenService, sessionService: SessionService, securityService: SecurityService, loggerService: LoggerService);
    login(loginData: ILoginRequest, context?: {
        ipAddress: string;
        userAgent: string;
        deviceFingerprint?: string;
    }): Promise<ILoginResult>;
    register(registerData: IRegisterRequest): Promise<IRegisterResult>;
    validateUser(email: string, password: string, context?: {
        ipAddress: string;
        userAgent: string;
        deviceFingerprint?: string;
    }): Promise<IUserProfile | null>;
    logout(sessionId: string, allDevices?: boolean): Promise<boolean>;
    verifyMfa(challengeToken: string, code: string, method: any): Promise<ILoginResult>;
    private validateUserSecurity;
    private updateLastLogin;
    private validatePasswordStrength;
    private handleFailedLogin;
    private initiateMfaChallenge;
    private processOnboardingSecret;
    private generateEmailVerificationToken;
}
