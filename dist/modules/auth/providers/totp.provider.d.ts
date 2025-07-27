import { ConfigService } from '@nestjs/config';
import { ITotpProvider } from '../interfaces/mfa.interface';
import { LoggerService } from '../../../shared/logger/logger.service';
export declare class TotpProvider implements ITotpProvider {
    private readonly config;
    private readonly logger;
    constructor(config: ConfigService, loggerService: LoggerService);
    generateSecret(userEmail: string): Promise<{
        secret: string;
        qrCode: string;
    }>;
    verifyCode(secret: string, code: string): boolean;
    generateQrCode(secret: string, userEmail: string): Promise<string>;
    validateSecret(secret: string): boolean;
    generateCurrentCode(secret: string): string;
}
