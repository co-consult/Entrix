import { HttpException } from '@nestjs/common';
export declare class AnonymousUserException extends HttpException {
    constructor(type: 'NOT_FOUND' | 'INVALID_KEY' | 'EXPIRED_KEY' | 'ALREADY_CONVERTED' | 'CONVERSION_FAILED' | 'SESSION_EXPIRED', identifier?: string, details?: Record<string, any>);
    static notFound(anonymousUserId?: string): AnonymousUserException;
    static invalidKey(onboardingKey: string): AnonymousUserException;
    static expiredKey(onboardingKey: string, expiredAt?: Date): AnonymousUserException;
    static alreadyConverted(anonymousUserId: string, convertedUserId?: string, convertedAt?: Date): AnonymousUserException;
    static conversionFailed(anonymousUserId: string, errors: string[]): AnonymousUserException;
    static sessionExpired(sessionId: string, expiredAt?: Date): AnonymousUserException;
}
