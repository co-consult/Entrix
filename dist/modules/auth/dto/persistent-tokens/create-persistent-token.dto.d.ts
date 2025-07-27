import { persistent_token_type } from '@prisma/client';
export declare class CreatePersistentTokenDto {
    token_type: persistent_token_type;
    name?: string;
    description?: string;
    scopes?: string[];
    expires_at?: Date | null;
    device_info?: {
        deviceFingerprint?: string;
        userAgent?: string;
        platform?: string;
        appVersion?: string;
    };
    metadata?: Record<string, any>;
}
export declare class UpdatePersistentTokenDto {
    name?: string;
    description?: string;
    scopes?: string[];
    expires_at?: Date | null;
    is_active?: boolean;
    metadata?: Record<string, any>;
}
export declare class GenerateApiKeyDto {
    name?: string;
    scopes?: string[];
    description?: string;
}
export declare class RevokePersistentTokenDto {
    reason?: string;
}
export declare class PersistentTokenFiltersDto {
    token_type?: persistent_token_type;
    is_active?: boolean;
    is_revoked?: boolean;
    expires_before?: Date;
    expires_after?: Date;
    search?: string;
}
export declare class PersistentTokenResponseDto {
    id: string;
    token_type: persistent_token_type;
    token_prefix: string;
    name?: string;
    description?: string;
    scopes: string[];
    expires_at?: string;
    last_used_at?: string;
    usage_count: number;
    is_active: boolean;
    created_at: string;
}
export declare class GeneratedPersistentTokenResponseDto {
    id: string;
    token: string;
    token_prefix: string;
    token_type: persistent_token_type;
    scopes: string[];
    expires_at?: string;
    created_at: string;
    security_warning: string;
}
export declare class PersistentTokenStatsResponseDto {
    total: number;
    active: number;
    expired: number;
    revoked: number;
    by_type: Record<string, number>;
    recent_usage: {
        last_24h: number;
        last_7d: number;
        last_30d: number;
    };
}
export declare class ValidatePersistentTokenDto {
    token: string;
}
export declare class ValidatePersistentTokenResponseDto {
    isValid: boolean;
    userId?: string;
    scopes?: string[];
    errors?: string[];
    lastUsed?: string;
    usageCount?: number;
    user?: {
        id: string;
        email: string;
        is_active: boolean;
    };
}
