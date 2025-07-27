import { HttpException } from '@nestjs/common';
import { MfaProvider } from '../constants/auth.constants';
export declare class MfaChallengeExpiredException extends HttpException {
    constructor();
}
export declare class MfaNotConfiguredException extends HttpException {
    constructor(provider?: MfaProvider | string);
}
export declare class MfaAlreadyConfiguredException extends HttpException {
    constructor(provider: MfaProvider);
}
export declare class MfaCodeInvalidException extends HttpException {
    constructor();
}
export declare class MfaRateLimitException extends HttpException {
    constructor(remainingTime: number);
}
export declare class MfaProviderNotSupportedException extends HttpException {
    constructor(provider: string);
}
export declare class MfaSetupIncompleteException extends HttpException {
    constructor(provider: MfaProvider);
}
export declare class MfaBackupCodesExhaustedException extends HttpException {
    constructor();
}
export declare class MfaDeviceNotTrustedException extends HttpException {
    constructor();
}
