import { HttpException, HttpStatus, UnauthorizedException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { TooManyRequestsException } from './too-many-requests.exception';
export declare abstract class AuthException extends HttpException {
    readonly code: string;
    readonly timestamp: string;
    readonly details?: any;
    constructor(code: string, message: string, httpStatus: HttpStatus, details?: any);
    private static generateRequestId;
}
export declare class InvalidCredentialsException extends UnauthorizedException {
    constructor(attemptsRemaining?: number);
}
export declare class AccountLockedException extends HttpException {
    constructor(unlockAt?: Date);
}
export declare class EmailNotVerifiedException extends ForbiddenException {
    constructor();
}
export declare class MfaRequiredException extends HttpException {
    constructor(challengeToken: string, methods: string[], expiresIn: number);
}
export declare class InvalidMfaCodeException extends UnauthorizedException {
    constructor(attemptsRemaining?: number);
}
export declare class DeviceNotTrustedException extends HttpException {
    constructor(verificationMethod: string);
}
export declare class EmailAlreadyExistsException extends ConflictException {
    constructor();
}
export declare class WeakPasswordException extends BadRequestException {
    constructor(suggestions?: string[]);
}
export declare class RateLimitedException extends TooManyRequestsException {
    constructor(retryAfter: number);
}
export declare class InvalidResetTokenException extends BadRequestException {
    constructor();
}
export declare class CaptchaRequiredException extends BadRequestException {
    constructor();
}
export declare class InvalidCaptchaException extends BadRequestException {
    constructor();
}
export declare class InvalidDeviceTokenException extends UnauthorizedException {
    constructor();
}
export { TooManyRequestsException };
