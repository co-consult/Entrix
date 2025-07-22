import { mfa_method } from '@prisma/client';
export declare class MfaDisableDto {
    method?: mfa_method;
    password: string;
    confirmationCode: string;
    reason?: string;
}
