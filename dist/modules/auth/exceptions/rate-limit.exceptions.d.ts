import { HttpException } from '@nestjs/common';
export declare class RegistrationRateLimitedException extends HttpException {
    constructor(retryAfter?: number);
}
export declare class LoginRateLimitedException extends HttpException {
    constructor(retryAfter?: number);
}
export declare class PasswordResetRateLimitedException extends HttpException {
    constructor(retryAfter?: number);
}
export declare class MfaRateLimitedException extends HttpException {
    constructor(retryAfter?: number);
}
