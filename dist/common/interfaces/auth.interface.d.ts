import { AuthResponse, TokenPair, JwtPayload, RefreshTokenPayload, TokenValidationResult, MfaConfig, MfaToken, SessionInfo, LoginAttempt, SecurityEvent, BlacklistEntry, SecurityPolicy, LoginOptions, AuthContext } from '../types/auth.types';
import { User } from '../types/user.types';
import { mfa_method, severity_level } from '@prisma/client';
export interface IAuthService {
    register(data: RegisterData): Promise<AuthResponse>;
    login(email: string, password: string, options: LoginOptions): Promise<AuthResponse>;
    refreshTokens(refreshToken: string): Promise<TokenPair>;
    logout(userId: string, sessionId?: string): Promise<void>;
    logoutAll(userId: string): Promise<void>;
    forgotPassword(email: string): Promise<void>;
    resetPassword(token: string, newPassword: string): Promise<void>;
    changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void>;
    verifyEmail(token: string): Promise<void>;
    resendEmailVerification(email: string): Promise<void>;
    verifyPhone(userId: string, code: string): Promise<void>;
    sendPhoneVerification(userId: string): Promise<void>;
    validateAuthContext(token: string): Promise<AuthContext>;
}
export interface ITokenService {
    generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string>;
    generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): Promise<string>;
    generateTokenPair(user: User, sessionId: string): Promise<TokenPair>;
    validateToken(token: string, type: 'access' | 'refresh'): Promise<TokenValidationResult>;
    decodeToken(token: string): JwtPayload | RefreshTokenPayload | null;
    revokeToken(token: string): Promise<void>;
    revokeAllTokens(userId: string): Promise<void>;
    isTokenRevoked(token: string): Promise<boolean>;
    generateTemporaryToken(userId: string, type: string, expiresIn?: number): Promise<string>;
    validateTemporaryToken(token: string, type: string): Promise<{
        userId: string;
        valid: boolean;
    }>;
}
export interface IMfaService {
    enableMfa(userId: string, method: mfa_method, config: Partial<MfaConfig>): Promise<MfaConfig>;
    disableMfa(userId: string, method?: mfa_method): Promise<void>;
    generateMfaToken(userId: string, method: mfa_method): Promise<MfaToken>;
    verifyMfaToken(userId: string, method: mfa_method, token: string): Promise<boolean>;
    setupTotp(userId: string): Promise<{
        secret: string;
        qrCode: string;
        backupCodes: string[];
    }>;
    verifyTotp(userId: string, token: string): Promise<boolean>;
    generateBackupCodes(userId: string): Promise<string[]>;
    useBackupCode(userId: string, code: string): Promise<boolean>;
    getUserMfaConfig(userId: string): Promise<MfaConfig | null>;
    isMfaRequired(userId: string, context: Partial<AuthContext>): Promise<boolean>;
    sendSmsCode(userId: string, phoneNumber: string): Promise<void>;
    sendEmailCode(userId: string, email: string): Promise<void>;
}
export interface ISessionService {
    createSession(userId: string, options: SessionCreationOptions): Promise<SessionInfo>;
    getSession(sessionId: string): Promise<SessionInfo | null>;
    updateSessionActivity(sessionId: string): Promise<void>;
    terminateSession(sessionId: string): Promise<void>;
    terminateAllUserSessions(userId: string): Promise<void>;
    getUserSessions(userId: string): Promise<SessionInfo[]>;
    validateSession(sessionId: string): Promise<boolean>;
    cleanupExpiredSessions(): Promise<number>;
    getActiveSessions(userId: string): Promise<SessionInfo[]>;
    detectSuspiciousSessions(userId: string): Promise<SessionInfo[]>;
}
export interface ISecurityService {
    logLoginAttempt(data: LoginAttemptData): Promise<LoginAttempt>;
    logSecurityEvent(data: SecurityEventData): Promise<SecurityEvent>;
    checkBlacklist(type: string, value: string, scope?: string): Promise<boolean>;
    addToBlacklist(entry: Omit<BlacklistEntry, 'id' | 'createdAt'>): Promise<BlacklistEntry>;
    removeFromBlacklist(id: string): Promise<void>;
    getBlacklistEntries(filters?: BlacklistFilters): Promise<BlacklistEntry[]>;
    validateSecurityPolicy(userId: string, action: string, context: any): Promise<boolean>;
    getSecurityPolicy(code: string): Promise<SecurityPolicy | null>;
    enforceSecurityPolicy(policy: SecurityPolicy, context: any): Promise<void>;
    detectSuspiciousActivity(userId: string, context: any): Promise<boolean>;
    calculateRiskScore(userId: string, context: any): Promise<number>;
    getSecurityEvents(filters?: SecurityEventFilters): Promise<SecurityEvent[]>;
}
export interface IRateLimitService {
    checkLimit(key: string, limit: number, window: number): Promise<{
        allowed: boolean;
        remaining: number;
        resetAt: Date;
    }>;
    incrementCounter(key: string, window: number): Promise<number>;
    resetCounter(key: string): Promise<void>;
    getLimitInfo(key: string): Promise<{
        count: number;
        resetAt: Date;
    } | null>;
    blockTemporarily(key: string, duration: number): Promise<void>;
    isBlocked(key: string): Promise<boolean>;
}
export interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    acceptTerms: boolean;
    marketingConsent?: boolean;
}
export interface SessionCreationOptions {
    ipAddress: string;
    userAgent?: string;
    deviceFingerprint?: string;
    geolocation?: any;
    rememberMe?: boolean;
}
export interface LoginAttemptData {
    email: string;
    userId?: string;
    ipAddress: string;
    userAgent?: string;
    success: boolean;
    failureReason?: string;
    isSuspicious?: boolean;
    geolocation?: any;
    metadata?: any;
}
export interface SecurityEventData {
    eventType: string;
    severity: severity_level;
    targetUserId?: string;
    ipAddress?: string;
    description: string;
    eventData?: any;
    metadata?: any;
}
export interface BlacklistFilters {
    type?: string;
    scope?: string;
    isActive?: boolean;
    addedBy?: string;
    createdAfter?: Date;
    createdBefore?: Date;
}
export interface SecurityEventFilters {
    eventType?: string;
    severity?: severity_level;
    targetUserId?: string;
    status?: string;
    createdAfter?: Date;
    createdBefore?: Date;
}
