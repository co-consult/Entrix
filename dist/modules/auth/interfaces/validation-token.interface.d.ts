import { validation_token_type } from '@prisma/client';
export interface IValidationToken {
    id: string;
    user_id?: string | null;
    email: string;
    token_type: validation_token_type;
    token_hash: string;
    token_plain?: string | null;
    expires_at: Date;
    is_used: boolean;
    used_at?: Date | null;
    used_ip?: string | null;
    attempt_count: number;
    max_attempts: number;
    is_blocked: boolean;
    blocked_at?: Date | null;
    reset_password_data?: any | null;
    invitation_data?: any | null;
    verification_data?: any | null;
    magic_link_data?: any | null;
    client_info?: any | null;
    metadata?: any | null;
    created_at: Date;
    updated_at: Date;
}
export interface ICreateValidationTokenData {
    user_id?: string;
    email: string;
    token_type: validation_token_type;
    expires_in_minutes?: number;
    max_attempts?: number;
    reset_password_data?: {
        current_password_hash?: string;
        requires_old_password?: boolean;
        security_questions?: any[];
    };
    invitation_data?: {
        inviter_id?: string;
        inviter_name?: string;
        organization_id?: string;
        role?: string;
        group_id?: string;
        permissions?: string[];
        welcome_message?: string;
    };
    verification_data?: {
        previous_email?: string;
        verification_type?: 'registration' | 'email_change' | 'account_recovery';
        requires_current_password?: boolean;
    };
    magic_link_data?: {
        action: string;
        redirect_url?: string;
        expires_after_use?: boolean;
        one_time_use?: boolean;
        context_data?: Record<string, any>;
    };
    client_info?: {
        ip_address?: string;
        user_agent?: string;
        geolocation?: any;
        device_fingerprint?: string;
    };
    metadata?: Record<string, any>;
}
export interface IUpdateValidationTokenData {
    attempt_count?: number;
    is_blocked?: boolean;
    metadata?: Record<string, any>;
}
export interface IValidationTokenGenerated {
    id: string;
    token: string;
    token_type: validation_token_type;
    email: string;
    user_id?: string;
    expires_at: Date;
    max_attempts: number;
    verification_url?: string;
    magic_link_url?: string;
    created_at: Date;
}
export interface IValidationTokenValidation {
    isValid: boolean;
    token?: IValidationToken;
    errors?: ValidationTokenError[];
    attempts_remaining?: number;
    is_blocked?: boolean;
    expires_at?: Date;
    can_resend?: boolean;
}
export interface ValidationTokenError {
    code: string;
    message: string;
    field?: string;
}
export interface IEmailVerificationToken extends Omit<IValidationToken, 'token_type'> {
    token_type: 'EMAIL_VERIFICATION';
    verification_data: {
        verification_type: 'registration' | 'email_change';
        previous_email?: string;
    };
}
export interface IPasswordResetToken extends Omit<IValidationToken, 'token_type'> {
    token_type: 'PASSWORD_RESET';
    reset_password_data: {
        current_password_hash?: string;
        requires_old_password?: boolean;
        security_questions?: Array<{
            question: string;
            answer_hash: string;
        }>;
    };
}
export interface IUserInvitationToken extends Omit<IValidationToken, 'token_type'> {
    token_type: 'INVITATION_USER' | 'INVITATION_GROUP';
    invitation_data: {
        inviter_id: string;
        inviter_name: string;
        organization_id?: string;
        role: string;
        group_id?: string;
        permissions?: string[];
        welcome_message?: string;
        auto_accept?: boolean;
    };
}
export interface IMagicLinkToken extends Omit<IValidationToken, 'token_type'> {
    token_type: 'MAGIC_LINK_LOGIN' | 'MAGIC_LINK_ACTION';
    magic_link_data: {
        action: string;
        redirect_url?: string;
        expires_after_use: boolean;
        one_time_use: boolean;
        context_data?: Record<string, any>;
    };
}
export interface IValidationTokenUsageResult {
    success: boolean;
    token?: IValidationToken;
    user_id?: string;
    email?: string;
    action_data?: Record<string, any>;
    next_steps?: string[];
    errors?: ValidationTokenError[];
}
export interface IValidationTokenStats {
    total: number;
    active: number;
    used: number;
    expired: number;
    blocked: number;
    by_type: Record<validation_token_type, number>;
    success_rate: number;
    average_usage_time: number;
    recent_activity: {
        last_24h: number;
        last_7d: number;
        last_30d: number;
    };
}
export interface IValidationTokenFilters {
    user_id?: string;
    email?: string;
    token_type?: validation_token_type | validation_token_type[];
    is_used?: boolean;
    is_blocked?: boolean;
    expires_before?: Date;
    expires_after?: Date;
    created_before?: Date;
    created_after?: Date;
    attempt_count_min?: number;
    attempt_count_max?: number;
}
export interface IValidationTokenService {
    createEmailVerificationToken(email: string, userId?: string, type?: 'registration' | 'email_change'): Promise<IValidationTokenGenerated>;
    createPasswordResetToken(email: string): Promise<IValidationTokenGenerated>;
    createInvitationToken(email: string, invitationData: any): Promise<IValidationTokenGenerated>;
    createMagicLinkToken(email: string, action: string, linkData?: any): Promise<IValidationTokenGenerated>;
    createPhoneVerificationToken(phone: string, userId?: string): Promise<IValidationTokenGenerated>;
    validateToken(token: string): Promise<IValidationTokenValidation>;
    useToken(token: string, clientInfo?: any): Promise<IValidationTokenUsageResult>;
    verifyEmailWithToken(token: string): Promise<IValidationTokenUsageResult>;
    resetPasswordWithToken(token: string, newPassword: string): Promise<IValidationTokenUsageResult>;
    acceptInvitationWithToken(token: string, userData?: any): Promise<IValidationTokenUsageResult>;
    useMagicLink(token: string, clientInfo?: any): Promise<IValidationTokenUsageResult>;
    recordAttempt(tokenId: string, success: boolean, clientInfo?: any): Promise<void>;
    blockToken(tokenId: string, reason?: string): Promise<boolean>;
    unblockToken(tokenId: string): Promise<boolean>;
    getToken(tokenId: string): Promise<IValidationToken | null>;
    getTokenByHash(tokenHash: string): Promise<IValidationToken | null>;
    getUserTokens(userId: string, type?: validation_token_type): Promise<IValidationToken[]>;
    getEmailTokens(email: string, type?: validation_token_type): Promise<IValidationToken[]>;
    resendToken(originalTokenId: string): Promise<IValidationTokenGenerated>;
    extendTokenExpiry(tokenId: string, additionalMinutes: number): Promise<boolean>;
    revokeToken(tokenId: string): Promise<boolean>;
    revokeUserTokens(userId: string, type?: validation_token_type): Promise<number>;
    getTokenStats(userId?: string): Promise<IValidationTokenStats>;
    getTokenUsageHistory(tokenId: string): Promise<any[]>;
    cleanupExpiredTokens(): Promise<number>;
    cleanupUsedTokens(olderThanDays?: number): Promise<number>;
    cleanupBlockedTokens(olderThanDays?: number): Promise<number>;
    generateVerificationUrl(token: string, baseUrl?: string): string;
    generateMagicLinkUrl(token: string, baseUrl?: string): string;
    canResendToken(email: string, type: validation_token_type): Promise<boolean>;
}
export declare const VALIDATION_TOKEN_DURATIONS: {
    readonly EMAIL_VERIFICATION: number;
    readonly EMAIL_CHANGE: 30;
    readonly PASSWORD_RESET: 60;
    readonly ACCOUNT_ACTIVATION: number;
    readonly INVITATION_USER: number;
    readonly INVITATION_GROUP: number;
    readonly MAGIC_LINK_LOGIN: 15;
    readonly MAGIC_LINK_ACTION: 60;
    readonly PHONE_VERIFICATION: 10;
    readonly ACCOUNT_DELETION: number;
};
export declare const VALIDATION_TOKEN_ATTEMPT_LIMITS: {
    readonly EMAIL_VERIFICATION: 5;
    readonly EMAIL_CHANGE: 3;
    readonly PASSWORD_RESET: 3;
    readonly ACCOUNT_ACTIVATION: 5;
    readonly INVITATION_USER: 10;
    readonly INVITATION_GROUP: 10;
    readonly MAGIC_LINK_LOGIN: 3;
    readonly MAGIC_LINK_ACTION: 5;
    readonly PHONE_VERIFICATION: 5;
    readonly ACCOUNT_DELETION: 3;
};
export declare enum ValidationTokenErrorCode {
    TOKEN_NOT_FOUND = "TOKEN_NOT_FOUND",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    TOKEN_USED = "TOKEN_USED",
    TOKEN_BLOCKED = "TOKEN_BLOCKED",
    ATTEMPTS_EXCEEDED = "ATTEMPTS_EXCEEDED",
    INVALID_TOKEN_FORMAT = "INVALID_TOKEN_FORMAT",
    USER_NOT_FOUND = "USER_NOT_FOUND",
    EMAIL_MISMATCH = "EMAIL_MISMATCH",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
}
