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
}
export declare const getRateLimitConfig: (configService: ConfigService) => RateLimitConfig;
