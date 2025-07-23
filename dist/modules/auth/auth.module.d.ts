import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
export declare class AuthModule {
    static forRoot(): {
        module: typeof AuthModule;
        providers: any[];
        exports: (typeof AuthService | typeof TokenService | typeof SessionService | typeof JwtAuthGuard)[];
    };
    static forRootAsync(options: {
        imports?: any[];
        useFactory?: (...args: any[]) => any;
        inject?: any[];
    }): {
        module: typeof AuthModule;
        imports: any[];
        providers: {
            provide: string;
            useFactory: (...args: any[]) => any;
            inject: any[];
        }[];
        exports: (typeof AuthService | typeof TokenService | typeof SessionService | typeof JwtAuthGuard)[];
    };
    static forFeature(features: {
        enableMfa?: boolean;
        enableDeviceTrust?: boolean;
        enableRiskScoring?: boolean;
        enableRateLimit?: boolean;
    }): {
        module: typeof AuthModule;
        providers: any[];
        exports: any[];
    };
}
export { IAuthService, IUserProfile, ILoginResult, IRegisterResult, ITokenPair, ISessionInfo, JwtPayload, JwtRefreshPayload, } from './interfaces';
export { LoginDto, RegisterDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto, MfaSetupDto, MfaVerifyDto, } from './dto';
export { CurrentUser, CurrentUserId, CurrentSession, SessionId, Public, RequireMfa, RequireTrustedDevice, AuditLog, RateLimit, Roles, Permissions, } from './decorators';
export { InvalidCredentialsException, AccountLockedException, EmailNotVerifiedException, MfaRequiredException, InvalidMfaCodeException, DeviceNotTrustedException, SessionExpiredException, InvalidRefreshTokenException, SuspiciousActivityException, } from './exceptions';
export { AUTH_CONSTANTS, SESSION_CONSTANTS, MFA_CONSTANTS, SECURITY_CONSTANTS, ERROR_CONSTANTS, } from './constants';
export { CryptoUtil, DeviceUtil, GeolocationUtil, TokenUtil, SecurityUtil, RiskScoringUtil, } from './utils';
export declare const DEFAULT_AUTH_CONFIG: {
    jwtSecret: string;
    jwtExpiresIn: string;
    jwtRefreshExpiresIn: string;
    sessionDuration: number;
    maxConcurrentSessions: number;
    mfaEnabled: boolean;
    mfaRequiredForOrganizers: boolean;
    riskScoringEnabled: boolean;
    deviceTrustEnabled: boolean;
    rateLimitingEnabled: boolean;
    loginAttemptsLimit: number;
    loginAttemptsWindow: number;
    emailVerificationRequired: boolean;
    auditEnabled: boolean;
    auditRetentionDays: number;
};
export declare function validateAuthConfig(config: any): boolean;
export declare function createAuthModule(config?: Partial<typeof DEFAULT_AUTH_CONFIG>): {
    module: typeof AuthModule;
    imports: any[];
    providers: {
        provide: string;
        useFactory: (...args: any[]) => any;
        inject: any[];
    }[];
    exports: (typeof AuthService | typeof TokenService | typeof SessionService | typeof JwtAuthGuard)[];
};
