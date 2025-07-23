import { NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
export declare class SessionExpiredException extends UnauthorizedException {
    constructor();
}
export declare class InvalidRefreshTokenException extends UnauthorizedException {
    constructor();
}
export declare class TooManySessionsException extends BadRequestException {
    constructor(maxSessions: number);
}
export declare class SessionNotFoundException extends NotFoundException {
    constructor(sessionId: string);
}
