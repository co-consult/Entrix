import { mfa_method } from '@prisma/client';
export declare class MfaVerifyDto {
    method: mfa_method;
    code: string;
    rememberDevice?: boolean;
}
