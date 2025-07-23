import { ConfigService } from '@nestjs/config';
export interface MfaConfig {
    enabled: boolean;
    requiredForOrganizers: boolean;
    providers: {
        sms: {
            enabled: boolean;
            provider: string;
            validityDuration: number;
        };
        email: {
            enabled: boolean;
            validityDuration: number;
        };
        totp: {
            enabled: boolean;
            issuer: string;
            algorithm: string;
            digits: number;
            window: number;
        };
        backupCodes: {
            enabled: boolean;
            count: number;
            length: number;
        };
    };
}
export declare const getMfaConfig: (configService: ConfigService) => MfaConfig;
