import { validation_token_type } from '@prisma/client';
export declare class CreateEmailVerificationDto {
    email: string;
    verification_type?: 'registration' | 'email_change';
    previous_email?: string;
}
export declare class CreatePasswordResetDto {
    email: string;
    client_info?: {
        ip_address?: string;
        user_agent?: string;
        device_fingerprint?: string;
    };
}
export declare class UsePasswordResetDto {
    token: string;
    new_password: string;
    confirm_password?: string;
}
export declare class CreateInvitationDto {
    email: string;
    role: string;
    group_id?: string;
    organization_id?: string;
    permissions?: string[];
    welcome_message?: string;
    auto_accept?: boolean;
}
export declare class AcceptInvitationDto {
    token: string;
    firstName: string;
    lastName: string;
    password: string;
    phone?: string;
    terms_accepted?: boolean;
}
export declare class CreateMagicLinkDto {
    email: string;
    action: string;
    redirect_url?: string;
    context_data?: Record<string, any>;
    expires_after_use?: boolean;
}
export declare class UseMagicLinkDto {
    token: string;
    client_info?: {
        ip_address?: string;
        user_agent?: string;
        device_fingerprint?: string;
    };
}
export declare class CreatePhoneVerificationDto {
    phone: string;
    user_id?: string;
}
export declare class VerifyPhoneDto {
    code: string;
    phone: string;
}
export declare class ValidateTokenDto {
    token: string;
}
export declare class UseTokenDto {
    token: string;
    client_info?: {
        ip_address?: string;
        user_agent?: string;
        device_fingerprint?: string;
    };
}
export declare class ResendTokenDto {
    email: string;
    token_type: validation_token_type;
}
export declare class ValidationTokenFiltersDto {
    email?: string;
    token_type?: validation_token_type;
    is_used?: boolean;
    is_blocked?: boolean;
    created_after?: Date;
    created_before?: Date;
}
export declare class ValidationTokenResponseDto {
    id: string;
    token_type: validation_token_type;
    email: string;
    user_id?: string;
    expires_at: string;
    is_used: boolean;
    used_at?: string;
    attempt_count: number;
    max_attempts: number;
    is_blocked: boolean;
    created_at: string;
}
export declare class GeneratedValidationTokenResponseDto {
    id: string;
    token_type: validation_token_type;
    email: string;
    expires_at: string;
    max_attempts: number;
    verification_url?: string;
    magic_link_url?: string;
    message: string;
}
export declare class TokenValidationResponseDto {
    isValid: boolean;
    errors?: Array<{
        code: string;
        message: string;
        field?: string;
    }>;
    attempts_remaining?: number;
    is_blocked?: boolean;
    expires_at?: string;
    can_resend?: boolean;
}
export declare class TokenUsageResponseDto {
    success: boolean;
    user_id?: string;
    email?: string;
    action_data?: Record<string, any>;
    next_steps?: string[];
    errors?: Array<{
        code: string;
        message: string;
    }>;
    message?: string;
}
export declare class ValidationTokenStatsResponseDto {
    total: number;
    active: number;
    used: number;
    expired: number;
    blocked: number;
    by_type: Record<string, number>;
    success_rate: number;
    recent_activity: {
        last_24h: number;
        last_7d: number;
        last_30d: number;
    };
}
export declare class VerifyEmailResponseDto extends TokenUsageResponseDto {
    email_verified?: boolean;
    verified_at?: string;
}
export declare class PasswordResetResponseDto extends TokenUsageResponseDto {
    password_updated?: boolean;
    sessions_closed?: number;
}
export declare class InvitationResponseDto extends TokenUsageResponseDto {
    account_created?: boolean;
    role_assigned?: string;
    permissions_granted?: string[];
}
