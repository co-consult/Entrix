export declare class AuthModule {
    static withFeatures(features: {
        enableMfa?: boolean;
        enableDeviceTrust?: boolean;
        enableRiskScoring?: boolean;
        enableRateLimit?: boolean;
        enablePasswordService?: boolean;
    }): {
        module: typeof AuthModule;
        providers: any[];
        exports: any[];
    };
}
export { IAuthService, IUserProfile, ILoginResult, IRegisterResult, ITokenPair, ISessionInfo, ISessionLoginResult, JwtPayload, JwtRefreshPayload, } from './interfaces';
export { LoginDto, RegisterDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto, MfaSetupDto, MfaVerifyDto, } from './dto';
export { CurrentUser, CurrentUserId, CurrentSession, SessionId, Public, RequireMfa, RequireTrustedDevice, AuditLog, RateLimit, Roles, Permissions, } from './decorators';
export { InvalidCredentialsException, AccountLockedException, EmailNotVerifiedException, MfaRequiredException, InvalidMfaCodeException, DeviceNotTrustedException, SessionExpiredException, InvalidRefreshTokenException, SuspiciousActivityException, } from './exceptions';
export { AUTH_CONSTANTS, SESSION_CONSTANTS, MFA_CONSTANTS, SECURITY_CONSTANTS, ERROR_CONSTANTS, } from './constants';
export { CryptoUtil, DeviceUtil, GeolocationUtil, TokenUtil, SecurityUtil, RiskScoringUtil, } from './utils';
export declare const DEFAULT_AUTH_CONFIG: {
    enableMfa: boolean;
    enableDeviceTrust: boolean;
    enableRiskScoring: boolean;
    enableRateLimit: boolean;
    enablePasswordService: boolean;
};
