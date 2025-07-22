export interface AuthSession {
    id: string;
    userId: string;
    token: string;
    createdAt: Date;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
    isActive: boolean;
    revokedAt?: Date;
    revokedBy?: string;
}
export interface AuthTokenPayload {
    userId: string;
    email: string;
    roles: string[];
    provider: string;
    iat: number;
    exp: number;
    sessionId?: string;
    mfaEnabled?: boolean;
}
export interface MFASecret {
    userId: string;
    secret: string;
    enabled: boolean;
    createdAt: Date;
    lastUsed?: Date;
    backupCodes?: string[];
}
export interface MFAVerification {
    userId: string;
    code: string;
    expiresAt: Date;
    attempts: number;
    verified: boolean;
}
export interface PasswordResetRequest {
    userId: string;
    token: string;
    requestedAt: Date;
    expiresAt: Date;
    used: boolean;
    usedAt?: Date;
    ipAddress?: string;
}
export interface AuthApiKey {
    id: string;
    userId: string;
    key: string;
    label: string;
    createdAt: Date;
    expiresAt?: Date;
    lastUsedAt?: Date;
    isActive: boolean;
    revokedAt?: Date;
    revokedBy?: string;
    scopes: string[];
    description?: string;
}
export interface BlacklistEntry {
    id: string;
    userId?: string;
    token?: string;
    reason: string;
    createdAt: Date;
    expiresAt?: Date;
    revokedBy?: string;
}
export interface AuthEmailVerification {
    userId: string;
    email: string;
    token: string;
    requestedAt: Date;
    expiresAt: Date;
    verified: boolean;
    verifiedAt?: Date;
}
export interface AuthProviderProfile {
    provider: string;
    providerId: string;
    email?: string;
    displayName?: string;
    avatarUrl?: string;
    linkedAt: Date;
}
export interface AuthAuditLog {
    id: string;
    userId?: string;
    action: string;
    ipAddress?: string;
    userAgent?: string;
    status: 'SUCCESS' | 'FAILURE';
    details?: any;
    createdAt: Date;
}
