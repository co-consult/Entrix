export interface RateLimitOptions {
    limit?: number;
    windowMs?: number;
    algorithm?: 'sliding_window' | 'token_bucket' | 'fixed_window';
    message?: string;
    skip?: boolean;
    keyGenerator?: (req: any) => string;
}
export interface RateLimitingMetrics {
    totalRequests: number;
    blockedRequests: number;
    allowedRequests: number;
    errorCount: number;
}
export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    totalRequests: number;
}
export interface RateLimitState {
    count: number;
    expiresAt: number;
    lastRequest?: number;
    tokens?: number;
    lastRefill?: number;
}
export interface RateLimitTiers {
    ip: {
        general: RateLimitOptions;
        strict: RateLimitOptions;
        auth: RateLimitOptions;
    };
    user: {
        general: RateLimitOptions;
        premium: RateLimitOptions;
        upload: RateLimitOptions;
    };
    global: {
        system: RateLimitOptions;
        endpoint: RateLimitOptions;
    };
}
export interface RateLimitMetrics {
    totalRequests: number;
    blockedRequests: number;
    allowedRequests: number;
    errorCount: number;
    blockRate: number;
    allowRate: number;
    errorRate: number;
}
export interface AdaptiveRateLimitConfig {
    baseLimit: number;
    minLoadFactor: number;
    maxLoadFactor: number;
    activationThreshold: number;
    observationWindow: number;
}
export interface RateLimitEvent {
    type: 'limit_exceeded' | 'whitelist_added' | 'blacklist_added' | 'limit_reset';
    identifier: string;
    timestamp: number;
    metadata?: any;
}
export interface RateLimitStats {
    identifier?: string;
    currentRequests: number;
    metrics: RateLimitMetrics;
    topLimitedIps?: string[];
    recentEvents?: RateLimitEvent[];
}
export interface RateLimitHeaders {
    limit: string;
    remaining: string;
    reset: string;
    retryAfter: string;
}
export declare const DEFAULT_RATE_LIMIT = 100;
export declare const DEFAULT_WINDOW_MS = 60000;
export declare const DEFAULT_ALGORITHM = "sliding_window";
export declare const RATE_LIMIT_HEADERS: RateLimitHeaders;
export declare const RATE_LIMIT_MESSAGES: {
    readonly EXCEEDED: "Rate limit exceeded. Try again later.";
    readonly BLACKLISTED: "Access temporarily restricted.";
    readonly INVALID_KEY: "Invalid rate limit key.";
    readonly SYSTEM_ERROR: "Rate limiting system error.";
};
