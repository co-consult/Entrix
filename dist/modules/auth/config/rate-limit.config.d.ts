import { ConfigService } from '@nestjs/config';
export interface RateLimitConfig {
    login: {
        windowMs: number;
        maxAttempts: number;
        blockDuration: number;
    };
    passwordReset: {
        windowMs: number;
        maxAttempts: number;
        blockDuration: number;
    };
    mfaVerify: {
        windowMs: number;
        maxAttempts: number;
        blockDuration: number;
    };
    registration: {
        windowMs: number;
        maxAttempts: number;
        blockDuration: number;
    };
    emailVerification: {
        windowMs: number;
        maxAttempts: number;
        blockDuration: number;
    };
    validationTokens: {
        windowMs: number;
        maxAttempts: number;
        blockDuration: number;
    };
    apiCalls: {
        windowMs: number;
        maxAttempts: number;
        blockDuration: number;
    };
    apiKeyGeneration: {
        windowMs: number;
        maxAttempts: number;
        blockDuration: number;
    };
    magicLink: {
        windowMs: number;
        maxAttempts: number;
        blockDuration: number;
    };
}
export declare const getRateLimitConfig: (configService: ConfigService) => RateLimitConfig;
export declare const getRateLimitForEndpoint: (endpoint: keyof RateLimitConfig, configService: ConfigService) => {
    windowMs: number;
    maxAttempts: number;
    blockDuration: number;
};
export type RateLimitEndpoint = 'login' | 'passwordReset' | 'mfaVerify' | 'registration' | 'emailVerification' | 'validationTokens' | 'apiCalls' | 'apiKeyGeneration' | 'magicLink';
export declare const RATE_LIMIT_PRESETS: {
    readonly CRITICAL_AUTH: {
        readonly limit: 5;
        readonly windowMs: 900000;
    };
    readonly SENSITIVE_ACTION: {
        readonly limit: 3;
        readonly windowMs: 3600000;
    };
    readonly NORMAL_API: {
        readonly limit: 100;
        readonly windowMs: 60000;
    };
    readonly TOKEN_VALIDATION: {
        readonly limit: 3;
        readonly windowMs: 300000;
    };
    readonly API_KEY_CREATION: {
        readonly limit: 5;
        readonly windowMs: 3600000;
    };
};
