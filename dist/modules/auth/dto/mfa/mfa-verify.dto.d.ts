import { MfaProvider } from '../../constants/auth.constants';
export declare class MfaVerifyDto {
    challengeToken: string;
    method: MfaProvider;
    code: string;
    trustDevice?: boolean;
}
export declare class MfaVerifyResponseDto {
    success: boolean;
    data?: {
        user: any;
        tokens: any;
        session: any;
        trustedDevice?: {
            deviceId: string;
            expiresAt: string;
        };
    };
}
