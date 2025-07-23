export declare const RATE_LIMIT_KEY = "rateLimit";
export interface RateLimitConfig {
    limit: number;
    windowMs: number;
    keyGenerator?: string;
    skipSuccessful?: boolean;
    skipFailed?: boolean;
    blockDuration?: number;
}
export declare const RateLimit: (config: RateLimitConfig) => import("@nestjs/common").CustomDecorator<string>;
export declare const RateLimitStrict: () => import("@nestjs/common").CustomDecorator<string>;
export declare const RateLimitLogin: () => import("@nestjs/common").CustomDecorator<string>;
export declare const RateLimitPasswordReset: () => import("@nestjs/common").CustomDecorator<string>;
export declare const RateLimitMfa: () => import("@nestjs/common").CustomDecorator<string>;
