import { mfa_method } from '@prisma/client';
export declare class MfaMethodConfigDto {
    method: mfa_method;
    enabled: boolean;
    verified: boolean;
    configuredAt: Date;
    lastUsed?: Date;
    metadata?: Record<string, any>;
}
export declare class BackupCodesInfoDto {
    generated: boolean;
    generatedAt: Date;
    totalCodes: number;
    usedCodes: number;
    remainingCodes: number;
    expiresAt?: Date;
}
export declare class MfaConfigDto {
    enabled: boolean;
    methods: MfaMethodConfigDto[];
    defaultMethod?: mfa_method;
    backupCodes?: BackupCodesInfoDto;
    lastVerified?: Date;
    statistics: {
        totalVerifications: number;
        failedAttempts: number;
        lastFailedAttempt?: Date;
    };
    securityRequirements: {
        required: boolean;
        reason?: string;
        enforced: boolean;
        canDisable: boolean;
    };
    recommendedMethods: mfa_method[];
    nextStepRequired?: string;
    restrictions?: {
        temporaryLock: boolean;
        suspiciousActivity: boolean;
        requiresAdditionalVerification: boolean;
        lockReason?: string;
        lockExpiresAt?: Date;
    };
}
