import { MfaProvider } from '../../constants/auth.constants';
export declare class MfaSetupDto {
    provider: MfaProvider;
}
export declare class MfaSetupResponseDto {
    success: boolean;
    data?: {
        provider: MfaProvider;
        qrCode?: string;
        secret?: string;
        backupCodes?: string[];
        setupInstructions: string;
    };
}
