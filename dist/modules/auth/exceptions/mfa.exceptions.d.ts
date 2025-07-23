import { ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
export declare class UnsupportedMfaProviderException extends BadRequestException {
    constructor(provider: string);
}
export declare class MfaAlreadySetupException extends ConflictException {
    constructor(provider: string);
}
export declare class MfaChallengeExpiredException extends UnauthorizedException {
    constructor();
}
export declare class InvalidBackupCodeException extends UnauthorizedException {
    constructor();
}
