import { ForbiddenException } from '@nestjs/common';
export declare class SecurityViolationException extends ForbiddenException {
    readonly violationType: string;
    readonly reason: string;
    readonly securityContext?: {
        user_id?: string;
        ip_address?: string;
        user_agent?: string;
        attempted_action?: string;
        threat_level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        additional_info?: any;
    };
    constructor(violationType: string, reason: string, securityContext?: {
        user_id?: string;
        ip_address?: string;
        user_agent?: string;
        attempted_action?: string;
        threat_level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        additional_info?: any;
    });
    static privilegeEscalation(userId: string, attemptedAction: string, currentRole: string, requiredRole: string): SecurityViolationException;
    static suspiciousIPAccess(userId: string, ipAddress: string, reason: string): SecurityViolationException;
    static repeatedUnauthorizedAttempts(ipAddress: string, attemptCount: number, timeWindow: string): SecurityViolationException;
    static tokenManipulation(userId: string, manipulationType: string): SecurityViolationException;
}
