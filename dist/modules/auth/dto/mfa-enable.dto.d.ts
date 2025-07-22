import { mfa_method } from '@prisma/client';
export declare class MfaEnableDto {
    method: mfa_method;
    phoneNumber?: string;
    backupEmail?: string;
    verificationCode?: string;
}
