export declare class GenerateBackupCodesDto {
    password: string;
    forceRegenerate?: boolean;
}
export declare class UseBackupCodeDto {
    backupCode: string;
}
export declare class RevokeBackupCodesDto {
    password: string;
    reason?: string;
}
export declare class BackupCodesResponseDto {
    codes: string[];
    generatedAt: string;
    totalCodes: number;
    usedCodes: number;
    expiresAt?: string;
    instructions: string;
}
