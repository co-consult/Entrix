import { MfaProvider } from '../constants/auth.constants';
import { IUserProfile, ILoginRequest, IRegisterRequest } from './user.interface';
import { ISessionInfo, ITokenPair } from './session.interface';
import { IMfaChallenge } from './mfa.interface';
export interface JwtPayload {
    sub: string;
    email: string;
    iat: number;
    exp: number;
    aud: string;
    iss: string;
    sessionId: string;
    deviceFingerprint?: string;
    roles?: string[];
    permissions?: string[];
}
export interface JwtRefreshPayload {
    sub: string;
    sessionId: string;
    tokenId: string;
    iat: number;
    exp: number;
    aud: string;
    iss: string;
}
export interface ILoginResult {
    success: boolean;
    user?: IUserProfile;
    tokens?: ITokenPair;
    session?: ISessionInfo;
    mfaRequired?: IMfaChallenge;
    meta?: {
        riskScore: number;
        requiresMfa: boolean;
        ipGeolocation: string;
    };
}
export interface IRegisterResult {
    success: boolean;
    user?: IUserProfile;
    tokens?: ITokenPair;
    verification?: {
        emailSent: boolean;
        verificationRequired: boolean;
        tokenId: string;
    };
    onboarding?: {
        incentiveApplied: boolean;
        incentiveType: string;
        incentiveValue: number;
        migratedTickets: number;
    };
}
export interface IVerificationStatus {
    emailVerified: boolean;
    verifiedAt?: string;
    canResend: boolean;
}
export interface IAuthService {
    login(loginData: ILoginRequest, context?: {
        ipAddress: string;
        userAgent: string;
        deviceFingerprint?: string;
    }): Promise<ILoginResult>;
    register(registerData: IRegisterRequest): Promise<IRegisterResult>;
    logout(sessionId: string, allDevices?: boolean): Promise<boolean>;
    validateUser(email: string, password: string, context?: {
        ipAddress: string;
        userAgent: string;
        deviceFingerprint?: string;
    }): Promise<IUserProfile | null>;
    verifyMfa(challengeToken: string, code: string, method: MfaProvider): Promise<ILoginResult>;
}
