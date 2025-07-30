import { TooManyRequestsException } from '@nestjs/common';
export declare class RateLimitExceededException extends TooManyRequestsException {
    readonly limitType: string;
    readonly limit: number;
    readonly window: number;
    readonly retryAfter: number;
    readonly details?: {
        identifier?: string;
        current_count?: number;
        window_start?: Date;
        window_end?: Date;
    };
    constructor(limitType: string, limit: number, window: number, retryAfter: number, details?: {
        identifier?: string;
        current_count?: number;
        window_start?: Date;
        window_end?: Date;
    });
    static forIP(ipAddress: string, limit: number, window: number, currentCount: number): RateLimitExceededException;
    static forUser(userId: string, limit: number, window: number, currentCount: number): RateLimitExceededException;
    static forEndpoint(endpoint: string, limit: number, window: number, currentCount: number): RateLimitExceededException;
}
