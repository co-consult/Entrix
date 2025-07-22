import { mfa_method, blacklist_scope, blacklist_type, severity_level } from '@prisma/client';
export interface JwtPayload {
    sub: string;
    email: string;
    roles: string[];
    permissions: string[];
    type: 'access';
    iat: number;
    exp: number;
    sessionId: string;
    securityLevel?: severity_level;
    mfaVerified?: boolean;
}
export interface RefreshTokenPayload {
    sub: string;
    type: 'refresh';
    iat: number;
    exp: number;
    sessionId: string;
    tokenVersion: number;
}
export interface AuthResponse {
    user: AuthUser;
    tokens: TokenPair;
    session: SessionInfo;
    mfaRequired?: boolean;
    mfaMethods?: mfa_method[];
}
export interface AuthUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    isActive: boolean;
    emailVerified: Date | null;
    phoneVerified: Date | null;
    roles: UserRole[];
    permissions: string[];
    lastLogin?: Date;
}
export interface UserRole {
    id: string;
    code: string;
    name: string;
    level: number;
    assignedAt: Date;
    validUntil?: Date;
    status: string;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    tokenType: 'Bearer';
    expiresIn: number;
    refreshExpiresIn: number;
}
export interface SessionInfo {
    id: string;
    ipAddress: string;
    userAgent?: string;
    deviceFingerprint?: string;
    geolocation?: Geolocation;
    createdAt: Date;
    lastActivity: Date;
    expiresAt: Date;
}
export interface Geolocation {
    country?: string;
    region?: string;
    city?: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    provider?: string;
}
export interface MfaConfig {
    method: mfa_method;
    enabled: boolean;
    secret?: string;
    phoneNumber?: string;
    backupEmail?: string;
    backupCodes?: string[];
    qrCodeUrl?: string;
}
export interface MfaToken {
    id: string;
    userId: string;
    method: mfa_method;
    tokenHash: string;
    secret?: string;
    expiresAt: Date;
    isUsed: boolean;
    metadata?: Record<string, any>;
}
export interface LoginAttempt {
    id: string;
    email: string;
    userId?: string;
    ipAddress: string;
    userAgent?: string;
    success: boolean;
    failureReason?: string;
    isSuspicious: boolean;
    geolocation?: Geolocation;
    metadata?: Record<string, any>;
    createdAt: Date;
}
export interface SecurityEvent {
    id: string;
    eventType: string;
    severity: severity_level;
    targetUserId?: string;
    ipAddress?: string;
    description: string;
    eventData?: Record<string, any>;
    status: string;
    resolvedAt?: Date;
    metadata?: Record<string, any>;
    createdAt: Date;
}
export interface BlacklistEntry {
    id: string;
    type: blacklist_type;
    value: string;
    scope: blacklist_scope;
    reason: string;
    isActive: boolean;
    isPermanent: boolean;
    expiresAt?: Date;
    addedBy: string;
    metadata?: Record<string, any>;
    createdAt: Date;
}
export interface SecurityPolicy {
    id: string;
    code: string;
    name: string;
    description?: string;
    policyType: string;
    rules: SecurityPolicyRules;
    validFrom: Date;
    validUntil?: Date;
    isActive: boolean;
    isEnforced: boolean;
    metadata?: Record<string, any>;
}
export interface SecurityPolicyRules {
    passwordPolicy?: PasswordPolicy;
    sessionPolicy?: SessionPolicy;
    accessPolicy?: AccessPolicy;
    mfaPolicy?: MfaPolicy;
}
export interface PasswordPolicy {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecial: boolean;
    maxAgeDays: number;
    historyCount: number;
    complexityScore: number;
}
export interface SessionPolicy {
    maxDurationHours: number;
    idleTimeoutMinutes: number;
    concurrentSessions: number;
    require2faFor: string[];
    geoRestriction?: GeoRestriction;
}
export interface GeoRestriction {
    enabled: boolean;
    allowedCountries: string[];
    allowedRegions?: string[];
    autoBlock: boolean;
}
export interface AccessPolicy {
    maxFailedAttempts: number;
    lockoutDurationMinutes: number;
    progressiveDelay: boolean;
    captchaAfterAttempts: number;
    ipRestriction?: boolean;
    ipWhitelist?: string[];
}
export interface MfaPolicy {
    requiredForAll: boolean;
    requiredForRoles: string[];
    allowedMethods: mfa_method[];
    defaultMethod: mfa_method;
    backupCodesEnabled: boolean;
    verificationFrequency: number;
}
export interface AuthContext {
    user: AuthUser;
    session: SessionInfo;
    ipAddress: string;
    userAgent?: string;
    permissions: string[];
    mfaVerified: boolean;
    securityLevel: severity_level;
}
export interface LoginOptions {
    rememberMe?: boolean;
    ipAddress: string;
    userAgent?: string;
    deviceFingerprint?: string;
    geolocation?: Geolocation;
    forceNewSession?: boolean;
    mfaCode?: string;
}
export interface TokenValidationResult {
    valid: boolean;
    payload?: JwtPayload | RefreshTokenPayload;
    reason?: string;
    expired?: boolean;
    revoked?: boolean;
}
export interface RateLimitConfig {
    windowMs: number;
    max: number;
    message: string;
    standardHeaders: boolean;
    legacyHeaders: boolean;
    skipIf?: (request: any) => boolean;
}
export type AuthenticationType = 'login' | 'refresh' | 'mfa' | 'reset' | 'verify';
export type SessionStatus = 'active' | 'expired' | 'terminated' | 'suspicious';
export type SecurityLevel = severity_level;
