import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
export declare class SuspiciousActivityException extends ForbiddenException {
    constructor(riskScore: number, factors: string[]);
}
export declare class BlockedIpException extends ForbiddenException {
    constructor(ip: string, reason: string);
}
export declare class UnauthorizedLocationException extends ForbiddenException {
    constructor(country: string);
}
export declare class SuspiciousDeviceException extends ForbiddenException {
    constructor(deviceFingerprint: string, reason: string);
}
export declare class VelocityAnomalyException extends ForbiddenException {
    constructor(previousLocation: string, currentLocation: string, timeSpan: number);
}
export declare class AttackPatternException extends ForbiddenException {
    constructor(patternType: string, confidence: number);
}
export declare class CompromisedSessionException extends UnauthorizedException {
    constructor(sessionId: string, reason: string);
}
export declare class SuspiciousConcurrentAccessException extends ForbiddenException {
    constructor(sessionCount: number, ipAddresses: string[]);
}
export declare class BotDetectedException extends ForbiddenException {
    constructor(detectionMethod: string, confidence: number);
}
export declare class HoneypotTriggeredException extends ForbiddenException {
    constructor(honeypotType: string);
}
