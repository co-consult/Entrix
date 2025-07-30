import { BadRequestException } from '@nestjs/common';
import { AccessRightStatus } from '../types/access-enums';
export declare class InvalidAccessRightException extends BadRequestException {
    readonly accessCode: string;
    readonly reason: string;
    readonly details?: {
        current_status?: AccessRightStatus;
        valid_from?: Date;
        valid_until?: Date;
        max_uses?: number;
        current_uses?: number;
        additional_info?: any;
    };
    constructor(accessCode: string, reason: string, details?: {
        current_status?: AccessRightStatus;
        valid_from?: Date;
        valid_until?: Date;
        max_uses?: number;
        current_uses?: number;
        additional_info?: any;
    });
    static expired(accessCode: string, validUntil: Date): InvalidAccessRightException;
    static alreadyUsed(accessCode: string, maxUses: number, currentUses: number): InvalidAccessRightException;
    static suspended(accessCode: string, reason?: string): InvalidAccessRightException;
    static notYetValid(accessCode: string, validFrom: Date): InvalidAccessRightException;
    static notFound(accessCode: string): InvalidAccessRightException;
}
